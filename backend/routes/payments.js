const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { protect, optionalAuth } = require('../middleware/auth');
const { createPayPalOrder, capturePayPalOrder } = require('../config/paypal');
const { getSignedDownloadUrl } = require('../utils/s3');
const { sendOrderConfirmation, sendAdminOrderAlert } = require('../utils/email');
const { createNotification } = require('../utils/notifications');

// POST /api/payments/paypal/create-order
router.post('/paypal/create-order', optionalAuth, async (req, res, next) => {
  try {
    const { items, customerInfo } = req.body;

    if (!items?.length) {
      return res.status(400).json({ error: 'Cart is empty.' });
    }

    const productIds = items.map(i => i.productId);
    const products = await Product.find({ _id: { $in: productIds }, isActive: true });

    if (products.length !== items.length) {
      return res.status(400).json({ error: 'One or more products are unavailable.' });
    }

    const orderItems = items.map(item => {
      const product = products.find(p => p._id.toString() === item.productId);
      return {
        product: product._id,
        title: product.title,
        price: product.price,
        quantity: Number(item.quantity) || 1,
        coverImage: product.coverImage?.url,
        emoji: product.emoji,
      };
    });

    const subtotal = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const total = Math.round(subtotal * 100) / 100;

    const order = await Order.create({
      user: req.user?._id,
      customerInfo,
      items: orderItems,
      subtotal,
      total,
      currency: 'USD',
      payment: { method: 'paypal', status: 'pending' },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    const paypalOrder = await createPayPalOrder({
      amount: total,
      currency: 'USD',
      orderId: order._id.toString(),
      items: orderItems,
    });

    order.payment.paypalOrderId = paypalOrder.id;
    await order.save();

    res.json({ paypalOrderId: paypalOrder.id, orderId: order._id, total });
  } catch (err) {
    next(err);
  }
});

// POST /api/payments/paypal/capture
router.post('/paypal/capture', optionalAuth, async (req, res, next) => {
  try {
    const { paypalOrderId, orderId } = req.body;

    if (!paypalOrderId || !orderId) {
      return res.status(400).json({ error: 'Missing paypalOrderId or orderId.' });
    }

    const order = await Order.findById(orderId).populate('items.product');
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    // Ownership check: logged-in user may only capture their own order
    if (req.user && order.user && order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Forbidden.' });
    }

    if (order.payment.status === 'completed') {
      return res.status(409).json({ error: 'Order already processed.' });
    }

    const capture = await capturePayPalOrder(paypalOrderId);

    if (capture.status !== 'COMPLETED') {
      order.payment.status = 'failed';
      await order.save();
      return res.status(400).json({ error: 'PayPal payment was not completed.', capture });
    }

    const captureDetails = capture.purchase_units[0].payments.captures[0];

    order.payment.status = 'completed';
    order.payment.paypalCaptureId = captureDetails.id;
    order.payment.paypalPayerId = capture.payer?.payer_id;
    order.payment.transactionId = captureDetails.id;
    order.payment.paidAt = new Date();
    order.status = 'completed';

    // Assign tokens synchronously so they're set before save
    const expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    for (const item of order.items) {
      item.downloadToken = crypto.randomBytes(32).toString('hex');
      item.downloadExpiry = expiry;
    }

    // Generate all signed S3 URLs in parallel
    const downloadLinks = await Promise.all(
      order.items.map(async (item) => {
        let url = `${process.env.FRONTEND_URL}/download/${item.downloadToken}`;
        if (item.product?.fileUrl?.key) {
          url = await getSignedDownloadUrl(item.product.fileUrl.key).catch(() => url);
        }
        return { title: item.title, url, expiry, token: item.downloadToken };
      })
    );

    // Single save — all tokens and payment fields set above
    await order.save();

    // Fire-and-forget: sales counts + user purchases in parallel
    Promise.all([
      ...order.items.map((item) =>
        Product.findByIdAndUpdate(item.product?._id || item.product, {
          $inc: { totalSales: item.quantity },
        })
      ),
      req.user
        ? User.findByIdAndUpdate(req.user._id, {
            $push: {
              purchases: order.items.map((item) => ({
                product: item.product?._id || item.product,
                order: order._id,
                downloadToken: item.downloadToken,
                downloadExpiry: item.downloadExpiry,
              })),
            },
          })
        : Promise.resolve(),
    ]).catch(console.error);

    // Fire-and-forget: emails + admin notification
    sendOrderConfirmation({ order, downloadLinks })
      .then(() => Order.findByIdAndUpdate(order._id, { downloadEmailSent: true }).catch(() => {}))
      .catch(console.error);
    sendAdminOrderAlert({ order }).catch(console.error);
    createNotification({
      type: 'new_order',
      title: 'New Order Received',
      message: `${order.customerInfo.firstName} ${order.customerInfo.lastName} placed order ${order.orderNumber} for $${order.total.toFixed(2)}.`,
      link: '/admin/orders',
      meta: { orderId: order._id, orderNumber: order.orderNumber, total: order.total, email: order.customerInfo.email },
    });

    res.json({
      success: true,
      orderNumber: order.orderNumber,
      downloadLinks,
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        total: order.total,
        status: order.status,
        items: order.items.map((i) => ({ title: i.title, quantity: i.quantity })),
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/payments/download/:token
router.get('/download/:token', async (req, res, next) => {
  try {
    const { token } = req.params;

    const order = await Order.findOne({
      'items.downloadToken': token,
      'payment.status': 'completed',
    }).populate('items.product');

    if (!order) {
      return res.status(404).json({ error: 'Invalid or expired download link.' });
    }

    const item = order.items.find(
      (i) =>
        i.downloadToken &&
        crypto.timingSafeEqual(Buffer.from(i.downloadToken), Buffer.from(token))
    );
    if (!item) return res.status(404).json({ error: 'Download not found.' });

    if (new Date() > new Date(item.downloadExpiry)) {
      return res.status(410).json({ error: 'Download link has expired. Please contact support.' });
    }

    const product = item.product;
    if (!product?.fileUrl?.key) {
      return res.status(404).json({ error: 'File not found. Please contact support.' });
    }

    const signedUrl = await getSignedDownloadUrl(product.fileUrl.key, 3600);
    res.redirect(signedUrl);
  } catch (err) {
    next(err);
  }
});

// GET /api/payments/orders — user's own orders
router.get('/orders', protect, async (req, res, next) => {
  try {
    const orders = await Order.find({
      $or: [{ user: req.user._id }, { 'customerInfo.email': req.user.email }],
    })
      .sort('-createdAt')
      .select('-items.downloadToken');
    res.json({ orders });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect, restrictTo } = require('../middleware/auth');
const { uploadToS3, deleteFromS3 } = require('../utils/s3');
const Product = require('../models/Product');

// ─── Multer – memory storage ──────────────────────────────────────────────────
const storage = multer.memoryStorage();

const fileFilter = (allowedMimes) => (req, file, cb) => {
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed: ${allowedMimes.join(', ')}`), false);
  }
};

const uploadPdf = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: fileFilter([
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/msword', // .doc
    'application/vnd.ms-powerpoint', // .ppt
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
    'application/vnd.ms-excel', // .xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'text/plain', // .txt
    'application/rtf', // .rtf
    'application/epub+zip', // .epub
  ]),
});

const uploadImage = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: fileFilter(['image/jpeg', 'image/png', 'image/webp']),
});

// ─── POST /api/upload/pdf ── Admin only ───────────────────────────────────────
router.post(
  '/pdf',
  protect,
  restrictTo('admin'),
  uploadPdf.single('file'),
  async (req, res, next) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'No PDF file provided.' });

      const { productId } = req.body;

      const result = await uploadToS3({
        buffer: req.file.buffer,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        folder: 'pdfs',
      });

      // If productId provided, attach to product
      if (productId) {
        const product = await Product.findById(productId);
        if (product) {
          // Delete old file if exists
          if (product.fileUrl?.key) {
            await deleteFromS3(product.fileUrl.key).catch(console.error);
          }
          product.fileUrl = {
            key: result.key,
            originalName: result.originalName,
            size: result.size,
          };
          await product.save();
        }
      }

      res.json({
        message: 'PDF uploaded successfully.',
        file: { key: result.key, size: result.size, originalName: result.originalName },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /api/upload/image ── Admin only ─────────────────────────────────────
router.post(
  '/image',
  protect,
  restrictTo('admin'),
  uploadImage.single('image'),
  async (req, res, next) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'No image provided.' });

      const { productId } = req.body;

      const result = await uploadToS3({
        buffer: req.file.buffer,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        folder: 'covers',
      });

      // If productId provided, attach to product
      if (productId) {
        const product = await Product.findById(productId);
        if (product) {
          if (product.coverImage?.key) {
            await deleteFromS3(product.coverImage.key).catch(console.error);
          }
          product.coverImage = { key: result.key, url: result.url };
          await product.save();
        }
      }

      res.json({
        message: 'Image uploaded successfully.',
        image: { key: result.key, url: result.url },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /api/upload/product-full ── Upload everything at once ───────────────
router.post(
  '/product-full',
  protect,
  restrictTo('admin'),
  multer({ storage, limits: { fileSize: 100 * 1024 * 1024 } }).fields([
    { name: 'pdf', maxCount: 1 },
    { name: 'cover', maxCount: 1 },
  ]),
  async (req, res, next) => {
    try {
      const { title, category, price, originalPrice, pages, description, badge, emoji } = req.body;

      if (!title || !price) {
        return res.status(400).json({ error: 'Title and price are required.' });
      }

      // Build product data
      const productData = {
        title,
        category,
        price: parseFloat(price),
        originalPrice: parseFloat(originalPrice) || parseFloat(price) * 1.5,
        pages: parseInt(pages) || 0,
        description,
        badge: badge || null,
        emoji: emoji || '📘',
        uploadedBy: req.user._id,
      };

      // Upload PDF if provided
      if (req.files?.pdf?.[0]) {
        const pdfFile = req.files.pdf[0];
        const pdfResult = await uploadToS3({
          buffer: pdfFile.buffer,
          originalName: pdfFile.originalname,
          mimeType: pdfFile.mimetype,
          folder: 'pdfs',
        });
        productData.fileUrl = {
          key: pdfResult.key,
          originalName: pdfResult.originalName,
          size: pdfResult.size,
        };
      }

      // Upload cover image if provided
      if (req.files?.cover?.[0]) {
        const imgFile = req.files.cover[0];
        const imgResult = await uploadToS3({
          buffer: imgFile.buffer,
          originalName: imgFile.originalname,
          mimeType: imgFile.mimetype,
          folder: 'covers',
        });
        productData.coverImage = { key: imgResult.key, url: imgResult.url };
      }

      const product = await Product.create(productData);

      res.status(201).json({ message: 'Product created successfully.', product });
    } catch (err) {
      next(err);
    }
  }
);

// ─── DELETE /api/upload/file ── Admin only ────────────────────────────────────
router.delete('/file', protect, restrictTo('admin'), async (req, res, next) => {
  try {
    const { key } = req.body;
    if (!key) return res.status(400).json({ error: 'File key is required.' });
    await deleteFromS3(key);
    res.json({ message: 'File deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

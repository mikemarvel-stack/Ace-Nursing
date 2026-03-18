/**
 * Integration tests for payment and custom-order flows.
 * Runs against an in-memory MongoDB instance — no real DB or PayPal calls.
 */
const request = require('supertest');
const { app } = require('../server');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const CustomOrder = require('../models/CustomOrder');
const User = require('../models/User');
const crypto = require('crypto');

// ── Helpers ───────────────────────────────────────────────────────────────────
async function registerAndLogin(overrides = {}) {
  const data = {
    firstName: 'Pay',
    lastName: 'Tester',
    email: `pay-${Date.now()}@example.com`,
    password: 'StrongPass123!',
    ...overrides,
  };
  await request(app).post('/api/auth/register').send(data);
  const res = await request(app).post('/api/auth/login').send({ email: data.email, password: data.password });
  return { token: res.body.token, user: res.body.user };
}

async function createProduct(overrides = {}) {
  return Product.create({
    title: 'Test Product',
    category: 'RN Prep (NCLEX-RN)',
    price: 9.99,
    originalPrice: 14.99,
    description: 'A test product for integration tests.',
    isActive: true,
    emoji: '📘',
    ...overrides,
  });
}

// ── POST /api/payments/paypal/create-order ────────────────────────────────────
describe('POST /api/payments/paypal/create-order', () => {
  it('returns 400 when Zod validation fails (empty items array)', async () => {
    const res = await request(app)
      .post('/api/payments/paypal/create-order')
      .send({ items: [], customerInfo: { firstName: 'A', lastName: 'B', email: 'a@b.com' } });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Validation failed');
  });

  it('returns 400 when Zod validation fails (missing customerInfo)', async () => {
    const res = await request(app)
      .post('/api/payments/paypal/create-order')
      .send({ items: [{ productId: '6'.repeat(24), quantity: 1 }] });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Validation failed');
  });

  it('returns 400 when product is inactive', async () => {
    const product = await createProduct({ isActive: false });
    const res = await request(app)
      .post('/api/payments/paypal/create-order')
      .send({
        items: [{ productId: product._id.toString(), quantity: 1 }],
        customerInfo: { firstName: 'A', lastName: 'B', email: 'a@b.com' },
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/unavailable/i);
  });
});

// ── GET /api/payments/download/:token ─────────────────────────────────────────
describe('GET /api/payments/download/:token', () => {
  it('returns 404 for a random token', async () => {
    const res = await request(app).get('/api/payments/download/notarealtoken');
    expect(res.status).toBe(404);
  });

  it('returns 410 for an expired token', async () => {
    const product = await createProduct();
    const raw = crypto.randomBytes(32).toString('hex');
    const hash = crypto.createHash('sha256').update(raw).digest('hex');
    await Order.create({
      customerInfo: { firstName: 'A', lastName: 'B', email: 'a@b.com' },
      items: [{
        product: product._id,
        title: 'Test',
        price: 9.99,
        quantity: 1,
        downloadToken: hash,
        downloadExpiry: new Date(Date.now() - 1000), // already expired
      }],
      subtotal: 9.99,
      total: 9.99,
      currency: 'USD',
      payment: { method: 'paypal', status: 'completed' },
      status: 'completed',
    });
    const res = await request(app).get(`/api/payments/download/${raw}`);
    expect(res.status).toBe(410);
  });
});

// ── GET /api/payments/orders ──────────────────────────────────────────────────
describe('GET /api/payments/orders', () => {
  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/payments/orders');
    expect(res.status).toBe(401);
  });

  it('returns empty array for new user', async () => {
    const { token } = await registerAndLogin();
    const res = await request(app)
      .get('/api/payments/orders')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.orders).toEqual([]);
  });
});

// ── POST /api/custom-orders ───────────────────────────────────────────────────
describe('POST /api/custom-orders', () => {
  const validBody = {
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@example.com',
    subject: 'Pathophysiology of Heart Failure',
    assignmentType: 'Essay',
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    requirements: 'Write a 5-page essay on heart failure pathophysiology.',
  };

  it('creates a custom order and returns orderNumber', async () => {
    const res = await request(app).post('/api/custom-orders').send(validBody);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('orderNumber');
    expect(res.body.orderNumber).toMatch(/^ACN-C-/);
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app).post('/api/custom-orders').send({ firstName: 'Jane' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when deadline is in the past', async () => {
    const res = await request(app).post('/api/custom-orders').send({
      ...validBody,
      deadline: new Date(Date.now() - 1000).toISOString(),
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/future/i);
  });
});

// ── GET /api/custom-orders/mine ───────────────────────────────────────────────
describe('GET /api/custom-orders/mine', () => {
  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/custom-orders/mine');
    expect(res.status).toBe(401);
  });

  it('returns orders for authenticated user', async () => {
    const { token, user } = await registerAndLogin();
    // Create an order linked to this user
    await CustomOrder.create({
      user: user._id,
      customerInfo: { firstName: 'Pay', lastName: 'Tester', email: user.email },
      subject: 'Test Subject',
      assignmentType: 'Essay',
      deadline: new Date(Date.now() + 86400000),
      requirements: 'Test requirements text here.',
    });
    const res = await request(app)
      .get('/api/custom-orders/mine')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.orders.length).toBeGreaterThanOrEqual(1);
  });
});

// ── POST /api/payments/paypal/create-custom-order ─────────────────────────────
describe('POST /api/payments/paypal/create-custom-order', () => {
  it('returns 401 without auth', async () => {
    const res = await request(app)
      .post('/api/payments/paypal/create-custom-order')
      .send({ customOrderId: new mongoose.Types.ObjectId().toString() });
    expect(res.status).toBe(401);
  });

  it('returns 400 when Zod validation fails (invalid ObjectId)', async () => {
    const { token } = await registerAndLogin();
    const res = await request(app)
      .post('/api/payments/paypal/create-custom-order')
      .set('Authorization', `Bearer ${token}`)
      .send({ customOrderId: 'not-an-objectid' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Validation failed');
  });

  it('returns 404 for an order that does not belong to the user', async () => {
    const { token } = await registerAndLogin();
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .post('/api/payments/paypal/create-custom-order')
      .set('Authorization', `Bearer ${token}`)
      .send({ customOrderId: fakeId });
    expect(res.status).toBe(404);
  });

  it('returns 400 when order is not yet delivered', async () => {
    const { token, user } = await registerAndLogin();
    const order = await CustomOrder.create({
      user: user._id,
      customerInfo: { firstName: 'Pay', lastName: 'Tester', email: user.email },
      subject: 'Test',
      assignmentType: 'Essay',
      deadline: new Date(Date.now() + 86400000),
      requirements: 'Test requirements.',
      status: 'accepted',
      quote: { price: 49.99, daysToComplete: 3 },
    });
    const res = await request(app)
      .post('/api/payments/paypal/create-custom-order')
      .set('Authorization', `Bearer ${token}`)
      .send({ customOrderId: order._id.toString() });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/not yet delivered/i);
  });
});

// ── GET /api/payments/custom-order/:id/download ───────────────────────────────
describe('GET /api/payments/custom-order/:id/download', () => {
  it('returns 401 without auth', async () => {
    const res = await request(app).get(`/api/payments/custom-order/${new mongoose.Types.ObjectId()}/download`);
    expect(res.status).toBe(401);
  });

  it('returns 402 when order is not paid', async () => {
    const { token, user } = await registerAndLogin();
    const order = await CustomOrder.create({
      user: user._id,
      customerInfo: { firstName: 'Pay', lastName: 'Tester', email: user.email },
      subject: 'Test',
      assignmentType: 'Essay',
      deadline: new Date(Date.now() + 86400000),
      requirements: 'Test requirements.',
      status: 'delivered',
    });
    const res = await request(app)
      .get(`/api/payments/custom-order/${order._id}/download`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(402);
  });
});

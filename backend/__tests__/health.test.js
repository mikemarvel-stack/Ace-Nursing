const request = require('supertest');
const { app } = require('../server');

describe('Health check', () => {
  it('returns 200 and a healthy payload', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      status: 'healthy',
      environment: expect.any(String),
      requestId: expect.any(String),
    });
  });
});

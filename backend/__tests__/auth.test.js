const request = require('supertest');
const { app } = require('../server');

const testUser = {
  firstName: 'Test',
  lastName: 'User',
  email: 'test-user@example.com',
  password: 'StrongPass123!',
  phone: '+1234567890',
  country: 'US',
};

describe('Auth routes', () => {
  it('registers a new user and returns a token', async () => {
    const res = await request(app).post('/api/auth/register').send(testUser);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toHaveProperty('email', testUser.email.toLowerCase());
  });

  it('logs in with correct credentials', async () => {
    // Ensure the user exists from the registration test
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('email', testUser.email.toLowerCase());
  });
});

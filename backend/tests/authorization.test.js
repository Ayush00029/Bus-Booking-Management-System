const request = require('supertest');
const app = require('../src/app');

describe('Role-Based Authorization API (/api/admin)', () => {
  let passengerToken;
  let adminToken;

  beforeEach(async () => {
    // Register passenger
    const passengerRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Regular Passenger',
        email: 'passenger@example.com',
        password: 'password123',
        role: 'passenger'
      });
    passengerToken = passengerRes.body.data.token;

    // Register admin with secret key
    const adminRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'System Admin',
        email: 'admin@example.com',
        password: 'password123',
        role: 'admin',
        adminSecret: 'algions_admin_secret_key_2026'
      });
    adminToken = adminRes.body.data.token;
  });

  it('should prevent privilege escalation: registering as admin without secret key defaults to passenger', async () => {
    const maliciousRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Sneaky Attacker',
        email: 'attacker@example.com',
        password: 'password123',
        role: 'admin' // No adminSecret supplied!
      });

    expect(maliciousRes.statusCode).toBe(201);
    expect(maliciousRes.body.data.user.role).toBe('passenger'); // Escalation barred!

    // Attacker token cannot access admin routes
    const verifyRes = await request(app)
      .get('/api/admin/verify')
      .set('Authorization', `Bearer ${maliciousRes.body.data.token}`);

    expect(verifyRes.statusCode).toBe(403);
  });

  it('should allow admin user to access /api/admin/verify with 200 OK', async () => {
    const res = await request(app)
      .get('/api/admin/verify')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.role).toBe('admin');
  });

  it('should strictly reject passenger accessing /api/admin/verify with 403 Forbidden', async () => {
    const res = await request(app)
      .get('/api/admin/verify')
      .set('Authorization', `Bearer ${passengerToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Access denied');
  });

  it('should reject unauthenticated request with 401 Unauthorized', async () => {
    const res = await request(app).get('/api/admin/verify');
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });
});


const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');

describe('Authentication API (/api/auth)', () => {
  const testPassenger = {
    name: 'Rahul Dravid',
    email: 'rahul.test@example.com',
    password: 'password123',
    phone: '9876543210',
    role: 'passenger'
  };

  describe('POST /api/auth/register', () => {
    it('should register a new passenger successfully and return JWT', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testPassenger);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe(testPassenger.email);
      expect(res.body.data.user.role).toBe('passenger');
      expect(res.body.data.user.password).toBeUndefined(); // Never expose password!
      expect(res.body.data.token).toBeDefined();

      // Verify password hashed in database
      const dbUser = await User.findOne({ email: testPassenger.email }).select('+password');
      expect(dbUser).not.toBeNull();
      expect(dbUser.password).not.toBe(testPassenger.password);
    });

    it('should reject registration with duplicate email with 409 Conflict', async () => {
      // First registration
      await request(app).post('/api/auth/register').send(testPassenger);

      // Duplicate attempt
      const res = await request(app)
        .post('/api/auth/register')
        .send(testPassenger);

      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already exists');
    });

    it('should return 422 if required fields are missing or invalid', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'A', // too short
          email: 'not-an-email',
          password: '123' // too short
        });

      expect(res.statusCode).toBe(422);
      expect(res.body.success).toBe(false);
      expect(Array.isArray(res.body.errors)).toBe(true);
      expect(res.body.errors.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(testPassenger);
    });

    it('should authenticate user with valid credentials and return JWT', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testPassenger.email,
          password: testPassenger.password
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe(testPassenger.email);
    });

    it('should reject login with wrong password (401 Unauthorized)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testPassenger.email,
          password: 'WrongPassword999'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid email or password');
    });

    it('should reject login for non-existent user (401 Unauthorized)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'ghost@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return profile for authenticated user with valid token', async () => {
      const reg = await request(app).post('/api/auth/register').send(testPassenger);
      const token = reg.body.data.token;

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(testPassenger.email);
    });

    it('should reject request without token with 401 Unauthorized', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject request with tampered/invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid_garbage_token_here');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});


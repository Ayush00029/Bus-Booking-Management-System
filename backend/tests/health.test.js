const request = require('supertest');
const app = require('../src/app');

describe('Health and System Endpoints', () => {
  it('GET /api/health should return 200 with system status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('healthy');
  });

  it('GET /api should return 200 with API info', async () => {
    const res = await request(app).get('/api');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.version).toBe('1.0.0');
  });

  it('GET /api/unknown-route should return 404 standardized error', async () => {
    const res = await request(app).get('/api/non-existent-route-404');
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Endpoint not found');
  });
});


const request = require('supertest');
const app = require('../../../../app');
const User = require('../../../../core/auth/users/models/user.model');

let token;

beforeAll(async () => {
  await User.create({
    username: 'testlogin',
    email: 'testlogin@example.com',
    password: 'Test1234!',
    firstName: 'Test',
    lastName: 'Login',
    status: 'active',
    isActive: true
  });
});

afterAll(async () => {
  await User.deleteMany({ email: 'testlogin@example.com' });
});

describe('Auth Login API', () => {
  it('should fail with wrong credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'testlogin@example.com', password: 'wrongpass' });
    expect(res.statusCode).toBe(401);
  });

  it('should login successfully and return a token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'testlogin@example.com', password: 'Test1234!' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    token = res.body.token;
  });

  it('should allow using the token for protected routes', async () => {
    const res = await request(app)
      .get('/api/crm/customers')
      .set('Authorization', `Bearer ${token}`);
    // Puede ser 200 o 403/404 si no hay datos, pero no debe ser 401
    expect(res.statusCode).not.toBe(401);
  });
}); 
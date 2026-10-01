/**
 * tests/auth.test.js — Authentication endpoint tests
 *
 * Covers: POST /api/auth/register, POST /api/auth/login, GET /api/auth/me
 *
 * Test naming convention:
 *   "should <behaviour> when <condition>"
 * This reads like plain English and makes failures easy to understand.
 */

const {
  connectTestDB, disconnectTestDB, clearDB,
  createStudent, createAdmin,
  app, request,
} = require('./helpers');

beforeAll(connectTestDB);
afterAll(disconnectTestDB);
beforeEach(clearDB); // fresh DB before every test

// ═══════════════════════════════════════════════════════════════════════════════
describe('POST /api/auth/register', () => {
// ═══════════════════════════════════════════════════════════════════════════════

  it('should register a student and return 201 with a token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Alice Test',
        email: 'alice@test.com',
        password: 'Alice1234',
        role: 'student',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.user.email).toBe('alice@test.com');
    expect(res.body.data.user.role).toBe('student');
    // IMPORTANT: password should NEVER appear in the response
    expect(res.body.data.user).not.toHaveProperty('password');
  });

  it('should return 400 when email is already registered', async () => {
    // Register once
    await createStudent({ email: 'dup@test.com' });

    // Try to register with the same email
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Duplicate User',
        email: 'dup@test.com',
        password: 'Test1234',
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/already registered/i);
  });

  it('should return 400 with field errors when body is empty', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toBeInstanceOf(Array);
    // Should flag all three required fields
    const fields = res.body.errors.map((e) => e.field);
    expect(fields).toContain('name');
    expect(fields).toContain('email');
    expect(fields).toContain('password');
  });

  it('should return 400 when password has no number', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test', email: 'test@test.com', password: 'NoNumbers' });

    expect(res.statusCode).toBe(400);
    const messages = res.body.errors.map((e) => e.message);
    expect(messages.some((m) => /number/i.test(m))).toBe(true);
  });

  it('should return 400 when email format is invalid', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test', email: 'not-an-email', password: 'Test1234' });

    expect(res.statusCode).toBe(400);
    const fields = res.body.errors.map((e) => e.field);
    expect(fields).toContain('email');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
describe('POST /api/auth/login', () => {
// ═══════════════════════════════════════════════════════════════════════════════

  it('should return 200 and a token with valid credentials', async () => {
    await createStudent({ email: 'login@test.com', password: 'Login1234' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@test.com', password: 'Login1234' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.user.email).toBe('login@test.com');
  });

  it('should return 401 with wrong password', async () => {
    await createStudent({ email: 'login@test.com' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@test.com', password: 'WrongPass1' });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    // Deliberately vague message — doesn't reveal which part was wrong
    expect(res.body.message).toMatch(/invalid email or password/i);
  });

  it('should return 401 with non-existent email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@test.com', password: 'Test1234' });

    expect(res.statusCode).toBe(401);
    // SAME message as wrong password — no email enumeration
    expect(res.body.message).toMatch(/invalid email or password/i);
  });

  it('should return 400 when body is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toBeInstanceOf(Array);
  });

  it('should return 400 for malformed JSON', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email":}'); // invalid JSON

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/invalid json/i);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
describe('GET /api/auth/me', () => {
// ═══════════════════════════════════════════════════════════════════════════════

  it('should return the current user profile with a valid token', async () => {
    const { authHeader, user } = await createStudent();

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', authHeader);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.email).toBe(user.email);
    expect(res.body.data).not.toHaveProperty('password');
  });

  it('should return 401 when no token is provided', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/not authorized/i);
  });

  it('should return 401 with a fake/tampered token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer totally.fake.token');

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/invalid token/i);
  });
});

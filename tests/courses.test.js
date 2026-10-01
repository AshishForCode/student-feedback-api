/**
 * tests/courses.test.js — Course CRUD endpoint tests
 *
 * Covers: GET, POST, PUT, DELETE /api/courses
 * Key things tested: RBAC (admin-only writes), validation, not-found handling
 */

const {
  connectTestDB, disconnectTestDB, clearDB,
  createStudent, createAdmin, createCourse,
  app, request,
} = require('./helpers');

let adminAuth, studentAuth, course;

beforeAll(connectTestDB);
afterAll(disconnectTestDB);

// Create fresh users and a course before each test
beforeEach(async () => {
  await clearDB();
  const admin   = await createAdmin();
  const student = await createStudent();
  adminAuth   = admin.authHeader;
  studentAuth = student.authHeader;

  // Create a baseline course for GET/PUT/DELETE tests
  course = await createCourse(adminAuth, {
    title: 'Intro to Testing',
    code: 'TT101',
    instructor: 'Dr. Test',
    department: 'QA',
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
describe('GET /api/courses', () => {
// ═══════════════════════════════════════════════════════════════════════════════

  it('should return all courses for a logged-in student', async () => {
    const res = await request(app)
      .get('/api/courses')
      .set('Authorization', studentAuth);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('should return 401 when no token is provided', async () => {
    const res = await request(app).get('/api/courses');
    expect(res.statusCode).toBe(401);
  });

  it('should filter by department query param', async () => {
    // Create a second course in a different department
    await createCourse(adminAuth, {
      code: 'MATH201', title: 'Calculus', instructor: 'Prof. Newton', department: 'Mathematics',
    });

    const res = await request(app)
      .get('/api/courses?department=QA')
      .set('Authorization', adminAuth);

    expect(res.statusCode).toBe(200);
    // Should only return courses in the QA department
    res.body.data.forEach((c) => {
      expect(c.department.toLowerCase()).toContain('qa');
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
describe('GET /api/courses/:id', () => {
// ═══════════════════════════════════════════════════════════════════════════════

  it('should return a single course by valid id', async () => {
    const res = await request(app)
      .get(`/api/courses/${course._id}`)
      .set('Authorization', studentAuth);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.code).toBe('TT101');
  });

  it('should return 404 for a non-existent course id', async () => {
    const fakeId = '6abda2a003f9a3cb9f000000';
    const res = await request(app)
      .get(`/api/courses/${fakeId}`)
      .set('Authorization', studentAuth);

    expect(res.statusCode).toBe(404);
  });

  it('should return 404 for an invalid ObjectId format', async () => {
    const res = await request(app)
      .get('/api/courses/not-a-valid-id')
      .set('Authorization', studentAuth);

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toMatch(/invalid/i);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
describe('POST /api/courses', () => {
// ═══════════════════════════════════════════════════════════════════════════════

  it('should allow admin to create a course and return 201', async () => {
    const res = await request(app)
      .post('/api/courses')
      .set('Authorization', adminAuth)
      .send({
        title: 'Advanced Node.js',
        code: 'NODE401',
        instructor: 'Dr. Ryan Dahl',
        department: 'Computer Science',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.code).toBe('NODE401');
    expect(res.body.data.title).toBe('Advanced Node.js');
  });

  it('should return 403 when a student tries to create a course', async () => {
    const res = await request(app)
      .post('/api/courses')
      .set('Authorization', studentAuth)
      .send({
        title: 'Unauthorized Course',
        code: 'UNAUTH1',
        instructor: 'Nobody',
        department: 'None',
      });

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/access denied/i);
  });

  it('should return 400 when code is already taken', async () => {
    const res = await request(app)
      .post('/api/courses')
      .set('Authorization', adminAuth)
      .send({
        title: 'Duplicate Course',
        code: 'TT101', // already exists from beforeEach
        instructor: 'Someone',
        department: 'QA',
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/duplicate/i);
  });

  it('should return 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/courses')
      .set('Authorization', adminAuth)
      .send({ title: 'Missing Fields' }); // code, instructor, department missing

    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toBeInstanceOf(Array);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
describe('PUT /api/courses/:id', () => {
// ═══════════════════════════════════════════════════════════════════════════════

  it('should allow admin to update a course', async () => {
    const res = await request(app)
      .put(`/api/courses/${course._id}`)
      .set('Authorization', adminAuth)
      .send({ instructor: 'Dr. Updated Instructor' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.instructor).toBe('Dr. Updated Instructor');
  });

  it('should return 403 when a student tries to update a course', async () => {
    const res = await request(app)
      .put(`/api/courses/${course._id}`)
      .set('Authorization', studentAuth)
      .send({ instructor: 'Hacker' });

    expect(res.statusCode).toBe(403);
  });

  it('should return 404 for non-existent course', async () => {
    const fakeId = '6abda2a003f9a3cb9f000000';
    const res = await request(app)
      .put(`/api/courses/${fakeId}`)
      .set('Authorization', adminAuth)
      .send({ instructor: 'Anyone' });

    expect(res.statusCode).toBe(404);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
describe('DELETE /api/courses/:id', () => {
// ═══════════════════════════════════════════════════════════════════════════════

  it('should allow admin to delete a course', async () => {
    const res = await request(app)
      .delete(`/api/courses/${course._id}`)
      .set('Authorization', adminAuth);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);

    // Verify it's actually gone
    const check = await request(app)
      .get(`/api/courses/${course._id}`)
      .set('Authorization', adminAuth);
    expect(check.statusCode).toBe(404);
  });

  it('should return 403 when a student tries to delete a course', async () => {
    const res = await request(app)
      .delete(`/api/courses/${course._id}`)
      .set('Authorization', studentAuth);

    expect(res.statusCode).toBe(403);
  });
});

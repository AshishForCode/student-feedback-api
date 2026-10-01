/**
 * tests/feedback.test.js — Feedback CRUD endpoint tests
 *
 * These are the most important tests — they verify:
 *  - Students can only see/edit/delete their OWN feedback
 *  - Admins can manage ALL feedback
 *  - Pagination and filtering work correctly
 *  - Stats aggregation returns correct data
 *  - Duplicate feedback (same student + course) is rejected
 */

const {
  connectTestDB, disconnectTestDB, clearDB,
  createStudent, createAdmin, createCourse, createFeedback,
  app, request,
} = require('./helpers');

let adminAuth, student1Auth, student2Auth, course, feedback1;

beforeAll(connectTestDB);
afterAll(disconnectTestDB);

beforeEach(async () => {
  await clearDB();

  const admin    = await createAdmin();
  const student1 = await createStudent({ email: 's1@test.com' });
  const student2 = await createStudent({ email: 's2@test.com' });

  adminAuth    = admin.authHeader;
  student1Auth = student1.authHeader;
  student2Auth = student2.authHeader;

  // Create a shared course
  course = await createCourse(adminAuth, {
    title: 'Test Course',
    code: 'TC201',
    instructor: 'Dr. Jest',
    department: 'Testing',
  });

  // Create a second course for multi-course tests
  await createCourse(adminAuth, {
    title: 'Second Course',
    code: 'SC202',
    instructor: 'Dr. Super',
    department: 'Testing',
  });

  // Student1 already has feedback on the main course
  feedback1 = await createFeedback(student1Auth, course._id, {
    rating: 5,
    comment: 'Outstanding teaching quality and well structured material.',
    category: 'teaching',
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
describe('POST /api/feedback', () => {
// ═══════════════════════════════════════════════════════════════════════════════

  it('should allow a student to submit feedback and return 201', async () => {
    // student2 submits on the main course (they have no feedback yet)
    const res = await request(app)
      .post('/api/feedback')
      .set('Authorization', student2Auth)
      .send({
        course: course._id,
        rating: 3,
        comment: 'Decent course but could use more practical examples.',
        category: 'content',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.rating).toBe(3);
    expect(res.body.data.status).toBe('pending');     // default status
    expect(res.body.data.course).toHaveProperty('title'); // populated
  });

  it('should return 400 when student submits duplicate feedback for same course', async () => {
    // student1 already has feedback on course from beforeEach
    const res = await request(app)
      .post('/api/feedback')
      .set('Authorization', student1Auth)
      .send({
        course: course._id,
        rating: 2,
        comment: 'Trying to submit a second review for the same course.',
        category: 'content',
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/duplicate/i);
  });

  it('should return 403 when an admin tries to submit feedback', async () => {
    const res = await request(app)
      .post('/api/feedback')
      .set('Authorization', adminAuth)
      .send({
        course: course._id,
        rating: 4,
        comment: 'Admin trying to submit feedback illegally.',
        category: 'teaching',
      });

    expect(res.statusCode).toBe(403);
  });

  it('should return 400 when rating is out of range (1-5)', async () => {
    const res = await request(app)
      .post('/api/feedback')
      .set('Authorization', student2Auth)
      .send({
        course: course._id,
        rating: 10,
        comment: 'Rating too high — should fail validation.',
        category: 'teaching',
      });

    expect(res.statusCode).toBe(400);
    const messages = res.body.errors.map((e) => e.message);
    expect(messages.some((m) => /1 and 5/i.test(m))).toBe(true);
  });

  it('should return 400 when comment is too short', async () => {
    const res = await request(app)
      .post('/api/feedback')
      .set('Authorization', student2Auth)
      .send({
        course: course._id,
        rating: 3,
        comment: 'Too short', // less than 10 chars
        category: 'teaching',
      });

    expect(res.statusCode).toBe(400);
  });

  it('should return 404 when course does not exist', async () => {
    const fakeId = '6abda2a003f9a3cb9f000000';
    const res = await request(app)
      .post('/api/feedback')
      .set('Authorization', student2Auth)
      .send({
        course: fakeId,
        rating: 4,
        comment: 'Feedback for a non-existent course.',
        category: 'teaching',
      });

    expect(res.statusCode).toBe(404);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
describe('GET /api/feedback/my', () => {
// ═══════════════════════════════════════════════════════════════════════════════

  it('should return only the current student own feedback', async () => {
    // student2 submits their own feedback
    await createFeedback(student2Auth, course._id);

    const res = await request(app)
      .get('/api/feedback/my')
      .set('Authorization', student1Auth); // student1 should only see theirs

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    // All returned feedback must belong to student1
    res.body.data.forEach((fb) => {
      expect(fb.student).toBeTruthy(); // student id is present
    });
    // student1 only has 1 feedback (from beforeEach)
    expect(res.body.data.length).toBe(1);
  });

  it('should return 403 when an admin tries to access /my', async () => {
    const res = await request(app)
      .get('/api/feedback/my')
      .set('Authorization', adminAuth);

    expect(res.statusCode).toBe(403);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
describe('GET /api/feedback (admin list with pagination)', () => {
// ═══════════════════════════════════════════════════════════════════════════════

  it('should return paginated feedback for admin', async () => {
    // Add a second feedback entry
    await createFeedback(student2Auth, course._id);

    const res = await request(app)
      .get('/api/feedback?page=1&limit=1')
      .set('Authorization', adminAuth);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.feedbacks).toHaveLength(1);   // limit=1
    expect(res.body.data.pagination.total).toBe(2);    // 2 total
    expect(res.body.data.pagination.totalPages).toBe(2);
  });

  it('should filter feedback by status', async () => {
    const res = await request(app)
      .get('/api/feedback?status=pending')
      .set('Authorization', adminAuth);

    expect(res.statusCode).toBe(200);
    res.body.data.feedbacks.forEach((fb) => {
      expect(fb.status).toBe('pending');
    });
  });

  it('should return 403 when a student tries to access the admin list', async () => {
    const res = await request(app)
      .get('/api/feedback')
      .set('Authorization', student1Auth);

    expect(res.statusCode).toBe(403);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
describe('GET /api/feedback/stats', () => {
// ═══════════════════════════════════════════════════════════════════════════════

  it('should return average ratings per course for admin', async () => {
    const res = await request(app)
      .get('/api/feedback/stats')
      .set('Authorization', adminAuth);

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);

    const stat = res.body.data[0];
    expect(stat).toHaveProperty('course');
    expect(stat).toHaveProperty('averageRating');
    expect(stat).toHaveProperty('totalFeedback');

    // We know student1 gave rating=5 on course
    expect(stat.averageRating).toBe(5);
    expect(stat.totalFeedback).toBe(1);
  });

  it('should return 403 for a student accessing stats', async () => {
    const res = await request(app)
      .get('/api/feedback/stats')
      .set('Authorization', student1Auth);

    expect(res.statusCode).toBe(403);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
describe('PUT /api/feedback/:id', () => {
// ═══════════════════════════════════════════════════════════════════════════════

  it('should allow the owner student to update their feedback', async () => {
    const res = await request(app)
      .put(`/api/feedback/${feedback1._id}`)
      .set('Authorization', student1Auth)
      .send({ rating: 4, comment: 'Updated comment — still a great course overall.' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.rating).toBe(4);
    expect(res.body.data.comment).toMatch(/updated comment/i);
  });

  it('should return 403 when another student tries to update someone else feedback', async () => {
    const res = await request(app)
      .put(`/api/feedback/${feedback1._id}`) // feedback belongs to student1
      .set('Authorization', student2Auth)    // student2 trying to edit it
      .send({ rating: 1, comment: 'Trying to tamper with someone else feedback.' });

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/not authorized/i);
  });

  it('should allow admin to update feedback status', async () => {
    const res = await request(app)
      .put(`/api/feedback/${feedback1._id}`)
      .set('Authorization', adminAuth)
      .send({ status: 'reviewed' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.status).toBe('reviewed');
  });

  it('should return 403 when student tries to change feedback status', async () => {
    const res = await request(app)
      .put(`/api/feedback/${feedback1._id}`)
      .set('Authorization', student1Auth)
      .send({ status: 'resolved' });

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/students cannot change/i);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
describe('DELETE /api/feedback/:id', () => {
// ═══════════════════════════════════════════════════════════════════════════════

  it('should allow the owner student to delete their feedback', async () => {
    const res = await request(app)
      .delete(`/api/feedback/${feedback1._id}`)
      .set('Authorization', student1Auth);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);
  });

  it('should return 403 when student2 tries to delete student1 feedback', async () => {
    const res = await request(app)
      .delete(`/api/feedback/${feedback1._id}`)
      .set('Authorization', student2Auth);

    expect(res.statusCode).toBe(403);
  });

  it('should allow admin to delete any feedback', async () => {
    const res = await request(app)
      .delete(`/api/feedback/${feedback1._id}`)
      .set('Authorization', adminAuth);

    expect(res.statusCode).toBe(200);
  });

  it('should return 404 for non-existent feedback id', async () => {
    const fakeId = '6abda2a003f9a3cb9f000000';
    const res = await request(app)
      .delete(`/api/feedback/${fakeId}`)
      .set('Authorization', adminAuth);

    expect(res.statusCode).toBe(404);
  });
});

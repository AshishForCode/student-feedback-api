/**
 * scripts/seed.js — Database seed script
 *
 * Creates:
 *  - 1 admin account
 *  - 3 student accounts
 *  - 4 sample courses
 *  - 6 sample feedback entries
 *
 * Run with: npm run seed
 *
 * WARNING: This script CLEARS existing data before seeding.
 * Never run it against a production database!
 */

require('dotenv').config();          // Load .env before anything else
const mongoose = require('mongoose');

const User     = require('../src/models/User');
const Course   = require('../src/models/Course');
const Feedback = require('../src/models/Feedback');

// ── Seed Data ─────────────────────────────────────────────────────────────────

const users = [
  {
    name: 'Super Admin',
    email: 'admin@feedback.com',
    password: 'Admin@123',
    role: 'admin',
  },
  {
    name: 'Alice Johnson',
    email: 'alice@student.com',
    password: 'Student@123',
    role: 'student',
  },
  {
    name: 'Bob Smith',
    email: 'bob@student.com',
    password: 'Student@123',
    role: 'student',
  },
  {
    name: 'Carol White',
    email: 'carol@student.com',
    password: 'Student@123',
    role: 'student',
  },
];

const courses = [
  {
    title: 'Introduction to Computer Science',
    code: 'CS101',
    instructor: 'Dr. Alan Turing',
    department: 'Computer Science',
  },
  {
    title: 'Data Structures and Algorithms',
    code: 'CS201',
    instructor: 'Dr. Grace Hopper',
    department: 'Computer Science',
  },
  {
    title: 'Calculus I',
    code: 'MATH101',
    instructor: 'Prof. Isaac Newton',
    department: 'Mathematics',
  },
  {
    title: 'Technical Writing',
    code: 'ENG201',
    instructor: 'Dr. Jane Austen',
    department: 'English',
  },
];

// ── Main Seed Function ────────────────────────────────────────────────────────

const seedDB = async () => {
  try {
    // 1. Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // 2. Clear existing data (order matters — delete dependents first)
    await Feedback.deleteMany({});
    await Course.deleteMany({});
    await User.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // 3. Create users
    // We use insertMany but passwords need hashing via the pre-save hook,
    // which only runs on .save(). So we create users one by one.
    const createdUsers = [];
    for (const userData of users) {
      const user = new User(userData);
      await user.save();             // triggers the bcrypt pre-save hook
      createdUsers.push(user);
    }
    console.log(`👤 Created ${createdUsers.length} users`);

    // 4. Create courses (no hooks needed, so insertMany is fine)
    const createdCourses = await Course.insertMany(courses);
    console.log(`📚 Created ${createdCourses.length} courses`);

    // 5. Grab the students (skip index 0 = admin)
    const [, alice, bob, carol] = createdUsers;
    const [cs101, cs201, math101, eng201] = createdCourses;

    // 6. Create sample feedback
    const feedbackData = [
      {
        student: alice._id,
        course: cs101._id,
        rating: 5,
        comment: 'Excellent course! Dr. Turing explains complex topics very clearly.',
        category: 'teaching',
        status: 'reviewed',
      },
      {
        student: alice._id,
        course: math101._id,
        rating: 3,
        comment: 'The course content is good but the pace is too fast for beginners.',
        category: 'content',
        status: 'pending',
      },
      {
        student: bob._id,
        course: cs101._id,
        rating: 4,
        comment: 'Great introduction! The lab facilities could use more computers.',
        category: 'facilities',
        status: 'pending',
      },
      {
        student: bob._id,
        course: cs201._id,
        rating: 5,
        comment: 'Best course I have taken! Dr. Hopper is an amazing instructor.',
        category: 'teaching',
        status: 'resolved',
      },
      {
        student: carol._id,
        course: eng201._id,
        rating: 4,
        comment: 'Very useful for improving technical writing skills. Highly recommend.',
        category: 'content',
        status: 'pending',
      },
      {
        student: carol._id,
        course: cs201._id,
        rating: 2,
        comment: 'The assignments are too difficult without enough support materials.',
        category: 'content',
        status: 'pending',
      },
    ];

    await Feedback.insertMany(feedbackData);
    console.log(`💬 Created ${feedbackData.length} feedback entries`);

    // 7. Print login credentials for easy testing
    console.log('\n─────────────────────────────────────────');
    console.log('🔑 TEST CREDENTIALS');
    console.log('─────────────────────────────────────────');
    console.log('Admin   → admin@feedback.com  / Admin@123');
    console.log('Student → alice@student.com   / Student@123');
    console.log('Student → bob@student.com     / Student@123');
    console.log('Student → carol@student.com   / Student@123');
    console.log('─────────────────────────────────────────\n');

    console.log('✅ Database seeded successfully!');
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
  } finally {
    // Always disconnect, even on error
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

seedDB();

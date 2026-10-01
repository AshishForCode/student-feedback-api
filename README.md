# 🎓 Student Feedback Management System API

A production-ready RESTful API built with **Node.js**, **Express.js**, and **MongoDB** that allows students to submit feedback on courses/faculty, and admins to review and manage that feedback.

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Example Requests](#example-requests)
- [Running Tests](#running-tests)
- [API Documentation](#api-documentation)

---

## ✨ Features

- 🔐 **JWT Authentication** with bcrypt password hashing
- 👥 **Role-Based Access Control** (Student / Admin)
- 📝 **Feedback CRUD** with ownership enforcement
- 📚 **Course Management** (admin-only writes)
- 📊 **Admin Dashboard** — pagination, filtering, sorting, and stats
- ✅ **Input Validation** on every endpoint (express-validator)
- 🛡️ **Security** — helmet, CORS, rate limiting on auth routes
- 🧪 **49 Integration Tests** with Jest + Supertest
- 📖 **Swagger UI** interactive documentation at `/api/docs`

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js (LTS) |
| Framework | Express.js 4 |
| Database | MongoDB + Mongoose 8 |
| Auth | JSON Web Tokens (JWT) + bcryptjs |
| Validation | express-validator |
| Security | helmet, cors, express-rate-limit |
| Testing | Jest + Supertest |
| Docs | swagger-jsdoc + swagger-ui-express |
| Dev | nodemon, dotenv |

---

## 📁 Project Structure

```
student-feedback-api/
├── src/
│   ├── config/
│   │   ├── db.js              # MongoDB connection
│   │   └── swagger.js         # OpenAPI 3.0 spec config
│   ├── controllers/
│   │   ├── authController.js  # register, login, getMe
│   │   ├── courseController.js# Course CRUD
│   │   └── feedbackController.js # Feedback CRUD + stats
│   ├── middleware/
│   │   ├── auth.js            # protect + authorize() middleware
│   │   ├── asyncHandler.js    # Wraps async controllers
│   │   ├── errorHandler.js    # Global error handler
│   │   └── validate.js        # express-validator result checker
│   ├── models/
│   │   ├── User.js            # User schema + bcrypt hook
│   │   ├── Course.js          # Course schema
│   │   └── Feedback.js        # Feedback schema + aggregation
│   ├── routes/
│   │   ├── authRoutes.js      # /api/auth/*
│   │   ├── courseRoutes.js    # /api/courses/*
│   │   └── feedbackRoutes.js  # /api/feedback/*
│   ├── utils/
│   │   ├── AppError.js        # Custom error class
│   │   ├── apiResponse.js     # sendSuccess / sendError helpers
│   │   └── generateToken.js   # JWT sign utility
│   └── validators/
│       ├── authValidators.js  # Register + login rules
│       ├── courseValidators.js# Course create + update rules
│       └── feedbackValidators.js # Feedback create + update rules
├── tests/
│   ├── helpers.js             # DB lifecycle + factory helpers
│   ├── auth.test.js           # 13 auth tests
│   ├── courses.test.js        # 15 course tests
│   └── feedback.test.js       # 21 feedback tests
├── scripts/
│   └── seed.js                # Populates DB with sample data
├── app.js                     # Express app configuration
├── server.js                  # Entry point (DB connect + listen)
├── .env.example               # Environment variable template
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+ (LTS recommended)
- [MongoDB](https://www.mongodb.com/try/download/community) running locally **or** a [MongoDB Atlas](https://www.mongodb.com/atlas) connection string

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/student-feedback-api.git
cd student-feedback-api
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
# Copy the template
cp .env.example .env
```

Then open `.env` and fill in your values (see [Environment Variables](#environment-variables) below).

### 4. Seed the database (optional but recommended)

```bash
npm run seed
```

This creates:
- 1 admin: `admin@feedback.com` / `Admin@123`
- 3 students: `alice@student.com`, `bob@student.com`, `carol@student.com` (all use `Student@123`)
- 4 sample courses
- 6 sample feedback entries

### 5. Start the development server

```bash
npm run dev
```

The API will be live at **http://localhost:5000**

---

## 🔑 Environment Variables

Copy `.env.example` to `.env` and set each value:

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment (`development` / `production` / `test`) | `development` |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/feedback_db` |
| `JWT_SECRET` | Long random string for signing tokens | *(generate below)* |
| `JWT_EXPIRES_IN` | Token expiry duration | `7d` |
| `RATE_LIMIT_MAX` | Max auth requests per 15 min per IP | `10` |

**Generate a strong JWT secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

> ⚠️ **Never commit your `.env` file.** It's already in `.gitignore`.

---

## 📡 API Endpoints

### Authentication

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/api/auth/register` | Public | Register a new user |
| `POST` | `/api/auth/login` | Public | Log in and get JWT |
| `GET`  | `/api/auth/me` | Any auth | Get current user profile |

### Courses

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET`    | `/api/courses` | Any auth | List all courses (with optional `?department=` / `?search=`) |
| `GET`    | `/api/courses/:id` | Any auth | Get a single course |
| `POST`   | `/api/courses` | Admin | Create a course |
| `PUT`    | `/api/courses/:id` | Admin | Update a course |
| `DELETE` | `/api/courses/:id` | Admin | Delete a course |

### Feedback

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET`    | `/api/feedback` | Admin | All feedback (pagination, filter, sort) |
| `GET`    | `/api/feedback/stats` | Admin | Average rating per course |
| `GET`    | `/api/feedback/my` | Student | Current student's own feedback |
| `POST`   | `/api/feedback` | Student | Submit new feedback |
| `GET`    | `/api/feedback/:id` | Owner or Admin | Get one feedback |
| `PUT`    | `/api/feedback/:id` | Owner or Admin | Update feedback |
| `DELETE` | `/api/feedback/:id` | Owner or Admin | Delete feedback |

### Query Parameters for `GET /api/feedback` (Admin)

| Param | Type | Description | Example |
|-------|------|-------------|---------|
| `page` | integer | Page number | `?page=2` |
| `limit` | integer | Items per page (max 50) | `?limit=10` |
| `status` | string | Filter by status | `?status=pending` |
| `rating` | integer | Filter by rating | `?rating=5` |
| `category` | string | Filter by category | `?category=teaching` |
| `course` | ObjectId | Filter by course | `?course=<id>` |
| `sort` | string | Sort field (prefix `-` for desc) | `?sort=-createdAt` |

---

## 💬 Example Requests

### Register a student

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Johnson",
    "email": "alice@student.com",
    "password": "Alice1234",
    "role": "student"
  }'
```

### Log in

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@feedback.com",
    "password": "Admin@123"
  }'
# Copy the token from the response
```

### Submit feedback (student)

```bash
curl -X POST http://localhost:5000/api/feedback \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{
    "course": "<course_id>",
    "rating": 5,
    "comment": "Excellent course! Dr. Turing explains complex topics very clearly.",
    "category": "teaching"
  }'
```

### Get all feedback with filters (admin)

```bash
curl "http://localhost:5000/api/feedback?status=pending&rating=5&page=1&limit=10&sort=-createdAt" \
  -H "Authorization: Bearer <admin_token>"
```

### Get average ratings per course (admin)

```bash
curl http://localhost:5000/api/feedback/stats \
  -H "Authorization: Bearer <admin_token>"
```

### Update feedback status (admin)

```bash
curl -X PUT http://localhost:5000/api/feedback/<feedback_id> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{ "status": "reviewed" }'
```

---

## 🧪 Running Tests

Tests use a **separate test database** (`feedback_db_test`) and run sequentially to avoid conflicts.

```bash
# Run all 49 tests once
npm test

# Run in watch mode (re-runs on file save)
npm run test:watch

# Run a single test file
npx jest tests/auth.test.js --runInBand

# Run tests matching a name pattern
npx jest --runInBand -t "should return 403"
```

**Test results:**
```
PASS tests/auth.test.js       (13 tests)
PASS tests/courses.test.js    (15 tests)
PASS tests/feedback.test.js   (21 tests)
─────────────────────────────────────────
Tests: 49 passed, 49 total
```

---

## 📖 API Documentation

Interactive Swagger UI is available at:

**http://localhost:5000/api/docs**

**How to use it:**
1. Click **POST /api/auth/login** → **Try it out** → enter credentials → **Execute**
2. Copy the `token` from the response
3. Click **🔓 Authorize** (top right) → paste the token → **Authorize**
4. All protected endpoints will now include your JWT automatically

The raw OpenAPI JSON spec is also available at:
**http://localhost:5000/api/docs.json** *(can be imported directly into Postman)*

---

## 🔒 Security Features

| Feature | Implementation |
|---------|----------------|
| Password hashing | bcryptjs with cost factor 12 |
| JWT tokens | 7-day expiry, signed with secret |
| Rate limiting | 10 auth requests per 15 min per IP |
| Security headers | helmet (15+ HTTP headers) |
| CORS | Configurable via `CLIENT_URL` env var |
| Input validation | express-validator on every route |
| No secret leakage | Stack traces hidden in production |

---

## 👤 Author

Built as a learning project for back-end development with Node.js, Express.js, and MongoDB.

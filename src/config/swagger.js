/**
 * src/config/swagger.js — OpenAPI 3.0 spec configuration
 *
 * swagger-jsdoc scans the files listed in `apis` for JSDoc comments
 * with @swagger tags and merges them into one complete spec object.
 *
 * swagger-ui-express then serves that spec at /api/docs.
 */

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',

    // ── API Metadata ─────────────────────────────────────────────────────────
    info: {
      title: 'Student Feedback Management System API',
      version: '1.0.0',
      description: `
A RESTful API for managing student feedback on courses and faculty.

## Roles
- **Student**: Register, log in, submit feedback, view/edit/delete own feedback
- **Admin**: View all feedback, filter/search, update status, manage courses

## Authentication
All protected routes require a **Bearer JWT token** in the Authorization header:
\`\`\`
Authorization: Bearer <your_token_here>
\`\`\`
Get your token from **POST /api/auth/login** or **POST /api/auth/register**.
      `,
      contact: {
        name: 'API Support',
        email: 'support@feedback-api.com',
      },
    },

    // ── Servers ───────────────────────────────────────────────────────────────
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
    ],

    // ── Security Scheme ───────────────────────────────────────────────────────
    // This declares that our API uses Bearer JWT tokens.
    // The Authorize button in the Swagger UI uses this definition.
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token (without the "Bearer " prefix)',
        },
      },

      // ── Reusable Schemas ──────────────────────────────────────────────────
      // Define data shapes once, reference them with $ref everywhere.
      schemas: {
        User: {
          type: 'object',
          properties: {
            id:        { type: 'string', example: '6abda1c1ddef86b772325374' },
            name:      { type: 'string', example: 'Alice Johnson' },
            email:     { type: 'string', format: 'email', example: 'alice@student.com' },
            role:      { type: 'string', enum: ['student', 'admin'], example: 'student' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },

        Course: {
          type: 'object',
          properties: {
            id:         { type: 'string', example: '6abda2922c5c31441b80178d' },
            title:      { type: 'string', example: 'Introduction to Computer Science' },
            code:       { type: 'string', example: 'CS101' },
            instructor: { type: 'string', example: 'Dr. Alan Turing' },
            department: { type: 'string', example: 'Computer Science' },
            createdAt:  { type: 'string', format: 'date-time' },
          },
        },

        Feedback: {
          type: 'object',
          properties: {
            id:        { type: 'string', example: '6abda2b003f9a3cb9f257c30' },
            student:   { $ref: '#/components/schemas/User' },
            course:    { $ref: '#/components/schemas/Course' },
            rating:    { type: 'integer', minimum: 1, maximum: 5, example: 4 },
            comment:   { type: 'string', example: 'Great course, very informative.' },
            category:  { type: 'string', enum: ['teaching', 'content', 'facilities', 'other'] },
            status:    { type: 'string', enum: ['pending', 'reviewed', 'resolved'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },

        // ── Standard response wrappers ───────────────────────────────────────
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Success' },
            data:    { type: 'object' },
          },
        },

        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error description' },
          },
        },

        ValidationErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Validation failed' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field:   { type: 'string', example: 'email' },
                  message: { type: 'string', example: 'Please provide a valid email' },
                },
              },
            },
          },
        },
      },

      // ── Reusable Response Objects ─────────────────────────────────────────
      responses: {
        Unauthorized: {
          description: '401 — No token or invalid token',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { success: false, message: 'Not authorized. Please log in.' },
            },
          },
        },
        Forbidden: {
          description: '403 — Token valid but role not allowed',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { success: false, message: 'Access denied. Required role(s): admin.' },
            },
          },
        },
        NotFound: {
          description: '404 — Resource not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { success: false, message: 'Resource not found' },
            },
          },
        },
        ValidationError: {
          description: '400 — Input validation failed',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ValidationErrorResponse' },
            },
          },
        },
      },
    },
  },

  // ── Source files to scan for @swagger JSDoc comments ─────────────────────
  apis: [
    './src/routes/*.js',
    './src/controllers/*.js',
  ],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

# Learning Management System (LMS) API

A scalable and production-oriented Learning Management System (LMS) backend built with Node.js, Express.js, PostgreSQL, and Prisma ORM. The platform supports role-based authentication, instructor onboarding, course creation, student enrollment, lesson progress tracking, assignments, submissions, reviews, and administrative management.

---

# Features

## Authentication & Authorization

* JWT Authentication
* Secure Password Hashing
* Role-Based Access Control (RBAC)
* Student, Instructor, and Admin Roles
* Google OAuth Ready
* Email Verification Support
* Refresh Token Support

## Instructor Management

* Instructor Profile Creation
* Instructor Approval Workflow
* Expertise & Skills Management
* Instructor Rating Tracking
* Student Count Analytics

## Course Management

* Create, Update, Delete Courses
* Course Publishing System
* Course Categories
* Course Difficulty Levels
* Course Thumbnail Support
* Course Reviews and Ratings

## Course Content Management

* Course Sections
* Video Lessons
* Ordered Learning Paths
* Structured Curriculum Design

## Enrollment & Progress Tracking

* Student Enrollment
* Course Progress Monitoring
* Lesson Completion Tracking
* Learning Analytics

## Assignment System

* Create Assignments
* Assignment Deadlines
* Marks & Grading System
* Student Submission Tracking
* Instructor Feedback
* Submission Status Management

## Payment & Purchase Management

* Course Purchase System
* Payment Status Tracking
* Purchase History

## Community Features

* Course Comments
* Course Reviews
* Rating System

## Admin Features

* User Management
* Course Moderation
* Instructor Approval
* Platform Analytics
* Enrollment Statistics

## API Documentation

* Swagger/OpenAPI Documentation
* Interactive API Testing

---

# Technology Stack

| Technology | Purpose             |
| ---------- | ------------------- |
| Node.js    | Runtime Environment |
| Express.js | Backend Framework   |
| PostgreSQL | Relational Database |
| Prisma ORM | Database ORM        |
| JWT        | Authentication      |
| bcrypt     | Password Security   |
| Swagger    | API Documentation   |

---

## Project Structure

```bash
E-LEARNING-API/
├── node_modules/
├── prisma/
│   ├── migrations/
│   └── schema.prisma
│
├── src/
│   ├── config/
│   │   └── swagger.js              # Swagger/OpenAPI configuration
│   │
│   ├── handler/
│   │   ├── adminHandler.js         # Admin-related APIs
│   │   ├── commentAndReviewHandler.js # Comments & course reviews
│   │   ├── instructorHandler.js    # Instructor operations
│   │   ├── studentHandler.js       # Student operations
│   │   └── userHandler.js          # Authentication & user management
│   │
│   ├── middleware/                # Authentication & authorization middleware
│   ├── utils/                     # Helper functions and utilities
│   └── app.js                     # Express application configuration
│
├── .env                           # Environment variables
├── .gitignore
├── package.json
├── package-lock.json
├── prisma.config.ts               # Prisma configuration
├── server.js                      # Application entry point
└── README.md
```
# Database Schema

## User

Stores all platform users including students, instructors, and administrators.

```text
User
├── id
├── name
├── email
├── passwordHash
├── provider
├── role
├── isVerified
├── isOnboarded
├── refreshToken
├── createdAt
└── updatedAt
```

---

## InstructorProfile

Contains instructor-specific information and approval status.

```text
InstructorProfile
├── id
├── userId
├── bio
├── expertise
├── linkedin
├── skills
├── status
├── totalStudents
├── rating
└── createdAt
```

---

## Category

Used to organize courses into logical groups.

```text
Category
├── id
├── name
├── description
└── createdAt
```

---

## Course

Represents learning programs offered by instructors.

```text
Course
├── id
├── title
├── description
├── price
├── level
├── instructorProfileId
├── categoryId
├── thumbnailUrl
├── isPublished
└── createdAt
```

---

## CourseSection

Groups lessons into structured sections.

```text
CourseSection
├── id
├── courseId
├── title
├── order
└── createdAt
```

---

## Lesson

Represents individual learning content.

```text
Lesson
├── id
├── courseId
├── courseSectionId
├── title
├── videoUrl
├── order
└── createdAt
```

---

## Purchase

Stores payment records for purchased courses.

```text
Purchase
├── id
├── userId
├── courseId
├── amount
├── status
└── createdAt
```

---

## Enrollment

Tracks student enrollment in courses.

```text
Enrollment
├── id
├── userId
├── courseId
├── progress
└── createdAt
```

Unique Constraint:

```text
(userId, courseId)
```

Prevents duplicate enrollments.

---

## Progress

Tracks lesson completion progress.

```text
Progress
├── id
├── userId
├── enrollmentId
├── lessonId
├── isCompleted
├── completedAt
├── createdAt
└── updatedAt
```

Unique Constraint:

```text
(enrollmentId, lessonId)
```

Ensures one progress record per lesson.

---

## Assignment

Stores course assignments.

```text
Assignment
├── id
├── title
├── description
├── courseId
├── instructorId
├── deadline
├── totalMarks
├── createdAt
└── updatedAt
```

---

## Submission

Stores assignment submissions.

```text
Submission
├── id
├── assignmentId
├── userId
├── content
├── fileUrl
├── marks
├── feedback
├── status
└── submittedAt
```

Unique Constraint:

```text
(assignmentId, userId)
```

Prevents multiple submissions from the same student.

---

## Comment

Stores course discussion comments.

```text
Comment
├── id
├── userId
├── courseId
├── content
└── createdAt
```

---

## Review

Stores course ratings and feedback.

```text
Review
├── id
├── userId
├── courseId
├── rating
├── comment
└── createdAt
```

Unique Constraint:

```text
(userId, courseId)
```

Prevents duplicate reviews.

---

# Database Design Decisions

## Why PostgreSQL?

This project uses PostgreSQL as its primary database because the Learning Management System contains highly structured and interconnected data.

The platform manages relationships between:

* Users
* Instructors
* Courses
* Categories
* Lessons
* Enrollments
* Assignments
* Submissions
* Purchases
* Reviews

These entities depend heavily on relational integrity, making PostgreSQL an ideal choice.

### 1. Strong Relational Modeling

The LMS contains numerous one-to-many and many-to-many relationships.

Examples:

```text
User → Enrollment
User → Purchase
User → Review

Course → Lessons
Course → Assignments
Course → Reviews

Assignment → Submission
```

PostgreSQL efficiently manages these relationships using foreign keys and joins.

### 2. Data Integrity

Foreign key constraints ensure:

* Invalid enrollments cannot be created.
* Reviews always belong to existing courses.
* Assignments always belong to valid courses.
* Submissions always belong to existing assignments.

This guarantees consistent and reliable data.

### 3. ACID Compliance

PostgreSQL follows ACID principles:

* Atomicity
* Consistency
* Isolation
* Durability

These properties are essential for:

* Course purchases
* Student enrollments
* Assignment submissions
* Progress tracking

where data accuracy is critical.

### 4. Excellent Prisma Integration

PostgreSQL works seamlessly with Prisma ORM and provides:

* Type-safe queries
* Schema migrations
* Better developer experience
* Improved maintainability

### 5. Scalability

PostgreSQL can efficiently handle:

* Large numbers of users
* Thousands of courses
* Assignment submissions
* Progress records
* Payment transactions

while maintaining performance and reliability.

### 6. Advanced Query Capabilities

PostgreSQL supports:

* Aggregations
* Analytics Queries
* Complex Joins
* Indexing
* Transactions

which are useful for generating:

* Admin dashboards
* Enrollment reports
* Instructor statistics
* Course analytics

---

## Why Not MongoDB?

MongoDB is designed for flexible and document-based data.

However, an LMS contains highly relational entities where consistency and relationships are more important than schema flexibility.

Using MongoDB would result in:

* More complex relationship management
* Data duplication
* Additional application-level validation

PostgreSQL provides a cleaner and more maintainable solution for this use case.

---

# API Documentation

Swagger documentation is available at:

```bash
http://localhost:3000/docs
```

---

# Installation

```bash
git clone <repository-url>
cd lms-api

npm install

npx prisma generate
npx prisma migrate dev

npm run dev
```

---

# Environment Variables

```env
PORT=3000

DATABASE_URL=postgresql://username:password@localhost:5432/lms_db

JWT_SECRET=your_secret_key

JWT_REFRESH_SECRET=your_refresh_secret
```

---

# Future Improvements

* Live Classes
* Quiz System
* Certificates
* Discussion Forums
* Real-Time Notifications
* Payment Gateway Integration
* AI-Powered Course Recommendations

---

# Author

Nandan Chakraborty

B.Sc. in Computer Science and Engineering

Dhaka, Bangladesh

---

# License

MIT License

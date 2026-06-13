# Learning Management System (LMS) Backend API

A scalable and production-ready Learning Management System (LMS) backend built with **Node.js**, **Express.js**, **PostgreSQL**, and **Prisma ORM**.

The platform supports authentication, instructor onboarding, course management, student enrollment, lesson progress tracking, assignments, AI-powered assignment feedback, reviews, and administrative operations.

---

# Overview

This project is designed to simulate a real-world e-learning platform similar to Udemy, Coursera, or Skillshare.

The API provides:

* Secure Authentication & Authorization
* Instructor Management
* Course Creation & Publishing
* Student Enrollment
* Lesson Progress Tracking
* Assignment & Submission Management
* AI-Powered Assignment Feedback
* Reviews & Comments
* Administrative Controls
* Interactive API Documentation

---

# Tech Stack

| Technology        | Purpose                |
| ----------------- | ---------------------- |
| Node.js           | Runtime Environment    |
| Express.js        | Backend Framework      |
| PostgreSQL        | Relational Database    |
| Prisma ORM        | Database ORM           |
| JWT               | Authentication         |
| bcrypt            | Password Hashing       |
| Swagger           | API Documentation      |
| Google Gemini API | AI Assignment Feedback |

---

# Key Features

## Authentication & Authorization

* JWT Authentication
* Refresh Token Support
* Role-Based Access Control (RBAC)
* Student, Instructor, and Admin Roles
* Google OAuth Authentication
* Email Verification

---

## Instructor Management

* Instructor Profile Creation
* Instructor Approval Workflow
* Skills & Expertise Management
* Instructor Ratings
* Student Analytics

---

## Course Management

* Create Courses
* Update Courses
* Delete Courses
* Publish Courses
* Course Categories
* Difficulty Levels
* Course Thumbnail Support

---

## Course Content

* Course Sections
* Video Lessons
* Ordered Curriculum Structure
* Learning Path Management

---

## Student Features

* Course Enrollment
* Progress Tracking
* Lesson Completion Tracking
* Learning Analytics

---

## Assignment System

* Assignment Creation
* Submission Tracking
* Deadline Management
* Marks & Grading
* Instructor Feedback
* Submission Status Tracking
* AI Assignment Feedback

---

## Community Features

* Course Reviews
* Course Ratings
* Discussion Comments

---

## Administrative Features

* User Management
* Course Moderation
* Instructor Approval
* Enrollment Analytics
* Platform Statistics

---

# Project Structure

```bash
E-LEARNING-API/
│
├── prisma/
│   ├── migrations/
│   └── schema.prisma
│
├── src/
│   ├── config/
│   │   └── swagger.js
│   │
│   ├── handler/
│   │   ├── adminHandler.js
│   │   ├── commentAndReviewHandler.js
│   │   ├── instructorHandler.js
│   │   ├── studentHandler.js
│   │   └── userHandler.js
│   │
│   ├── middleware/
│   ├── utils/
│   └── app.js
│
├── .env
├── server.js
├── package.json
├── prisma.config.ts
└── README.md
```

---

# Database Design

The application uses PostgreSQL because the LMS contains highly relational data.

### Main Relationships

```text
User
 ├── Enrollment
 ├── Purchase
 ├── Review
 └── Submission

Instructor
 └── Course

Course
 ├── Sections
 ├── Lessons
 ├── Assignments
 ├── Reviews
 └── Enrollments

Assignment
 └── Submission
```

### Why PostgreSQL?

* Strong relational modeling
* ACID compliance
* Data integrity through foreign keys
* Transaction support
* Advanced indexing
* Scalable analytics queries
* Excellent Prisma integration

---

# Prerequisites

Before running the project, ensure the following software is installed:

### Node.js

```bash
node -v
```

Recommended:

```text
v20+
```

### PostgreSQL

```bash
psql --version
```

Recommended:

```text
PostgreSQL 15+
```

### Git

```bash
git --version
```

---

# Installation Guide

## Step 1: Clone Repository

```bash
git clone https://github.com/nandanchakraborty/E-learning-backend-API.git
```

Move into the project directory:

```bash
cd E-learning-backend-API
```

---

## Step 2: Install Dependencies

```bash
npm install
```

---

## Step 3: Create PostgreSQL Database

Login to PostgreSQL:

```bash
psql -U postgres
```

Create database:

```sql
CREATE DATABASE lms_db;
```

---

## Step 4: Configure Environment Variables

Create a `.env` file in the project root.

Example:

```env
PORT=3000

DATABASE_URL="postgresql://postgres:password@localhost:5432/lms_db"

JWT_SECRET=your_jwt_secret

JWT_REFRESH_SECRET=your_refresh_secret

GOOGLE_CLIENT_ID=your_google_client_id

GOOGLE_CLIENT_SECRET=your_google_client_secret

GEMINI_API_KEY=your_gemini_api_key
```

Replace all values with your own credentials.

---

## Step 5: Generate Prisma Client

```bash
npx prisma generate
```

---

## Step 6: Run Database Migrations

```bash
npx prisma migrate dev
```

This command:

* Creates database tables
* Applies migrations
* Updates Prisma Client

---

## Step 7: Start Development Server

```bash
npm run dev
```

You should see:

```bash
Server running on port 3000
```

---

# API Documentation

Swagger documentation is automatically generated.

Open:

```text
http://localhost:3000/docs
```

Features:

* API endpoint documentation
* Request examples
* Response examples
* Interactive API testing

---

# Useful Prisma Commands

Generate Prisma Client:

```bash
npx prisma generate
```

Create Migration:

```bash
npx prisma migrate dev --name migration_name
```

Open Prisma Studio:

```bash
npx prisma studio
```

Reset Database:

```bash
npx prisma migrate reset
```

---

# AI Assignment Feedback

The platform integrates Google Gemini API to provide AI-generated assignment feedback.

Capabilities:

* Assignment Evaluation
* Improvement Suggestions
* Learning Guidance
* Feedback Generation

---

# Future Improvements

* Live Classes
* Quiz System
* Certificates
* Discussion Forums
* Real-Time Notifications
* Payment Gateway Integration
* AI Course Recommendations
* Video Streaming Optimization
* Course Wishlist
* Student Dashboard Analytics

---

# Author

**Nandan Chakraborty**

B.Sc. in Computer Science and Engineering

Dhaka, Bangladesh

---

# License

This project is licensed under the MIT License.

const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { getPrisma } = require('../utils/prisma');
const { adminMiddleware } = require('../middleware/authMiddleware');
const { logger } = require("../utils/logger");

// POST - Create a new admin (by existing admin)
router.post('/create-admin', adminMiddleware, async (req, res) => {
    const prisma = getPrisma();
    const { name, email, password } = req.body;

    try {
        if (!name || !email || !password) {
            return res.status(400).json({ msg: 'Name, email, and password are required' });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ msg: 'User with this email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const admin = await prisma.user.create({
            data: {
                name,
                email,
                passwordHash: hashedPassword,
                role: 'admin',
                isVerified: true,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
            },
        });

        logger.info(`Admin created: ${admin.id} by admin ${req.userId}`);
        return res.status(201).json({ admin, msg: "Admin created successfully" });

    } catch (err) {
        console.error(err);
        logger.error(`Error creating admin: ${err.message}`);
        return res.status(500).json({ msg: "Internal server error" });
    }
});

// GET - Fetch all users
router.get('/users', adminMiddleware, async (req, res) => {
    const prisma = getPrisma();

    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isVerified: true,
                isOnboarded: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return res.status(200).json({ users, count: users.length });

    } catch (err) {
        console.error(err);
        logger.error(`Error fetching users: ${err.message}`);
        return res.status(500).json({ msg: "Internal server error" });
    }
});

// GET - Fetch a single user by ID
router.get('/users/:userId', adminMiddleware, async (req, res) => {
    const prisma = getPrisma();
    const { userId } = req.params;

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isVerified: true,
                isOnboarded: true,
                provider: true,
                createdAt: true,
                updatedAt: true,
                instructorProfile: true,
                enrollments: {
                    select: {
                        courseId: true,
                        progress: true,
                    },
                },
            },
        });

        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        return res.status(200).json({ user });

    } catch (err) {
        console.error(err);
        logger.error(`Error fetching user: ${err.message}`);
        return res.status(500).json({ msg: "Internal server error" });
    }
});

// PUT - Update user role
router.put('/users/:userId/role', adminMiddleware, async (req, res) => {
    const prisma = getPrisma();
    const { userId } = req.params;
    const { role } = req.body;

    try {
        if (!['student', 'instructor', 'admin'].includes(role)) {
            return res.status(400).json({ msg: 'Invalid role. Must be student, instructor, or admin' });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { role },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
            },
        });

        logger.info(`User ${userId} role updated to ${role} by admin ${req.userId}`);
        return res.status(200).json({ user: updatedUser, msg: "User role updated successfully" });

    } catch (err) {
        console.error(err);
        logger.error(`Error updating user role: ${err.message}`);
        return res.status(500).json({ msg: "Internal server error" });
    }
});

// DELETE - Delete a user
router.delete('/users/:userId', adminMiddleware, async (req, res) => {
    const prisma = getPrisma();
    const { userId } = req.params;

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        if (user.role === 'admin') {
            return res.status(403).json({ msg: "Cannot delete admin users" });
        }

        await prisma.user.delete({
            where: { id: userId },
        });

        logger.info(`User ${userId} deleted by admin ${req.userId}`);
        return res.status(200).json({ msg: "User deleted successfully" });

    } catch (err) {
        console.error(err);
        logger.error(`Error deleting user: ${err.message}`);
        return res.status(500).json({ msg: "Internal server error" });
    }
});

// GET - Fetch pending instructor approvals
router.get('/instructors/pending', adminMiddleware, async (req, res) => {
    const prisma = getPrisma();

    try {
        const pendingInstructors = await prisma.instructorProfile.findMany({
            where: { status: 'pending' },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return res.status(200).json({ instructors: pendingInstructors, count: pendingInstructors.length });

    } catch (err) {
        console.error(err);
        logger.error(`Error fetching pending instructors: ${err.message}`);
        return res.status(500).json({ msg: "Internal server error" });
    }
});

// PUT - Approve or reject instructor
router.put('/instructors/:instructorId/status', adminMiddleware, async (req, res) => {
    const prisma = getPrisma();
    const { instructorId } = req.params;
    const { status } = req.body;

    try {
        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ msg: 'Status must be approved or rejected' });
        }

        const instructor = await prisma.instructorProfile.findUnique({
            where: { id: instructorId },
        });

        if (!instructor) {
            return res.status(404).json({ msg: "Instructor not found" });
        }

        const updatedInstructor = await prisma.instructorProfile.update({
            where: { id: instructorId },
            data: { status },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        logger.info(`Instructor ${instructorId} status updated to ${status} by admin ${req.userId}`);
        return res.status(200).json({ instructor: updatedInstructor, msg: `Instructor ${status} successfully` });

    } catch (err) {
        console.error(err);
        logger.error(`Error updating instructor status: ${err.message}`);
        return res.status(500).json({ msg: "Internal server error" });
    }
});

// Dashboard statistics
router.get('/dashboard/stats', adminMiddleware, async (req, res) => {
    const prisma = getPrisma();

    try {
        const totalUsers = await prisma.user.count();
        const totalStudents = await prisma.user.count({ where: { role: 'student' } });
        const totalInstructors = await prisma.user.count({ where: { role: 'instructor' } });
        const totalAdmins = await prisma.user.count({ where: { role: 'admin' } });
        const totalCourses = await prisma.course.count();
        const totalEnrollments = await prisma.enrollment.count();
        const pendingInstructors = await prisma.instructorProfile.count({ where: { status: 'pending' } });
        const totalComments = await prisma.comment.count();
        const totalReviews = await prisma.review.count();

        return res.status(200).json({
            stats: {
                totalUsers,
                totalStudents,
                totalInstructors,
                totalAdmins,
                totalCourses,
                totalEnrollments,
                pendingInstructors,
                totalComments,
                totalReviews,
            },
        });

    } catch (err) {
        console.error(err);
        logger.error(`Error fetching dashboard stats: ${err.message}`);
        return res.status(500).json({ msg: "Internal server error" });
    }
});

module.exports = router;

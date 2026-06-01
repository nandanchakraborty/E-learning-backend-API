const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { getPrisma } = require('../utils/prisma');
const { studentMiddleware } = require('../middleware/authMiddleware');
const { logger } = require("../utils/logger");

// POST - Create a new comment
router.post('/comment/:courseId', studentMiddleware, async (req, res) => {
    const prisma = getPrisma();
    const userId = req.userId;
    const { courseId } = req.params;
    const { content } = req.body;

    try {
        if (!content || content.trim() === '') {
            return res.status(400).json({ msg: 'Content cannot be empty' });
        }

        const comment = await prisma.comment.create({
            data: {
                userId,
                courseId,
                content,
            },
            select: {
                id: true,
                userId: true,
                courseId: true,
                content: true,
                createdAt: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        logger.info(`Comment created: ${comment.id} by user ${userId}`);
        return res.status(201).json({ comment: comment, msg: "Comment posted successfully" });

    } catch (err) {
        console.error(err);
        logger.error(`Error creating comment: ${err.message}`);
        return res.status(500).json({ msg: "Internal server error" });
    }
});

// GET - Fetch all comments for a course
router.get('/comment/course/:courseId', async (req, res) => {
    const prisma = getPrisma();
    const { courseId } = req.params;

    try {
        const comments = await prisma.comment.findMany({
            where: { courseId },
            select: {
                id: true,
                userId: true,
                courseId: true,
                content: true,
                createdAt: true,
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

        return res.status(200).json({ comments, count: comments.length });

    } catch (err) {
        console.error(err);
        logger.error(`Error fetching comments: ${err.message}`);
        return res.status(500).json({ msg: "Internal server error" });
    }
});

// GET - Fetch a single comment by ID
router.get('/comment/:commentId', async (req, res) => {
    const prisma = getPrisma();
    const { commentId } = req.params;

    try {
        const comment = await prisma.comment.findUnique({
            where: { id: commentId },
            select: {
                id: true,
                userId: true,
                courseId: true,
                content: true,
                createdAt: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        if (!comment) {
            return res.status(404).json({ msg: "Comment not found" });
        }

        return res.status(200).json({ comment });

    } catch (err) {
        console.error(err);
        logger.error(`Error fetching comment: ${err.message}`);
        return res.status(500).json({ msg: "Internal server error" });
    }
});

// PUT - Update a comment
router.put('/comment/:commentId', studentMiddleware, async (req, res) => {
    const prisma = getPrisma();
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.userId;

    try {
        if (!content || content.trim() === '') {
            return res.status(400).json({ msg: 'Content cannot be empty' });
        }

        const existingComment = await prisma.comment.findUnique({
            where: { id: commentId },
        });

        if (!existingComment) {
            return res.status(404).json({ msg: "Comment not found" });
        }

        if (existingComment.userId !== userId) {
            return res.status(403).json({ msg: "You can only update your own comments" });
        }

        const updatedComment = await prisma.comment.update({
            where: { id: commentId },
            data: { content },
            select: {
                id: true,
                userId: true,
                courseId: true,
                content: true,
                createdAt: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        logger.info(`Comment updated: ${commentId} by user ${userId}`);
        return res.status(200).json({ comment: updatedComment, msg: "Comment updated successfully" });

    } catch (err) {
        console.error(err);
        logger.error(`Error updating comment: ${err.message}`);
        return res.status(500).json({ msg: "Internal server error" });
    }
});

// DELETE - Delete a comment
router.delete('/comment/:commentId', studentMiddleware, async (req, res) => {
    const prisma = getPrisma();
    const { commentId } = req.params;
    const userId = req.userId;

    try {
        const existingComment = await prisma.comment.findUnique({
            where: { id: commentId },
        });

        if (!existingComment) {
            return res.status(404).json({ msg: "Comment not found" });
        }

        if (existingComment.userId !== userId) {
            return res.status(403).json({ msg: "You can only delete your own comments" });
        }

        const deletedComment = await prisma.comment.delete({
            where: { id: commentId },
        });

        logger.info(`Comment deleted: ${commentId} by user ${userId}`);
        return res.status(200).json({ msg: "Comment deleted successfully" });

    } catch (err) {
        console.error(err);
        logger.error(`Error deleting comment: ${err.message}`);
        return res.status(500).json({ msg: "Internal server error" });
    }
});


// POST - Create a new review
router.post('/review/:courseId', studentMiddleware, async (req, res) => {
    const prisma = getPrisma();
    const userId = req.userId;
    const { courseId } = req.params;
    const { rating, comment } = req.body;

    try {
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ msg: 'Rating must be between 1 and 5' });
        }

        const review = await prisma.review.create({
            data: {
                userId,
                courseId,
                rating,
                comment: comment || null,
            },
            select: {
                id: true,
                userId: true,
                courseId: true,
                rating: true,
                comment: true,
                createdAt: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        logger.info(`Review created: ${review.id} by user ${userId}`);
        return res.status(201).json({ review: review, msg: "Review posted successfully" });

    } catch (err) {
        console.error(err);
        logger.error(`Error creating review: ${err.message}`);
        return res.status(500).json({ msg: "Internal server error" });
    }
});

router.get('/review/course/:courseId', async (req, res) => {
    const prisma = getPrisma();
    const { courseId } = req.params;

    try {
        const reviews = await prisma.review.findMany({
            where: { courseId },
            select: {
                id: true,
                userId: true,
                courseId: true,
                rating: true,
                comment: true,
                createdAt: true,
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

        const averageRating = reviews.length > 0
            ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(2)
            : 0;

        return res.status(200).json({ reviews, count: reviews.length, averageRating });

    } catch (err) {
        console.error(err);
        logger.error(`Error fetching reviews: ${err.message}`);
        return res.status(500).json({ msg: "Internal server error" });
    }
});

// GET - Fetch a single review by ID
router.get('/review/:reviewId', async (req, res) => {
    const prisma = getPrisma();
    const { reviewId } = req.params;

    try {
        const review = await prisma.review.findUnique({
            where: { id: reviewId },
            select: {
                id: true,
                userId: true,
                courseId: true,
                rating: true,
                comment: true,
                createdAt: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        if (!review) {
            return res.status(404).json({ msg: "Review not found" });
        }

        return res.status(200).json({ review });

    } catch (err) {
        console.error(err);
        logger.error(`Error fetching review: ${err.message}`);
        return res.status(500).json({ msg: "Internal server error" });
    }
});

// PUT - Update a review
router.put('/review/:reviewId', studentMiddleware, async (req, res) => {
    const prisma = getPrisma();
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.userId;

    try {
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ msg: 'Rating must be between 1 and 5' });
        }

        const existingReview = await prisma.review.findUnique({
            where: { id: reviewId },
        });

        if (!existingReview) {
            return res.status(404).json({ msg: "Review not found" });
        }

        if (existingReview.userId !== userId) {
            return res.status(403).json({ msg: "You can only update your own reviews" });
        }

        const updatedReview = await prisma.review.update({
            where: { id: reviewId },
            data: {
                rating,
                comment: comment || null,
            },
            select: {
                id: true,
                userId: true,
                courseId: true,
                rating: true,
                comment: true,
                createdAt: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        logger.info(`Review updated: ${reviewId} by user ${userId}`);
        return res.status(200).json({ review: updatedReview, msg: "Review updated successfully" });

    } catch (err) {
        console.error(err);
        logger.error(`Error updating review: ${err.message}`);
        return res.status(500).json({ msg: "Internal server error" });
    }
});

// DELETE - Delete a review
router.delete('/review/:reviewId', studentMiddleware, async (req, res) => {
    const prisma = getPrisma();
    const { reviewId } = req.params;
    const userId = req.userId;

    try {
        const existingReview = await prisma.review.findUnique({
            where: { id: reviewId },
        });

        if (!existingReview) {
            return res.status(404).json({ msg: "Review not found" });
        }

        if (existingReview.userId !== userId) {
            return res.status(403).json({ msg: "You can only delete your own reviews" });
        }

        await prisma.review.delete({
            where: { id: reviewId },
        });

        logger.info(`Review deleted: ${reviewId} by user ${userId}`);
        return res.status(200).json({ msg: "Review deleted successfully" });

    } catch (err) {
        console.error(err);
        logger.error(`Error deleting review: ${err.message}`);
        return res.status(500).json({ msg: "Internal server error" });
    }
});

module.exports = router;
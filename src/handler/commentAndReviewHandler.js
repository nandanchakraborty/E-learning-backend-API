const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { getPrisma } = require('../utils/prisma');
const { studentMiddleware } = require('../middleware/authMiddleware');
const { logger } = require("../utils/logger");


/**
 * @swagger
 * /cmtReview/comment/{courseId}:
 *   post:
 *     summary: Create a new comment on a course
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 description: Comment content
 *     responses:
 *       201:
 *         description: Comment created successfully
 *       400:
 *         description: Content cannot be empty
 *       500:
 *         description: Internal server error
 */

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


/**
 * @swagger
 * /cmtReview/comment/course/{courseId}:
 *   get:
 *     summary: Get all comments for a course
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of comments
 *       500:
 *         description: Internal server error
 */

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


/**
 * @swagger
 * /cmtReview/comment/{commentId}:
 *   get:
 *     summary: Get a single comment by ID
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Comment details
 *       404:
 *         description: Comment not found
 *       500:
 *         description: Internal server error
 *   put:
 *     summary: Update a comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Comment updated successfully
 *       403:
 *         description: You can only update your own comments
 *       404:
 *         description: Comment not found
 *       500:
 *         description: Internal server error
 *   delete:
 *     summary: Delete a comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *       403:
 *         description: You can only delete your own comments
 *       404:
 *         description: Comment not found
 *       500:
 *         description: Internal server error
 */

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


/**
 * @swagger
 * /cmtReview/review/{courseId}:
 *   post:
 *     summary: Create a new review on a course
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Review rating
 *               comment:
 *                 type: string
 *                 description: Optional review comment
 *     responses:
 *       201:
 *         description: Review created successfully
 *       400:
 *         description: Rating must be between 1 and 5
 *       500:
 *         description: Internal server error
 */

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


/**
 * @swagger
 * /cmtReview/review/course/{courseId}:
 *   get:
 *     summary: Get all reviews for a course with average rating
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of reviews with average rating
 *       500:
 *         description: Internal server error
 */

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


/**
 * @swagger
 * /cmtReview/review/{reviewId}:
 *   get:
 *     summary: Get a single review by ID
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Review details
 *       404:
 *         description: Review not found
 *       500:
 *         description: Internal server error
 *   put:
 *     summary: Update a review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Review updated successfully
 *       403:
 *         description: You can only update your own reviews
 *       404:
 *         description: Review not found
 *       500:
 *         description: Internal server error
 *   delete:
 *     summary: Delete a review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Review deleted successfully
 *       403:
 *         description: You can only delete your own reviews
 *       404:
 *         description: Review not found
 *       500:
 *         description: Internal server error
 */

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
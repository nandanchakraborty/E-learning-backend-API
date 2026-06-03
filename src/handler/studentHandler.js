const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { getPrisma } = require("../utils/prisma");
const { studentMiddleware } = require("../middleware/authMiddleware");
const { logger } = require("../utils/logger");

/**
 * @swagger
 * /stu/purchase/{courseId}:
 *   post:
 *     summary: Purchase a course (student only)
 *     tags: [Student - Purchases]
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
 *               amount:
 *                 type: number
 *                 description: Purchase amount (must match course price)
 *               status:
 *                 type: string
 *                 enum: [pending, success, failed]
 *                 description: Payment status
 *     responses:
 *       201:
 *         description: Purchase created successfully
 *       400:
 *         description: Invalid amount or missing fields
 *       404:
 *         description: Course not found
 *       500:
 *         description: Internal server error
 */

router.post("/purchase/:courseId", studentMiddleware, async (req, res) => {
	const prisma = getPrisma();
	const { courseId } = req.params;
	const userId = req.userId;
	const { amount, status } = req.body;

	try {
		if (!prisma) {
			return res.status(500).json({ msg: "Database connection failed" });
		}

		if (!amount || !status) {
			return res
				.status(400)
				.json({ msg: "Need to provide amount and status" });
		}

		const course = await prisma.course.findUnique({
			where: { id: courseId },
		});

		if (!course) {
			return res.status(404).json({ msg: "Course not found" });
		}

		if (course.price !== amount) {
			return res
				.status(400)
				.json({ msg: "Amount does not match course price" });
		}

		const purchase = await prisma.purchase.create({
			data: {
				userId,
				courseId,
				amount,
				status,
			},
			select: {
				id: true,
				userId: true,
				courseId: true,
				amount: true,
				status: true,
				createdAt: true,
			},
		});

		logger.info(`Purchase created: ${purchase.id} for course ${courseId}`);
		return res
			.status(201)
			.json({ purchase: purchase, msg: "Course purchased successfully" });
	} catch (err) {
		logger.error("Purchase error:", err.message);
		return res.status(500).json({ msg: "Internal server error" });
	}
});

/**
 * @swagger
 * /stu/purchases:
 *   get:
 *     summary: Get all purchases by student (student only)
 *     tags: [Student - Purchases]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of purchases
 *       500:
 *         description: Internal server error
 */

router.get("/purchases", studentMiddleware, async (req, res) => {
	const prisma = getPrisma();
	const userId = req.userId;

	try {
		if (!prisma) {
			return res.status(500).json({ msg: "Database connection failed" });
		}

		const purchases = await prisma.purchase.findMany({
			where: { userId: userId },
			include: { course: true },
		});

		return res
			.status(200)
			.json({ purchases: purchases, total: purchases.length });
	} catch (err) {
		logger.error("Fetch purchases error:", err.message);
		return res.status(500).json({ msg: "Internal server error" });
	}
});

/**
 * @swagger
 * /stu/purchase/{purchaseId}:
 *   get:
 *     summary: Get purchase details (student only)
 *     tags: [Student - Purchases]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: purchaseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Purchase details
 *       403:
 *         description: Access denied
 *       404:
 *         description: Purchase not found
 *       500:
 *         description: Internal server error
 */

router.get("/purchase/:purchaseId", studentMiddleware, async (req, res) => {
	const prisma = getPrisma();
	const { purchaseId } = req.params;
	const userId = req.userId;

	try {
		if (!prisma) {
			return res.status(500).json({ msg: "Database connection failed" });
		}

		const purchase = await prisma.purchase.findUnique({
			where: { id: purchaseId },
			include: { course: true },
		});

		if (!purchase) {
			return res.status(404).json({ msg: "Purchase not found" });
		}

		if (purchase.userId !== userId) {
			return res.status(403).json({
				msg: "Access denied. You can only view your own purchases",
			});
		}

		return res.status(200).json({ purchase: purchase });
	} catch (err) {
		logger.error("Fetch purchase error:", err.message);
		return res.status(500).json({ msg: "Internal server error" });
	}
});

/**
 * @swagger
 * /stu/enrollment/{purchaseId}:
 *   post:
 *     summary: Enroll in course using purchase (student only)
 *     tags: [Student - Enrollment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: purchaseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Enrollment successful
 *       400:
 *         description: Already enrolled or invalid purchase
 *       403:
 *         description: Access denied
 *       404:
 *         description: Purchase not found
 *       500:
 *         description: Internal server error
 */

router.post("/enrollment/:purchaseId", studentMiddleware, async (req, res) => {
	const prisma = getPrisma();
	const { purchaseId } = req.params;
	const userId = req.userId;
	try {
		if (!prisma) {
			return res.status(500).json({ msg: "Database connection failed" });
		}

		const purchase = await prisma.purchase.findUnique({
			where: { id: purchaseId },
			include: { course: true },
		});

		if (!purchase) {
			return res.status(404).json({ msg: "Purchase not found" });
		}

		if (purchase.userId !== userId) {
			return res.status(403).json({
				msg: "Access denied. You can only enroll using your own purchases",
			});
		}

		const existingEnrollment = await prisma.enrollment.findFirst({
			where: {
				userId: userId,
				courseId: purchase.courseId,
			},
		});

		if (existingEnrollment) {
			return res
				.status(400)
				.json({ msg: "Already enrolled in this course" });
		}

		const enrollment = await prisma.enrollment.create({
			data: {
				userId,
				courseId: purchase.courseId,
			},
			select: {
				id: true,
				userId: true,
				courseId: true,
				progress: true,
				createdAt: true,
			},
		});

		logger.info(
			`Enrollment created: ${enrollment.id} for course ${purchase.courseId}`,
		);
		return res
			.status(201)
			.json({ enrollment: enrollment, msg: "Enrollment successful" });
	} catch (err) {
		logger.error("Enrollment error:", err.message);
		return res.status(500).json({ msg: "Internal server error" });
	}
});

/**
 * @swagger
 * /stu/enrollments:
 *   get:
 *     summary: Get all enrollments for student (student only)
 *     tags: [Student - Enrollment]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of enrollments
 *       500:
 *         description: Internal server error
 */

router.get("/enrollments", studentMiddleware, async (req, res) => {
	const userId = req.userId;
	const prisma = getPrisma();
	try {
		if (!prisma) {
			return res.status(500).json({ msg: "Database connection failed" });
		}

		const enrollments = await prisma.enrollment.findMany({
			where: { userId: userId },
			include: { course: true },
		});

		return res
			.status(200)
			.json({ enrollments: enrollments, total: enrollments.length });
	} catch (err) {
		logger.error("Fetch enrollments error:", err.message);
		return res.status(500).json({ msg: "Internal server error" });
	}
});

/**
 * @swagger
 * /stu/enrollment/{enrollmentId}:
 *   get:
 *     summary: Get enrollment details (student only)
 *     tags: [Student - Enrollment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: enrollmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Enrollment details
 *       403:
 *         description: Access denied
 *       404:
 *         description: Enrollment not found
 *       500:
 *         description: Internal server error
 *   delete:
 *     summary: Delete enrollment (student only)
 *     tags: [Student - Enrollment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: enrollmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Enrollment deleted successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Enrollment not found
 *       500:
 *         description: Internal server error
 */

router.get("/enrollment/:enrollmentId", studentMiddleware, async (req, res) => {
	const prisma = getPrisma();
	const { enrollmentId } = req.params;
	const userId = req.userId;

	try {
		if (!prisma) {
			return res.status(500).json({ msg: "Database connection failed" });
		}

		const enrollment = await prisma.enrollment.findUnique({
			where: { id: enrollmentId },
			include: { course: true },
		});

		if (!enrollment) {
			return res.status(404).json({ msg: "Enrollment not found" });
		}

		if (enrollment.userId !== userId) {
			return res
				.status(403)
				.json({
					msg: "Access denied. You can only view your own enrollments",
				});
		}

		return res.status(200).json({ enrollment: enrollment });
	} catch (err) {
		logger.error("Fetch enrollment error:", err.message);
		return res.status(500).json({ msg: "Internal server error" });
	}
});

router.delete(
	"/enrollment/:enrollmentId",
	studentMiddleware,
	async (req, res) => {
		const prisma = getPrisma();
		const { enrollmentId } = req.params;
		const userId = req.userId;

		try {
			if (!prisma) {
				return res
					.status(500)
					.json({ msg: "Database connection failed" });
			}

			const enrollment = await prisma.enrollment.findUnique({
				where: { id: enrollmentId },
			});

			if (!enrollment) {
				return res.status(404).json({ msg: "Enrollment not found" });
			}

			if (enrollment.userId !== userId) {
				return res
					.status(403)
					.json({
						msg: "Access denied. You can only delete your own enrollments",
					});
			}

			await prisma.enrollment.delete({
				where: { id: enrollmentId },
			});

			logger.info(`Enrollment deleted: ${enrollmentId}`);
			return res
				.status(200)
				.json({ msg: "Enrollment deleted successfully" });
		} catch (err) {
			logger.error("Delete enrollment error:", err.message);
			return res.status(500).json({ msg: "Internal server error" });
		}
	},
);

//protected lesson access
router.get(
	"/protectedLesson/:courseId/:courseSectionId",
	studentMiddleware,
	async (req, res) => {
		const prisma = getPrisma();
		const userId = req.userId;
		const { courseId, courseSectionId } = req.params;

		try {
			const enrollment = await prisma.enrollment.findUnique({
				where: { id: userId },
			});

			if (!enrollment) {
				return res.status(404).json({ msg: "Enrollment not found" });
			}

			if (enrollment.userId !== userId) {
				return res
					.status(403)
					.json({
						msg: "Access denied. You can only delete your own enrollments",
					});
			}
			const lessons = await prisma.lesson.findUnique({
				where: { courseId: courseId, courseSectionId: courseSectionId },
			});
			if (lessons) {
				return res
					.status(200)
					.json({ lessons: lessons, msg: "Lesson found" });
			} else {
				return res
					.status(400)
					.json({ msg: "invalid couse section id" });
			}
		} catch (err) {
			console.log(err);
			return res.status(500).json({ msg: "internal server error" });
		}
	},
);

//course progress  tracking
router.get(
	"/courseProgress/:courseId/:courseSectionId",
	studentMiddleware,
	async (req, res) => {
		const prisma = getPrisma();
		const userId = req.userId;
		const { courseId, courseSectionId } = req.params;

		try {
			const enrollment = await prisma.enrollment.findFirst({
				where: { userId: userId, courseId: courseId },
			});

			if (!enrollment) {
				return res.status(404).json({ msg: "Enrollment not found" });
			}

			const courseSectionCount = await prisma.courseSection.count({
				where: { courseId: courseId },
			});
			const getSectionOrder = await prisma.courseSection.findUnique({
				where: { id: courseSectionId },
			});
			if (!getSectionOrder) {
				return res
					.status(404)
					.json({ msg: "Course section not found" });
			}
			const courseProgress =
				((getSectionOrder.order || 0) / courseSectionCount) * 100;
			return res
				.status(200)
				.json({
					msg: `Congratulations! You have completed ${courseProgress.toFixed(2)}% of that course`,
				}); //toFixed(2) = 2 decimal place
		} catch (err) {
			logger.error("Course progress error:", err.message);
			return res.status(500).json({ msg: "internal server error" });
		}
	},
);

//assignment submissions

router.post(
	"/submissions/:assignmentId",
	studentMiddleware,
	async (req, res) => {
		const prisma = getPrisma();

		const { assignmentId } = req.params;
		const studentId = req.studentId;

		const { content, fileUrl } = req.body;

		try {
			const assignment = await prisma.assignment.findUnique({
				where: { id: assignmentId },
			});

			if (!assignment) {
				return res.status(404).json({
					msg: "Assignment not found",
				});
			}
			const existing = await prisma.submission.findFirst({
				where: {
					assignmentId,
					studentId,
				},
			});

			if (existing) {
				return res.status(400).json({
					msg: "You already submitted this assignment",
				});
			}

			const submission = await prisma.submission.create({
				data: {
					assignmentId,
					studentId,
					content,
					fileUrl,
					status: "SUBMITTED",
				},
			});

			return res.status(201).json({
				msg: "Assignment submitted successfully",
				submission,
			});
		} catch (err) {
			console.log(err);
			return res.status(500).json({
				msg: "Internal server error",
			});
		}
	},
);
router.get(
	"/submissions/:assignmentId",
	instructorMiddleware,
	async (req, res) => {
		const prisma = getPrisma();

		const { assignmentId } = req.params;
		const instructorId = req.instructorId;

		try {
			const assignment = await prisma.assignment.findUnique({
				where: { id: assignmentId },
			});

			if (!assignment) {
				return res.status(404).json({
					msg: "Assignment not found",
				});
			}

			if (assignment.instructorId !== instructorId) {
				return res.status(403).json({
					msg: "Access denied",
				});
			}

			const submissions = await prisma.submission.findMany({
				where: { assignmentId },
				include: {
					student: true,
				},
				orderBy: {
					submittedAt: "desc",
				},
			});

			return res.status(200).json({
				submissions,
			});
		} catch (err) {
			console.log(err);
			return res.status(500).json({
				msg: "Internal server error",
			});
		}
	},
);

module.exports = router;

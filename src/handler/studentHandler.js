const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { getPrisma } = require("../utils/prisma");
const { studentMiddleware } = require("../middleware/authMiddleware");
const { logger } = require("../utils/logger");

router.post("/purchase/:courseId", studentMiddleware, async (req, res) => {
	const prisma = getPrisma();
	const { courseId } = req.params;
	const userId = req.userId;
	const { amount, status } = req.body;

	try {
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

router.get("/purchases", studentMiddleware, async (req, res) => {
	const prisma = getPrisma();
	const userId = req.userId;

	try {
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

router.get("/purchase/:purchaseId", studentMiddleware, async (req, res) => {
	const prisma = getPrisma();
	const { purchaseId } = req.params;
	const userId = req.userId;

	try {
		const purchase = await prisma.purchase.findUnique({
			where: { id: purchaseId },
			include: { course: true },
		});

		if (!purchase) {
			return res.status(404).json({ msg: "Purchase not found" });
		}

		if (purchase.userId !== userId) {
			return res
				.status(403)
				.json({
					msg: "Access denied. You can only view your own purchases",
				});
		}

		return res.status(200).json({ purchase: purchase });
	} catch (err) {
		logger.error("Fetch purchase error:", err.message);
		return res.status(500).json({ msg: "Internal server error" });
	}
});

//enrollment

router.post(
	"/enrollment/:purchaseId",
	studentMiddleware,
	async (req, res) => {
		const prisma = getPrisma();
		const { purchaseId } = req.params;
		const userId = req.userId;
		try {
			const purchase = await prisma.purchase.findUnique({
				where: { id: purchaseId },
				include: { course: true },
			});

			if (!purchase) {
				return res.status(404).json({ msg: "Purchase not found" });
			}

			if (purchase.userId !== userId) {
				return res
					.status(403)
					.json({
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
				return res.status(400).json({ msg: "Already enrolled in this course" });
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

			logger.info(`Enrollment created: ${enrollment.id} for course ${purchase.courseId}`);
			return res
				.status(201)
				.json({ enrollment: enrollment, msg: "Enrollment successful" });
		} catch (err) {
			logger.error('Enrollment error:', err.message);
			return res.status(500).json({ msg: "Internal server error" });
		}
	},
);

router.get("/enrollments", studentMiddleware, async (req, res) => {
	const userId = req.userId;
	const prisma = getPrisma();
    try {
        const enrollments = await prisma.enrollment.findMany({
            where: { userId: userId },
            include: { course: true }
        });

        return res.status(200).json({enrollments: enrollments, total: enrollments.length});

    } catch (err) {
        logger.error('Fetch enrollments error:', err.message);
        return res.status(500).json({msg: 'Internal server error'});
    }
});

router.get("/enrollment/:enrollmentId", studentMiddleware, async (req, res) => {
	const prisma = getPrisma();
	const { enrollmentId } = req.params;
	const userId = req.userId;

    try {
        const enrollment = await prisma.enrollment.findUnique({
            where: { id: enrollmentId },
            include: { course: true }
        });

        if (!enrollment) {
            return res.status(404).json({msg: 'Enrollment not found'});
        }

        if (enrollment.userId !== userId) {
            return res.status(403).json({msg: 'Access denied. You can only view your own enrollments'});
        }

        return res.status(200).json({enrollment: enrollment});

    } catch (err) {
        logger.error('Fetch enrollment error:', err.message);
        return res.status(500).json({msg: 'Internal server error'});
    }
});


router.delete("/enrollment/:enrollmentId", studentMiddleware, async (req, res) => {
	const prisma = getPrisma();
	const { enrollmentId } = req.params;
	const userId = req.userId;

    try {
        const enrollment = await prisma.enrollment.findUnique({
            where: { id: enrollmentId }
        });

        if (!enrollment) {
            return res.status(404).json({msg: 'Enrollment not found'});
        }

        if (enrollment.userId !== userId) {
            return res.status(403).json({msg: 'Access denied. You can only delete your own enrollments'});
        }

        await prisma.enrollment.delete({
            where: { id: enrollmentId }
        });

        logger.info(`Enrollment deleted: ${enrollmentId}`);
        return res.status(200).json({msg: 'Enrollment deleted successfully'});

    } catch (err) {
        logger.error('Delete enrollment error:', err.message);
        return res.status(500).json({msg: 'Internal server error'});
    }
});


//protected lesson access
router.get('/protectedLesson/:courseId/:courseSectionId',studentMiddleware,async(req,res)=>{
		const prisma = getPrisma();
	const userId = req.userId;
	const {courseId,courseSectionId} = req.params

    try {
        const enrollment = await prisma.enrollment.findUnique({
            where: { id: userId }
        });

        if (!enrollment) {
            return res.status(404).json({msg: 'Enrollment not found'});
        }

        if (enrollment.userId !== userId) {
            return res.status(403).json({msg: 'Access denied. You can only delete your own enrollments'});
        }
		const lessons = await prisma.lesson.findUnique({
			where:{courseId:courseId,courseSectionId:courseSectionId}
		})
		if(lessons){
			return res.status(200).json({lessons:lessons,msg:'Lesson found'})
		}else{
			return res.status(400).json({msg:'invalid couse section id'});
		}
	}catch(err){
		console.log(err);
		return res.status(500).json({msg: 'internal server error'});


	}
})


module.exports = router;

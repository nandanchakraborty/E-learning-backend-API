const express = require("express");
const router = express.Router();
const speakeasy = require("speakeasy");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const {
	studentMiddleware,
	instructorMiddleware,
	verifyRefresh,
} = require("../middleware/authMiddleware");
const { getPrisma } = require("../utils/prisma");

function getUserSecret(email) {
	return `${process.env.SECRET}_${email}`;
}

function generateOTP(email) {
	return speakeasy.totp({
		secret: getUserSecret(email),
		encoding: "ascii",
	});
}

function verifyOTP(email, token) {
	return speakeasy.totp.verify({
		secret: getUserSecret(email),
		encoding: "ascii",
		token: token,
		window: 2, // Handles minor time-drifts (allows up to 60 seconds before/after)
	});
}

async function sendOTPEmail(email, otp) {
	const transporter = nodemailer.createTransport({
		host: "smtp.gmail.com",
		port: 465,
		secure: true,
		auth: {
			user: process.env.EMAILUSER,
			pass: process.env.EMAILPASSWORD,
		},
	});

	await transporter.sendMail({
		from: `"OTP Service" <${process.env.EMAILUSER}>`,
		to: email,
		subject: "Your OTP Code",
		text: `Your OTP code is: ${otp}`,
	});
}

/**
 * @swagger
 * /user/email-register:
 *   post:
 *     summary: Register a new user with email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [student, instructor]
 *               otp:
 *                 type: string
 *                 description: OTP for verification (send empty first to get OTP)
 *     responses:
 *       200:
 *         description: OTP sent or registration successful
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Internal server error
 */
router.post("/email-register", async (req, res) => {
	const { name, email, password, role, otp } = req.body;
	if (!name || !role || !email || !password) {
		return res
			.status(401)
			.json({ msg: "Need to fill all the credentials" });
	}
	try {
		const prisma = getPrisma();
		if (!prisma)
			return res
				.status(500)
				.json({ error: "Database client not initialized" });

		const existingUser = await prisma.user.findUnique({ where: { email } });
		if (existingUser) {
			return res
				.status(400)
				.json({ error: "User with this email already exists" });
		}

		if (!otp) {
			const generatedOtp = generateOTP(email);
			await sendOTPEmail(email, generatedOtp);
			return res.status(200).json({
				msg: "OTP sent, please verify to complete registration",
			});
		}

		const isVerified = verifyOTP(email, otp);
		if (!isVerified) {
			return res.status(400).json({ error: "Invalid or expired OTP" });
		}

		const hashedPassword = await bcrypt.hash(password, 10);

		const newUser = await prisma.user.create({
			data: {
				name,
				email,
				passwordHash: hashedPassword,
				provider: "local",
				role: role || "student",
				isVerified: true,
				isOnboarded: true,
			},
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
		});

		return res
			.status(201)
			.json({ user: newUser, msg: "user created successfully" });
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: "Internal server error" });
	}
});

/**
 * @swagger
 * /user/email-login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *       400:
 *         description: Missing credentials
 *       401:
 *         description: Invalid email or password
 *       500:
 *         description: Internal server error
 */
router.post("/email-login", async (req, res) => {
	const { email, password } = req.body;
	const prisma = getPrisma();

	try {
		if (!email || !password) {
			return res.status(400).json({
				error: "Email and password are required.",
			});
		}

		const user = await prisma.user.findUnique({ where: { email } });

		if (!user || !user.passwordHash) {
			return res.status(401).json({
				error: "Invalid email or password",
			});
		}

		const isMatch = await bcrypt.compare(password, user.passwordHash);

		if (isMatch) {
			const accessToken = jwt.sign(
				{ userId: user.id, role: user.role },
				process.env.JWT_SECRET,
				{ expiresIn: "1h" },
			);

			const refreshToken = jwt.sign(
				{ userId: user.id, role: user.role },
				process.env.JWT_REFRESH,
				{ expiresIn: "7d" },
			);

			return res.status(200).json({
				msg: "login successful",
				accessToken,
				refreshToken,
			});
		} else {
			return res.status(401).json({ error: "Invalid email or password" });
		}
	} catch (err) {
		console.error("Login error details:", err.message);
		return res.status(500).json({ error: "Internal server error" });
	}
});

/**
 * @swagger
 * /user/google-login:
 *   post:
 *     summary: Login with Google OAuth token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 description: Google ID token from Google Sign-In
 *               role:
 *                 type: string
 *                 enum: [student, instructor]
 *                 description: User role (optional, defaults to student)
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *       400:
 *         description: Missing Google token
 *       500:
 *         description: Google authentication failed
 */
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
router.post("/google-login", async (req, res) => {
	const prisma = getPrisma();

	try {
		const { token, role } = req.body;
		if (!token) {
			return res.status(400).json({
				message: "Google token is required",
			});
		}

		const ticket = await client.verifyIdToken({
			idToken: token,
			audience: process.env.GOOGLE_CLIENT_ID,
		});
		const payload = ticket.getPayload();
		const email = payload.email;
		const name = payload.name;
		const prisma = getPrisma();
		let user = await prisma.user.findUnique({ where: { email } });
		if (!user) {
			user = await prisma.user.create({
				data: {
					name,
					email,
					provider: "google",
					role: role || "student",
					isVerified: true,
					isOnboarded: true,
				},
			});
		}
		const accessToken = jwt.sign(
			{ userId: user.id, role: user.role },
			process.env.JWT_SECRET,
			{ expiresIn: "1h" },
		);

		const refreshToken = jwt.sign(
			{ userId: user.id },
			process.env.JWT_REFRESH,
			{ expiresIn: "7d" },
		);

		return res.status(200).json({
			msg: "login successful",
			accessToken,
			refreshToken,
		});
	} catch (err) {
		console.error("Google login error:", err.message);
		return res.status(500).json({
			message: "Google authentication failed",
		});
	}
});

/**
 * @swagger
 * /user/refresh:
 *   post:
 *     summary: Refresh access token using refresh token
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Access token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 accessToken:
 *                   type: string
 *       401:
 *         description: Invalid or expired refresh token
 *       500:
 *         description: Token generation failed
 */
//RefreshToken verification
router.post("/refresh", verifyRefresh, (req, res) => {
	try {
		const accessToken = jwt.sign(
			{ userId: req.userId, role: req.role },
			process.env.JWT_SECRET,
			{ expiresIn: "1h" },
		);
		return res.status(200).json({ success: true, accessToken });
	} catch (err) {
		console.error("Refresh token error:", err.message);
		return res.status(500).json({ error: "Token generation failed" });
	}
});

module.exports = router;

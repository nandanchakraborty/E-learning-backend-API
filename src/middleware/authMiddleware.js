const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const studentMiddleware = (req, res, next) => {
	const { authorization } = req.headers;

	try {
		if (!authorization) {
			return res.status(401).json({ error: "No token provided" });
		}

		const token = authorization.split(" ")[1];

		if (!token) {
			return res.status(401).json({ error: "Invalid token format" });
		}

		const decode = jwt.verify(token, process.env.JWT_SECRET);
		const { userId, role } = decode;

		if (role !== "student") {
			return res
				.status(403)
				.json({ error: "Access denied. Student role required." });
		}

		req.userId = userId;
		req.role = role;

		next();
	} catch (err) {
		console.error("Student middleware error:", err.message);
		return res.status(401).json({ error: "Authentication failed" });
	}
};

const instructorMiddleware = (req, res, next) => {
	const { authorization } = req.headers;

	try {
		if (!authorization) {
			return res.status(401).json({ error: "No token provided" });
		}

		const token = authorization.split(" ")[1];

		if (!token) {
			return res.status(401).json({ error: "Invalid token format" });
		}

		const decode = jwt.verify(token, process.env.JWT_SECRET);
		const { userId, role } = decode;

		if (role !== "instructor") {
			return res
				.status(403)
				.json({ error: "Access denied. Instructor role required." });
		}

		req.userId = userId;
		req.role = role;

		next();
	} catch (err) {
		console.error("Instructor middleware error:", err.message);
		return res.status(401).json({ error: "Authentication failed" });
	}
};

const verifyRefresh = (req, res, next) => {
	const { authorization } = req.headers;

	try {
		if (!authorization) {
			return res.status(401).json({ error: "No refresh token provided" });
		}

		const token = authorization.split(" ")[1];

		if (!token) {
			return res.status(401).json({ error: "Invalid token format" });
		}

		const decode = jwt.verify(token, process.env.JWT_REFRESH);
		const { userId, role } = decode;

		req.userId = userId;
		req.role = role;

		next();
	} catch (err) {
		console.error("Refresh token verification error:", err.message);
		return res
			.status(401)
			.json({ error: "Invalid or expired refresh token" });
	}
};



const adminMiddleware = (req, res, next) => {
	const { authorization } = req.headers;

	try {
		if (!authorization) {
			return res.status(401).json({ error: "No token provided" });
		}

		const token = authorization.split(" ")[1];

		if (!token) {
			return res.status(401).json({ error: "Invalid token format" });
		}

		const decode = jwt.verify(token, process.env.JWT_SECRET);
		const { userId, role } = decode;

		if (role !== "admin") {
			return res
				.status(403)
				.json({ error: "Access denied. Admin role required." });
		}

		req.userId = userId;
		req.role = role;

		next();
	} catch (err) {
		console.error("admin middleware error:", err.message);
		return res.status(401).json({ error: "Authentication failed" });
	}
};

module.exports = { studentMiddleware, instructorMiddleware, verifyRefresh ,adminMiddleware};

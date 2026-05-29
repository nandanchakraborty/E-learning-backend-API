const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const pg = require("pg");

let _prismaInstance = null;

function getPrisma() {
	if (_prismaInstance) return _prismaInstance;

	try {
		console.log(
			"[Prisma] Initializing PrismaClient with PostgreSQL adapter...",
		);
		console.log(
			"[Prisma] DATABASE_URL:",
			process.env.DATABASE_URL ? "set" : "NOT SET",
		);

		const pool = new pg.Pool({
			connectionString: process.env.DATABASE_URL,
		});
		const adapter = new PrismaPg(pool);

		_prismaInstance = new PrismaClient({
			adapter,
			log: ["warn", "error"],
		});

		console.log("[Prisma] PrismaClient initialized successfully");
		return _prismaInstance;
	} catch (e) {
		console.error(
			"[Prisma] PrismaClient initialization failed:",
			e.message,
		);
		console.error("[Prisma] Full error:", e);
		return null;
	}
}

module.exports = { getPrisma };

import { z } from 'zod';
import { db } from '../db/index.js';
import { users, couples } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { generateId } from '../utils/uuid.js';
import { hashPassword, verifyPassword } from '../utils/hash.js';
import { issueToken, COOKIE_OPTS } from '../utils/jwt.js';
import { requiresAuth } from '../middleware/auth.middleware.js';


const registerSchema = z.object({
	email:        z.string().email(),
	password:     z.string().min(8),
	display_name: z.string().min(1).max(64),
});

const loginSchema = z.object({
	email:    z.string().email(),
	password: z.string().min(1),
});


export async function authRoutes(fastify) {
	fastify.post('/api/auth/register', async (request, reply) => {
		const parsed = registerSchema.safeParse(request.body);
		if (!parsed.success) {
			return reply.code(400).send({ error: 'invalid input', code: 'VALIDATION_ERROR', details: parsed.error.flatten() });
		}

		const { email, password, display_name } = parsed.data;

		const existing = db.select().from(users).where(eq(users.email, email)).get();
		if (existing) {
			return reply.code(409).send({ error: 'email already registered', code: 'EMAIL_TAKEN' });
		}

		const user = {
			id:           generateId(),
			email,
			passwordHash: await hashPassword(password),
			displayName:  display_name,
			avatarUrl:    null,
			coupleId:     null,
			createdAt:    Date.now(),
		};

		db.insert(users).values(user).run();

		const token = await issueToken(user);
		reply.setCookie('token', token, COOKIE_OPTS);

		return reply.code(201).send({ user: sanitise(user) });
	});


	fastify.post('/api/auth/login', async (request, reply) => {
		const parsed = loginSchema.safeParse(request.body);
		if (!parsed.success) {
			return reply.code(400).send({ error: 'invalid input', code: 'VALIDATION_ERROR' });
		}

		const { email, password } = parsed.data;

		const user = db.select().from(users).where(eq(users.email, email)).get();
		if (!user) {
			return reply.code(401).send({ error: 'invalid credentials', code: 'INVALID_CREDENTIALS' });
		}

		const valid = await verifyPassword(password, user.passwordHash);
		if (!valid) {
			return reply.code(401).send({ error: 'invalid credentials', code: 'INVALID_CREDENTIALS' });
		}

		const token = await issueToken(user);
		reply.setCookie('token', token, COOKIE_OPTS);

		return reply.send({ user: sanitise(user) });
	});


	fastify.post('/api/auth/logout', async (request, reply) => {
		reply.clearCookie('token', { path: '/' });
		return reply.code(204).send();
	});


	fastify.get('/api/auth/me', { preHandler: requiresAuth }, async (request, reply) => {
		// Always read from DB — the JWT may be stale if the user just paired
		const user = db.select().from(users).where(eq(users.id, request.user.id)).get();
		if (!user) {
			return reply.code(401).send({ error: 'user not found', code: 'UNAUTHENTICATED' });
		}

		// Reissue JWT if coupleId has changed since it was last issued (e.g. partner just joined)
		if ((user.coupleId ?? null) !== (request.user.coupleId ?? null)) {
			const token = await issueToken(user);
			reply.setCookie('token', token, COOKIE_OPTS);
		}

		let couple = null;
		if (user.coupleId) {
			couple = db.select().from(couples).where(eq(couples.id, user.coupleId)).get() ?? null;
		}

		return reply.send({ user: sanitise(user), couple });
	});
}


function sanitise(user) {
	const { passwordHash, ...safe } = user;
	return safe;
}

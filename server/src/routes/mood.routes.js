import { z } from 'zod';
import { db } from '../db/index.js';
import { moodLogs } from '../db/schema.js';
import { eq, and, gte, sql } from 'drizzle-orm';
import { generateId } from '../utils/uuid.js';
import { requiresAuth } from '../middleware/auth.middleware.js';
import { requiresPaired } from '../middleware/pair.middleware.js';


const createMoodSchema = z.object({
	mood_score: z.number().int().min(1).max(5),
	note:       z.string().max(512).optional(),
});

const updateMoodSchema = z.object({
	mood_score: z.number().int().min(1).max(5).optional(),
	note:       z.string().max(512).optional(),
}).refine((d) => d.mood_score !== undefined || d.note !== undefined, {
	message: 'at least one field required',
});

const querySchema = z.object({
	days: z.coerce.number().int().min(1).max(365).default(30),
});

// Returns today's date as YYYY-MM-DD in the server's local timezone
function today() {
	return new Date().toISOString().slice(0, 10);
}


export async function moodRoutes(fastify) {
	// Get mood logs for both partners over the last N days
	fastify.get('/api/moods', { preHandler: [requiresAuth, requiresPaired] }, async (request, reply) => {
		const parsed = querySchema.safeParse(request.query);
		if (!parsed.success) {
			return reply.code(400).send({ error: 'invalid query', code: 'VALIDATION_ERROR' });
		}

		// build the cutoff as a YYYY-MM-DD string, since that's the format SQLite compares correctly
		const cutoff = new Date();
		cutoff.setDate(cutoff.getDate() - parsed.data.days);
		const cutoffDate = cutoff.toISOString().slice(0, 10);

		const logs = db.select().from(moodLogs)
			.where(
				and(
					eq(moodLogs.coupleId, request.user.coupleId),
					gte(moodLogs.logDate, cutoffDate),
				),
			)
			.all();

		return reply.send({ logs });
	});


	// log today's mood. one entry per user per day, enforced right here
	fastify.post('/api/moods', { preHandler: [requiresAuth, requiresPaired] }, async (request, reply) => {
		const parsed = createMoodSchema.safeParse(request.body);
		if (!parsed.success) {
			return reply.code(400).send({ error: 'invalid input', code: 'VALIDATION_ERROR', details: parsed.error.flatten() });
		}

		const date = today();

		const existing = db.select().from(moodLogs)
			.where(
				and(
					eq(moodLogs.userId, request.user.id),
					eq(moodLogs.logDate, date),
				),
			)
			.get();

		if (existing) {
			return reply.code(409).send({ error: 'mood already logged for today', code: 'ALREADY_LOGGED', log: existing });
		}

		const log = {
			id:        generateId(),
			coupleId:  request.user.coupleId,
			userId:    request.user.id,
			moodScore: parsed.data.mood_score,
			note:      parsed.data.note ?? null,
			logDate:   date,
			createdAt: Date.now(),
		};

		db.insert(moodLogs).values(log).run();
		return reply.code(201).send({ log });
	});


	// edit a mood log. only today's entry is allowed to be updated
	fastify.patch('/api/moods/:id', { preHandler: [requiresAuth, requiresPaired] }, async (request, reply) => {
		const parsed = updateMoodSchema.safeParse(request.body);
		if (!parsed.success) {
			return reply.code(400).send({ error: 'invalid input', code: 'VALIDATION_ERROR', details: parsed.error.flatten() });
		}

		const log = db.select().from(moodLogs).where(eq(moodLogs.id, request.params.id)).get();
		if (!log) {
			return reply.code(404).send({ error: 'log not found', code: 'NOT_FOUND' });
		}
		if (log.coupleId !== request.user.coupleId) {
			return reply.code(403).send({ error: 'forbidden', code: 'FORBIDDEN' });
		}
		// Only the user who created the log can edit it
		if (log.userId !== request.user.id) {
			return reply.code(403).send({ error: 'forbidden', code: 'FORBIDDEN' });
		}
		// past entries stay locked, so nobody can rewrite how they felt after the fact
		if (log.logDate !== today()) {
			return reply.code(403).send({ error: 'only today\'s entry can be edited', code: 'PAST_ENTRY' });
		}

		const updates = {};
		if (parsed.data.mood_score !== undefined) updates.moodScore = parsed.data.mood_score;
		if (parsed.data.note !== undefined)       updates.note      = parsed.data.note;

		db.update(moodLogs).set(updates).where(eq(moodLogs.id, log.id)).run();

		const updated = db.select().from(moodLogs).where(eq(moodLogs.id, log.id)).get();
		return reply.send({ log: updated });
	});
}

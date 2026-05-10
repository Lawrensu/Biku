import { z } from 'zod';
import { db } from '../db/index.js';
import { importantDates } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { generateId } from '../utils/uuid.js';
import { requiresAuth } from '../middleware/auth.middleware.js';
import { requiresPaired } from '../middleware/pair.middleware.js';


const createDateSchema = z.object({
	title:         z.string().min(1).max(128),
	date:          z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be YYYY-MM-DD'),
	recurs_yearly: z.boolean().default(false),
});

const updateDateSchema = z.object({
	title:         z.string().min(1).max(128).optional(),
	date:          z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
	recurs_yearly: z.boolean().optional(),
}).refine((d) => Object.keys(d).length > 0, { message: 'at least one field required' });


export async function datesRoutes(fastify) {
	// All important dates for the couple, ordered chronologically
	fastify.get('/api/dates', { preHandler: [requiresAuth, requiresPaired] }, async (request, reply) => {
		const dates = db.select().from(importantDates)
			.where(eq(importantDates.coupleId, request.user.coupleId))
			.all()
			.sort((a, b) => a.date.localeCompare(b.date));

		return reply.send({ dates });
	});


	// Create a new important date
	fastify.post('/api/dates', { preHandler: [requiresAuth, requiresPaired] }, async (request, reply) => {
		const parsed = createDateSchema.safeParse(request.body);
		if (!parsed.success) {
			return reply.code(400).send({ error: 'invalid input', code: 'VALIDATION_ERROR', details: parsed.error.flatten() });
		}

		const date = {
			id:           generateId(),
			coupleId:     request.user.coupleId,
			createdBy:    request.user.id,
			title:        parsed.data.title,
			date:         parsed.data.date,
			// Store as SQLite integer boolean: true → 1, false → 0
			recursYearly: parsed.data.recurs_yearly ? 1 : 0,
			createdAt:    Date.now(),
		};

		db.insert(importantDates).values(date).run();
		return reply.code(201).send({ date });
	});


	// Partial update — any member of the couple can edit any date
	fastify.patch('/api/dates/:id', { preHandler: [requiresAuth, requiresPaired] }, async (request, reply) => {
		const parsed = updateDateSchema.safeParse(request.body);
		if (!parsed.success) {
			return reply.code(400).send({ error: 'invalid input', code: 'VALIDATION_ERROR', details: parsed.error.flatten() });
		}

		const record = db.select().from(importantDates).where(eq(importantDates.id, request.params.id)).get();
		if (!record) {
			return reply.code(404).send({ error: 'date not found', code: 'NOT_FOUND' });
		}
		if (record.coupleId !== request.user.coupleId) {
			return reply.code(403).send({ error: 'forbidden', code: 'FORBIDDEN' });
		}

		const data = parsed.data;
		const updates = {};
		if (data.title !== undefined)         updates.title        = data.title;
		if (data.date !== undefined)          updates.date         = data.date;
		if (data.recurs_yearly !== undefined) updates.recursYearly = data.recurs_yearly ? 1 : 0;

		db.update(importantDates).set(updates).where(eq(importantDates.id, record.id)).run();

		const updated = db.select().from(importantDates).where(eq(importantDates.id, record.id)).get();
		return reply.send({ date: updated });
	});


	// Delete an important date
	fastify.delete('/api/dates/:id', { preHandler: [requiresAuth, requiresPaired] }, async (request, reply) => {
		const record = db.select().from(importantDates).where(eq(importantDates.id, request.params.id)).get();
		if (!record) {
			return reply.code(404).send({ error: 'date not found', code: 'NOT_FOUND' });
		}
		if (record.coupleId !== request.user.coupleId) {
			return reply.code(403).send({ error: 'forbidden', code: 'FORBIDDEN' });
		}

		db.delete(importantDates).where(eq(importantDates.id, record.id)).run();
		return reply.code(204).send();
	});
}

import { z } from 'zod';
import { db } from '../db/index.js';
import { users, couples } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { generateId } from '../utils/uuid.js';
import { requiresAuth } from '../middleware/auth.middleware.js';
import { requiresPaired } from '../middleware/pair.middleware.js';


const INVITE_CODE_LENGTH = 6;

function generateInviteCode() {
	const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars (0/O, 1/I)
	let code = '';
	for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
		code += chars[Math.floor(Math.random() * chars.length)];
	}
	return code;
}

const updateCoupleSchema = z.object({
	couple_name:      z.string().min(1).max(64).optional(),
	anniversary_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
}).refine((d) => d.couple_name !== undefined || d.anniversary_date !== undefined, {
	message: 'at least one field required',
});

const joinSchema = z.object({
	invite_code: z.string().length(INVITE_CODE_LENGTH),
});


export async function coupleRoutes(fastify) {
	// Create a new couple — user must be unpaired
	fastify.post('/api/couples', { preHandler: requiresAuth }, async (request, reply) => {
		const user = db.select().from(users).where(eq(users.id, request.user.id)).get();

		if (user.coupleId) {
			return reply.code(409).send({ error: 'already paired', code: 'ALREADY_PAIRED' });
		}

		// Ensure invite codes are unique — retry on collision (extremely rare)
		let inviteCode;
		let attempts = 0;
		do {
			inviteCode = generateInviteCode();
			const clash = db.select().from(couples).where(eq(couples.inviteCode, inviteCode)).get();
			if (!clash) break;
			attempts++;
		} while (attempts < 5);

		const couple = {
			id:              generateId(),
			partnerAId:      user.id,
			partnerBId:      null,
			coupleName:      null,
			anniversaryDate: null,
			inviteCode,
			inviteStatus:    'pending',
			createdAt:       Date.now(),
		};

		db.insert(couples).values(couple).run();

		return reply.code(201).send({ couple, invite_code: inviteCode });
	});


	// Join an existing couple using an invite code — user must be unpaired
	fastify.post('/api/couples/join', { preHandler: requiresAuth }, async (request, reply) => {
		const parsed = joinSchema.safeParse(request.body);
		if (!parsed.success) {
			return reply.code(400).send({ error: 'invalid input', code: 'VALIDATION_ERROR' });
		}

		const user = db.select().from(users).where(eq(users.id, request.user.id)).get();
		if (user.coupleId) {
			return reply.code(409).send({ error: 'already paired', code: 'ALREADY_PAIRED' });
		}

		const couple = db.select().from(couples)
			.where(eq(couples.inviteCode, parsed.data.invite_code.toUpperCase()))
			.get();

		if (!couple) {
			return reply.code(404).send({ error: 'invite code not found', code: 'INVALID_CODE' });
		}
		if (couple.inviteStatus !== 'pending') {
			return reply.code(410).send({ error: 'invite code already used or expired', code: 'CODE_EXPIRED' });
		}
		if (couple.partnerAId === user.id) {
			return reply.code(400).send({ error: 'cannot join your own invite', code: 'SELF_JOIN' });
		}

		// Link partner B and mark invite accepted
		db.update(couples)
			.set({ partnerBId: user.id, inviteStatus: 'accepted' })
			.where(eq(couples.id, couple.id))
			.run();

		// Set couple_id on both user records
		db.update(users).set({ coupleId: couple.id }).where(eq(users.id, couple.partnerAId)).run();
		db.update(users).set({ coupleId: couple.id }).where(eq(users.id, user.id)).run();

		const updated = db.select().from(couples).where(eq(couples.id, couple.id)).get();
		return reply.send({ couple: updated });
	});


	// Get the current couple and partner profile
	fastify.get('/api/couples/me', { preHandler: [requiresAuth, requiresPaired] }, async (request, reply) => {
		const couple = db.select().from(couples).where(eq(couples.id, request.user.coupleId)).get();

		const partnerId = couple.partnerAId === request.user.id
			? couple.partnerBId
			: couple.partnerAId;

		const partner = partnerId
			? db.select().from(users).where(eq(users.id, partnerId)).get()
			: null;

		return reply.send({
			couple,
			partner: partner ? sanitiseUser(partner) : null,
		});
	});


	// Update couple name and/or anniversary date
	fastify.patch('/api/couples/me', { preHandler: [requiresAuth, requiresPaired] }, async (request, reply) => {
		const parsed = updateCoupleSchema.safeParse(request.body);
		if (!parsed.success) {
			return reply.code(400).send({ error: 'invalid input', code: 'VALIDATION_ERROR', details: parsed.error.flatten() });
		}

		const updates = {};
		if (parsed.data.couple_name !== undefined)      updates.coupleName      = parsed.data.couple_name;
		if (parsed.data.anniversary_date !== undefined) updates.anniversaryDate = parsed.data.anniversary_date;

		db.update(couples).set(updates).where(eq(couples.id, request.user.coupleId)).run();

		const updated = db.select().from(couples).where(eq(couples.id, request.user.coupleId)).get();
		return reply.send({ couple: updated });
	});
}


function sanitiseUser(user) {
	const { passwordHash, ...safe } = user;
	return safe;
}

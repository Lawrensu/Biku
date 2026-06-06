import { z } from 'zod';
import { db } from '../db/index.js';
import { lists, listItems } from '../db/schema.js';
import { eq, and, inArray } from 'drizzle-orm';
import { generateId } from '../utils/uuid.js';
import { requiresAuth } from '../middleware/auth.middleware.js';
import { requiresPaired } from '../middleware/pair.middleware.js';


const LIST_TYPES = ['bucket', 'grocery', 'wishlist'];

const listTypeSchema = z.enum(LIST_TYPES);

const createItemSchema = z.object({
	content: z.string().min(1).max(256),
});

const updateItemSchema = z.object({
	content:    z.string().min(1).max(256).optional(),
	is_checked: z.boolean().optional(),
	sort_order: z.number().int().min(0).optional(),
}).refine((d) => Object.keys(d).length > 0, { message: 'at least one field required' });

const reorderSchema = z.object({
	ordered_ids: z.array(z.string().uuid()).min(1),
});


export async function listRoutes(fastify) {
	// fetch a list and its items, creating the list record on first access if needed
	fastify.get('/api/lists/:type', { preHandler: [requiresAuth, requiresPaired] }, async (request, reply) => {
		const typeResult = listTypeSchema.safeParse(request.params.type);
		if (!typeResult.success) {
			return reply.code(400).send({ error: 'invalid list type', code: 'INVALID_TYPE' });
		}

		const type = typeResult.data;
		let list = db.select().from(lists)
			.where(and(eq(lists.coupleId, request.user.coupleId), eq(lists.listType, type)))
			.get();

		// nothing exists yet for this couple/type, so create it now
		if (!list) {
			const newList = {
				id:        generateId(),
				coupleId:  request.user.coupleId,
				listType:  type,
				createdAt: Date.now(),
			};
			db.insert(lists).values(newList).run();
			list = newList;
		}

		const items = db.select().from(listItems)
			.where(eq(listItems.listId, list.id))
			.all()
			// sort_order ascending, then insertion order for ties
			.sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt - b.createdAt);

		return reply.send({ list, items });
	});


	// Add an item to a list
	fastify.post('/api/lists/:type/items', { preHandler: [requiresAuth, requiresPaired] }, async (request, reply) => {
		const typeResult = listTypeSchema.safeParse(request.params.type);
		if (!typeResult.success) {
			return reply.code(400).send({ error: 'invalid list type', code: 'INVALID_TYPE' });
		}

		const parsed = createItemSchema.safeParse(request.body);
		if (!parsed.success) {
			return reply.code(400).send({ error: 'invalid input', code: 'VALIDATION_ERROR', details: parsed.error.flatten() });
		}

		// Ensure the list exists before adding an item
		let list = db.select().from(lists)
			.where(and(eq(lists.coupleId, request.user.coupleId), eq(lists.listType, typeResult.data)))
			.get();

		if (!list) {
			const newList = {
				id:        generateId(),
				coupleId:  request.user.coupleId,
				listType:  typeResult.data,
				createdAt: Date.now(),
			};
			db.insert(lists).values(newList).run();
			list = newList;
		}

		const item = {
			id:        generateId(),
			listId:    list.id,
			addedBy:   request.user.id,
			content:   parsed.data.content,
			isChecked: 0,
			sortOrder: 0,
			createdAt: Date.now(),
		};

		db.insert(listItems).values(item).run();
		return reply.code(201).send({ item });
	});


	// update a single item: its content, checked state, or sort order
	fastify.patch('/api/lists/items/:id', { preHandler: [requiresAuth, requiresPaired] }, async (request, reply) => {
		const parsed = updateItemSchema.safeParse(request.body);
		if (!parsed.success) {
			return reply.code(400).send({ error: 'invalid input', code: 'VALIDATION_ERROR', details: parsed.error.flatten() });
		}

		const item = db.select().from(listItems).where(eq(listItems.id, request.params.id)).get();
		if (!item) {
			return reply.code(404).send({ error: 'item not found', code: 'NOT_FOUND' });
		}

		// Verify the item belongs to this couple via the parent list
		const list = db.select().from(lists).where(eq(lists.id, item.listId)).get();
		if (!list || list.coupleId !== request.user.coupleId) {
			return reply.code(403).send({ error: 'forbidden', code: 'FORBIDDEN' });
		}

		const data = parsed.data;
		const updates = {};
		if (data.content !== undefined)    updates.content   = data.content;
		if (data.is_checked !== undefined) updates.isChecked = data.is_checked ? 1 : 0;
		if (data.sort_order !== undefined) updates.sortOrder = data.sort_order;

		db.update(listItems).set(updates).where(eq(listItems.id, item.id)).run();

		const updated = db.select().from(listItems).where(eq(listItems.id, item.id)).get();
		return reply.send({ item: updated });
	});


	// Delete an item
	fastify.delete('/api/lists/items/:id', { preHandler: [requiresAuth, requiresPaired] }, async (request, reply) => {
		const item = db.select().from(listItems).where(eq(listItems.id, request.params.id)).get();
		if (!item) {
			return reply.code(404).send({ error: 'item not found', code: 'NOT_FOUND' });
		}

		const list = db.select().from(lists).where(eq(lists.id, item.listId)).get();
		if (!list || list.coupleId !== request.user.coupleId) {
			return reply.code(403).send({ error: 'forbidden', code: 'FORBIDDEN' });
		}

		db.delete(listItems).where(eq(listItems.id, item.id)).run();
		return reply.code(204).send();
	});


	// Batch-update sort_order from an ordered array of item IDs
	fastify.patch('/api/lists/:type/reorder', { preHandler: [requiresAuth, requiresPaired] }, async (request, reply) => {
		const typeResult = listTypeSchema.safeParse(request.params.type);
		if (!typeResult.success) {
			return reply.code(400).send({ error: 'invalid list type', code: 'INVALID_TYPE' });
		}

		const parsed = reorderSchema.safeParse(request.body);
		if (!parsed.success) {
			return reply.code(400).send({ error: 'invalid input', code: 'VALIDATION_ERROR', details: parsed.error.flatten() });
		}

		const list = db.select().from(lists)
			.where(and(eq(lists.coupleId, request.user.coupleId), eq(lists.listType, typeResult.data)))
			.get();

		if (!list) {
			return reply.code(404).send({ error: 'list not found', code: 'NOT_FOUND' });
		}

		// Verify all submitted IDs belong to this list before writing anything
		const existing = db.select({ id: listItems.id }).from(listItems)
			.where(and(eq(listItems.listId, list.id), inArray(listItems.id, parsed.data.ordered_ids)))
			.all();

		if (existing.length !== parsed.data.ordered_ids.length) {
			return reply.code(400).send({ error: 'one or more item IDs are invalid', code: 'INVALID_IDS' });
		}

		// Write each sort_order in a single transaction
		const setOrder = db.transaction(() => {
			parsed.data.ordered_ids.forEach((id, index) => {
				db.update(listItems).set({ sortOrder: index }).where(eq(listItems.id, id)).run();
			});
		});

		setOrder();
		return reply.code(204).send();
	});
}

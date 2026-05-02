import { z } from 'zod';
import { db } from '../db/index.js';
import { memories } from '../db/schema.js';
import { eq, and, desc, sql } from 'drizzle-orm';
import { generateId } from '../utils/uuid.js';
import { requiresAuth } from '../middleware/auth.middleware.js';
import { requiresPaired } from '../middleware/pair.middleware.js';


const createMemorySchema = z.object({
	title:            z.string().min(1).max(128),
	description:      z.string().max(2000).optional(),
	memory_date:      z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	location_name:    z.string().max(128).optional(),
	lat:              z.number().min(-90).max(90).optional(),
	lng:              z.number().min(-180).max(180).optional(),
	image_url:        z.string().url().optional(),
	image_author:     z.string().max(128).optional(),
	image_author_url: z.string().url().optional(),
});

const updateMemorySchema = createMemorySchema.partial();

const paginationSchema = z.object({
	page:  z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(50).default(12),
});


export async function memoryRoutes(fastify) {
	// Paginated list of memories for the couple
	fastify.get('/api/memories', { preHandler: [requiresAuth, requiresPaired] }, async (request, reply) => {
		const parsed = paginationSchema.safeParse(request.query);
		if (!parsed.success) {
			return reply.code(400).send({ error: 'invalid query', code: 'VALIDATION_ERROR' });
		}

		const { page, limit } = parsed.data;
		const offset = (page - 1) * limit;

		const rows = db.select().from(memories)
			.where(eq(memories.coupleId, request.user.coupleId))
			.orderBy(desc(memories.memoryDate))
			.limit(limit)
			.offset(offset)
			.all();

		const { total } = db
			.select({ total: sql`COUNT(*)`.mapWith(Number) })
			.from(memories)
			.where(eq(memories.coupleId, request.user.coupleId))
			.get();

		return reply.send({ memories: rows, total, page });
	});


	// Create a memory — fetches and caches weather if coordinates are provided
	fastify.post('/api/memories', { preHandler: [requiresAuth, requiresPaired] }, async (request, reply) => {
		const parsed = createMemorySchema.safeParse(request.body);
		if (!parsed.success) {
			return reply.code(400).send({ error: 'invalid input', code: 'VALIDATION_ERROR', details: parsed.error.flatten() });
		}

		const data = parsed.data;

		let weatherData = null;
		if (data.lat != null && data.lng != null) {
			weatherData = await fetchWeather(data.lat, data.lng, data.memory_date);
		}

		const memory = {
			id:             generateId(),
			coupleId:       request.user.coupleId,
			createdBy:      request.user.id,
			title:          data.title,
			description:    data.description ?? null,
			memoryDate:     data.memory_date,
			locationName:   data.location_name ?? null,
			lat:            data.lat ?? null,
			lng:            data.lng ?? null,
			imageUrl:       data.image_url ?? null,
			imageAuthor:    data.image_author ?? null,
			imageAuthorUrl: data.image_author_url ?? null,
			weatherData:    weatherData ? JSON.stringify(weatherData) : null,
			createdAt:      Date.now(),
		};

		db.insert(memories).values(memory).run();

		return reply.code(201).send({ memory });
	});


	// Lightweight list for map pins — only memories with coordinates
	fastify.get('/api/memories/map', { preHandler: [requiresAuth, requiresPaired] }, async (request, reply) => {
		const rows = db
			.select({
				id:         memories.id,
				title:      memories.title,
				lat:        memories.lat,
				lng:        memories.lng,
				imageUrl:   memories.imageUrl,
				memoryDate: memories.memoryDate,
			})
			.from(memories)
			.where(
				and(
					eq(memories.coupleId, request.user.coupleId),
					sql`${memories.lat} IS NOT NULL`,
				),
			)
			.all();

		return reply.send({ memories: rows });
	});


	// Single memory — :id must come after /map to avoid route conflict
	fastify.get('/api/memories/:id', { preHandler: [requiresAuth, requiresPaired] }, async (request, reply) => {
		const memory = db.select().from(memories).where(eq(memories.id, request.params.id)).get();

		if (!memory) {
			return reply.code(404).send({ error: 'memory not found', code: 'NOT_FOUND' });
		}
		if (memory.coupleId !== request.user.coupleId) {
			return reply.code(403).send({ error: 'forbidden', code: 'FORBIDDEN' });
		}

		return reply.send({ memory });
	});


	// Partial update — only the creating couple can edit
	fastify.patch('/api/memories/:id', { preHandler: requiresAuth }, async (request, reply) => {
		const parsed = updateMemorySchema.safeParse(request.body);
		if (!parsed.success) {
			return reply.code(400).send({ error: 'invalid input', code: 'VALIDATION_ERROR', details: parsed.error.flatten() });
		}

		const memory = db.select().from(memories).where(eq(memories.id, request.params.id)).get();
		if (!memory) {
			return reply.code(404).send({ error: 'memory not found', code: 'NOT_FOUND' });
		}
		if (memory.coupleId !== request.user.coupleId) {
			return reply.code(403).send({ error: 'forbidden', code: 'FORBIDDEN' });
		}

		const data = parsed.data;
		const updates = {};

		if (data.title !== undefined)            updates.title          = data.title;
		if (data.description !== undefined)      updates.description    = data.description;
		if (data.memory_date !== undefined)      updates.memoryDate     = data.memory_date;
		if (data.location_name !== undefined)    updates.locationName   = data.location_name;
		if (data.lat !== undefined)              updates.lat            = data.lat;
		if (data.lng !== undefined)              updates.lng            = data.lng;
		if (data.image_url !== undefined)        updates.imageUrl       = data.image_url;
		if (data.image_author !== undefined)     updates.imageAuthor    = data.image_author;
		if (data.image_author_url !== undefined) updates.imageAuthorUrl = data.image_author_url;

		db.update(memories).set(updates).where(eq(memories.id, memory.id)).run();

		const updated = db.select().from(memories).where(eq(memories.id, memory.id)).get();
		return reply.send({ memory: updated });
	});


	// Delete a memory — ownership validated
	fastify.delete('/api/memories/:id', { preHandler: requiresAuth }, async (request, reply) => {
		const memory = db.select().from(memories).where(eq(memories.id, request.params.id)).get();

		if (!memory) {
			return reply.code(404).send({ error: 'memory not found', code: 'NOT_FOUND' });
		}
		if (memory.coupleId !== request.user.coupleId) {
			return reply.code(403).send({ error: 'forbidden', code: 'FORBIDDEN' });
		}

		db.delete(memories).where(eq(memories.id, memory.id)).run();
		return reply.code(204).send();
	});
}


// Fetches historical daily weather from Open-Meteo for a given coordinate + date.
// Returns a plain object that gets stored as JSON on the memory record.
// Open-Meteo is free and requires no API key.
async function fetchWeather(lat, lng, date) {
	try {
		const url = new URL('https://archive-api.open-meteo.com/v1/archive');
		url.searchParams.set('latitude', lat);
		url.searchParams.set('longitude', lng);
		url.searchParams.set('start_date', date);
		url.searchParams.set('end_date', date);
		url.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min,weathercode');
		url.searchParams.set('timezone', 'auto');

		const res = await fetch(url.toString());
		if (!res.ok) return null;

		const json = await res.json();
		const daily = json.daily;
		if (!daily) return null;

		return {
			tempMax:     daily.temperature_2m_max?.[0] ?? null,
			tempMin:     daily.temperature_2m_min?.[0] ?? null,
			weatherCode: daily.weathercode?.[0] ?? null,
		};
	} catch {
		// Weather is non-critical — a fetch failure must not block memory creation
		return null;
	}
}

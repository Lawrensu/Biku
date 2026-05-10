import { z } from 'zod';
import { db } from '../db/index.js';
import { memories } from '../db/schema.js';
import { and, eq, isNotNull, sql } from 'drizzle-orm';
import { requiresAuth } from '../middleware/auth.middleware.js';


const unsplashQuerySchema = z.object({
	q: z.string().min(1).max(128),
});

const weatherQuerySchema = z.object({
	lat:  z.coerce.number().min(-90).max(90),
	lng:  z.coerce.number().min(-180).max(180),
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});


export async function proxyRoutes(fastify) {
	// Unsplash image search — API key never leaves the server
	fastify.get('/api/proxy/unsplash/search', { preHandler: requiresAuth }, async (request, reply) => {
		const parsed = unsplashQuerySchema.safeParse(request.query);
		if (!parsed.success) {
			return reply.code(400).send({ error: 'invalid query', code: 'VALIDATION_ERROR' });
		}

		const url = new URL('https://api.unsplash.com/search/photos');
		url.searchParams.set('query', parsed.data.q);
		url.searchParams.set('per_page', '9');
		url.searchParams.set('orientation', 'landscape');

		const res = await fetch(url.toString(), {
			headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` },
		});

		if (!res.ok) {
			return reply.code(502).send({ error: 'upstream request failed', code: 'UPSTREAM_ERROR' });
		}

		const json = await res.json();

		// Normalise to a minimal shape — frontend only needs these four fields
		const images = (json.results ?? []).map((photo) => ({
			url:        photo.urls.regular,
			thumb_url:  photo.urls.thumb,
			author:     photo.user.name,
			author_url: photo.user.links.html,
		}));

		return reply.send({ images });
	});


	// Weather proxy — checks SQLite first, calls Open-Meteo only on cache miss.
	// Historical weather for a (lat, lng, date) is immutable, so cached results
	// are valid forever and the same data will never need to be fetched twice.
	fastify.get('/api/proxy/weather', { preHandler: requiresAuth }, async (request, reply) => {
		const parsed = weatherQuerySchema.safeParse(request.query);
		if (!parsed.success) {
			return reply.code(400).send({ error: 'invalid query', code: 'VALIDATION_ERROR' });
		}

		const { lat, lng, date } = parsed.data;

		// Round coordinates to 2 decimal places (~1 km precision) for cache lookup —
		// avoids cache misses caused by floating-point noise in repeated requests
		const latR = Math.round(lat * 100) / 100;
		const lngR = Math.round(lng * 100) / 100;

		// Look for any existing memory with weather already cached for these coordinates
		const cached = db.select({ weatherData: memories.weatherData })
			.from(memories)
			.where(
				and(
					isNotNull(memories.weatherData),
					eq(memories.memoryDate, date),
					sql`ROUND(${memories.lat}, 2) = ${latR}`,
					sql`ROUND(${memories.lng}, 2) = ${lngR}`,
				),
			)
			.get();

		if (cached?.weatherData) {
			try {
				const weather = JSON.parse(cached.weatherData);
				return reply.send({ weather, cached: true });
			} catch {
				// Corrupt cache entry — fall through to a fresh fetch
			}
		}

		// Cache miss — fetch from Open-Meteo
		const weather = await fetchWeather(lat, lng, date);
		if (!weather) {
			return reply.code(502).send({ error: 'weather data unavailable', code: 'UPSTREAM_ERROR' });
		}

		return reply.send({ weather, cached: false });
	});
}


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
		return null;
	}
}

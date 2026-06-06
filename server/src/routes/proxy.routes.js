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


const geocodeQuerySchema = z.object({
	q: z.string().min(2).max(256),
});


export async function proxyRoutes(fastify) {
	// search Unsplash through us, so the API key stays server-side and never reaches the client
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

		// trim it down to the four fields the frontend actually needs
		const images = (json.results ?? []).map((photo) => ({
			url:        photo.urls.regular,
			thumb_url:  photo.urls.thumb,
			author:     photo.user.name,
			author_url: photo.user.links.html,
		}));

		return reply.send({ images });
	});


	// Nominatim geocoding. turns a typed place name into lat/lng coordinates.
	// OpenStreetMap Nominatim is free, no API key required, consistent with our
	// Leaflet/OSM map stack. We proxy server-side to (a) set the required
	// User-Agent header and (b) keep the external call out of the browser.
	fastify.get('/api/proxy/geocode', { preHandler: requiresAuth }, async (request, reply) => {
		const parsed = geocodeQuerySchema.safeParse(request.query);
		if (!parsed.success) {
			return reply.code(400).send({ error: 'query must be at least 2 characters', code: 'VALIDATION_ERROR' });
		}

		const url = new URL('https://nominatim.openstreetmap.org/search');
		url.searchParams.set('q',       parsed.data.q);
		url.searchParams.set('format',  'json');
		url.searchParams.set('limit',   '5');
		url.searchParams.set('addressdetails', '1');

		const res = await fetch(url.toString(), {
			headers: {
				// Nominatim ToS requires identifying the application in User-Agent
				'User-Agent':    'Biku/1.0 (COS30043 Interface Design; lawrensuleo@gmail.com)',
				'Accept-Language': 'en',
			},
		});

		if (!res.ok) {
			return reply.code(502).send({ error: 'geocoding service unavailable', code: 'UPSTREAM_ERROR' });
		}

		const data = await res.json();

		// trim it down to what the frontend actually uses: name, displayName, lat, lng
		const results = data.map((r) => ({
			name:        r.name || r.display_name.split(',')[0].trim(),
			displayName: r.display_name,
			lat:         parseFloat(r.lat),
			lng:         parseFloat(r.lon),
		}));

		return reply.send({ results });
	});


	// weather proxy. checks the SQLite cache first and only calls Open-Meteo on a miss.
	// Historical weather for a (lat, lng, date) is immutable, so cached results
	// are valid forever and the same data will never need to be fetched twice.
	fastify.get('/api/proxy/weather', { preHandler: requiresAuth }, async (request, reply) => {
		const parsed = weatherQuerySchema.safeParse(request.query);
		if (!parsed.success) {
			return reply.code(400).send({ error: 'invalid query', code: 'VALIDATION_ERROR' });
		}

		const { lat, lng, date } = parsed.data;

		// round to 2 decimal places (about 1km precision) before the cache lookup,
		// so floating-point noise across repeated requests doesn't cause needless misses
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
				// the cached row didn't parse cleanly, so just treat it as a miss and refetch
			}
		}

		// nothing cached, so go fetch it from Open-Meteo
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

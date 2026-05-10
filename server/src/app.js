import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';

import { authRoutes }        from './routes/auth.routes.js';
import { coupleRoutes }      from './routes/couple.routes.js';
import { memoryRoutes }      from './routes/memory.routes.js';
import { listRoutes }        from './routes/list.routes.js';
import { moodRoutes }        from './routes/mood.routes.js';
import { datesRoutes }       from './routes/dates.routes.js';
import { randomiserRoutes }  from './routes/randomiser.routes.js';
import { proxyRoutes }       from './routes/proxy.routes.js';


const fastify = Fastify({ logger: true });

// Allow POST/PUT/PATCH requests with no body when Content-Type is application/json.
// Fastify throws FST_ERR_CTP_EMPTY_JSON_BODY by default — routes like POST /api/couples
// have no body, and the frontend will omit one. Treat empty body as an empty object.
fastify.addContentTypeParser('application/json', { parseAs: 'string' }, (_req, body, done) => {
	if (!body || body === '') return done(null, {});
	try {
		done(null, JSON.parse(body));
	} catch (err) {
		err.statusCode = 400;
		done(err);
	}
});

// Cookies — required for httpOnly JWT
await fastify.register(cookie);

// CORS — allow the Vite dev server origin in development
await fastify.register(cors, {
	origin:      process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
	credentials: true, // required so the browser sends cookies cross-origin
});

// Routes
await fastify.register(authRoutes);
await fastify.register(coupleRoutes);
await fastify.register(memoryRoutes);
await fastify.register(listRoutes);
await fastify.register(moodRoutes);
await fastify.register(datesRoutes);
await fastify.register(randomiserRoutes);
await fastify.register(proxyRoutes);

// Health check — useful for verifying the server is up without touching auth
fastify.get('/api/health', async () => ({ ok: true }));


try {
	await fastify.listen({ port: Number(process.env.PORT ?? 3000), host: '0.0.0.0' });
} catch (err) {
	fastify.log.error(err);
	process.exit(1);
}

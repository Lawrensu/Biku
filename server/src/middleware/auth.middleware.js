import { jwtVerify } from 'jose';


const secret = new TextEncoder().encode(process.env.JWT_SECRET);

// Attaches request.user = { id, email, displayName, coupleId } or replies 401
export async function requiresAuth(request, reply) {
	const token = request.cookies?.token;

	if (!token) {
		return reply.code(401).send({ error: 'not authenticated', code: 'UNAUTHENTICATED' });
	}

	try {
		const { payload } = await jwtVerify(token, secret);
		request.user = payload;
	} catch {
		return reply.code(401).send({ error: 'session expired', code: 'TOKEN_INVALID' });
	}
}

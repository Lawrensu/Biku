// run this after requiresAuth, since it assumes request.user is already set
export async function requiresPaired(request, reply) {
	if (!request.user?.coupleId) {
		return reply.code(403).send({ error: 'must be paired to access this resource', code: 'UNPAIRED' });
	}
}

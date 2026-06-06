import { SignJWT } from 'jose';


const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export const COOKIE_OPTS = {
	httpOnly: true,
	sameSite: 'lax',
	path: '/',
	// secure: true belongs in production. left off here so dev over plain HTTP still works
	maxAge: 60 * 60 * 24 * 7, // 7 days
};

// Issue a signed JWT from a user object and set it as an httpOnly cookie
export async function issueToken(user) {
	return new SignJWT({
		id:          user.id,
		email:       user.email,
		displayName: user.displayName,
		coupleId:    user.coupleId ?? null,
	})
		.setProtectedHeader({ alg: 'HS256' })
		.setIssuedAt()
		.setExpirationTime('7d')
		.sign(secret);
}

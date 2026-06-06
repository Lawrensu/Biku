// Bun.password uses bcrypt by default, so we don't need an extra dependency for hashing
export const hashPassword = (plain) => Bun.password.hash(plain);

export const verifyPassword = (plain, hash) => Bun.password.verify(plain, hash);

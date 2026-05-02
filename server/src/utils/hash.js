// Bun.password uses bcrypt by default — no external dependency needed
export const hashPassword = (plain) => Bun.password.hash(plain);

export const verifyPassword = (plain, hash) => Bun.password.verify(plain, hash);

import { z } from 'zod';
import { db } from '../db/index.js';
import { dateIdeas } from '../db/schema.js';
import { eq, and, lte } from 'drizzle-orm';
import { requiresAuth } from '../middleware/auth.middleware.js';
import { requiresPaired } from '../middleware/pair.middleware.js';


const VALID_CATEGORIES = ['outdoor', 'indoor', 'food', 'adventure', 'cosy'];
const GEMINI_MODEL    = 'gemini-2.5-flash';

const querySchema = z.object({
	budget:       z.coerce.number().int().min(1).max(3).optional(),
	category:     z.enum(VALID_CATEGORIES).optional(),
	max_duration: z.coerce.number().int().min(1).optional(),
});


export async function randomiserRoutes(fastify) {
	fastify.get('/api/date-ideas', { preHandler: [requiresAuth, requiresPaired] }, async (request, reply) => {
		const parsed = querySchema.safeParse(request.query);
		if (!parsed.success) {
			return reply.code(400).send({ error: 'invalid query', code: 'VALIDATION_ERROR', details: parsed.error.flatten() });
		}

		const filters = parsed.data;

		// Attempt AI-generated idea first if a key is configured
		if (process.env.GEMINI_API_KEY) {
			const aiIdea = await generateWithGemini(filters);
			if (aiIdea) {
				return reply.send({ idea: aiIdea, source: 'ai' });
			}
		}

		// Fallback: query the seeded date_ideas table
		const idea = querySeeded(filters);
		if (!idea) {
			return reply.code(404).send({ error: 'no ideas match your filters', code: 'NO_RESULTS' });
		}

		return reply.send({ idea, source: 'seed' });
	});
}


// Build filter conditions and pick one random idea from the seed table
function querySeeded(filters) {
	const { budget, category, max_duration } = filters;

	const conditions = [];
	if (budget !== undefined)       conditions.push(eq(dateIdeas.budgetLevel, budget));
	if (category !== undefined)     conditions.push(eq(dateIdeas.category, category));
	if (max_duration !== undefined) conditions.push(lte(dateIdeas.minDuration, max_duration));

	const pool = conditions.length > 0
		? db.select().from(dateIdeas).where(and(...conditions)).all()
		: db.select().from(dateIdeas).all();

	if (pool.length === 0) return null;

	const idea = pool[Math.floor(Math.random() * pool.length)];

	// Parse tags JSON string back to array for the client
	if (idea.tags) {
		try { idea.tags = JSON.parse(idea.tags); } catch { idea.tags = []; }
	}

	return idea;
}


// Call Gemini to generate a single date idea matching the given filters.
// Returns null on any failure so the caller can silently fall back to seeds.
async function generateWithGemini(filters) {
	const { budget, category, max_duration } = filters;

	const constraints = [
		budget       ? `budget level ${budget} out of 3 (1 = free, 2 = moderate, 3 = splurge)` : null,
		category     ? `category: ${category}` : null,
		max_duration ? `fits within ${max_duration} minutes` : null,
	].filter(Boolean);

	const constraintText = constraints.length > 0
		? `The idea must match these constraints: ${constraints.join(', ')}.`
		: 'The idea can be anything — no constraints.';

	const prompt = `You are a date night idea generator for couples.

${constraintText}

Respond with a single JSON object only — no markdown, no explanation, no code fences. Use exactly this shape:
{
  "title": "short name for the date idea",
  "description": "2-3 sentence description, warm and specific",
  "category": one of "outdoor" | "indoor" | "food" | "adventure" | "cosy",
  "budget_level": integer 1 to 3,
  "min_duration": estimated minimum duration in minutes,
  "max_duration": estimated maximum duration in minutes,
  "tags": array of 2-3 lowercase string tags
}`;

	try {
		const res = await fetch(
			`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`,
			{
				method:  'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					contents: [{ parts: [{ text: prompt }] }],
					generationConfig: {
						temperature:     0.9,
						maxOutputTokens: 512,
						// turn off chain-of-thought thinking. gemini-2.5-flash enables it by
						// default, and that prepends reasoning text before the JSON response,
						// which breaks JSON.parse. we don't need any of that for a task this simple.
						// this has to sit nested inside generationConfig, not as a sibling of it.
						// sending it as a top-level field makes Gemini respond with HTTP 400
						// ("Unknown name thinkingConfig: Cannot find field"), and that 400 was
						// quietly tripping the seed fallback on every single request.
						thinkingConfig: { thinkingBudget: 0 },
					},
				}),
			},
		);

		if (!res.ok) return null;

		const json     = await res.json();
		const text     = json.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
		const cleaned  = text.trim().replace(/^```(?:json)?|```$/g, '').trim();
		const idea     = JSON.parse(cleaned);

		// Validate the shape loosely before returning to the client
		if (!idea.title || !idea.description || !idea.category) return null;

		return {
			id:          null, // AI-generated ideas have no DB row
			title:       String(idea.title),
			description: String(idea.description),
			category:    String(idea.category),
			budgetLevel: Number(idea.budget_level) || 1,
			minDuration: Number(idea.min_duration) || null,
			maxDuration: Number(idea.max_duration) || null,
			tags:        Array.isArray(idea.tags) ? idea.tags : [],
		};
	} catch {
		// any parse or network failure lands here, and the caller just falls back to the seed table
		return null;
	}
}

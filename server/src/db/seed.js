import { Database } from 'bun:sqlite';
import { randomUUID } from 'crypto';


const sqlite = new Database(process.env.DATABASE_URL ?? './biku.db');
sqlite.run('PRAGMA foreign_keys = ON');

// Only seed if the table is empty — safe to run multiple times
const existing = sqlite.query('SELECT COUNT(*) as count FROM date_ideas').get();
if (existing.count > 0) {
	console.log('date_ideas already seeded, skipping');
	sqlite.close();
	process.exit(0);
}

const ideas = [
	// outdoor
	{ title: 'Sunrise picnic', description: 'Pack coffee and pastries, find a hill, watch the sun come up together.', category: 'outdoor', budgetLevel: 1, minDuration: 60, maxDuration: 120, tags: '["romantic","morning"]' },
	{ title: 'Botanical garden walk', description: 'Wander through a garden. No phones, just us.', category: 'outdoor', budgetLevel: 1, minDuration: 90, maxDuration: 180, tags: '["relaxed","nature"]' },
	{ title: 'Night market crawl', description: 'Pick a night market, eat everything, decide nothing in advance.', category: 'outdoor', budgetLevel: 2, minDuration: 120, maxDuration: 180, tags: '["food","spontaneous"]' },
	{ title: 'Beach sunset', description: 'Bring a blanket, stay until the sky goes dark.', category: 'outdoor', budgetLevel: 1, minDuration: 90, maxDuration: 150, tags: '["romantic","evening"]' },
	{ title: 'Hiking day trip', description: 'Pick a trail neither of you has done. Pack snacks. Get lost (a little).', category: 'outdoor', budgetLevel: 1, minDuration: 180, maxDuration: 360, tags: '["active","adventure"]' },
	{ title: 'Stargazing night', description: 'Drive out of the city, lie on a blanket, find constellations badly.', category: 'outdoor', budgetLevel: 1, minDuration: 60, maxDuration: 120, tags: '["romantic","night"]' },

	// indoor
	{ title: 'Cook a recipe neither of you knows', description: 'Pick something ambitious, make a mess, eat it anyway.', category: 'indoor', budgetLevel: 2, minDuration: 90, maxDuration: 150, tags: '["food","creative"]' },
	{ title: 'Film marathon', description: 'Pick a director or a theme. Watch back to back. No skipping credits.', category: 'indoor', budgetLevel: 1, minDuration: 180, maxDuration: 360, tags: '["cosy","relaxed"]' },
	{ title: 'Paint together', description: 'Buy cheap canvases and acrylic paint. Paint the same subject, compare results.', category: 'indoor', budgetLevel: 2, minDuration: 90, maxDuration: 120, tags: '["creative","playful"]' },
	{ title: 'Board game afternoon', description: 'Break out a board game or card game neither of you is good at.', category: 'indoor', budgetLevel: 1, minDuration: 90, maxDuration: 180, tags: '["playful","competitive"]' },
	{ title: 'Spa night at home', description: 'Face masks, warm bath, no phones after 8pm.', category: 'indoor', budgetLevel: 2, minDuration: 120, maxDuration: 180, tags: '["relaxed","romantic"]' },
	{ title: 'Bake something together', description: 'Bread, cake, cookies — pick one and bake it start to finish.', category: 'indoor', budgetLevel: 2, minDuration: 90, maxDuration: 150, tags: '["food","cosy"]' },

	// food
	{ title: 'Omakase dinner', description: "Book a chef's choice menu somewhere special. No peeking at the menu in advance.", category: 'food', budgetLevel: 3, minDuration: 120, maxDuration: 180, tags: '["splurge","romantic"]' },
	{ title: 'Ramen crawl', description: 'Pick two or three ramen shops. Small bowls, compare, rank them.', category: 'food', budgetLevel: 2, minDuration: 120, maxDuration: 180, tags: '["food","spontaneous"]' },
	{ title: 'Brunch at a new café', description: "Find a café you've never been to. Order different things, share everything.", category: 'food', budgetLevel: 2, minDuration: 60, maxDuration: 120, tags: '["morning","relaxed"]' },
	{ title: 'Dessert tasting', description: 'Visit two or three places that do dessert well. Chocolate and coffee required.', category: 'food', budgetLevel: 2, minDuration: 90, maxDuration: 150, tags: '["sweet","spontaneous"]' },
	{ title: 'Cook from a new cuisine', description: "Pick a cuisine neither of you cooks regularly. Follow recipes strictly this time.", category: 'food', budgetLevel: 2, minDuration: 90, maxDuration: 150, tags: '["creative","food"]' },

	// adventure
	{ title: 'Road trip with no destination', description: 'Get in the car, pick a direction, stop somewhere interesting.', category: 'adventure', budgetLevel: 2, minDuration: 240, maxDuration: 480, tags: '["spontaneous","active"]' },
	{ title: 'Rock climbing (indoor)', description: 'Book an intro session at a climbing gym. Belay each other. Laugh when you fall.', category: 'adventure', budgetLevel: 2, minDuration: 90, maxDuration: 120, tags: '["active","playful"]' },
	{ title: 'Try a new sport together', description: "Kayaking, paddleboarding, archery — something neither of you is good at.", category: 'adventure', budgetLevel: 2, minDuration: 120, maxDuration: 180, tags: '["active","adventure"]' },
	{ title: 'Overnight trip', description: "Book a place a few hours away. Pack light. Leave tomorrow's plans for tomorrow.", category: 'adventure', budgetLevel: 3, minDuration: 720, maxDuration: 1440, tags: '["romantic","spontaneous"]' },
	{ title: "Explore a neighbourhood you've never been to", description: "Walk around an unfamiliar part of the city. No map unless you're truly lost.", category: 'adventure', budgetLevel: 1, minDuration: 90, maxDuration: 180, tags: '["spontaneous","active"]' },

	// cosy
	{ title: 'Read together', description: "Same book, different books — sit in the same room and read for two hours.", category: 'cosy', budgetLevel: 1, minDuration: 90, maxDuration: 150, tags: '["quiet","relaxed"]' },
	{ title: 'Podcast and tea evening', description: "Pick a podcast episode you've both been meaning to hear. Make tea. Just listen.", category: 'cosy', budgetLevel: 1, minDuration: 60, maxDuration: 90, tags: '["quiet","cosy"]' },
	{ title: 'Journalling evening', description: "Prompt: what's one thing this year has taught us? Write, share if you want.", category: 'cosy', budgetLevel: 1, minDuration: 60, maxDuration: 90, tags: '["reflective","quiet"]' },
	{ title: 'Build a fort and watch a film', description: 'Use every blanket and pillow. Make it ridiculous. Stay in it all evening.', category: 'cosy', budgetLevel: 1, minDuration: 120, maxDuration: 180, tags: '["playful","cosy"]' },
	{ title: 'Slow morning in', description: 'No alarms, no plans. Cook breakfast slowly. Stay in pyjamas until noon.', category: 'cosy', budgetLevel: 1, minDuration: 120, maxDuration: 240, tags: '["relaxed","morning"]' },
	{ title: 'Playlist evening', description: "Take turns picking songs for 10 minutes each. No skipping each other's picks.", category: 'cosy', budgetLevel: 1, minDuration: 60, maxDuration: 120, tags: '["music","playful"]' },
];

const insert = sqlite.prepare(`
	INSERT INTO date_ideas (id, title, description, category, budget_level, min_duration, max_duration, tags)
	VALUES ($id, $title, $description, $category, $budgetLevel, $minDuration, $maxDuration, $tags)
`);

const insertMany = sqlite.transaction((rows) => {
	for (const row of rows) {
		insert.run({
			$id:          randomUUID(),
			$title:       row.title,
			$description: row.description ?? null,
			$category:    row.category,
			$budgetLevel: row.budgetLevel,
			$minDuration: row.minDuration ?? null,
			$maxDuration: row.maxDuration ?? null,
			$tags:        row.tags ?? null,
		});
	}
});

insertMany(ideas);
sqlite.close();
console.log(`seeded ${ideas.length} date ideas`);

import { Database }      from 'bun:sqlite';
import { randomUUID }    from 'crypto';
import { eq }            from 'drizzle-orm';
import { db }            from './index.js';
import { users, couples, memories, lists, listItems, moodLogs, importantDates } from './schema.js';
import { generateId }    from '../utils/uuid.js';
import { hashPassword }  from '../utils/hash.js';


// ── 1. date ideas — backs the randomiser's seed fallback when Gemini is unavailable ──
// each block below checks whether its own data already exists before inserting,
// so running `bun run seed` again later is always safe and never duplicates rows

const sqlite = new Database(process.env.DATABASE_URL ?? './biku.db');
sqlite.run('PRAGMA foreign_keys = ON');

const existingIdeas = sqlite.query('SELECT COUNT(*) as count FROM date_ideas').get();
if (existingIdeas.count > 0) {
	console.log('date_ideas already seeded, skipping');
} else {
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
	console.log(`seeded ${ideas.length} date ideas`);
}

sqlite.close();


// ── 2. showcase couple — Law + Ariana, demo content for presenting the app ──
// Law's account (lawrensuleo@gmail.com) was created by hand through the real
// UI while testing, so we look him up rather than recreating him. Ariana gets
// created fresh and paired onto his existing (until-now-pending) couple row.
// everything below is themed on the interests Law told us about: minecraft,
// CS, space (Interstellar, Project Hail Mary), gym, food, bouldering, hiking,
// the beach, DPR IAN / Cigarettes After Sex / Ariana Grande concerts, DIY and
// home projects.
//
// guarded on Ariana's email existing already, so re-running `bun run seed`
// after the couple's been created is a no-op rather than a duplicate-row mess

const LAW_EMAIL    = 'lawrensuleo@gmail.com';
const ARIANA_EMAIL = 'Ariana7@gmail.com';

const existingAriana = db.select().from(users).where(eq(users.email, ARIANA_EMAIL)).get();

if (existingAriana) {
	console.log('showcase couple already seeded, skipping');
} else {
	const law = db.select().from(users).where(eq(users.email, LAW_EMAIL)).get();

	if (!law) {
		console.log(`showcase seed skipped: no account found for ${LAW_EMAIL} — register through the UI first, then run the seed again`);
	} else if (!law.coupleId) {
		console.log(`showcase seed skipped: Law has no couple row yet — visit /pair to generate one, then run the seed again`);
	} else {
		const couple = db.select().from(couples).where(eq(couples.id, law.coupleId)).get();

		if (!couple) {
			console.log(`showcase seed skipped: Law's couple row (${law.coupleId}) is missing`);
		} else if (couple.partnerBId) {
			console.log('showcase seed skipped: Law is already paired with someone, nothing to add');
		} else {
			const arianaId = generateId();
			const now      = Date.now();

			await db.insert(users).values({
				id:           arianaId,
				email:        ARIANA_EMAIL,
				passwordHash: await hashPassword('DPRGrande7#'),
				displayName:  'Ariana',
				coupleId:     couple.id,
				createdAt:    now,
			});

			await db.update(couples)
				.set({ partnerBId: arianaId, inviteStatus: 'accepted' })
				.where(eq(couples.id, couple.id));

			console.log(`paired Ariana (${arianaId}) with Law on couple ${couple.id}`);


			// memories — real Unsplash photos pulled live through the proxy route's
			// access key, so they look exactly like memories a user would actually create
			const newMemories = [
				{
					title:         'conquering Gunung Santubong',
					description:   "we finally made it to the summit of Santubong. legs were jelly by the end, but the view over the south china sea made every single step worth it.",
					memoryDate:    '2026-04-12',
					locationName:  'Gunung Santubong',
					lat:           1.7440,
					lng:           110.3198,
					imageUrl:      'https://images.unsplash.com/photo-1665678473650-b4d8c79b02b7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5NDA1MjV8MHwxfHNlYXJjaHwxfHxyYWluZm9yZXN0JTIwaGlraW5nJTIwdHJhaWx8ZW58MHx8fHwxNzgwNzUzMDk4fDA&ixlib=rb-4.1.0&q=80&w=1080',
					imageAuthor:    'Walter Martin',
					imageAuthorUrl: 'https://unsplash.com/@rise13law',
				},
				{
					title:         'building our first bookshelf',
					description:   "our first DIY project together, a little bookshelf for all our books and games. it wobbles a bit if you push it, but we built it with our own hands and that's what matters.",
					memoryDate:    '2026-04-26',
					locationName:  'home',
					lat:           null,
					lng:           null,
					imageUrl:      'https://images.unsplash.com/photo-1608613304899-ea8098577e38?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5NDA1MjV8MHwxfHNlYXJjaHwxfHxkaXklMjB3b29kd29ya2luZyUyMGhvbWUlMjBwcm9qZWN0fGVufDB8fHx8MTc4MDc1MzA5OXww&ixlib=rb-4.1.0&q=80&w=1080',
					imageAuthor:    'Samantha Fortney',
					imageAuthorUrl: 'https://unsplash.com/@goldencoastgrams',
				},
				{
					title:         'Interstellar rewatch and stargazing',
					description:   "rewatched Interstellar and then just stayed outside looking up for an hour, talking about Project Hail Mary and whether we'd survive a year alone in space. verdict: no, but together, maybe.",
					memoryDate:    '2026-05-03',
					locationName:  'Permai Rainforest Resort',
					lat:           1.7470,
					lng:           110.3230,
					imageUrl:      'https://images.unsplash.com/photo-1609000142140-fb449c139c82?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5NDA1MjV8MHwxfHNlYXJjaHwxfHxzdGFyZ2F6aW5nJTIwbmlnaHQlMjBza3klMjB0ZWxlc2NvcGV8ZW58MHx8fHwxNzgwNzUzMDk5fDA&ixlib=rb-4.1.0&q=80&w=1080',
					imageAuthor:    'Simon Delalande',
					imageAuthorUrl: 'https://unsplash.com/@simon_dld',
				},
				{
					title:         'first time bouldering together',
					description:   'tried bouldering for the first time today. fell off the overhang route about a dozen times each and laughed every single time. we are absolutely doing this again.',
					memoryDate:    '2026-05-18',
					locationName:  'The Boulder Spot, Kuching',
					lat:           1.5535,
					lng:           110.3593,
					imageUrl:      'https://images.unsplash.com/photo-1564769662533-4f00a87b4056?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5NDA1MjV8MHwxfHNlYXJjaHwxfHxib3VsZGVyaW5nJTIwY2xpbWJpbmclMjBneW18ZW58MHx8fHwxNzgwNzUzMDk2fDA&ixlib=rb-4.1.0&q=80&w=1080',
					imageAuthor:    'Yns Plt',
					imageAuthorUrl: 'https://unsplash.com/@ynsplt',
				},
				{
					title:         'sunset swim at Damai Beach',
					description:   'spent the whole evening at Damai beach. swam until the sun went down, then just sat in the sand watching the sky turn orange and pink behind us.',
					memoryDate:    '2026-05-24',
					locationName:  'Damai Beach, Santubong',
					lat:           1.7384,
					lng:           110.3214,
					imageUrl:      'https://images.unsplash.com/photo-1578660692094-da697dfc1c78?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5NDA1MjV8MHwxfHNlYXJjaHwxfHx0cm9waWNhbCUyMGJlYWNoJTIwc3Vuc2V0JTIwY291cGxlfGVufDB8fHx8MTc4MDc1MzA5N3ww&ixlib=rb-4.1.0&q=80&w=1080',
					imageAuthor:    'Andrey Câmara',
					imageAuthorUrl: 'https://unsplash.com/@andreycamara',
				},
				{
					title:         'minecraft marathon and movie night',
					description:   "stayed in, built an entire base in minecraft, then put on a movie and barely watched any of it because we kept getting distracted talking instead.",
					memoryDate:    '2026-05-30',
					locationName:  'home',
					lat:           null,
					lng:           null,
					imageUrl:      'https://images.unsplash.com/photo-1603481588273-2f908a9a7a1b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5NDA1MjV8MHwxfHNlYXJjaHwxfHxjb3p5JTIwZ2FtaW5nJTIwc2V0dXB8ZW58MHx8fHwxNzgwNzUzMDk4fDA&ixlib=rb-4.1.0&q=80&w=1080',
					imageAuthor:    'Jack B',
					imageAuthorUrl: 'https://unsplash.com/@nervum',
				},
			];

			for (const m of newMemories) {
				await db.insert(memories).values({
					id:             generateId(),
					coupleId:       couple.id,
					createdBy:      Math.random() < 0.5 ? law.id : arianaId,
					title:          m.title,
					description:    m.description,
					memoryDate:     m.memoryDate,
					locationName:   m.locationName,
					lat:            m.lat,
					lng:            m.lng,
					imageUrl:       m.imageUrl,
					imageAuthor:    m.imageAuthor,
					imageAuthorUrl: m.imageAuthorUrl,
					weatherData:    null,
					createdAt:      now,
				});
			}
			console.log(`inserted ${newMemories.length} memories`);


			// important dates — concerts Law mentioned, plus a couple of plans on the horizon
			const newDates = [
				{ title: "Ariana's birthday",             date: '2026-07-15', recursYearly: 1, createdBy: law.id },
				{ title: 'DPR IAN concert',               date: '2026-08-14', recursYearly: 0, createdBy: arianaId },
				{ title: 'Cigarettes After Sex concert',  date: '2026-09-20', recursYearly: 0, createdBy: law.id },
				{ title: 'Ariana Grande concert',         date: '2026-11-02', recursYearly: 0, createdBy: arianaId },
				{ title: 'hiking trip to Mount Kinabalu', date: '2026-12-05', recursYearly: 0, createdBy: law.id },
			];

			for (const d of newDates) {
				await db.insert(importantDates).values({
					id:           generateId(),
					coupleId:     couple.id,
					createdBy:    d.createdBy,
					title:        d.title,
					date:         d.date,
					recursYearly: d.recursYearly,
					createdAt:    now,
				});
			}
			console.log(`inserted ${newDates.length} important dates`);


			// list items — spread across the couple's existing bucket / grocery / wishlist lists
			const coupleLists = db.select().from(lists).where(eq(lists.coupleId, couple.id)).all();
			const bucketList   = coupleLists.find((l) => l.listType === 'bucket');
			const groceryList  = coupleLists.find((l) => l.listType === 'grocery');
			const wishlistList = coupleLists.find((l) => l.listType === 'wishlist');

			const newListItems = [
				{ list: bucketList,   content: 'hike Mount Kinabalu',                                          addedBy: law.id    },
				{ list: bucketList,   content: 'build an unreasonably ambitious minecraft base together',      addedBy: arianaId  },
				{ list: bucketList,   content: 'try outdoor rock climbing, not just the gym',                  addedBy: law.id    },
				{ list: groceryList,  content: 'protein powder',                                               addedBy: law.id    },
				{ list: groceryList,  content: 'avocados',                                                     addedBy: arianaId  },
				{ list: wishlistList, content: 'a telescope for stargazing nights',                            addedBy: arianaId  },
				{ list: wishlistList, content: 'new bouldering shoes',                                         addedBy: law.id    },
				{ list: wishlistList, content: 'Nintendo Switch 2',                                            addedBy: law.id    },
			];

			// sort_order continues on from whatever's already in each list
			const nextOrder = { bucket: 0, grocery: 0, wishlist: 0 };
			for (const item of db.select().from(listItems).all()) {
				const owningList = coupleLists.find((l) => l.id === item.listId);
				if (owningList) nextOrder[owningList.listType] = Math.max(nextOrder[owningList.listType], item.sortOrder + 1);
			}

			for (const item of newListItems) {
				if (!item.list) continue;
				await db.insert(listItems).values({
					id:        generateId(),
					listId:    item.list.id,
					addedBy:   item.addedBy,
					content:   item.content,
					isChecked: 0,
					sortOrder: nextOrder[item.list.listType]++,
					createdAt: now,
				});
			}
			console.log(`inserted ${newListItems.length} list items`);


			// mood logs — both partners across a ~20 day window ending today, written
			// as a small narrative arc (the beach day, the minecraft night and the
			// dinner date all show up as highs, with quieter days dotted between).
			// Law already had real entries for 2026-06-04 and 2026-06-06 from testing,
			// so those two days only get an Ariana entry here, to respect the
			// one-entry-per-user-per-day rule the route handler enforces
			const moodPlan = {
				'2026-05-18': { law: [4, 'first time bouldering, my arms are dead but it was so much fun'],            ariana: [5, "I beat Law on the overhang route and I will never let him forget it"] },
				'2026-05-19': { law: [3, null],                                                                          ariana: [4, null] },
				'2026-05-20': { law: [4, 'good gym session today'],                                                      ariana: [3, null] },
				'2026-05-21': { law: [3, null],                                                                          ariana: [3, 'long day at work'] },
				'2026-05-22': { law: [4, null],                                                                          ariana: [4, 'grocery run then a quiet night in'] },
				'2026-05-23': { law: [3, 'pretty tired today'],                                                          ariana: [4, null] },
				'2026-05-24': { law: [5, 'Damai beach was unreal, that sunset though'],                                  ariana: [5, 'best beach day ever, I want to do this every weekend'] },
				'2026-05-25': { law: [4, null],                                                                          ariana: [3, 'feeling a bit under the weather'] },
				'2026-05-26': { law: [3, null],                                                                          ariana: [3, null] },
				'2026-05-27': { law: [4, 'productive day, got a lot done'],                                              ariana: [4, null] },
				'2026-05-28': { law: [3, null],                                                                          ariana: [4, null] },
				'2026-05-29': { law: [4, null],                                                                          ariana: [4, 'excited for tomorrow'] },
				'2026-05-30': { law: [5, 'we built the best base in minecraft, the movie also made me a little emotional'], ariana: [5, '10/10 night in, minecraft and cuddles is the move'] },
				'2026-05-31': { law: [3, 'rainy day, stayed in'],                                                        ariana: [3, null] },
				'2026-06-01': { law: [5, 'she looked so good tonight, perfect first dinner date'],                       ariana: [5, "he actually planned the whole thing, I'm soft"] },
				'2026-06-02': { law: [4, null],                                                                          ariana: [4, null] },
				'2026-06-03': { law: [3, 'long week catching up to me'],                                                 ariana: [3, null] },
				'2026-06-04': { law: null, /* Law already logged this day */                                             ariana: [4, 'feeling good too, today was a good one'] },
				'2026-06-05': { law: [4, 'felt better today'],                                                           ariana: [4, null] },
				'2026-06-06': { law: null, /* Law already logged this day */                                             ariana: [3, 'trying to cheer Law up today, missing his family is hard on him'] },
			};

			let moodCount = 0;
			for (const [logDate, entry] of Object.entries(moodPlan)) {
				if (entry.law) {
					await db.insert(moodLogs).values({
						id: generateId(), coupleId: couple.id, userId: law.id,
						moodScore: entry.law[0], note: entry.law[1], logDate, createdAt: now,
					});
					moodCount++;
				}
				if (entry.ariana) {
					await db.insert(moodLogs).values({
						id: generateId(), coupleId: couple.id, userId: arianaId,
						moodScore: entry.ariana[0], note: entry.ariana[1], logDate, createdAt: now,
					});
					moodCount++;
				}
			}
			console.log(`inserted ${moodCount} mood log entries`);

			console.log('showcase seed complete — Ariana can sign in with Ariana7@gmail.com / DPRGrande7#');
		}
	}
}

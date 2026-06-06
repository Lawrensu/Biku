import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';


export const couples = sqliteTable('couples', {
	id:              text('id').primaryKey(),
	partnerAId:      text('partner_a_id').notNull().references(() => users.id),
	partnerBId:      text('partner_b_id').references(() => users.id),
	coupleName:      text('couple_name'),
	anniversaryDate: text('anniversary_date'),
	inviteCode:      text('invite_code').unique(),
	// 'pending' | 'accepted' | 'expired'
	inviteStatus:    text('invite_status').notNull().default('pending'),
	createdAt:       integer('created_at').notNull(),
});


export const users = sqliteTable('users', {
	id:           text('id').primaryKey(),
	email:        text('email').notNull().unique(),
	passwordHash: text('password_hash').notNull(),
	displayName:  text('display_name').notNull(),
	avatarUrl:    text('avatar_url'),
	coupleId:     text('couple_id').references(() => couples.id),
	createdAt:    integer('created_at').notNull(),
});


export const memories = sqliteTable('memories', {
	id:             text('id').primaryKey(),
	coupleId:       text('couple_id').notNull().references(() => couples.id),
	createdBy:      text('created_by').notNull().references(() => users.id),
	title:          text('title').notNull(),
	description:    text('description'),
	// ISO 8601: YYYY-MM-DD
	memoryDate:     text('memory_date').notNull(),
	locationName:   text('location_name'),
	lat:            real('lat'),
	lng:            real('lng'),
	// hotlinked Unsplash URL, kept this way because Unsplash's API terms require it
	imageUrl:       text('image_url'),
	imageAuthor:    text('image_author'),
	imageAuthorUrl: text('image_author_url'),
	// cached JSON string from Open-Meteo. written once on creation and never touched again
	weatherData:    text('weather_data'),
	createdAt:      integer('created_at').notNull(),
});


export const lists = sqliteTable('lists', {
	id:        text('id').primaryKey(),
	coupleId:  text('couple_id').notNull().references(() => couples.id),
	// 'bucket' | 'grocery' | 'wishlist'. each couple gets one of each, enforced in the route handler
	listType:  text('list_type').notNull(),
	createdAt: integer('created_at').notNull(),
});


export const listItems = sqliteTable('list_items', {
	id:        text('id').primaryKey(),
	listId:    text('list_id').notNull().references(() => lists.id),
	addedBy:   text('added_by').notNull().references(() => users.id),
	content:   text('content').notNull(),
	// SQLite boolean: 0 = false, 1 = true
	isChecked: integer('is_checked').notNull().default(0),
	sortOrder: integer('sort_order').notNull().default(0),
	createdAt: integer('created_at').notNull(),
});


export const moodLogs = sqliteTable('mood_logs', {
	id:        text('id').primaryKey(),
	coupleId:  text('couple_id').notNull().references(() => couples.id),
	userId:    text('user_id').notNull().references(() => users.id),
	// 1 (very low) to 5 (very high)
	moodScore: integer('mood_score').notNull(),
	note:      text('note'),
	// stored as YYYY-MM-DD. one entry per user per day, enforced in the route handler
	logDate:   text('log_date').notNull(),
	createdAt: integer('created_at').notNull(),
});


export const importantDates = sqliteTable('important_dates', {
	id:           text('id').primaryKey(),
	coupleId:     text('couple_id').notNull().references(() => couples.id),
	createdBy:    text('created_by').notNull().references(() => users.id),
	title:        text('title').notNull(),
	date:         text('date').notNull(),
	// 0 = one-time, 1 = recurring annually
	recursYearly: integer('recurs_yearly').notNull().default(0),
	createdAt:    integer('created_at').notNull(),
});


// Seed-only table. Not user-created.
// Architecture allows swapping this data source for an AI API in future
// by replacing the query in randomiser.routes.js without touching this schema.
export const dateIdeas = sqliteTable('date_ideas', {
	id:          text('id').primaryKey(),
	title:       text('title').notNull(),
	description: text('description'),
	// 'outdoor' | 'indoor' | 'food' | 'adventure' | 'cosy'
	category:    text('category').notNull(),
	// 1 (free) to 3 (splurge)
	budgetLevel: integer('budget_level').notNull(),
	// minutes
	minDuration: integer('min_duration'),
	maxDuration: integer('max_duration'),
	// JSON array string: '["romantic","creative"]'
	tags:        text('tags'),
});

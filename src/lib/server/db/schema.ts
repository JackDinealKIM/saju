import { pgTable, serial, text, timestamp, jsonb, boolean } from 'drizzle-orm/pg-core';

export const sajuLogs = pgTable('saju_logs', {
	id: serial('id').primaryKey(),
	name: text('name').notNull(),
	birthDate: timestamp('birth_date', { withTimezone: true }).notNull(),
	sajuText: text('saju_text').notNull(),
	aiResult: text('ai_result').notNull(),
	meta: jsonb('meta').$type<{
		gender: 'male' | 'female';
		isLunar: boolean;
		isLeapMonth: boolean;
		birthHour?: number;
		birthMinute?: number;
		originalInput: {
			year: number;
			month: number;
			day: number;
			hour?: number;
			minute?: number;
		};
		shareId?: string;
		inviteToken?: string;
	}>().notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export type SajuLog = typeof sajuLogs.$inferSelect;
export type NewSajuLog = typeof sajuLogs.$inferInsert;

// 초대 링크 테이블
export const inviteTokens = pgTable('invite_tokens', {
	id: serial('id').primaryKey(),
	token: text('token').notNull().unique(),
	isUsed: boolean('is_used').notNull().default(false),
	usedAt: timestamp('used_at', { withTimezone: true }),
	sajuLogId: serial('saju_log_id').references(() => sajuLogs.id),
	memo: text('memo'), // 관리자 메모 (누구한테 줬는지 등)
	createdBy: text('created_by').notNull().default('admin'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export type InviteToken = typeof inviteTokens.$inferSelect;
export type NewInviteToken = typeof inviteTokens.$inferInsert;

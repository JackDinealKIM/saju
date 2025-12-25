import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { inviteTokens, sajuLogs } from '$lib/server/db/schema';
import { nanoid } from 'nanoid';
import { desc, eq } from 'drizzle-orm';

// 간단한 관리자 인증 (실제로는 더 강력한 인증 필요)
const ADMIN_PASSWORD = 'admin1234'; // 실제로는 환경변수로 관리

export const load: PageServerLoad = async ({ cookies }) => {
	const isAuthenticated = cookies.get('admin_auth') === 'true';

	if (!isAuthenticated) {
		throw redirect(302, '/admin/login');
	}

	try {
		// 초대 토큰 목록 조회 (최근 50개)
		const tokens = await db
			.select({
				id: inviteTokens.id,
				token: inviteTokens.token,
				isUsed: inviteTokens.isUsed,
				usedAt: inviteTokens.usedAt,
				sajuLogId: inviteTokens.sajuLogId,
				memo: inviteTokens.memo,
				createdBy: inviteTokens.createdBy,
				createdAt: inviteTokens.createdAt
			})
			.from(inviteTokens)
			.orderBy(desc(inviteTokens.createdAt))
			.limit(50);

		// 사용된 토큰의 사주 정보 조회
		const tokensWithSaju = await Promise.all(
			tokens.map(async (token) => {
				if (token.isUsed && token.sajuLogId) {
					const sajuLog = await db
						.select()
						.from(sajuLogs)
						.where(eq(sajuLogs.id, token.sajuLogId))
						.limit(1);

					return {
						...token,
						sajuLog: sajuLog[0] || null
					};
				}
				return {
					...token,
					sajuLog: null
				};
			})
		);

		return {
			tokens: tokensWithSaju
		};
	} catch (error: any) {
		console.error('❌ 초대 토큰 조회 실패:', error);
		return {
			tokens: []
		};
	}
};

export const actions: Actions = {
	// 초대 토큰 생성
	createToken: async ({ request }) => {
		try {
			const data = await request.formData();
			const memo = data.get('memo') as string;
			const count = parseInt(data.get('count') as string) || 1;

			const createdTokens = [];

			for (let i = 0; i < count; i++) {
				const token = nanoid(16);

				await db.insert(inviteTokens).values({
					token,
					memo: memo || null,
					createdBy: 'admin'
				});

				createdTokens.push(token);
			}

			return {
				success: true,
				tokens: createdTokens,
				message: `${count}개의 초대 링크가 생성되었습니다.`
			};
		} catch (error: any) {
			console.error('❌ 초대 토큰 생성 실패:', error);
			return fail(500, {
				error: '초대 토큰 생성 중 오류가 발생했습니다.'
			});
		}
	},

	// 초대 토큰 삭제
	deleteToken: async ({ request }) => {
		try {
			const data = await request.formData();
			const tokenId = parseInt(data.get('tokenId') as string);

			await db.delete(inviteTokens).where(eq(inviteTokens.id, tokenId));

			return {
				success: true,
				message: '초대 토큰이 삭제되었습니다.'
			};
		} catch (error: any) {
			console.error('❌ 초대 토큰 삭제 실패:', error);
			return fail(500, {
				error: '초대 토큰 삭제 중 오류가 발생했습니다.'
			});
		}
	}
};

import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { sajuLogs } from '$lib/server/db/schema';
import { desc } from 'drizzle-orm';

export const load: PageServerLoad = async () => {
	try {
		// DB에서 최근 10개 조회
		const recentLogs = await db
			.select()
			.from(sajuLogs)
			.orderBy(desc(sajuLogs.createdAt))
			.limit(10);

		return {
			history: recentLogs.map((log) => {
				const meta = log.meta as any;
				const sajuParts = log.sajuText.split(' ');

				return {
					id: log.id,
					name: log.name,
					birthDate: `${log.birthDate.getFullYear()}년 ${log.birthDate.getMonth() + 1}월 ${log.birthDate.getDate()}일`,
					gender: meta.gender,
					saju: {
						yearPillar: sajuParts[0] || '',
						monthPillar: sajuParts[1] || '',
						dayPillar: sajuParts[2] || '',
						timePillar: sajuParts[3] !== '(시간미상)' ? sajuParts[3] : undefined
					},
					shareId: meta.shareId,
					createdAt: log.createdAt
				};
			})
		};
	} catch (err: any) {
		console.error('❌ 히스토리 조회 실패:', err);
		// DB 연결 실패 시 빈 배열 반환
		return {
			history: [],
			error: 'DB 연결이 필요합니다. fix-db-permissions.sql을 실행해주세요.'
		};
	}
};

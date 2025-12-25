import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { sajuLogs } from '$lib/server/db/schema';
import { eq, sql } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params }) => {
	const shareId = params.id;

	try {
		// DB에서 공유 ID로 조회
		const results = await db
			.select()
			.from(sajuLogs)
			.where(sql`${sajuLogs.meta}->>'shareId' = ${shareId}`)
			.limit(1);

		if (results.length === 0) {
			throw error(404, '공유된 사주 분석을 찾을 수 없습니다.');
		}

		const record = results[0];
		const meta = record.meta as any;

		// 사주 팔자 분리
		const sajuParts = record.sajuText.split(' ');

		// AI 분석 결과 파싱 (JSON 문자열 -> 객체)
		let aiAnalysis;
		try {
			aiAnalysis = typeof record.aiResult === 'string'
				? JSON.parse(record.aiResult)
				: record.aiResult;
		} catch (e) {
			console.error('AI 결과 파싱 실패:', e);
			aiAnalysis = record.aiResult;
		}

		return {
			result: {
				name: record.name,
				gender: meta.gender,
				birthDate: `${record.birthDate.getFullYear()}년 ${record.birthDate.getMonth() + 1}월 ${record.birthDate.getDate()}일`,
				saju: {
					yearPillar: sajuParts[0] || '',
					monthPillar: sajuParts[1] || '',
					dayPillar: sajuParts[2] || '',
					timePillar: sajuParts[3] !== '(시간미상)' ? sajuParts[3] : undefined
				},
				aiAnalysis,
				isShared: true
			}
		};
	} catch (err: any) {
		console.error('❌ 공유 페이지 로드 실패:', err);
		if (err.status === 404) {
			throw err;
		}
		throw error(500, 'DB 연결 오류: 공유 기능은 DB 설정 후 사용 가능합니다.');
	}
};

import { fail, error, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { calculateSaju, formatSajuPillars, type SajuInput } from '$lib/saju';
import { analyzeSaju } from '$lib/server/gemini';
import { db } from '$lib/server/db';
import { sajuLogs, inviteTokens } from '$lib/server/db/schema';
import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ url }) => {
	const inviteToken = url.searchParams.get('invite');

	if (!inviteToken) {
		throw redirect(302, '/welcome');
	}

	try {
		// 초대 토큰 조회
		const tokens = await db
			.select()
			.from(inviteTokens)
			.where(eq(inviteTokens.token, inviteToken))
			.limit(1);

		if (tokens.length === 0) {
			throw error(404, '유효하지 않은 초대 링크입니다.');
		}

		const token = tokens[0];

		// 이미 사용된 토큰인 경우, share 페이지로 리다이렉트
		if (token.isUsed && token.sajuLogId) {
			const sajuLog = await db
				.select()
				.from(sajuLogs)
				.where(eq(sajuLogs.id, token.sajuLogId))
				.limit(1);

			if (sajuLog.length > 0) {
				const record = sajuLog[0];
				const meta = record.meta as any;

				// shareId가 있으면 share 페이지로 리다이렉트
				if (meta.shareId) {
					throw redirect(302, `/share/${meta.shareId}`);
				}
			}
		}

	return {
		inviteToken
	};
} catch (err: any) {
		if (err.status) throw err;
		console.error('❌ 초대 토큰 확인 실패:', err);
		throw error(500, 'DB 연결 오류: 관리자에게 문의하세요.');
	}
};

export const actions: Actions = {
	analyze: async ({ request, url }) => {
		const data = await request.formData();

		try {
			// 초대 토큰 검증
			const inviteToken = data.get('inviteToken') as string;
			if (!inviteToken) {
				return fail(403, { error: '초대 토큰이 필요합니다.' });
			}

			const tokens = await db
				.select()
				.from(inviteTokens)
				.where(eq(inviteTokens.token, inviteToken))
				.limit(1);

			if (tokens.length === 0) {
				return fail(404, { error: '유효하지 않은 초대 링크입니다.' });
			}

			const token = tokens[0];

			if (token.isUsed) {
				return fail(400, { error: '이미 사용된 초대 링크입니다.' });
			}

			// 폼 데이터 파싱
			const name = data.get('name') as string;
			const gender = data.get('gender') as 'male' | 'female';
			const calendarType = data.get('calendarType') as 'solar' | 'lunar';
			const year = parseInt(data.get('year') as string);
			const month = parseInt(data.get('month') as string);
			const day = parseInt(data.get('day') as string);
			const hourStr = data.get('hour') as string;
			const minuteStr = data.get('minute') as string;
			const isLeapMonth = data.get('isLeapMonth') === 'true';

			// 유효성 검사
			if (!name || !gender || !calendarType || !year || !month || !day) {
				return fail(400, { error: '필수 입력 항목을 모두 입력해주세요.' });
			}

			// 시간 파싱 (선택적)
			let hour: number | undefined;
			let minute: number | undefined;

			if (hourStr && hourStr.trim() !== '') {
				hour = parseInt(hourStr);
			}
			if (minuteStr && minuteStr.trim() !== '') {
				minute = parseInt(minuteStr);
			}

			// 사주 입력 데이터 구성
			const sajuInput: SajuInput = {
				name,
				gender,
				year,
				month,
				day,
				hour,
				minute,
				isLunar: calendarType === 'lunar',
				isLeapMonth: calendarType === 'lunar' && isLeapMonth
			};

			console.log('📝 사주 입력 데이터:', sajuInput);

			// 사주 계산
			const sajuPillars = calculateSaju(sajuInput);
			console.log('🔮 사주 계산 완료:', formatSajuPillars(sajuPillars));

			// Gemini AI 분석
			console.log('🤖 Gemini AI 분석 시작...');
			const aiAnalysis = await analyzeSaju(
				{
					yearPillar: sajuPillars.yearPillar,
					monthPillar: sajuPillars.monthPillar,
					dayPillar: sajuPillars.dayPillar,
					timePillar: sajuPillars.timePillar
				},
				gender,
				`${sajuPillars.solarDate.getYear()}년 ${sajuPillars.solarDate.getMonth()}월 ${sajuPillars.solarDate.getDay()}일`
			);

			console.log('✅ AI 분석 완료:', aiAnalysis ? 'JSON 객체' : 'null');

			// 공유 ID 생성
			const shareId = nanoid(10);

			// DB 저장 시도 (실패해도 결과는 반환)
			let dbSaved = false;
			let sajuLogId: number | undefined;

			try {
				const result = await db.insert(sajuLogs).values({
					name,
					birthDate: new Date(
						sajuPillars.solarDate.getYear(),
						sajuPillars.solarDate.getMonth() - 1,
						sajuPillars.solarDate.getDay()
					),
					sajuText: formatSajuPillars(sajuPillars),
					aiResult: JSON.stringify(aiAnalysis),
					meta: {
						gender,
						isLunar: sajuInput.isLunar,
						isLeapMonth: sajuInput.isLeapMonth || false,
						birthHour: hour,
						birthMinute: minute,
						originalInput: {
							year,
							month,
							day,
							hour,
							minute
						},
						shareId,
						inviteToken
					}
				}).returning({ id: sajuLogs.id });

				dbSaved = true;
				sajuLogId = result[0]?.id;
				console.log('💾 DB 저장 성공 (Share ID:', shareId, ', Saju Log ID:', sajuLogId, ')');
				// 초대 토큰 사용 처리
				if (dbSaved && sajuLogId) {
					try {
						await db
							.update(inviteTokens)
							.set({
								isUsed: true,
								usedAt: new Date(),
								sajuLogId
							})
							.where(eq(inviteTokens.token, inviteToken));
						console.log('✅ 초대 토큰 사용 처리 완료');
					} catch (tokenError: any) {
						console.warn('⚠️  초대 토큰 업데이트 실패:', tokenError.message);
					}
				}
			} catch (dbError: any) {
				console.warn('⚠️  DB 저장 실패:', dbError.message);
				console.warn('   결과는 정상적으로 반환됩니다.');
			}

			// 결과 반환
			return {
				result: {
					name,
					gender,
					birthDate: `${sajuPillars.solarDate.getYear()}년 ${sajuPillars.solarDate.getMonth()}월 ${sajuPillars.solarDate.getDay()}일`,
					saju: {
						yearPillar: sajuPillars.yearPillar,
						monthPillar: sajuPillars.monthPillar,
						dayPillar: sajuPillars.dayPillar,
						timePillar: sajuPillars.timePillar
					},
					aiAnalysis,
					shareId: dbSaved ? shareId : undefined
				}
			};
		} catch (error: any) {
			console.error('❌ 사주 분석 실패:', error);
			return fail(500, {
				error: `분석 중 오류가 발생했습니다: ${error.message}`
			});
		}
	}
};

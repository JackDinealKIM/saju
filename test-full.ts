/**
 * 전체 시스템 테스트 (사주 계산 + Gemini AI 분석)
 */
import { calculateSaju, formatSajuPillars, type SajuInput } from './src/lib/saju';
import { analyzeSaju } from './src/lib/server/gemini';

async function testFullSystem() {
	console.log('🚀 전체 시스템 테스트 시작\n');

	// 테스트 케이스: 양력 1990년 5월 15일 14시 30분 남성
	const testInput: SajuInput = {
		name: '홍길동',
		gender: 'male',
		year: 1990,
		month: 5,
		day: 15,
		hour: 14,
		minute: 30,
		isLunar: false
	};

	try {
		// 1. 사주 계산
		console.log('📝 입력 정보:', testInput);
		console.log('\n1️⃣ 사주 계산 중...');
		const pillars = calculateSaju(testInput);
		console.log('✅ 사주 계산 완료');
		console.log('   사주팔자:', formatSajuPillars(pillars));
		console.log('   년주:', pillars.yearPillar);
		console.log('   월주:', pillars.monthPillar);
		console.log('   일주:', pillars.dayPillar);
		console.log('   시주:', pillars.timePillar || '시간미상');

		// 2. Gemini AI 분석
		console.log('\n2️⃣ Gemini AI 분석 시작...');
		const birthDate = `${pillars.solarDate.getYear()}년 ${pillars.solarDate.getMonth()}월 ${pillars.solarDate.getDay()}일`;

		const aiAnalysis = await analyzeSaju(
			{
				yearPillar: pillars.yearPillar,
				monthPillar: pillars.monthPillar,
				dayPillar: pillars.dayPillar,
				timePillar: pillars.timePillar
			},
			testInput.gender,
			birthDate
		);

		console.log('✅ Gemini AI 분석 완료');
		console.log('   분석 결과 길이:', aiAnalysis.length, '자');
		console.log('\n=== AI 분석 결과 ===');
		console.log(aiAnalysis);
		console.log('==================\n');

		// 3. 결과 요약
		console.log('📊 테스트 결과 요약:');
		console.log('   ✅ 사주 계산: 성공');
		console.log('   ✅ AI 분석: 성공');
		console.log('   ✅ 전체 시스템: 정상 작동');

		console.log('\n🎉 모든 테스트 완료!');
	} catch (error: any) {
		console.error('\n❌ 테스트 실패:', error.message);
		console.error('스택:', error.stack);
		process.exit(1);
	}
}

// 테스트 실행
testFullSystem();

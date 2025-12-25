import { calculateSaju, displaySajuInfo, type SajuInput } from './src/lib/saju';

/**
 * 사주 계산 테스트
 */
function testSaju() {
	console.log('🔮 사주 계산 테스트 시작\n');

	// 테스트 케이스 1: 양력 1990년 5월 15일 14시 30분 남성
	const test1: SajuInput = {
		name: '홍길동',
		gender: 'male',
		year: 1990,
		month: 5,
		day: 15,
		hour: 14,
		minute: 30,
		isLunar: false
	};

	console.log('=== 테스트 1: 양력 1990년 5월 15일 14:30 (남성) ===');
	const pillars1 = calculateSaju(test1);
	console.log(displaySajuInfo(test1, pillars1));
	console.log('\n');

	// 테스트 케이스 2: 음력 1985년 3월 10일 (시간 모름) 여성
	const test2: SajuInput = {
		name: '김영희',
		gender: 'female',
		year: 1985,
		month: 3,
		day: 10,
		isLunar: true
	};

	console.log('=== 테스트 2: 음력 1985년 3월 10일 (시간 모름, 여성) ===');
	const pillars2 = calculateSaju(test2);
	console.log(displaySajuInfo(test2, pillars2));
	console.log('\n');

	// 테스트 케이스 3: 양력 2000년 1월 1일 00:30 (자시) 남성
	const test3: SajuInput = {
		name: '이철수',
		gender: 'male',
		year: 2000,
		month: 1,
		day: 1,
		hour: 0,
		minute: 30,
		isLunar: false
	};

	console.log('=== 테스트 3: 양력 2000년 1월 1일 00:30 (남성) ===');
	const pillars3 = calculateSaju(test3);
	console.log(displaySajuInfo(test3, pillars3));
	console.log('\n');

	console.log('✅ 모든 테스트 완료!');
}

// 테스트 실행
testSaju();

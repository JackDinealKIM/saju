import { Solar, Lunar } from 'lunar-javascript';

/**
 * 천간 (Heavenly Stems)
 */
export const HEAVENLY_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];

/**
 * 지지 (Earthly Branches)
 */
export const EARTHLY_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

/**
 * 60갑자 생성
 */
function getGanZhi(index: number): string {
	const gan = HEAVENLY_STEMS[index % 10];
	const zhi = EARTHLY_BRANCHES[index % 12];
	return `${gan}${zhi}`;
}

/**
 * 사주 입력 데이터 인터페이스
 */
export interface SajuInput {
	year: number;
	month: number;
	day: number;
	hour?: number;
	minute?: number;
	isLunar: boolean; // 음력 여부
	isLeapMonth?: boolean; // 윤달 여부
	gender: 'male' | 'female';
	name: string;
}

/**
 * 사주 팔자 결과 인터페이스
 */
export interface SajuPillars {
	yearPillar: string; // 년주
	monthPillar: string; // 월주
	dayPillar: string; // 일주
	timePillar?: string; // 시주 (시간 모를 경우 undefined)
	yearGan: string; // 년간
	yearZhi: string; // 년지
	monthGan: string; // 월간
	monthZhi: string; // 월지
	dayGan: string; // 일간
	dayZhi: string; // 일지
	timeGan?: string; // 시간
	timeZhi?: string; // 시지
	solarDate: Solar; // 양력 날짜 객체
	lunarDate: Lunar; // 음력 날짜 객체
}

/**
 * 양력/음력 날짜를 Solar 객체로 변환
 */
export function convertToSolar(input: SajuInput): Solar {
	if (input.isLunar) {
		// 음력 -> 양력 변환
		const lunar = Lunar.fromYmd(input.year, input.month, input.day);
		if (input.isLeapMonth) {
			// 윤달 처리 (lunar-javascript에서는 음력 생성 시 자동 처리)
			// 윤달이면 해당 월의 윤달로 설정
			const leapLunar = Lunar.fromYmd(input.year, -input.month, input.day); // 음수로 윤달 표시
			return leapLunar.getSolar();
		}
		return lunar.getSolar();
	} else {
		// 양력 그대로 사용
		return Solar.fromYmd(input.year, input.month, input.day);
	}
}

/**
 * 시주 계산 (시간을 60갑자로 변환)
 */
function calculateTimePillar(solar: Solar, hour: number, dayGanIndex: number): string {
	// 시지 계산 (23-01시: 子, 01-03시: 丑, ...)
	let timeZhiIndex: number;
	if (hour >= 23 || hour < 1) {
		timeZhiIndex = 0; // 子時
	} else {
		timeZhiIndex = Math.floor((hour + 1) / 2);
	}

	// 시간 계산 (일간에 따라 결정)
	// 일간 甲/己 -> 甲子시 시작
	// 일간 乙/庚 -> 丙子시 시작
	// 일간 丙/辛 -> 戊子시 시작
	// 일간 丁/壬 -> 庚子시 시작
	// 일간 戊/癸 -> 壬子시 시작
	const timeGanStart = [0, 2, 4, 6, 8]; // 甲, 丙, 戊, 庚, 壬
	const dayGanMod = dayGanIndex % 5;
	const timeGanIndex = (timeGanStart[dayGanMod] + timeZhiIndex * 2) % 10;

	const timeGan = HEAVENLY_STEMS[timeGanIndex];
	const timeZhi = EARTHLY_BRANCHES[timeZhiIndex];

	return `${timeGan}${timeZhi}`;
}

/**
 * 사주 팔자 계산
 */
export function calculateSaju(input: SajuInput): SajuPillars {
	// 1. 양력 날짜로 변환
	const solar = convertToSolar(input);

	// 2. 음력 객체 생성
	const lunar = solar.getLunar();

	// 3. 사주 팔자 추출 (lunar-javascript 라이브러리 사용)
	const eightChar = lunar.getEightChar();

	// 년주, 월주, 일주
	const yearPillar = eightChar.getYear(); // 년주 (예: 甲子)
	const monthPillar = eightChar.getMonth(); // 월주
	const dayPillar = eightChar.getDay(); // 일주

	// 천간/지지 분리
	const yearGan = eightChar.getYearGan(); // 년간
	const yearZhi = eightChar.getYearZhi(); // 년지
	const monthGan = eightChar.getMonthGan(); // 월간
	const monthZhi = eightChar.getMonthZhi(); // 월지
	const dayGan = eightChar.getDayGan(); // 일간
	const dayZhi = eightChar.getDayZhi(); // 일지

	// 4. 시주 계산 (시간이 제공된 경우만)
	let timePillar: string | undefined;
	let timeGan: string | undefined;
	let timeZhi: string | undefined;

	if (input.hour !== undefined) {
		const hour = input.hour;
		const dayGanIndex = HEAVENLY_STEMS.indexOf(dayGan);
		timePillar = calculateTimePillar(solar, hour, dayGanIndex);
		timeGan = timePillar[0];
		timeZhi = timePillar[1];
	}

	return {
		yearPillar,
		monthPillar,
		dayPillar,
		timePillar,
		yearGan,
		yearZhi,
		monthGan,
		monthZhi,
		dayGan,
		dayZhi,
		timeGan,
		timeZhi,
		solarDate: solar,
		lunarDate: lunar
	};
}

/**
 * 사주 팔자를 문자열로 변환
 */
export function formatSajuPillars(pillars: SajuPillars): string {
	const parts = [pillars.yearPillar, pillars.monthPillar, pillars.dayPillar];
	if (pillars.timePillar) {
		parts.push(pillars.timePillar);
	} else {
		parts.push('(시간미상)');
	}
	return parts.join(' ');
}

/**
 * 사주 정보를 보기 좋게 출력
 */
export function displaySajuInfo(input: SajuInput, pillars: SajuPillars): string {
	const dateType = input.isLunar ? '음력' : '양력';
	const leapMonth = input.isLeapMonth ? ' (윤달)' : '';

	let result = `=== 사주 정보 ===\n`;
	result += `이름: ${input.name}\n`;
	result += `성별: ${input.gender === 'male' ? '남성' : '여성'}\n`;
	result += `입력: ${dateType} ${input.year}년 ${input.month}월 ${input.day}일${leapMonth}\n`;
	result += `양력: ${pillars.solarDate.getYear()}년 ${pillars.solarDate.getMonth()}월 ${pillars.solarDate.getDay()}일\n`;
	result += `음력: ${pillars.lunarDate.getYear()}년 ${pillars.lunarDate.getMonth()}월 ${pillars.lunarDate.getDay()}일\n`;
	result += `\n`;
	result += `사주팔자:\n`;
	result += `  년주(年柱): ${pillars.yearPillar} (${pillars.yearGan}${pillars.yearZhi})\n`;
	result += `  월주(月柱): ${pillars.monthPillar} (${pillars.monthGan}${pillars.monthZhi})\n`;
	result += `  일주(日柱): ${pillars.dayPillar} (${pillars.dayGan}${pillars.dayZhi})\n`;
	if (pillars.timePillar) {
		result += `  시주(時柱): ${pillars.timePillar} (${pillars.timeGan}${pillars.timeZhi})\n`;
	} else {
		result += `  시주(時柱): 시간 미상\n`;
	}
	result += `\n`;
	result += `사주: ${formatSajuPillars(pillars)}\n`;

	return result;
}

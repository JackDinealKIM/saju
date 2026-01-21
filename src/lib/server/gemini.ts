import { env } from '$env/dynamic/private';

/**
 * Gemini API 설정
 */
export const GEMINI_CONFIG = {
	apiUrl:
		env.GEMINI_API_URL ||
		'https://aiplatform.googleapis.com/v1/publishers/google/models/gemini-2.5-flash-lite:generateContent',
	defaultTemperature: 0.3,
	defaultMaxOutputTokens: 32000,
	defaultTopP: 0.95,
	defaultTopK: 40,
	defaultTimeout: 10 * 60 * 1000 // 10분
};

/**
 * Gemini API Key 조회
 */
function getGeminiAPIKey(): string {
	const apiKey = env.GEMINI_API_KEY;
	if (!apiKey) {
		throw new Error('GEMINI_API_KEY가 환경변수에 설정되지 않았습니다.');
	}
	return apiKey;
}

/**
 * JSON 문자열 정리 (이스케이프 문자 및 제어 문자 수정)
 */
function sanitizeJsonString(jsonText: string): string {
	let cleaned = jsonText;

	// 1. 백슬래시 + 개행 패턴 처리
	cleaned = cleaned.replace(/\\\r?\n/g, '\\n');

	// 2. 문자열 값 내부의 실제 개행 문자를 이스케이프된 형태로 변환
	let inString = false;
	let escaped = false;
	let result = '';

	for (let i = 0; i < cleaned.length; i++) {
		const char = cleaned[i];

		if (char === '"' && !escaped) {
			inString = !inString;
			result += char;
		} else if (inString) {
			// 문자열 내부에서 제어 문자 처리
			if (char === '\n') {
				result += '\\n';
			} else if (char === '\r') {
				result += '\\r';
			} else if (char === '\t') {
				result += '\\t';
			} else if (char.charCodeAt(0) < 0x20 && char !== '\n' && char !== '\r' && char !== '\t') {
				// 다른 제어 문자는 제거
				continue;
			} else {
				result += char;
			}
		} else {
			result += char;
		}

		// 이스케이프 상태 추적
		escaped = char === '\\' && !escaped;
	}

	cleaned = result;

	// 3. 잘못된 이스케이프 시퀀스 처리
	const protectedSequences: string[] = [];
	cleaned = cleaned.replace(/(\\["\\\/bfnrt]|\\u[0-9a-fA-F]{4})/g, (match) => {
		const index = protectedSequences.length;
		protectedSequences.push(match);
		return `__PROTECTED_${index}__`;
	});

	// 4. 나머지 잘못된 백슬래시는 이중 백슬래시로 변경
	cleaned = cleaned.replace(/\\/g, '\\\\');

	// 5. 보호된 시퀀스 복원
	protectedSequences.forEach((seq, index) => {
		cleaned = cleaned.replace(`__PROTECTED_${index}__`, seq);
	});

	return cleaned;
}

/**
 * Gemini 응답에서 JSON 추출 및 파싱
 */
export function parseGeminiResult(result: string): any {
	try {
		// ```json ... ``` 형태 추출
		const jsonMatch = result.match(/```json\s*([\s\S]*?)\s*```/);

		if (jsonMatch) {
			let jsonText = jsonMatch[1].trim();
			jsonText = sanitizeJsonString(jsonText);

			try {
				const parsed = JSON.parse(jsonText);
				return parsed.document || parsed;
			} catch (parseError: any) {
				console.warn('⚠️  JSON 파싱 실패 (코드 블록 내):', parseError.message);
				return null;
			}
		}

		// 순수 JSON 객체 찾기
		const pureJsonMatch = result.match(/\{[\s\S]*\}/);
		if (pureJsonMatch) {
			let jsonText = pureJsonMatch[0];
			jsonText = sanitizeJsonString(jsonText);

			try {
				const parsed = JSON.parse(jsonText);
				return parsed.document || parsed;
			} catch (parseError: any) {
				console.warn('⚠️  JSON 파싱 실패 (순수 JSON):', parseError.message);
				return null;
			}
		}

		console.warn('⚠️  JSON을 찾을 수 없습니다.');
		return null;
	} catch (error: any) {
		console.warn('⚠️  JSON 처리 실패:', error.message);
		return null;
	}
}

interface GenerateTextOptions {
	temperature?: number;
	maxOutputTokens?: number;
	topP?: number;
	topK?: number;
	timeout?: number;
	parseJson?: boolean;
}

/**
 * Gemini API로 범용 텍스트 생성
 */
export async function generateText(
	prompt: string,
	options: GenerateTextOptions = {}
): Promise<string | any> {
	const {
		temperature = GEMINI_CONFIG.defaultTemperature,
		maxOutputTokens = GEMINI_CONFIG.defaultMaxOutputTokens,
		topP = GEMINI_CONFIG.defaultTopP,
		topK = GEMINI_CONFIG.defaultTopK,
		parseJson = false
	} = options;

	console.log(`🤖 Gemini API 실행 중...`);
	console.log(`   프롬프트 길이: ${prompt.length}자`);

	const GEMINI_API_KEY = getGeminiAPIKey();

	const requestBody = {
		contents: [
			{
				role: 'user',
				parts: [
					{
						text: prompt
					}
				]
			}
		],
		generationConfig: {
			temperature,
			maxOutputTokens,
			topP,
			topK
		}
	};

	try {
		const response = await fetch(`${GEMINI_CONFIG.apiUrl}?key=${GEMINI_API_KEY}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(requestBody)
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error('❌ Gemini API 에러:', errorText);
			throw new Error(`Gemini API 오류: ${response.status} ${response.statusText}`);
		}

		const responseText = await response.text();
		console.log('📥 Gemini API 원본 응답 받음 (길이:', responseText.length, '자)');

		let combinedText = '';

		try {
			const jsonData = JSON.parse(responseText);

			if (
				jsonData.candidates &&
				jsonData.candidates[0] &&
				jsonData.candidates[0].content &&
				jsonData.candidates[0].content.parts &&
				jsonData.candidates[0].content.parts[0]
			) {
				combinedText = jsonData.candidates[0].content.parts[0].text;
			} else {
				console.error('❌ Gemini API 응답 형식이 예상과 다릅니다.');
				throw new Error('Gemini API 응답 형식이 예상과 다릅니다.');
			}
		} catch (parseError: any) {
			console.error('❌ JSON 파싱 실패:', parseError.message);
			throw parseError;
		}

		if (!combinedText) {
			console.error('❌ Gemini API 응답에서 텍스트를 추출하지 못했습니다.');
			throw new Error('Gemini API 응답에서 텍스트를 추출하지 못했습니다.');
		}

		console.log('✅ Gemini API 응답 완료 (추출된 텍스트 길이:', combinedText.length, '자)');

		// JSON 파싱 옵션이 활성화된 경우
		if (parseJson) {
			return parseGeminiResult(combinedText);
		}

		return combinedText;
	} catch (error: any) {
		console.error('❌ Gemini API 실행 실패:', error.message);
		throw error;
	}
}

// 인터페이스 정의 (타입 안전성 확보)
interface SajuInput {
	yearPillar: string;
	monthPillar: string;
	dayPillar: string;
	timePillar?: string;
	gender: 'male' | 'female';
	birthDate: string;
}

/**
 * 공통 시스템 프롬프트 생성 (페르소나 + 기본 데이터)
 */
function createBaseSystemPrompt(data: SajuInput, nextYear: number): string {
	// 현재 날짜 (KST 기준)
	const now = new Date();
	const kstOffset = 9 * 60; // KST는 UTC+9
	const kstTime = new Date(now.getTime() + kstOffset * 60 * 1000);
	const currentDateKST = kstTime.toISOString().split('T')[0]; // YYYY-MM-DD 형식

	return `
# Role Definition
당신은 30년 경력의 정통 명리학자이자 심리 상담가 '도담(道談)'입니다.
내담자의 사주를 깊이 있게 분석하여, A4 용지 5장 분량의 상세한 리포트 중 [일부분]을 작성하고 있습니다.
다정하고 깊이 있는 어조("~한 경향이 있네요", "~하는 것이 좋겠습니다")를 유지하세요.

# Context
- 오늘 날짜 (KST): ${currentDateKST}
- 기준 년도: ${nextYear}년

# Input Data
- 성별: ${data.gender === 'male' ? '남성' : '여성'}
- 생년월일: ${data.birthDate}
- 사주 명식: [${data.yearPillar}, ${data.monthPillar}, ${data.dayPillar}, ${data.timePillar || '시주 미상'}]
`;
}

/**
 * 사주 정밀 분석 (4단계 병렬 호출)
 */
export async function analyzeSajuDeep(sajuData: SajuInput): Promise<any> {
	const currentYear = new Date().getFullYear();
	const nextYear = currentYear + 1;
	const basePrompt = createBaseSystemPrompt(sajuData, nextYear);

	// 4개의 파트를 동시에 호출 (Parallel Execution)
	try {
		const [part1, part2, part3, part4] = await Promise.all([
			// PART 1: 기본 분석 (성격, 적성)
			generatePart(basePrompt, `
                # Task: [PART 1. 기본 성향 분석]
                오직 내담자의 타고난 기질, 성격(겉/속), 잠재력에만 집중하여 분석하세요.
                
                # Output Schema (JSON Only):
                {
                    "basicAnalysis": {
                        "title": "나를 정의하다",
                        "emoji": "🌟",
                        "totalReview": "3문장 이상의 총평",
                        "personality": { 
                            "outer": "겉모습 성격 (상세히)", 
                            "inner": "내면 심리 (상세히)", 
                            "strengths": ["강점1", "강점2", "강점3"], 
                            "weaknesses": ["보완점1", "보완점2"] 
                        },
                        "aptitude": "적성과 잠재력 상세 분석"
                    }
                }
            `),

			// PART 2: 직업 및 재물
			generatePart(basePrompt, `
                # Task: [PART 2. 부와 명예]
                오직 직업운, 사업운, 재물운, 성공 전략에만 집중하세요. 구체적인 직업 예시를 포함하세요.
                
                # Output Schema (JSON Only):
                {
                    "wealthAndCareer": {
                        "title": "부와 명예의 흐름",
                        "emoji": "💼",
                        "jobStyle": "조직생활 vs 사업가 적합도 분석",
                        "suitableJobs": ["추천 직업1", "추천 직업2", "추천 직업3"],
                        "wealthLuck": "재물운의 크기와 특징 상세 서술",
                        "successStrategy": "부자가 되기 위한 현실적 조언"
                    }
                }
            `),

			// PART 3: 관계 및 건강
			generatePart(basePrompt, `
                # Task: [PART 3. 관계와 안녕]
                연애, 애정, 결혼, 대인관계, 그리고 건강운에 집중하세요.
                연애운과 애정운은 특히 상세하게 분석해주세요.

                # Output Schema (JSON Only):
                {
                    "relationships": {
                        "title": "인연과 사랑",
                        "emoji": "💕",
                        "loveStyle": {
                            "approach": "연애 접근 방식 (적극적/소극적, 이상형 등)",
                            "expression": "애정 표현 스타일 (직접적/간접적)",
                            "compatibility": "잘 맞는 이성 유형 상세 분석",
                            "dating": "연애할 때 특징과 행동 패턴"
                        },
                        "loveFortune": {
                            "overall": "전반적인 연애운 분석 (3-4문장)",
                            "timing": "연애운이 좋은 시기",
                            "challenges": "연애에서 겪을 수 있는 어려움",
                            "advice": "연애 성공을 위한 구체적 조언"
                        },
                        "affectionLuck": {
                            "charm": "타고난 매력 포인트 분석",
                            "popularity": "이성에게 인기도 및 어필 방법",
                            "romanticTendency": "낭만적 성향 및 연애 가치관",
                            "longTermLove": "장기 연애 및 안정적 관계 유지 능력"
                        },
                        "spouseLuck": {
                            "timing": "결혼 적령기 및 좋은 시기",
                            "idealSpouse": "이상적인 배우자 유형 상세 묘사",
                            "marriageStyle": "결혼 생활 스타일 예측",
                            "advice": "행복한 결혼을 위한 조언"
                        },
                        "socialLuck": "인복 및 귀인 분석",
                        "caution": "인간관계 주의점"
                    },
                    "health": {
                        "title": "건강과 컨디션",
                        "emoji": "🌿",
                        "constitution": "타고난 체질 분석",
                        "cautionOrgans": ["주의 장기1", "주의 장기2"],
                        "healthAdvice": "건강 관리 조언"
                    }
                }
            `),

			// PART 4: 시기별 운세 및 조언
			generatePart(basePrompt, `
                # Task: [PART 4. 운의 흐름과 조언]
                대운(10년 주기), ${nextYear}년 신년 운세, 그리고 개운법을 작성하세요.
                
                # Output Schema (JSON Only):
                {
                    "lifeFlow": {
                        "title": "인생 전체 대운",
                        "emoji": "🌊",
                        "summary": "인생 흐름 요약",
                        "primeEra": "황금기(전성기) 시기",
                        "graph": [
                             { "ageGroup": "20대", "keyword": "키워드", "desc": "운세 설명", "score": 70 },
                             { "ageGroup": "30대", "keyword": "키워드", "desc": "운세 설명", "score": 80 },
                             { "ageGroup": "40대", "keyword": "키워드", "desc": "운세 설명", "score": 90 },
                             { "ageGroup": "50대", "keyword": "키워드", "desc": "운세 설명", "score": 85 }
                        ]
                    },
                    "yearFortune": {
                        "title": "${nextYear}년 신년 운세",
                        "emoji": "🎊",
                        "overview": "신년 총평",
                        "monthly": [
                            { "month": 1, "period": "1분기", "fortune": "운세 상세", "score": 80, "action": "행동 지침" },
                            { "month": 4, "period": "2분기", "fortune": "운세 상세", "score": 70, "action": "행동 지침" },
                            { "month": 7, "period": "3분기", "fortune": "운세 상세", "score": 60, "action": "행동 지침" },
                            { "month": 10, "period": "4분기", "fortune": "운세 상세", "score": 90, "action": "행동 지침" }
                        ]
                    },
                    "finalAdvice": {
                        "title": "도담의 처방",
                        "emoji": "📜",
                        "luckyItems": { "color": "색", "number": "수", "direction": "방향", "item": "물건" },
                        "wiseSaying": "명언",
                        "closing": "마무리 인사"
                    }
                }
            `)
		]);

		// 4. 결과 병합 (Merge Results)
		return {
			...part1,
			...part2,
			...part3,
			...part4
		};

	} catch (error) {
		console.error("Saju Analysis Error:", error);
		throw new Error("사주 분석 중 오류가 발생했습니다.");
	}
}

/**
 * 개별 파트 호출 헬퍼 함수
 */
async function generatePart(baseSystemPrompt: string, specificPrompt: string): Promise<any> {
	const fullPrompt = `${baseSystemPrompt}\n\n${specificPrompt}\n\n중요: JSON 형식 외에는 아무것도 출력하지 마세요.`;

	// 기존에 사용하시던 generateText 함수 호출
	return await generateText(fullPrompt, {
		temperature: 0.85, // 창의적이고 풍부한 서술
		maxOutputTokens: 8000, // 각 파트별 넉넉한 토큰
		parseJson: true
	});
}

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

/**
 * 사주 분석용 Gemini API 호출 (구조화된 JSON 응답)
 */
export async function analyzeSaju(
	sajuData: {
		yearPillar: string;
		monthPillar: string;
		dayPillar: string;
		timePillar?: string;
	},
	gender: 'male' | 'female',
	birthDate: string
): Promise<any> {
	const currentYear = new Date().getFullYear();
	const nextYear = currentYear + 1;

	const prompt = `역할: 당신은 30년 경력의 정통 명리학자이자 심리 상담가입니다.

입력 정보:
- 성별: ${gender === 'male' ? '남성' : '여성'}
- 생년월일(양력): ${birthDate}
- 사주팔자(Four Pillars):
  [년주: ${sajuData.yearPillar}]
  [월주: ${sajuData.monthPillar}]
  [일주: ${sajuData.dayPillar}]
  [시주: ${sajuData.timePillar || '시간 미상'}]
- 현재 년도: ${currentYear}년
- 분석 대상 년도: ${nextYear}년 (신년 운세)

지시사항:
위 사주 정보를 바탕으로 의뢰인의 운세를 분석해주세요.
초등학생도 이해할 수 있도록 쉬운 말로 설명하되, 전문성은 유지해주세요.

중요한 점수 기준:
- score 필드는 0-100 사이의 숫자로, 해당 시기의 운세 점수입니다
- 50점 미만: 어려운 시기, 50-70점: 보통, 70-85점: 좋은 시기, 85점 이상: 매우 좋은 시기
- 월별 운세와 인생 전체 운세 모두 score 값을 반드시 포함해주세요

다음 JSON 형식으로만 출력하세요:

\`\`\`json
{
  "personality": {
    "title": "타고난 성격",
    "emoji": "🌟",
    "summary": "한 줄로 요약한 핵심 성격",
    "traits": [
      { "trait": "성격 특징1", "description": "설명" },
      { "trait": "성격 특징2", "description": "설명" },
      { "trait": "성격 특징3", "description": "설명" }
    ],
    "strengths": ["장점1", "장점2", "장점3"],
    "weaknesses": ["주의할점1", "주의할점2"]
  },
  "career": {
    "title": "직업과 재물운",
    "emoji": "💼",
    "summary": "어떤 일을 하면 잘 될까요?",
    "suitableJobs": [
      { "category": "직업 분야1", "examples": ["구체적 직업1", "구체적 직업2"] },
      { "category": "직업 분야2", "examples": ["구체적 직업3", "구체적 직업4"] }
    ],
    "moneyTips": ["재물 조언1", "재물 조언2", "재물 조언3"]
  },
  "relationships": {
    "title": "인간관계와 사랑",
    "emoji": "💕",
    "summary": "사람들과 어떻게 지낼까요?",
    "loveStyle": "연애 스타일 설명",
    "idealPartner": "이상적인 배우자 스타일",
    "friendshipTips": ["친구 사귀기 팁1", "친구 사귀기 팁2"]
  },
  "yearFortune_${nextYear}": {
    "title": "${nextYear}년 신년 운세",
    "emoji": "🎊",
    "overall": "전체 운세 한 줄 요약",
    "months": [
      {
        "month": 1,
        "period": "1월-3월",
        "fortune": "운세 설명",
        "score": 75,
        "luckyColor": "행운의 색깔",
        "advice": "조언"
      },
      {
        "month": 4,
        "period": "4월-6월",
        "fortune": "운세 설명",
        "score": 85,
        "luckyColor": "행운의 색깔",
        "advice": "조언"
      },
      {
        "month": 7,
        "period": "7월-9월",
        "fortune": "운세 설명",
        "score": 65,
        "luckyColor": "행운의 색깔",
        "advice": "조언"
      },
      {
        "month": 10,
        "period": "10월-12월",
        "fortune": "운세 설명",
        "score": 90,
        "luckyColor": "행운의 색깔",
        "advice": "조언"
      }
    ],
    "luckyNumbers": [1, 7, 9],
    "avoidDates": ["특히 조심해야 할 시기"]
  },
  "lifeFortune": {
    "title": "인생 전체 운세",
    "emoji": "🌈",
    "summary": "전체 인생 흐름 요약",
    "decades": [
      { "age": "0-10세", "period": "유년기", "fortune": "운세", "score": 70 },
      { "age": "11-20세", "period": "청소년기", "fortune": "운세", "score": 75 },
      { "age": "21-30세", "period": "청년기", "fortune": "운세", "score": 80 },
      { "age": "31-40세", "period": "장년기", "fortune": "운세", "score": 85 },
      { "age": "41-50세", "period": "중년기", "fortune": "운세", "score": 75 },
      { "age": "51-60세", "period": "중년후기", "fortune": "운세", "score": 80 },
      { "age": "61-70세", "period": "노년기", "fortune": "운세", "score": 85 },
      { "age": "71-80세", "period": "노년후기", "fortune": "운세", "score": 90 }
    ],
    "peakPeriod": "가장 좋은 시기 (예: 31-40세)",
    "challengePeriod": "조심해야 할 시기 (예: 41-50세)"
  },
  "advice": {
    "title": "인생 조언",
    "emoji": "📜",
    "quote": "마음에 새길 한 마디",
    "dailyHabits": ["매일 실천할 습관1", "매일 실천할 습관2"],
    "yearGoals": ["올해 목표1", "올해 목표2"]
  }
}
\`\`\`

중요: 반드시 위 JSON 형식을 정확히 지켜주세요. 모든 값은 초등학생도 이해할 수 있게 쉽고 재미있게 작성해주세요.`;

	const result = await generateText(prompt, {
		temperature: 0.8,
		maxOutputTokens: 12000,
		parseJson: true
	});

	return result;
}

/**
 * Gemini API 간단 테스트
 */
import 'dotenv/config';

const GEMINI_CONFIG = {
	apiUrl:
		process.env.GEMINI_API_URL ||
		'https://aiplatform.googleapis.com/v1/publishers/google/models/gemini-2.5-flash-lite:generateContent',
	defaultTemperature: 0.7,
	defaultMaxOutputTokens: 8192
};

async function testGeminiAPI() {
	console.log('🤖 Gemini API 테스트 시작\n');

	const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
	if (!GEMINI_API_KEY) {
		console.error('❌ GEMINI_API_KEY가 설정되지 않았습니다.');
		process.exit(1);
	}

	console.log('✅ API Key 확인:', GEMINI_API_KEY.substring(0, 10) + '...');
	console.log('✅ API URL:', GEMINI_CONFIG.apiUrl);

	// 테스트 프롬프트
	const testPrompt = `역할: 당신은 30년 경력의 정통 명리학자이자 심리 상담가입니다.

입력 정보:
- 성별: 남성
- 생년월일(양력): 1990년 5월 15일
- 사주팔자(Four Pillars):
  [년주: 庚午]
  [월주: 辛巳]
  [일주: 庚辰]
  [시주: 庚未]

지시사항:
위 사주 정보를 바탕으로 의뢰인의 운세를 분석해주세요.
전문 용어(십성, 용신 등)를 적절히 섞되, 일반인이 이해하기 쉽게 풀어서 설명해야 합니다.
다음 목차에 따라 마크다운(Markdown) 형식으로 출력하세요.

## 1. 🌟 타고난 기질 (본원 분석)
(일간을 중심으로 핵심 성격과 장단점 설명)

## 2. 💰 재물과 직업운
(적성에 맞는 직업군 추천 및 재물 모으는 팁)

## 3. 💘 애정운과 인간관계
(배우자 운 및 대인관계 조언)

## 4. 📜 인생의 조언 (총평)
(현재 시점에서 명심해야 할 한 문장 포함)`;

	const requestBody = {
		contents: [
			{
				role: 'user',
				parts: [
					{
						text: testPrompt
					}
				]
			}
		],
		generationConfig: {
			temperature: GEMINI_CONFIG.defaultTemperature,
			maxOutputTokens: GEMINI_CONFIG.defaultMaxOutputTokens,
			topP: 0.95,
			topK: 40
		}
	};

	try {
		console.log('\n📤 Gemini API 호출 중...');
		console.log('   프롬프트 길이:', testPrompt.length, '자\n');

		const response = await fetch(`${GEMINI_CONFIG.apiUrl}?key=${GEMINI_API_KEY}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(requestBody)
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error('❌ API 오류:', errorText);
			throw new Error(`API 오류: ${response.status} ${response.statusText}`);
		}

		const responseText = await response.text();
		console.log('📥 응답 받음 (길이:', responseText.length, '자)');

		const jsonData = JSON.parse(responseText);

		if (
			jsonData.candidates &&
			jsonData.candidates[0] &&
			jsonData.candidates[0].content &&
			jsonData.candidates[0].content.parts &&
			jsonData.candidates[0].content.parts[0]
		) {
			const combinedText = jsonData.candidates[0].content.parts[0].text;
			console.log('\n✅ Gemini API 성공!');
			console.log('   분석 결과 길이:', combinedText.length, '자\n');
			console.log('=== AI 분석 결과 ===');
			console.log(combinedText);
			console.log('\n===================');
			console.log('\n🎉 테스트 완료!');
		} else {
			console.error('❌ 응답 형식 오류');
			console.error('응답:', JSON.stringify(jsonData, null, 2).substring(0, 500));
		}
	} catch (error: any) {
		console.error('\n❌ 테스트 실패:', error.message);
		if (error.stack) {
			console.error('스택:', error.stack);
		}
		process.exit(1);
	}
}

testGeminiAPI();

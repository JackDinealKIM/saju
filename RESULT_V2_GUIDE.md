# 결과 페이지 V2 사용 가이드

## 개요
`result-v2.svelte`는 Gemini API의 새로운 4파트 프롬프트 구조에 맞춰 설계된 명리학 결과 페이지입니다.

## 주요 특징

### 1. 완전한 조건부 렌더링
- **모든 섹션이 JSON 데이터 존재 여부에 따라 자동으로 표시/숨김 처리됩니다**
- 데이터가 없는 섹션은 렌더링되지 않아 깔끔한 UI 유지

### 2. 지원하는 체크 함수
```typescript
hasData(obj)        // 객체 존재 체크
hasArrayData(arr)   // 배열 존재 및 길이 체크
hasText(str)        // 문자열 존재 및 내용 체크
```

### 3. 기본값(fallback) 제공
모든 필드에 기본값이 설정되어 있어, 일부 데이터가 누락되어도 UI가 깨지지 않습니다.

```svelte
{analysis.basicAnalysis.emoji || '🌟'}
{analysis.basicAnalysis.title || '나를 정의하다'}
```

## 데이터 구조

### PART 1: 기본 성향 분석 (basicAnalysis)
```json
{
  "basicAnalysis": {
    "title": "나를 정의하다",
    "emoji": "🌟",
    "totalReview": "3문장 이상의 총평",
    "personality": {
      "outer": "겉모습 성격",
      "inner": "내면 심리",
      "strengths": ["강점1", "강점2", "강점3"],
      "weaknesses": ["보완점1", "보완점2"]
    },
    "aptitude": "적성과 잠재력 상세 분석"
  }
}
```

### PART 2: 부와 명예 (wealthAndCareer)
```json
{
  "wealthAndCareer": {
    "title": "부와 명예의 흐름",
    "emoji": "💼",
    "jobStyle": "조직생활 vs 사업가 적합도",
    "suitableJobs": ["추천 직업1", "추천 직업2"],
    "wealthLuck": "재물운 상세 서술",
    "successStrategy": "부자가 되기 위한 조언"
  }
}
```

### PART 3: 관계와 건강 (relationships + health)
```json
{
  "relationships": {
    "title": "인연과 사랑",
    "emoji": "💕",
    "loveStyle": "연애 스타일",
    "spouseLuck": "배우자운",
    "socialLuck": "인복 및 귀인",
    "caution": "인간관계 주의점"
  },
  "health": {
    "title": "건강과 컨디션",
    "emoji": "🌿",
    "constitution": "타고난 체질",
    "cautionOrgans": ["주의 장기1", "주의 장기2"],
    "healthAdvice": "건강 관리 조언"
  }
}
```

### PART 4-1: 인생 대운 (lifeFlow)
```json
{
  "lifeFlow": {
    "title": "인생 전체 대운",
    "emoji": "🌊",
    "summary": "인생 흐름 요약",
    "primeEra": "황금기(전성기) 시기",
    "graph": [
      {
        "ageGroup": "20대",
        "keyword": "키워드",
        "desc": "운세 설명",
        "score": 70
      }
    ]
  }
}
```

### PART 4-2: 신년 운세 (yearFortune)
```json
{
  "yearFortune": {
    "title": "2026년 신년 운세",
    "emoji": "🎊",
    "overview": "신년 총평",
    "monthly": [
      {
        "month": 1,
        "period": "1분기",
        "fortune": "운세 상세",
        "score": 80,
        "action": "행동 지침"
      }
    ]
  }
}
```

### PART 4-3: 도담의 처방 (finalAdvice)
```json
{
  "finalAdvice": {
    "title": "도담의 처방",
    "emoji": "📜",
    "luckyItems": {
      "color": "색",
      "number": "수",
      "direction": "방향",
      "item": "물건"
    },
    "wiseSaying": "명언",
    "closing": "마무리 인사"
  }
}
```

## 사용 방법

### 1. 테스트 페이지로 확인
```bash
npm run dev
# http://localhost:5173/test-result 접속
```

### 2. 실제 데이터와 연결
```svelte
<script>
  import ResultV2 from './result-v2.svelte';

  export let data; // 서버에서 받은 데이터
</script>

<ResultV2
  name={data.result.name}
  gender={data.result.gender}
  birthDate={data.result.birthDate}
  saju={data.result.saju}
  analysis={data.result.aiAnalysis}
/>
```

### 3. 부분 데이터 테스트
특정 섹션만 있는 경우도 자동으로 처리됩니다:

```javascript
// PART 1만 있는 경우
const partialData = {
  name: "홍길동",
  gender: "male",
  birthDate: "1990-01-01",
  saju: { ... },
  analysis: {
    basicAnalysis: { ... }
    // 나머지 파트는 없음
  }
};

// ✅ 문제없이 작동 - PART 1만 표시됨
```

## 조건부 렌더링 예시

### 배열 데이터
```svelte
<!-- 강점 배열이 있을 때만 표시 -->
{#if hasArrayData(analysis.basicAnalysis.personality.strengths)}
  <ul>
    {#each analysis.basicAnalysis.personality.strengths as strength}
      <li>{strength}</li>
    {/each}
  </ul>
{/if}
```

### 문자열 데이터
```svelte
<!-- 총평이 있을 때만 표시 -->
{#if hasText(analysis.basicAnalysis.totalReview)}
  <p>{analysis.basicAnalysis.totalReview}</p>
{/if}
```

### 객체 데이터
```svelte
<!-- 전체 섹션 존재 여부 체크 -->
{#if hasData(analysis?.basicAnalysis)}
  <Card>
    <!-- 내용 -->
  </Card>
{/if}
```

## 차트 렌더링

### 1. 대운 그래프
- `lifeFlow.graph` 배열이 있으면 자동으로 Canvas 차트 생성
- onMount에서 자동 렌더링

### 2. 분기별 운세 그래프
- `yearFortune.monthly` 배열이 있으면 자동으로 Canvas 차트 생성
- onMount에서 자동 렌더링

## 장점

### ✅ 안정성
- 데이터 누락으로 인한 에러 방지
- 안전한 옵셔널 체이닝 (`?.`)

### ✅ 유연성
- 부분 데이터만 있어도 정상 작동
- Gemini가 일부 섹션을 생략해도 문제없음

### ✅ 유지보수성
- 체크 함수로 중복 코드 제거
- 명확한 데이터 구조 정의

### ✅ 사용자 경험
- 불필요한 빈 카드가 표시되지 않음
- 깔끔한 UI 유지

## 트러블슈팅

### Q: 그래프가 안 보여요
A: `lifeFlow.graph` 또는 `yearFortune.monthly` 배열에 데이터가 있는지 확인하세요.

### Q: 섹션이 통째로 안 보여요
A: 해당 섹션의 최상위 객체 자체가 없거나 비어있는지 확인하세요.

### Q: 기본값이 표시돼요
A: Gemini 응답에서 해당 필드가 누락되었습니다. 프롬프트를 수정하거나 기본값을 변경하세요.

## 다음 단계

1. **실제 API와 연결**: `+page.server.ts`에서 Gemini 응답을 `aiAnalysis`로 저장
2. **스타일 커스터마이징**: 필요시 색상 테마 변경
3. **추가 섹션 개발**: 새로운 파트 추가 시 동일한 패턴 적용

---

**만든이:** Claude Code
**버전:** 2.0
**최종 수정:** 2025-12-26

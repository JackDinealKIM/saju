# AI 사주 자동화 분석 서비스 - 개발 체크리스트

## 프로젝트 개요
- **프로젝트명**: AI Saju Master
- **목표**: 사용자의 생년월일시 정보로 정확한 사주팔자를 계산하고 Gemini AI로 운세 풀이 제공
- **기술 스택**: SvelteKit, shadcn-svelte, Drizzle ORM, PostgreSQL, Gemini 1.5 Flash

---

## Phase 1: 환경 설정 및 DB 구성

### 1.1 프로젝트 초기화
- [ ] SvelteKit 프로젝트 생성
  ```bash
  npm create svelte@latest
  ```

### 1.2 패키지 설치
- [ ] 핵심 패키지 설치
  ```bash
  npm install drizzle-orm postgres @google/generative-ai lunar-javascript
  ```
- [ ] 개발 도구 설치
  ```bash
  npm install -D drizzle-kit tailwindcss postcss autoprefixer
  ```

### 1.3 UI 라이브러리 설정
- [ ] shadcn-svelte 초기화
  ```bash
  npx shadcn-svelte@latest init
  ```
- [ ] 필요한 컴포넌트 설치 (Card, Input, Label, Select, RadioGroup 등)

### 1.4 데이터베이스 설정
- [ ] PostgreSQL 인스턴스 준비 (Supabase 등)
- [ ] `.env` 파일 생성
  ```
  DATABASE_URL=postgresql://...
  GEMINI_API_KEY=your_api_key_here
  ```
- [ ] `src/lib/server/db/index.ts` - DB 클라이언트 생성
- [ ] `src/lib/server/db/schema.ts` - Drizzle 테이블 스키마 정의
  ```typescript
  // saju_logs 테이블:
  // - id (serial, PK)
  // - name (text)
  // - birth_date (timestamp)
  // - saju_text (text)
  // - ai_result (text)
  // - meta (jsonb) - 성별, 음력여부 등
  // - created_at (timestamp)
  ```
- [ ] DB 마이그레이션 실행
  ```bash
  npx drizzle-kit push
  ```

---

## Phase 2: 만세력(Saju) 코어 로직 구현

### 2.1 유틸리티 함수 작성
- [ ] `src/lib/saju.ts` 파일 생성
- [ ] lunar-javascript import
- [ ] 양력/음력 변환 함수 구현
  - [ ] 양력/음력/윤달 입력을 Solar 객체로 변환
- [ ] 사주 계산 함수 구현
  - [ ] 연주(年柱) 추출 - 천간/지지
  - [ ] 월주(月柱) 추출 - 24절기 기준
  - [ ] 일주(日柱) 추출 - 천간/지지
  - [ ] 시주(時柱) 추출 - 천간/지지
- [ ] (옵션) 야자시/조자시 처리 로직 구현

### 2.2 테스트
- [ ] 실제 생년월일로 테스트
- [ ] console.log로 60갑자 정확성 검증
- [ ] 음력/양력 변환 검증
- [ ] 윤달 처리 검증

---

## Phase 3: UI 구현 (Frontend)

### 3.1 입력 폼 컴포넌트 개발
- [ ] `src/routes/+page.svelte` 메인 페이지 작성
- [ ] shadcn Card 컴포넌트로 레이아웃 구성
- [ ] 입력 필드 구현
  - [ ] 이름 입력 (Input)
  - [ ] 성별 선택 (RadioGroup)
  - [ ] 양력/음력 선택 (RadioGroup 또는 Select)
  - [ ] 윤달 체크박스
  - [ ] 생년월일 입력 (Date Picker 또는 Select)
  - [ ] 시간 입력 (시/분 Select)
  - [ ] '시간 모름' 체크박스
- [ ] 폼 유효성 검사 UI
- [ ] 제출 버튼

### 3.2 결과 화면 컴포넌트
- [ ] 로딩 상태 UI 구현
  - [ ] Skeleton UI 또는 스피너
  - [ ] 로딩 중 문구 랜덤화 ("하늘의 기운을 읽는 중...", "만세력을 펼치는 중...")
- [ ] Markdown 렌더링 라이브러리 설치
  ```bash
  npm i svelte-markdown
  ```
- [ ] 사주 팔자 표시 영역
- [ ] AI 해석 결과 표시 영역 (Markdown 렌더링)
- [ ] 스타일링 (TailwindCSS)

---

## Phase 4: 서버 액션 및 AI 연동 (Backend)

### 4.1 Server Action 구현
- [ ] `src/routes/+page.server.ts` 생성
- [ ] Form Data 수신 로직
- [ ] 입력값 유효성 검사 (zod 추천)
  ```bash
  npm install zod
  ```
- [ ] calculateSaju 함수 호출
- [ ] 사주 팔자 데이터 획득

### 4.2 Gemini API 연동
- [ ] GoogleGenerativeAI 인스턴스 생성
- [ ] 프롬프트 엔지니어링
  - [ ] 시스템 프롬프트 작성 (명리학자 페르소나)
  - [ ] 사주 정보 포맷팅
  - [ ] 출력 형식 지정 (Markdown 구조)
- [ ] API 호출 구현
  ```typescript
  // 모델: gemini-1.5-flash
  // 입력: 성별, 생년월일, 사주팔자 8글자
  // 출력: Markdown 형식의 해석 결과
  ```
- [ ] 응답 파싱 및 에러 처리

### 4.3 DB 저장 로직
- [ ] Drizzle `db.insert()` 구현
- [ ] 저장할 데이터:
  - [ ] 사용자 이름
  - [ ] 생년월일 (양력 기준 변환 값)
  - [ ] 사주 텍스트 (8글자)
  - [ ] AI 해석 결과 (Markdown)
  - [ ] 메타 정보 (성별, 음력여부, 원본 시간 등)
- [ ] 고유 ID 발급
- [ ] 프론트엔드로 결과 데이터 반환

---

## Phase 5: 마무리 및 최적화

### 5.1 예외 처리
- [ ] Gemini API 오류 처리
  - [ ] Rate limit 에러
  - [ ] Network 에러
  - [ ] 우회 메시지 또는 재시도 로직
- [ ] 입력값 오류 처리
  - [ ] 존재하지 않는 날짜
  - [ ] 잘못된 시간 범위
  - [ ] 필수 입력 누락
- [ ] DB 저장 실패 시 처리

### 5.2 UX 개선
- [ ] `use:enhance` 적용 (페이지 리로딩 방지)
- [ ] Progressive Enhancement
- [ ] 로딩 상태 피드백
- [ ] 에러 메시지 사용자 친화적으로 개선
- [ ] 결과 공유 기능 (옵션)
- [ ] 과거 조회 기록 보기 (옵션)

### 5.3 성능 최적화
- [ ] API 호출 캐싱 (동일한 사주는 재사용)
- [ ] DB 쿼리 최적화
- [ ] 번들 크기 최적화

### 5.4 배포
- [ ] 환경 변수 설정 확인
- [ ] Vercel 또는 선호 호스팅에 배포
- [ ] DB 연결 테스트
- [ ] Gemini API 동작 확인
- [ ] 프로덕션 테스트

---

## 추가 기능 (Optional)

### 관리자 모드
- [ ] 조회 기록 관리 페이지
- [ ] 통계 대시보드

### 공유 기능
- [ ] 고유 URL 생성
- [ ] 결과 페이지 공유

### 분석 개선
- [ ] 대운(大運) 분석 추가
- [ ] 세운(歲運) 분석 추가
- [ ] 신살(神煞) 분석 추가

---

## 프롬프트 템플릿 (Gemini API용)

```
역할: 당신은 30년 경력의 정통 명리학자이자 심리 상담가입니다.

입력 정보:
- 성별: {gender}
- 생년월일(양력): {birthDate}
- 사주팔자(Four Pillars):
  [년주: {yearPillar}]
  [월주: {monthPillar}]
  [일주: {dayPillar}]
  [시주: {timePillar}]

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
(현재 시점에서 명심해야 할 한 문장 포함)
```

---

## 개발 시작 전 체크

- [ ] Node.js 최신 LTS 버전 설치 확인
- [ ] PostgreSQL 접속 정보 확보
- [ ] Gemini API 키 발급
- [ ] Git 저장소 초기화
- [ ] `.env` 파일을 `.gitignore`에 추가

---

## 참고 자료

- SvelteKit 문서: https://kit.svelte.dev/
- shadcn-svelte: https://www.shadcn-svelte.com/
- Drizzle ORM: https://orm.drizzle.team/
- lunar-javascript: https://github.com/6tail/lunar-javascript
- Gemini API: https://ai.google.dev/

---

**개발 시작일**: _____________
**예상 완료일**: _____________
**개발자**: _____________

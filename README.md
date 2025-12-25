# 🔮 AI Saju Master

초등학생도 쉽게 이해하는 재미있는 AI 사주팔자 분석 서비스

## ✨ 주요 기능

### 1. 사주팔자 계산 및 분석
- ☀️ 양력/🌙 음력 입력 지원
- 정확한 만세력 계산 (lunar-javascript 라이브러리 활용)
- 년주/월주/일주/시주 자동 계산

### 2. AI 운세 분석
- Gemini 2.5 Flash Lite를 활용한 심층 분석
- 초등학생도 이해할 수 있는 쉬운 설명
- 구조화된 JSON 응답으로 섹션별 명확한 정보 제공:
  - 🌟 타고난 성격 (장점/주의할점/성격특징)
  - 💼 직업과 재물운 (어울리는 직업/돈 모으는 비법)
  - 💕 인간관계와 사랑 (연애스타일/이상형/친구사귀기 팁)
  - 🎊 2026년 신년 운세 (분기별 운세/행운의 숫자/조심할 시기)
  - 📜 인생 조언 (매일 실천할 습관/올해 목표)

### 3. 시각적 UI/UX
- 🎨 화려한 그라데이션과 컬러풀한 디자인
- ✨ 부드러운 애니메이션 효과 (bounce-in, slide-up, slide-in)
- 📱 반응형 디자인 (모바일/태블릿/데스크톱)
- 👦👧 이모지를 활용한 직관적 인터페이스

### 4. 공유 기능
- 📤 고유 URL 생성 (nanoid 10자리)
- 🔗 클립보드 복사 원클릭 공유
- 친구에게 쉽게 공유 가능

### 5. 히스토리 기록
- 📜 최근 10개 분석 결과 저장
- ⏰ 상대적 시간 표시 (N분 전, N시간 전, N일 전)
- 🔍 과거 분석 결과 재확인 가능

## 🛠 기술 스택

### Frontend
- **SvelteKit 2** - 최신 풀스택 프레임워크
- **Tailwind CSS v4** - 최신 유틸리티 CSS 프레임워크
- **shadcn-svelte** - 고품질 UI 컴포넌트
- **marked** - Markdown 렌더링 (fallback용)

### Backend
- **Drizzle ORM** - Type-safe PostgreSQL ORM
- **PostgreSQL** - 관계형 데이터베이스
- **SvelteKit Server Actions** - 서버사이드 폼 처리

### AI & 계산 로직
- **Gemini 2.5 Flash Lite** - Google AI 모델
- **lunar-javascript** - 정통 만세력 계산 라이브러리
- **nanoid** - 고유 ID 생성

## 📦 설치 및 실행

### 1. 패키지 설치
```bash
npm install
```

### 2. 환경 변수 설정
`.env` 파일에 다음 내용 추가:
```env
DATABASE_URL=postgresql://saju_master:PASSWORD@HOST:5432/saju
GEMINI_API_KEY=your_gemini_api_key
GEMINI_API_URL=https://aiplatform.googleapis.com/v1/publishers/google/models/gemini-2.5-flash-lite:generateContent
```

### 3. 데이터베이스 설정
PostgreSQL 서버에 postgres 사용자로 접속하여 권한 설정:
```bash
psql -h HOST -U postgres -d saju -f 001-db-permissions.sql
```

`001-db-permissions.sql` 스크립트가 자동으로:
- public 스키마 권한 부여
- saju_logs 테이블 생성
- 시퀀스 권한 설정
- 테이블 소유권 변경

### 4. 개발 서버 실행
```bash
npm run dev
```

브라우저에서 http://localhost:5173 접속

### 5. 프로덕션 빌드
```bash
npm run build
npm run preview
```

## 📁 프로젝트 구조

```
saju/
├── src/
│   ├── lib/
│   │   ├── components/ui/          # shadcn-svelte UI 컴포넌트
│   │   ├── server/
│   │   │   ├── db/
│   │   │   │   └── schema.ts       # Drizzle DB 스키마
│   │   │   ├── db.ts               # DB 연결
│   │   │   └── gemini.ts           # Gemini API 통합
│   │   └── saju.ts                 # 사주 계산 로직
│   └── routes/
│       ├── +page.svelte            # 메인 페이지 (입력 폼 + 결과)
│       ├── +page.server.ts         # 분석 Server Action
│       ├── share/[id]/             # 공유 페이지
│       │   ├── +page.svelte
│       │   └── +page.server.ts
│       └── history/                # 히스토리 페이지
│           ├── +page.svelte
│           └── +page.server.ts
├── drizzle/                        # DB 마이그레이션 파일
├── .env                            # 환경 변수
├── 001-db-permissions.sql          # DB 권한 설정 스크립트
├── PRD_CHECKLIST.md                # 개발 체크리스트
└── package.json
```

## 🎯 주요 파일 설명

### `/src/lib/saju.ts`
- 만세력 기반 사주팔자 계산
- 음력/양력 변환 (lunar-javascript)
- 천간/지지 매핑
- 시간대별 시주 계산

### `/src/lib/server/gemini.ts`
- Gemini API 호출 및 응답 처리
- JSON 파싱 및 정제 (sanitizeJsonString)
- 구조화된 프롬프트 템플릿
- 2026년 신년 운세 동적 생성

### `/src/routes/+page.svelte`
- 초등학생 친화적 입력 폼
- 성별/달력 종류 비주얼 선택
- 구조화된 AI 분석 결과 표시
- 그라데이션 카드 기반 레이아웃
- 공유 URL 복사 기능

### `/src/routes/+page.server.ts`
- 폼 데이터 검증
- 사주 계산 수행
- Gemini AI 분석 요청
- DB 저장 (에러 시 계속 진행)
- 공유 ID 생성

## 🎨 디자인 특징

### 컬러 팔레트
- **Purple-Pink-Blue 그라데이션**: 메인 브랜드 컬러
- **섹션별 색상 코딩**:
  - 🟡 성격 분석: Yellow-Orange
  - 🟢 직업/재물: Green-Teal
  - 🩷 인간관계: Pink-Rose
  - 🔵 2026 운세: Indigo-Purple
  - 🟣 인생조언: Purple-Indigo

### 애니메이션
- **bounce-in**: 헤더 등장 (scale + opacity)
- **slide-up**: 카드 슬라이드 상승
- **slide-in**: 리스트 항목 순차 등장
- **hover effects**: 사주팔자 카드 확대 (scale-110)

## 🔧 개발 스크립트

```bash
# 개발 서버 실행
npm run dev

# TypeScript 타입 체크
npm run check

# 타입 체크 (watch 모드)
npm run check:watch

# 프로덕션 빌드
npm run build

# 프로덕션 미리보기
npm run preview

# DB 마이그레이션 생성
npm run db:generate

# DB 마이그레이션 실행
npm run db:migrate

# DB 스키마 푸시 (개발용)
npm run db:push

# Drizzle Studio 실행 (DB GUI)
npm run db:studio
```

## 📊 데이터베이스 스키마

### `saju_logs` 테이블
```sql
CREATE TABLE saju_logs (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  birth_date TIMESTAMP WITH TIME ZONE NOT NULL,
  saju_text TEXT NOT NULL,
  ai_result TEXT NOT NULL,
  meta JSONB NOT NULL,  -- { gender, isLunar, shareId, originalInput, ... }
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
```

## ⚙️ 환경 변수

| 변수 | 설명 | 필수 |
|------|------|------|
| `DATABASE_URL` | PostgreSQL 연결 문자열 | ✅ |
| `GEMINI_API_KEY` | Google Gemini API 키 | ✅ |
| `GEMINI_API_URL` | Gemini API 엔드포인트 | ⚠️ (기본값 있음) |

## 🚀 배포 가이드

### Vercel 배포
1. GitHub 저장소 연결
2. 환경 변수 설정
3. PostgreSQL 인스턴스 연결 (Vercel Postgres 또는 외부)
4. 자동 배포

### Docker 배포
```dockerfile
# Dockerfile 예시
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", "build"]
```

## 🐛 알려진 이슈 및 해결

### 1. DB 권한 오류
**증상**: `permission denied for schema public`

**해결**: `001-db-permissions.sql` 실행
```bash
psql -h HOST -U postgres -d saju -f 001-db-permissions.sql
```

### 2. Tailwind CSS 클래스 미적용
**증상**: 스타일이 적용되지 않음

**해결**: Tailwind v4 설정 확인
- `postcss.config.js`에 `@tailwindcss/postcss` 사용
- `app.css`에 `@import "tailwindcss"` 추가

### 3. Gemini API 타임아웃
**증상**: 10분 후 응답 없음

**해결**: `src/lib/server/gemini.ts`에서 timeout 조정
```typescript
timeout: 10 * 60 * 1000 // 기본 10분
```

## 📝 라이센스

이 프로젝트는 교육 및 개인 사용 목적으로 제작되었습니다.

## 🙏 크레딧

- **lunar-javascript**: 정통 만세력 계산
- **Gemini AI**: Google의 생성형 AI 모델
- **shadcn-svelte**: 고품질 UI 컴포넌트 라이브러리
- **SvelteKit**: Meta-framework
- **Tailwind CSS**: 유틸리티 CSS 프레임워크

---

**🤖 Powered by Gemini 2.5 Flash AI**

Made with ❤️ for 초등학생들

# 접속방법
```
http://localhost:5173/admin/login
admin1234
```# saju

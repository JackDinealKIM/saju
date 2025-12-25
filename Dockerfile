# 빌드 스테이지
FROM node:20-alpine AS builder

WORKDIR /app

# 빌드 시 필요한 ARG 선언
ARG DATABASE_URL
ARG GEMINI_API_KEY
ARG GEMINI_API_URL

# ARG를 ENV로 변환하여 빌드 시 사용
ENV DATABASE_URL=${DATABASE_URL}
ENV GEMINI_API_KEY=${GEMINI_API_KEY}
ENV GEMINI_API_URL=${GEMINI_API_URL}

# 패키지 파일 복사 및 의존성 설치
COPY package*.json ./
RUN npm ci

# 소스 코드 복사
COPY . .

# SvelteKit 빌드
RUN npm run build

# 프로덕션 스테이지
FROM node:20-alpine

WORKDIR /app

# 빌드된 파일 복사
COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json

# 프로덕션 의존성만 설치
RUN npm ci --omit=dev

# 포트 노출
EXPOSE 3000

# 환경 변수 설정
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# 애플리케이션 실행
CMD ["node", "build"]

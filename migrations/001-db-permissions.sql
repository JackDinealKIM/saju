-- DB 권한 수정 스크립트
-- postgres 사용자로 실행해야 합니다
-- 실행 방법: psql -h 192.168.3.100 -U postgres -d saju -f 001-db-permissions.sql


-- 테이블 생성
CREATE TABLE IF NOT EXISTS saju_logs (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  birth_date TIMESTAMP WITH TIME ZONE NOT NULL,
  saju_text TEXT NOT NULL,
  ai_result TEXT NOT NULL,
  meta JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);


CREATE TABLE "saju_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"birth_date" timestamp with time zone NOT NULL,
	"saju_text" text NOT NULL,
	"ai_result" text NOT NULL,
	"meta" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

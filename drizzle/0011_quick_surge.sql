ALTER TABLE "exam_attempts" RENAME COLUMN "created_at" TO "started_at";--> statement-breakpoint
ALTER TABLE "exam_attempts" ALTER COLUMN "score" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "exam_attempts" ALTER COLUMN "approved" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "exam_attempts" ADD COLUMN "finished_at" timestamp with time zone;
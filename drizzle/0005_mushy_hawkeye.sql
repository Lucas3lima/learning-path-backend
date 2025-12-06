ALTER TABLE "journeys" DROP CONSTRAINT "journeys_slug_unique";--> statement-breakpoint
ALTER TABLE "lessons" DROP CONSTRAINT "lessons_slug_unique";--> statement-breakpoint
ALTER TABLE "modules" ALTER COLUMN "order" SET NOT NULL;
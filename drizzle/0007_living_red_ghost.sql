CREATE TYPE "public"."module_content_type" AS ENUM('lesson', 'exam');--> statement-breakpoint
CREATE TABLE "exams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"moduleId" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "module_contents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"moduleId" uuid NOT NULL,
	"type" "module_content_type" NOT NULL,
	"order" integer NOT NULL,
	"lessonId" uuid,
	"examId" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "exams" ADD CONSTRAINT "exams_moduleId_modules_id_fk" FOREIGN KEY ("moduleId") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "module_contents" ADD CONSTRAINT "module_contents_moduleId_modules_id_fk" FOREIGN KEY ("moduleId") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "module_contents" ADD CONSTRAINT "module_contents_lessonId_lessons_id_fk" FOREIGN KEY ("lessonId") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "module_contents" ADD CONSTRAINT "module_contents_examId_exams_id_fk" FOREIGN KEY ("examId") REFERENCES "public"."exams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "exams_moduleId_slug_index" ON "exams" USING btree ("moduleId","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "module_contents_moduleId_order_index" ON "module_contents" USING btree ("moduleId","order");
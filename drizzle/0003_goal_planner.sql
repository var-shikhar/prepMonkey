CREATE TABLE "goal_plan" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"subjects" jsonb NOT NULL,
	"availability" jsonb NOT NULL,
	"start_date" date NOT NULL,
	"target_date" date NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"paused_at" timestamp with time zone,
	"paused_until" date,
	"auto_paused" boolean DEFAULT false NOT NULL,
	"notice" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "goal_task" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" text NOT NULL,
	"day" date NOT NULL,
	"position" integer NOT NULL,
	"kind" text NOT NULL,
	"exam_id" text NOT NULL,
	"skill_id" text,
	"count" integer,
	"role" integer,
	"minutes" integer NOT NULL,
	"label" text NOT NULL,
	"detail" text NOT NULL,
	"priority" real DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"done_at" timestamp with time zone,
	"attempt_id" text,
	"carried" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "goal_plan" ADD CONSTRAINT "goal_plan_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goal_task" ADD CONSTRAINT "goal_task_plan_id_goal_plan_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."goal_plan"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "goal_plan_user_id_status_index" ON "goal_plan" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "goal_task_plan_id_day_index" ON "goal_task" USING btree ("plan_id","day");
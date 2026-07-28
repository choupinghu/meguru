CREATE TYPE "public"."condition" AS ENUM('bnib', 'boxed-notag', 'nobox-tag', 'nobox-notag');--> statement-breakpoint
CREATE TYPE "public"."rarity" AS ENUM('common', 'uncommon', 'rare', 'grail');--> statement-breakpoint
CREATE TYPE "public"."region" AS ENUM('hokkaido', 'tohoku', 'kanto', 'chubu', 'kinki', 'chugoku', 'shikoku', 'kyushu-okinawa', 'collab');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('available', 'reserved', 'sold', 'keepsake');--> statement-breakpoint
CREATE TABLE "charms" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"name_ja" text,
	"is_collab" boolean DEFAULT false NOT NULL,
	"prefecture_code" integer,
	"region" "region" NOT NULL,
	"city" text,
	"brand" text,
	"condition" "condition" NOT NULL,
	"rarity" "rarity" NOT NULL,
	"status" "status" NOT NULL,
	"price_sgd" integer,
	"special" boolean DEFAULT false NOT NULL,
	"note" text,
	"image_url" text,
	"tags" text[],
	"created_at" timestamp with time zone DEFAULT now()
);

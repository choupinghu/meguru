-- Hand-written migration (spec 0005): split the single `charms` table into
-- `designs` (identity: name, prefecture, motif, rarity -- true of every
-- copy) and `items` (shelf state: condition, status, price -- true of one
-- physical copy), with items.design_id -> designs.id.
--
-- `drizzle-kit generate` can only diff table *shapes*, not infer a split of
-- one table into two. Left alone it produces: CREATE designs, CREATE items,
-- then immediately DROP TABLE charms -- discarding all 30 rows before a
-- single one is copied across. This file replaces that generated body with
-- the same CREATE TABLE / ADD CONSTRAINT statements (unchanged), but with
-- the copy ordered safely in between:
--   1. create both new tables (and, once items exists, its FK);
--   2. copy every charms row's design-shaped columns into designs,
--      preserving charms.id as designs.id -- the simplest way for step 3 to
--      join each item back to the design it came from;
--   3. copy every charms row's item-shaped columns into items, with
--      design_id set to that same preserved id;
--   4. assert the copy is 1:1 (today: 30 charms -> 30 designs, 30 items)
--      before it's safe to;
--   5. drop the old table.
--
-- `motif` used to live at `charms.tags[1]` (Postgres arrays are 1-indexed;
-- `tags[0]` in the old TS types) -- it becomes a proper `designs.motif`
-- column here, and the array is left behind with `charms`.

CREATE TABLE "designs" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"name_ja" text,
	"is_collab" boolean DEFAULT false NOT NULL,
	"brand" text,
	"prefecture_code" integer,
	"region" "region" NOT NULL,
	"city" text,
	"motif" text,
	"rarity" "rarity" NOT NULL,
	"special" boolean DEFAULT false NOT NULL,
	"story" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "items" (
	"id" serial PRIMARY KEY NOT NULL,
	"design_id" integer NOT NULL,
	"condition" "condition" NOT NULL,
	"status" "status" NOT NULL,
	"price_sgd" integer,
	"note" text,
	"image_url" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_design_id_designs_id_fk" FOREIGN KEY ("design_id") REFERENCES "public"."designs"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint

-- 1 of 2: design-shaped columns, preserving charms.id as designs.id.
INSERT INTO "designs" ("id", "name", "name_ja", "is_collab", "brand", "prefecture_code", "region", "city", "motif", "rarity", "special", "created_at")
SELECT "id", "name", "name_ja", "is_collab", "brand", "prefecture_code", "region", "city", "tags"[1], "rarity", "special", "created_at"
FROM "charms";
--> statement-breakpoint

-- Explicit ids were just inserted above; move the identity sequence past
-- them so the next (non-migration) insert into designs doesn't collide.
SELECT setval(pg_get_serial_sequence('public.designs', 'id'), COALESCE((SELECT MAX("id") FROM "designs"), 1), true);
--> statement-breakpoint

-- 2 of 2: item-shaped columns -- one item per charm, design_id pointing at
-- the design that kept its charms.id.
INSERT INTO "items" ("design_id", "condition", "status", "price_sgd", "note", "image_url", "created_at")
SELECT "id", "condition", "status", "price_sgd", "note", "image_url", "created_at"
FROM "charms";
--> statement-breakpoint

-- Assert the copy is 1:1 before it's safe to drop the source table.
-- Expected today: 30 charms rows -> 30 designs, 30 items.
DO $$
DECLARE
	charms_count integer;
	designs_count integer;
	items_count integer;
BEGIN
	SELECT COUNT(*) INTO charms_count FROM "charms";
	SELECT COUNT(*) INTO designs_count FROM "designs";
	SELECT COUNT(*) INTO items_count FROM "items";
	IF designs_count <> charms_count THEN
		RAISE EXCEPTION 'designs count (%) does not match charms count (%)', designs_count, charms_count;
	END IF;
	IF items_count <> charms_count THEN
		RAISE EXCEPTION 'items count (%) does not match charms count (%)', items_count, charms_count;
	END IF;
END $$;
--> statement-breakpoint

-- Only now that designs/items hold a verified 1:1 copy of charms is it safe
-- to drop the old table.
DROP TABLE "charms";

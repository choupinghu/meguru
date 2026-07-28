-- Split the `kyushu-okinawa` region into `kyushu` and `okinawa`.
--
-- drizzle-kit generates the enum swap (to text, drop type, recreate, cast back)
-- but cannot know how to remap existing rows: every current Kyushu/Okinawa charm
-- holds 'kyushu-okinawa', which is absent from the new enum, so the cast back
-- would fail. The two UPDATEs below are added by hand and must run while the
-- column is still text -- Okinawa first, so it is not swept into 'kyushu'.

ALTER TABLE "charms" ALTER COLUMN "region" SET DATA TYPE text;--> statement-breakpoint

UPDATE "charms" SET "region" = 'okinawa'
  WHERE "region" = 'kyushu-okinawa' AND "prefecture_code" = 47;--> statement-breakpoint

UPDATE "charms" SET "region" = 'kyushu'
  WHERE "region" = 'kyushu-okinawa';--> statement-breakpoint

DROP TYPE "public"."region";--> statement-breakpoint
CREATE TYPE "public"."region" AS ENUM('hokkaido', 'tohoku', 'kanto', 'chubu', 'kinki', 'chugoku', 'shikoku', 'kyushu', 'okinawa', 'collab');--> statement-breakpoint
ALTER TABLE "charms" ALTER COLUMN "region" SET DATA TYPE "public"."region" USING "region"::"public"."region";

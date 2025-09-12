-- DropIndex
DROP INDEX "public"."MusicFile_orderId_key";

-- AlterTable
ALTER TABLE "public"."MusicFile" ADD COLUMN     "filename" TEXT,
ADD COLUMN     "title" TEXT;

-- AlterTable
ALTER TABLE "masters" ALTER COLUMN "start_time" SET DATA TYPE TEXT,
ALTER COLUMN "end_time" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "is_banned" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "services" (
    "id" SERIAL NOT NULL,
    "service_name" TEXT,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

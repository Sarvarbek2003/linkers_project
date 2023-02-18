/*
  Warnings:

  - You are about to drop the column `first_name` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `is_admin` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `is_customer` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `phone_number` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `steep` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the `services` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "orders" DROP COLUMN "first_name",
DROP COLUMN "is_admin",
DROP COLUMN "is_customer",
DROP COLUMN "phone_number",
DROP COLUMN "steep",
DROP COLUMN "user_id",
ADD COLUMN     "customer_id" INTEGER,
ADD COLUMN     "master_id" INTEGER,
ADD COLUMN     "rating" INTEGER,
ADD COLUMN     "status" TEXT,
ADD COLUMN     "time" BIGINT;

-- DropTable
DROP TABLE "services";

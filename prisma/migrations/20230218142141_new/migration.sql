/*
  Warnings:

  - The `ban_expiration_time` column on the `masters` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `first_name` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `is_admin` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `is_customer` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `phone_number` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `steep` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `orders` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "masters" ALTER COLUMN "start_time" SET DATA TYPE TEXT,
ALTER COLUMN "end_time" SET DATA TYPE TEXT,
DROP COLUMN "ban_expiration_time",
ADD COLUMN     "ban_expiration_time" BIGINT;

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

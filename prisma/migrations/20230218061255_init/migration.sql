-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "user_id" BIGINT,
    "first_name" TEXT,
    "steep" JSONB,
    "phone_number" TEXT,
    "is_customer" BOOLEAN NOT NULL DEFAULT true,
    "is_admin" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "masters" (
    "id" SERIAL NOT NULL,
    "user_id" BIGINT,
    "name" TEXT,
    "phone_number" TEXT,
    "service_id" INTEGER,
    "workshop_name" TEXT,
    "address" TEXT,
    "landmark" TEXT,
    "longtitude" TEXT,
    "latitude" TEXT,
    "start_time" TIMESTAMP(3),
    "end_time" TIMESTAMP(3),
    "time_per_cutomer" TEXT,
    "rating_count" INTEGER,
    "rating" INTEGER,
    "is_banned" BOOLEAN NOT NULL DEFAULT false,
    "ban_expiration_time" TIMESTAMP(3),
    "is_verified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "masters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" SERIAL NOT NULL,
    "user_id" BIGINT,
    "first_name" TEXT,
    "steep" JSONB,
    "phone_number" TEXT,
    "is_customer" BOOLEAN,
    "is_admin" BOOLEAN,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" SERIAL NOT NULL,
    "service_name" TEXT,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

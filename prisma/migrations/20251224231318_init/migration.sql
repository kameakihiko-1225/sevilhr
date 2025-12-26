-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('PARTIAL', 'FULL', 'RETURNING', 'ACCEPTED', 'REJECTED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "telegram_id" TEXT,
    "telegram_username" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "company_type" TEXT,
    "role_in_company" TEXT,
    "interests" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "company_description" TEXT,
    "annual_turnover" TEXT,
    "number_of_employees" TEXT,
    "full_name" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "company_name" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'PARTIAL',
    "accepted_by" TEXT,
    "rejected_by" TEXT,
    "rejection_reason" TEXT,
    "telegram_message_id" TEXT,
    "telegram_chat_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_number_key" ON "users"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "users_telegram_id_key" ON "users"("telegram_id");

-- CreateIndex
CREATE INDEX "users_phone_number_idx" ON "users"("phone_number");

-- CreateIndex
CREATE INDEX "users_telegram_id_idx" ON "users"("telegram_id");

-- CreateIndex
CREATE INDEX "leads_phone_number_idx" ON "leads"("phone_number");

-- CreateIndex
CREATE INDEX "leads_user_id_idx" ON "leads"("user_id");

-- CreateIndex
CREATE INDEX "leads_status_idx" ON "leads"("status");

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

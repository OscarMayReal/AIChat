/*
  Warnings:

  - Added the required column `ownerId` to the `Prompt` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Prompt" ADD COLUMN     "organizationId" TEXT,
ADD COLUMN     "ownerId" TEXT NOT NULL;

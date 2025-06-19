/*
  Warnings:

  - You are about to drop the column `projectId` on the `Agent` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Agent" DROP COLUMN "projectId",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "organizationPublic" BOOLEAN NOT NULL DEFAULT false;

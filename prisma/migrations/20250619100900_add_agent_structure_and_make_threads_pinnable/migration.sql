-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "agentId" TEXT;

-- AlterTable
ALTER TABLE "Thread" ADD COLUMN     "agentId" TEXT,
ADD COLUMN     "pinned" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "organizationId" TEXT,
    "projectId" TEXT,
    "systemPrompt" TEXT NOT NULL,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Thread" ADD CONSTRAINT "Thread_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "ComplianceDocumentType" AS ENUM ('CERTIFICATE_OF_INCORPORATION', 'TAX_IDENTIFICATION', 'VAT_REGISTRATION', 'BUSINESS_OPERATING_PERMIT', 'BENEFICIAL_OWNERSHIP', 'SOCIAL_SECURITY_REGISTRATION', 'IMPORT_EXPORT_LICENSE', 'FOOD_DRUG_AUTHORITY_APPROVAL', 'ENVIRONMENTAL_PERMIT', 'INSURANCE_CERTIFICATE', 'BANK_REFERENCE', 'BUSINESS_LICENSE', 'SAFETY_CERTIFICATE', 'OTHER');

-- CreateEnum
CREATE TYPE "ComplianceDocumentStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateTable
CREATE TABLE "ComplianceDocument" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" "ComplianceDocumentType" NOT NULL,
    "status" "ComplianceDocumentStatus" NOT NULL DEFAULT 'SUBMITTED',
    "title" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "notes" TEXT,
    "issuedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComplianceDocument_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ComplianceDocument" ADD CONSTRAINT "ComplianceDocument_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

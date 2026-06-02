import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

const now = new Date();

const tiers = ["UNVERIFIED", "INDIVIDUAL", "BUSINESS", "ENHANCED"] as const;
const roles = ["seller", "buyer", "worker", "hirer", "platform"] as const;

function subjectId(tier: string, index: number): string {
  return `sandbox_${tier.toLowerCase()}_${String(index).padStart(2, "0")}`;
}

function hashApiKey(rawApiKey: string): string {
  return crypto.createHash("sha256").update(rawApiKey).digest("hex");
}

const sandboxApiKey = process.env.TRUSTLAYER_SANDBOX_API_KEY ?? "tl_test_sandbox_seed_key_do_not_use_in_production";

function scoreForTier(tier: string, index: number): number {
  if (tier === "UNVERIFIED") return 15 + (index % 10);
  if (tier === "INDIVIDUAL") return 45 + (index % 15);
  if (tier === "BUSINESS") return 65 + (index % 15);
  return 85 + (index % 10);
}

function tierCeiling(tier: string): number {
  if (tier === "INDIVIDUAL") return 65;
  if (tier === "BUSINESS") return 85;
  if (tier === "ENHANCED") return 100;
  return 30;
}

async function main() {
  console.log("Seeding TrustLayer sandbox data...");

  const organization = await prisma.organization.upsert({
    where: { slug: "sandbox-integrator" },
    update: {},
    create: {
      name: "Sandbox Integrator",
      slug: "sandbox-integrator"
    }
  });

  const user = await prisma.user.upsert({
    where: { email: "sandbox@trustlayer.local" },
    update: {},
    create: {
      email: "sandbox@trustlayer.local",
      name: "Sandbox Admin",
      role: "ADMIN"
    }
  });

  await prisma.membership.upsert({
    where: {
      organizationId_userId: {
        organizationId: organization.id,
        userId: user.id
      }
    },
    update: { role: "OWNER" },
    create: {
      organizationId: organization.id,
      userId: user.id,
      role: "OWNER"
    }
  });

  const plan = await prisma.subscriptionPlan.upsert({
    where: { slug: "sandbox" },
    update: {
      includesTrustScore: true,
      includesBadge: true,
      includesApiAccess: true,
      isActive: true
    },
    create: {
      name: "Sandbox",
      slug: "sandbox",
      description: "Sandbox plan for demo integrations.",
      priceCents: 0,
      currency: "GHS",
      interval: "MONTHLY",
      includesTrustScore: true,
      includesBadge: true,
      includesApiAccess: true
    }
  });

  await prisma.subscription.upsert({
    where: { organizationId: organization.id },
    update: {
      planId: plan.id,
      status: "ACTIVE"
    },
    create: {
      organizationId: organization.id,
      planId: plan.id,
      status: "ACTIVE",
      provider: "MANUAL",
      currentPeriodStart: now
    }
  });

  const platform = await prisma.platform.upsert({
    where: { slug: "sandbox-marketplace" },
    update: {
      organizationId: organization.id,
      userId: user.id,
      isActive: true
    },
    create: {
      organizationId: organization.id,
      userId: user.id,
      name: "Sandbox Marketplace",
      slug: "sandbox-marketplace",
      description: "Demo marketplace for TrustLayer sandbox data.",
      contactEmail: "sandbox@trustlayer.local",
      environment: "TEST",
      planTier: "SANDBOX",
      apiScopes: [
        "api:access",
        "tier:read",
        "verification:write",
        "score:read",
        "leaderboard:read"
      ]
    }
  });

  await prisma.apiKey.upsert({
    where: {
      keyHash: hashApiKey(sandboxApiKey)
    },
    update: {
      platformId: platform.id,
      keyPrefix: sandboxApiKey.slice(0, 12),
      scopes: [
        "api:access",
        "tier:read",
        "verification:write",
        "score:read",
        "leaderboard:read"
      ],
      environment: "TEST",
      revokedAt: null,
      expiresAt: null
    },
    create: {
      platformId: platform.id,
      keyPrefix: sandboxApiKey.slice(0, 12),
      keyHash: hashApiKey(sandboxApiKey),
      scopes: [
        "api:access",
        "tier:read",
        "verification:write",
        "score:read",
        "leaderboard:read"
      ],
      environment: "TEST"
    }
  });

  console.log(`Sandbox API key prefix: ${sandboxApiKey.slice(0, 12)}`);
  console.log("Set TRUSTLAYER_SANDBOX_API_KEY to override the default sandbox key.");

  const subjects: string[] = [];

  for (const tier of tiers) {
    for (let i = 1; i <= 10; i += 1) {
      const id = subjectId(tier, i);
      subjects.push(id);

      const subject = await prisma.subject.upsert({
        where: { id },
        update: {
          verificationTier: tier,
          tierUpdatedAt: tier === "UNVERIFIED" ? null : now
        },
        create: {
          id,
          type: tier === "BUSINESS" ? "BUSINESS" : "INDIVIDUAL",
          externalId: id,
          country: "GH",
          verificationTier: tier,
          tierUpdatedAt: tier === "UNVERIFIED" ? null : now
        }
      });

      await prisma.verificationSession.create({
        data: {
          subjectId: subject.id,
          method: tier === "BUSINESS" ? "BUSINESS_ORC" : "GHANA_CARD",
          status: tier === "UNVERIFIED" ? "FAILED" : "VERIFIED",
          tierBefore: "UNVERIFIED",
          tierAfter: tier,
          completedAt: tier === "UNVERIFIED" ? null : now,
          registryResponse: {
            sandbox: true,
            sharedPhoneGroup: i <= 3 ? "shared_phone_cluster_a" : null
          }
        }
      });

      for (const role of roles) {
        const score = Math.min(scoreForTier(tier, i), tierCeiling(tier));

        const trustScore = await prisma.trustScore.upsert({
          where: {
            subjectId_role: {
              subjectId: subject.id,
              role
            }
          },
          update: {
            score,
            tierCeiling: tierCeiling(tier),
            confidence: tier === "UNVERIFIED" ? 0.25 : 0.9,
            factorIdentity: tier === "UNVERIFIED" ? 10 : 100,
            factorTransactions: 60,
            factorReviews: 70,
            factorDisputes: i % 4 === 0 ? 60 : 90,
            factorRoleSpecific: 70
          },
          create: {
            subjectId: subject.id,
            role,
            score,
            tierCeiling: tierCeiling(tier),
            confidence: tier === "UNVERIFIED" ? 0.25 : 0.9,
            factorIdentity: tier === "UNVERIFIED" ? 10 : 100,
            factorTransactions: 60,
            factorReviews: 70,
            factorDisputes: i % 4 === 0 ? 60 : 90,
            factorRoleSpecific: 70
          }
        });

        await prisma.scoreHistory.create({
          data: {
            trustScoreId: trustScore.id,
            subjectId: subject.id,
            role,
            score,
            tierCeiling: tierCeiling(tier),
            confidence: tier === "UNVERIFIED" ? 0.25 : 0.9,
            factors: {
              identity: tier === "UNVERIFIED" ? 10 : 100,
              transactions: 60,
              reviews: 70,
              disputes: i % 4 === 0 ? 60 : 90,
              roleSpecific: 70
            },
            reason: "sandbox.seed"
          }
        });
      }

      if (tier === "UNVERIFIED" || i % 9 === 0) {
        await prisma.fraudAlert.create({
          data: {
            subjectId: subject.id,
            severity: tier === "UNVERIFIED" ? "MEDIUM" : "HIGH",
            status: "OPEN",
            reason: "Sandbox risk profile",
            source: "sandbox_seed",
            metadata: {
              tier,
              index: i
            }
          }
        });
      }
    }
  }

  for (let i = 0; i < subjects.length - 1; i += 2) {
    const sellerSubjectId = subjects[i];
    const buyerSubjectId = subjects[i + 1];

    await prisma.transaction.create({
      data: {
        sellerSubjectId,
        buyerSubjectId,
        sellerRole: "seller",
        buyerRole: "buyer",
        amountCents: 1000 + i * 250,
        currency: "GHS",
        status: "COMPLETED",
        metadata: { sandbox: true }
      }
    });

    await prisma.review.create({
      data: {
        reviewerSubjectId: buyerSubjectId,
        revieweeSubjectId: sellerSubjectId,
        reviewerRole: "buyer",
        revieweeRole: "seller",
        rating: i % 6 === 0 ? 3 : 5,
        comment: "Sandbox review",
        metadata: { sandbox: true }
      }
    });
  }

  // Slice 15: escrow hold, completed release, resolved dispute
  const buyerSubjectId = subjects[0];
  const sellerSubjectId = subjects[2];

  await prisma.escrowHold.upsert({
    where: { reference: "sandbox-escrow-held-001" },
    update: { status: "HELD" },
    create: {
      buyerSubjectId,
      sellerSubjectId,
      amountCents: 25000,
      currency: "GHS",
      status: "HELD",
      reference: "sandbox-escrow-held-001",
      metadata: { sandbox: true, description: "SafeDeal demo hold" }
    }
  });

  await prisma.escrowHold.upsert({
    where: { reference: "sandbox-escrow-released-001" },
    update: { status: "RELEASED", releasedAt: now },
    create: {
      buyerSubjectId: subjects[4],
      sellerSubjectId: subjects[6],
      amountCents: 15000,
      currency: "GHS",
      status: "RELEASED",
      reference: "sandbox-escrow-released-001",
      releasedAt: now,
      metadata: { sandbox: true, description: "Completed SafeDeal release" }
    }
  });

  await prisma.dispute.create({
    data: {
      filerSubjectId: buyerSubjectId,
      respondentSubjectId: sellerSubjectId,
      filerRole: "buyer",
      respondentRole: "seller",
      status: "RESOLVED",
      faultParty: "seller",
      reason: "Item not delivered as described",
      resolution: "Full refund issued to buyer",
      metadata: { sandbox: true, resolvedAt: now.toISOString() }
    }
  });

  console.log(`Seeded ${subjects.length} subjects across ${tiers.length} tiers.`);
  console.log("Seeded 1 escrow hold, 1 released escrow, 1 resolved dispute.");
  console.log("Sandbox seed complete.");
}

main()
  .catch((error) => {
    console.error("Sandbox seed failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

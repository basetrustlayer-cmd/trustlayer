import type { Integrator } from "../domain";

export const mockIntegrators: Integrator[] = [
  {
    id: "integrator_001",
    organizationName: "Trust Commerce Marketplace",
    status: "TRIAL",
    trialEndsAt: "2026-06-24T00:00:00.000Z",
    createdAt: "2026-06-10T00:00:00.000Z"
  },
  {
    id: "integrator_002",
    organizationName: "Pan-African Logistics Network",
    status: "ACTIVE",
    trialEndsAt: null,
    createdAt: "2026-05-01T00:00:00.000Z"
  }
];

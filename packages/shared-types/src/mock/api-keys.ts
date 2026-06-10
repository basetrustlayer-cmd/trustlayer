import type { ApiKey } from "../domain";

export const mockApiKeys: ApiKey[] = [
  {
    id: "key_001",
    name: "Sandbox Key",
    lastUsedAt: "2026-06-10T10:30:00.000Z",
    createdAt: "2026-06-01T00:00:00.000Z",
    expiresAt: null
  },
  {
    id: "key_002",
    name: "Production Key",
    lastUsedAt: "2026-06-10T11:15:00.000Z",
    createdAt: "2026-06-05T00:00:00.000Z",
    expiresAt: null
  }
];

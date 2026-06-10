import { mockIntegrators } from "../mock";
import type { Integrator } from "../domain";

export function listIntegrators(): Integrator[] {
  return mockIntegrators;
}

export function getIntegratorById(
  id: string
): Integrator | null {
  return (
    mockIntegrators.find(
      (integrator) => integrator.id === id
    ) ?? null
  );
}

export function listTrialIntegrators(): Integrator[] {
  return mockIntegrators.filter(
    (integrator) => integrator.status === "TRIAL"
  );
}

export function listActiveIntegrators(): Integrator[] {
  return mockIntegrators.filter(
    (integrator) => integrator.status === "ACTIVE"
  );
}

import { withRetry } from "./retry.js";

export interface TrustLayerClientOptions {
  apiKey: string;
  baseUrl?: string;
  timeoutMs?: number;
}

export interface TrustScoreResponse {
  subjectId: string;
  score: number;
  tier: string;
  consumerTier: "UNVERIFIED" | "BASIC" | "VERIFIED" | "ENHANCED";
  verificationTier: "UNVERIFIED" | "INDIVIDUAL" | "BUSINESS" | "ENHANCED";
  lastCalculatedAt: string;
}

export interface VerifyGhanaCardResponse {
  subjectId: string;
  verificationSessionId: string;
  status: "OTP_SENT";
}

export interface ConfirmOtpResponse {
  subjectId: string;
  verificationTier: string;
  consumerTier: string;
  score: number;
}

export interface SafeDealIntentResponse {
  intentId: string;
  status: string;
  escrowHoldId: string;
}

export interface DisputeResponse {
  disputeId: string;
  status: string;
}

export class TrustLayerClient {
  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;

  constructor(options: TrustLayerClientOptions) {
    this.baseUrl = options.baseUrl ?? "https://api.trustlayer.africa";
    this.headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${options.apiKey}`,
    };
  }

  private newCorrelationId(): string {
    return `tl-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const correlationId = this.newCorrelationId();
    return withRetry(async () => {
      const res = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: {
          ...this.headers,
          "X-Correlation-Id": correlationId,
          ...(method !== "GET" && {
            "X-Idempotency-Key": `${correlationId}-${method}-${path}`
          })
        },
        body: body ? JSON.stringify(body) : undefined
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: res.statusText }));
        throw Object.assign(new Error(error.error ?? "Request failed"), {
          status: res.status,
          body: error
        });
      }
      return res.json() as Promise<T>;
    });
  }

  async verifyGhanaCard(
    subjectId: string,
    ghanaCardNumber: string
  ): Promise<VerifyGhanaCardResponse> {
    return this.request("POST", "/v1/verify/initiate", {
      subjectId,
      ghanaCardNumber
    });
  }

  async confirmOtp(
    subjectId: string,
    verificationSessionId: string,
    otpCode: string
  ): Promise<ConfirmOtpResponse> {
    return this.request("POST", "/v1/verify/confirm", {
      subjectId,
      verificationSessionId,
      otpCode
    });
  }

  async getTrustScore(subjectId: string): Promise<TrustScoreResponse> {
    return this.request("GET", `/v1/score/${subjectId}`);
  }

  async getTier(
    subjectId: string
  ): Promise<Pick<TrustScoreResponse, "subjectId" | "consumerTier" | "verificationTier">> {
    const score = await this.getTrustScore(subjectId);
    return {
      subjectId: score.subjectId,
      consumerTier: score.consumerTier,
      verificationTier: score.verificationTier
    };
  }

  async createSafeDealIntent(params: {
    buyerSubjectId: string;
    sellerSubjectId: string;
    amountGhs: number;
    description: string;
    idempotencyKey: string;
  }): Promise<SafeDealIntentResponse> {
    return this.request("POST", "/v1/escrow/intent", params);
  }

  async confirmSafeDeal(intentId: string): Promise<SafeDealIntentResponse> {
    return this.request("POST", `/v1/escrow/intent/${intentId}/confirm`);
  }

  async openSafeDealDispute(
    escrowHoldId: string,
    reason: string
  ): Promise<DisputeResponse> {
    return this.request("POST", "/v1/disputes", { escrowHoldId, reason });
  }

  async resolveDispute(
    disputeId: string,
    resolution: "BUYER" | "SELLER" | "SPLIT"
  ): Promise<DisputeResponse> {
    return this.request("POST", `/v1/disputes/${disputeId}/resolve`, {
      resolution
    });
  }
}

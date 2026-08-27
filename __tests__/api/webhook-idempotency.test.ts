/**
 * Tests for POST /api/webhooks/lemonsqueezy
 *
 * Validates HMAC signature verification, idempotency protection,
 * and proper error status codes for provider retry behavior.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "node:crypto";

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockQuery = vi.fn();
const mockConnect = vi.fn();
const mockClientQuery = vi.fn();
const mockClientRelease = vi.fn();

const mockPool = {
  query: (...args: unknown[]) => mockQuery(...args),
  connect: () =>
    mockConnect().then(() => ({
      query: mockClientQuery,
      release: mockClientRelease,
    })),
};

vi.mock("@/utils/db", () => ({
  pool: mockPool,
  withTransaction: async (fn: (client: any) => Promise<any>) => {
    const client = await mockPool.connect();
    await client.query("BEGIN");
    try {
      const result = await fn(client);
      await client.query("COMMIT");
      return result;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  },
}));

vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/email-templates", () => ({
  orderConfirmationHtml: vi.fn().mockReturnValue("<html>test</html>"),
  orderConfirmationText: vi.fn().mockReturnValue("test"),
}));

vi.mock("@/utils/formatCurrency", () => ({
  formatCurrency: vi.fn((n: number) => `$${n.toFixed(2)}`),
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

const WEBHOOK_SECRET = "test-webhook-secret";

function signPayload(rawBody: string): string {
  return crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");
}

function makeWebhookPayload(
  eventName: string,
  eventId: string,
  overrides: Record<string, unknown> = {}
) {
  return {
    meta: {
      event_name: eventName,
      custom_data: {
        user_id: "user-1",
        reservation_id: "res-1",
        cart_items: JSON.stringify([
          { internalProductId: "prod-1", quantity: 1, size: "M" },
        ]),
        shipping_address: JSON.stringify({
          email: "test@example.com",
          firstName: "John",
          lastName: "Doe",
          address: "123 Main St",
          city: "Springfield",
          zipCode: "62701",
        }),
      },
      ...overrides,
    },
    data: {
      id: eventId,
      attributes: {
        order_number: 12345,
        customer_id: "ls-cust-1",
        total: 10800,
        ...(overrides.attributes as Record<string, unknown>),
      },
    },
  };
}

function makeWebhookRequest(
  rawBody: string,
  signature: string
): Request {
  return new Request("http://localhost:3000/api/webhooks/lemonsqueezy", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-signature": signature,
    },
    body: rawBody,
  });
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("POST /api/webhooks/lemonsqueezy", () => {
  let POST: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    vi.resetModules();
    mockQuery.mockReset();
    mockConnect.mockReset().mockResolvedValue(undefined);
    mockClientQuery.mockReset();
    mockClientRelease.mockReset();

    process.env.LEMON_SQUEEZY_WEBHOOK_SECRET = WEBHOOK_SECRET;

    const mod = await import("@/app/api/webhooks/lemonsqueezy/route");
    POST = mod.POST as unknown as (req: Request) => Promise<Response>;
  });

  // ── Signature verification ─────────────────────────────────────────────

  it("returns 401 when x-signature header is missing", async () => {
    const rawBody = JSON.stringify(makeWebhookPayload("order_created", "evt-1"));
    const req = new Request("http://localhost:3000/api/webhooks/lemonsqueezy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: rawBody,
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 401 when signature is invalid", async () => {
    const rawBody = JSON.stringify(makeWebhookPayload("order_created", "evt-1"));
    const req = makeWebhookRequest(rawBody, "invalid-signature");

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 401 when signature does not match body", async () => {
    const rawBody = JSON.stringify(makeWebhookPayload("order_created", "evt-1"));
    const wrongSignature = signPayload("tampered-body");
    const req = makeWebhookRequest(rawBody, wrongSignature);

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  // ── Missing event ID ───────────────────────────────────────────────────

  it("returns 400 when event ID is missing", async () => {
    const payload = makeWebhookPayload("order_created", "evt-1");
    // Remove the event ID
    (payload.data as Record<string, unknown>).id = undefined;
    const rawBody = JSON.stringify(payload);
    const signature = signPayload(rawBody);
    const req = makeWebhookRequest(rawBody, signature);

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  // ── Idempotency protection ─────────────────────────────────────────────

  it("skips duplicate events (idempotency key already processed)", async () => {
    const payload = makeWebhookPayload("order_created", "evt-duplicate");
    const rawBody = JSON.stringify(payload);
    const signature = signPayload(rawBody);

    // Mock: BEGIN, INSERT idempotency (conflict → rowCount=0), COMMIT
    mockClientQuery
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({ rowCount: 0 }) // INSERT processed_webhooks → already exists
      .mockResolvedValueOnce(undefined); // COMMIT

    const res = await POST(makeWebhookRequest(rawBody, signature));

    expect(res.status).toBe(200);
    // Should have committed and returned early without processing the order
    expect(mockClientQuery).toHaveBeenCalledTimes(3);
  });

  // ── Error handling (500 for retries) ───────────────────────────────────

  it("returns 500 on internal processing failure to enable provider retries", async () => {
    const payload = makeWebhookPayload("order_created", "evt-fail");
    const rawBody = JSON.stringify(payload);
    const signature = signPayload(rawBody);

    // Mock: connect throws to simulate DB failure
    mockConnect.mockRejectedValueOnce(new Error("Database connection failed"));

    const res = await POST(makeWebhookRequest(rawBody, signature));

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toContain("Internal processing failed");
  });

  // ── Successful processing ──────────────────────────────────────────────

  it("returns 200 for a valid, successfully processed order_created event", async () => {
    const payload = makeWebhookPayload("order_created", "evt-success");
    const rawBody = JSON.stringify(payload);
    const signature = signPayload(rawBody);

    mockClientQuery
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({ rowCount: 1 }) // INSERT processed_webhooks → new
      .mockResolvedValueOnce({ rows: [{ price: 100, name: "Product", slug: "product", image: "/img.jpg" }] }) // SELECT product
      .mockResolvedValueOnce({ rows: [{ id: "size-1", stock: 50 }] }) // SELECT product_sizes FOR UPDATE
      .mockResolvedValueOnce(undefined) // UPDATE product_sizes stock
      .mockResolvedValueOnce(undefined) // DELETE reservation
      .mockResolvedValueOnce(undefined) // INSERT order
      .mockResolvedValueOnce(undefined) // UPDATE user ls_customer_id
      .mockResolvedValueOnce(undefined); // COMMIT

    const res = await POST(makeWebhookRequest(rawBody, signature));

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.received).toBe(true);

    // Verify order_number is a UUID format (not sequential AUR-LS-XXXXX)
    const insertOrderCall = mockClientQuery.mock.calls[6];
    const orderNumberArg = insertOrderCall[1][1];
    expect(orderNumberArg).toMatch(/^AUR-[0-9A-F]{8}$/);
  });

  // ── Non-order events ───────────────────────────────────────────────────

  it("returns 200 for non-order_created events without processing", async () => {
    const payload = makeWebhookPayload("subscription_created", "evt-sub");
    const rawBody = JSON.stringify(payload);
    const signature = signPayload(rawBody);

    const res = await POST(makeWebhookRequest(rawBody, signature));

    expect(res.status).toBe(200);
    // Should not have connected to DB for order processing
    expect(mockConnect).not.toHaveBeenCalled();
  });

  // ── JSON parsing robustness ───────────────────────────────────────────

  it("returns 400 for malformed JSON request body payload", async () => {
    const rawBody = "{ invalid-json }";
    const signature = signPayload(rawBody);
    const res = await POST(makeWebhookRequest(rawBody, signature));

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Invalid JSON payload.");
  });

  it("returns 400 when payload is null", async () => {
    const rawBody = "null";
    const signature = signPayload(rawBody);
    const res = await POST(makeWebhookRequest(rawBody, signature));

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Invalid payload format.");
  });

  it("returns 500 when custom field cart_items has malformed JSON", async () => {
    const payload = makeWebhookPayload("order_created", "evt-malformed-custom");
    // Inject invalid JSON string into custom field
    payload.meta.custom_data.cart_items = "{ invalid-cart-items-json }";
    const rawBody = JSON.stringify(payload);
    const signature = signPayload(rawBody);

    const res = await POST(makeWebhookRequest(rawBody, signature));

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Internal processing failed.");
  });

  it("returns 200 and processes correctly when custom field cart_items is already a parsed array", async () => {
    const payload = makeWebhookPayload("order_created", "evt-pre-parsed");
    // Inject actual parsed array instead of stringified JSON
    (payload.meta.custom_data as any).cart_items = [
      { internalProductId: "prod-1", quantity: 1, size: "M" },
    ];
    const rawBody = JSON.stringify(payload);
    const signature = signPayload(rawBody);

    mockClientQuery
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({ rowCount: 1 }) // INSERT processed_webhooks
      .mockResolvedValueOnce({ rows: [{ price: 100, name: "Product", slug: "product", image: "/img.jpg" }] }) // SELECT product
      .mockResolvedValueOnce({ rows: [{ id: "size-1", stock: 50 }] }) // SELECT product_sizes FOR UPDATE
      .mockResolvedValueOnce(undefined) // UPDATE product_sizes stock
      .mockResolvedValueOnce(undefined) // DELETE reservation
      .mockResolvedValueOnce(undefined) // INSERT order
      .mockResolvedValueOnce(undefined) // UPDATE user ls_customer_id
      .mockResolvedValueOnce(undefined); // COMMIT

    const res = await POST(makeWebhookRequest(rawBody, signature));

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.received).toBe(true);
  });

  it("returns 500 when custom field cart_items is not an array", async () => {
    const payload = makeWebhookPayload("order_created", "evt-invalid-cart-array");
    payload.meta.custom_data.cart_items = JSON.stringify("not-an-array");
    const rawBody = JSON.stringify(payload);
    const signature = signPayload(rawBody);

    const res = await POST(makeWebhookRequest(rawBody, signature));

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Internal processing failed.");
  });

  it("returns 500 when cart_item contains negative quantity", async () => {
    const payload = makeWebhookPayload("order_created", "evt-negative-qty");
    payload.meta.custom_data.cart_items = JSON.stringify([
      { internalProductId: "prod-1", quantity: -5, size: "M" },
    ]);
    const rawBody = JSON.stringify(payload);
    const signature = signPayload(rawBody);

    const res = await POST(makeWebhookRequest(rawBody, signature));

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Internal processing failed.");
  });

  it("returns 500 when cart_item contains missing internalProductId", async () => {
    const payload = makeWebhookPayload("order_created", "evt-missing-prod");
    payload.meta.custom_data.cart_items = JSON.stringify([
      { quantity: 1, size: "M" } as any,
    ]);
    const rawBody = JSON.stringify(payload);
    const signature = signPayload(rawBody);

    const res = await POST(makeWebhookRequest(rawBody, signature));

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Internal processing failed.");
  });

  it("returns 500 when shipping_address custom field is not a valid object", async () => {
    const payload = makeWebhookPayload("order_created", "evt-invalid-address");
    payload.meta.custom_data.shipping_address = JSON.stringify("invalid-address-string");
    const rawBody = JSON.stringify(payload);
    const signature = signPayload(rawBody);

    const res = await POST(makeWebhookRequest(rawBody, signature));

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Internal processing failed.");
  });
});

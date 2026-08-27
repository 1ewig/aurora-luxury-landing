import { describe, it, expect, vi, beforeEach } from "vitest";
import { createDbMocks } from "../utils/mocks";

const db = createDbMocks();
const mockRequireAdmin = vi.fn();
const mockRevalidateTag = vi.fn();

vi.mock("@/utils/db", () => ({
  pool: db.mockPool,
  withTransaction: db.mockWithTransaction,
}));

vi.mock("@/utils/admin", () => ({
  requireAdmin: (...args: unknown[]) => mockRequireAdmin(...args),
}));

vi.mock("next/cache", () => ({
  revalidateTag: mockRevalidateTag,
}));

vi.mock("@insforge/sdk", () => ({
  createAdminClient: vi.fn(() => ({
    storage: { from: vi.fn(() => ({ remove: vi.fn().mockResolvedValue(undefined) })) },
  })),
}));

function req(url: string, options?: { method?: string; body?: unknown }): Request {
  const { method = "GET", body } = options ?? {};
  return new Request(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
}

beforeEach(() => {
  vi.resetModules();
  db.reset();
  mockRequireAdmin.mockReset();
  mockRevalidateTag.mockReset();
  mockRequireAdmin.mockResolvedValue({ user: { id: "admin-1" }, error: undefined });
});

describe("GET /api/admin/products", () => {
  it("returns paginated products", async () => {
    const productRow = { id: "p1", slug: "test", name: "Test", category: "Outerwear", price: 100, badge: null, image: "/img.jpg", altText: "", span: null, aspectRatio: null, description: "Desc", images: [], sizes: [], details: [], total: "1" };
    db.mockQuery.mockResolvedValue({ rows: [productRow] });

    const { GET } = await import("@/app/api/admin/products/route");
    const res = await GET(req("http://localhost:3000/api/admin/products?page=1&limit=20"));
    const json = await res.json();

    expect(json.products).toHaveLength(1);
    expect(json.total).toBe(1);
    expect(json.page).toBe(1);
  });

  it("builds search ILIKE condition", async () => {
    db.mockQuery.mockResolvedValue({ rows: [] });

    const { GET } = await import("@/app/api/admin/products/route");
    await GET(req("http://localhost:3000/api/admin/products?search=jacket"));

    const sql = db.mockQuery.mock.calls[0][0] as string;
    expect(sql).toContain("ILIKE");
  });
});

describe("POST /api/admin/products", () => {
  const validProduct = {
    id: "p-new", slug: "new-product", name: "New Product", category: "Outerwear", price: 100,
    image: "/img.jpg", altText: "Alt", description: "Desc", images: ["/img2.jpg"], sizes: [{ size: "M", stock: 10 }], details: ["Detail 1"],
  };

  it("rejects missing required fields", async () => {
    const { POST } = await import("@/app/api/admin/products/route");
    const res = await POST(req("http://localhost:3000/api/admin/products", { method: "POST", body: { name: "No ID" } }));
    expect(res.status).toBe(400);
  });

  it("rejects duplicate ID or slug", async () => {
    db.mockClientQuery.mockResolvedValue({ rows: [{ id: 1 }] });

    const { POST } = await import("@/app/api/admin/products/route");
    const res = await POST(req("http://localhost:3000/api/admin/products", { method: "POST", body: validProduct }));

    expect(res.status).toBe(400);
    expect(db.mockClientQuery.mock.calls[0][0]).toContain("SELECT 1 FROM products");
  });

  it("creates product with nested data in transaction", async () => {
    db.mockClientQuery.mockResolvedValue({ rows: [] });

    const { POST } = await import("@/app/api/admin/products/route");
    const res = await POST(req("http://localhost:3000/api/admin/products", { method: "POST", body: validProduct }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(db.mockClientQuery.mock.calls[1][0]).toContain("INSERT INTO products");
    expect(mockRevalidateTag).toHaveBeenCalled();
  });
});

describe("PUT /api/admin/products/[id]", () => {
  it("returns 404 when product not found", async () => {
    db.mockClientQuery.mockResolvedValue({ rows: [] });

    const { PUT } = await import("@/app/api/admin/products/[id]/route");
    const res = await PUT(req("http://localhost:3000", { method: "PUT", body: { slug: "test", name: "Test", category: "Outerwear", price: 100, image: "/img.jpg", altText: "Alt", description: "Desc" } }), { params: Promise.resolve({ id: "p-missing" }) });

    expect(res.status).toBe(404);
  });

  it("rejects slug conflict", async () => {
    db.mockClientQuery
      .mockResolvedValueOnce({ rows: [{ image: "/old.jpg" }] })
      .mockResolvedValueOnce({ rows: [{ id: 1 }] });

    const { PUT } = await import("@/app/api/admin/products/[id]/route");
    const res = await PUT(req("http://localhost:3000", { method: "PUT", body: { slug: "taken", name: "Test", category: "Outerwear", price: 100, image: "/img.jpg", altText: "Alt", description: "Desc" } }), { params: Promise.resolve({ id: "p-1" }) });

    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("Slug");
  });

  it("updates product successfully", async () => {
    db.mockClientQuery
      .mockResolvedValueOnce({ rows: [{ image: "/old.jpg" }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ image_url: "/gallery.jpg" }] })
      .mockResolvedValue({ rows: [] });

    const { PUT } = await import("@/app/api/admin/products/[id]/route");
    const res = await PUT(req("http://localhost:3000", { method: "PUT", body: { slug: "updated", name: "Updated", category: "Knitwear", price: 150, image: "/new.jpg", altText: "Alt", description: "New Desc", images: [], sizes: [{ size: "L", stock: 5 }], details: ["New detail"] } }), { params: Promise.resolve({ id: "p-1" }) });

    expect(res.status).toBe(200);
    expect(mockRevalidateTag).toHaveBeenCalled();
  });

  it("updates product successfully when id is present in payload from frontend form", async () => {
    db.mockClientQuery
      .mockResolvedValueOnce({ rows: [{ image: "/old.jpg" }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ image_url: "/gallery.jpg" }] })
      .mockResolvedValue({ rows: [] });

    const { PUT } = await import("@/app/api/admin/products/[id]/route");
    const res = await PUT(
      req("http://localhost:3000", {
        method: "PUT",
        body: {
          id: "p-1",
          slug: "updated",
          name: "Updated",
          category: "Knitwear",
          price: 150,
          image: "/new.jpg",
          altText: "Alt",
          description: "New Desc",
          images: [],
          sizes: [
            { size: "S", stock: 0 },
            { size: "M", stock: 15 },
          ],
          details: ["New detail"],
        },
      }),
      { params: Promise.resolve({ id: "p-1" }) }
    );

    expect(res.status).toBe(200);
    expect(mockRevalidateTag).toHaveBeenCalled();
  });
});

describe("DELETE /api/admin/products/[id]", () => {
  it("returns 404 when product not found", async () => {
    db.mockClientQuery.mockResolvedValue({ rows: [] });

    const { DELETE } = await import("@/app/api/admin/products/[id]/route");
    const res = await DELETE(new Request("http://localhost:3000"), { params: Promise.resolve({ id: "p-missing" }) });

    expect(res.status).toBe(404);
  });

  it("deletes product with storage cleanup", async () => {
    db.mockClientQuery
      .mockResolvedValueOnce({ rows: [{ image: "/img.jpg" }] })
      .mockResolvedValueOnce({ rows: [{ image_url: "/gallery.jpg" }] })
      .mockResolvedValue({ rows: [] });

    const { DELETE } = await import("@/app/api/admin/products/[id]/route");
    const res = await DELETE(new Request("http://localhost:3000"), { params: Promise.resolve({ id: "p-1" }) });

    expect(res.status).toBe(200);
    expect(mockRevalidateTag).toHaveBeenCalled();
  });
});

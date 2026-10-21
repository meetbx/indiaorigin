import test from "node:test";
import assert from "node:assert";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { GET as getSimilarHandler } from "@/app/api/recommendations/similar/route";
import { GET as getManufacturerHandler } from "@/app/api/recommendations/manufacturers/route";

test("API Routes: Similar Products & Alternative Manufacturers Validation & Response Contract", async (t) => {
  
  // Save original Prisma methods to restore later
  const originalFindUnique = prisma.product.findUnique;
  const originalFindMany = prisma.product.findMany;

  try {
    // -------------------------------------------------------------
    // Test 1: Missing Identifier -> HTTP 400
    // -------------------------------------------------------------
    await t.test("Returns 400 when identifier is missing", async () => {
      const req = new NextRequest("http://localhost/api/recommendations/similar");
      const res = await getSimilarHandler(req);
      assert.strictEqual(res.status, 400);
      const json = await res.json();
      assert.strictEqual(json.success, false);
      assert.match(json.error, /Missing or invalid/);
    });

    // -------------------------------------------------------------
    // Test 2: Whitespace-only Identifier -> HTTP 400
    // -------------------------------------------------------------
    await t.test("Returns 400 when identifier is whitespace-only", async () => {
      const req = new NextRequest("http://localhost/api/recommendations/similar?slug=   ");
      const res = await getSimilarHandler(req);
      assert.strictEqual(res.status, 400);
      const json = await res.json();
      assert.strictEqual(json.success, false);
    });

    // -------------------------------------------------------------
    // Test 3: Identifier Precedence (productId takes precedence over slug)
    // -------------------------------------------------------------
    await t.test("Respects identifier precedence (productId over slug)", async () => {
      let queriedId = "";
      (prisma.product.findUnique as any) = async (args: any) => {
        queriedId = args.where.id || args.where.slug;
        if (queriedId === "prod-id-123") {
          return {
            id: "prod-id-123",
            slug: "product-id-slug",
            categoryId: "cat-1",
            manufacturerId: "mfg-1",
            minPrice: 100,
            maxPrice: 200,
            moq: 10,
            isPublished: true,
          };
        }
        return null;
      };
      (prisma.product.findMany as any) = async () => [];

      const req = new NextRequest("http://localhost/api/recommendations/similar?productId=prod-id-123&slug=some-slug");
      const res = await getSimilarHandler(req);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(queriedId, "prod-id-123");
    });

    // -------------------------------------------------------------
    // Test 4: Invalid Limits (0, negative, non-integer, >20) -> HTTP 400
    // -------------------------------------------------------------
    await t.test("Returns 400 for invalid limits", async () => {
      const invalidLimits = ["0", "-5", "21", "abc", "3.5"];
      for (const limit of invalidLimits) {
        const req = new NextRequest(`http://localhost/api/recommendations/similar?slug=valid-slug&limit=${limit}`);
        const res = await getSimilarHandler(req);
        assert.strictEqual(res.status, 400, `Expected 400 for limit=${limit}`);
        const json = await res.json();
        assert.strictEqual(json.success, false);
        assert.match(json.error, /limit/i);
      }
    });

    // -------------------------------------------------------------
    // Test 5: Unknown Product -> HTTP 404
    // -------------------------------------------------------------
    await t.test("Returns 404 when product is not found", async () => {
      (prisma.product.findUnique as any) = async () => null;

      const req = new NextRequest("http://localhost/api/recommendations/similar?slug=unknown-product");
      const res = await getSimilarHandler(req);
      assert.strictEqual(res.status, 404);
      const json = await res.json();
      assert.strictEqual(json.success, false);
    });

    // -------------------------------------------------------------
    // Test 6: Empty Recommendations -> HTTP 200 with count 0
    // -------------------------------------------------------------
    await t.test("Returns 200 with empty array when no recommendations match", async () => {
      (prisma.product.findUnique as any) = async () => ({
        id: "prod-1",
        slug: "empty-product",
        categoryId: "cat-1",
        manufacturerId: "mfg-1",
        minPrice: 100,
        maxPrice: 200,
        moq: 10,
        isPublished: true,
      });
      (prisma.product.findMany as any) = async () => [];

      const req = new NextRequest("http://localhost/api/recommendations/similar?slug=empty-product");
      const res = await getSimilarHandler(req);
      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.strictEqual(json.success, true);
      assert.strictEqual(json.count, 0);
      assert.deepStrictEqual(json.recommendations, []);
    });

    // -------------------------------------------------------------
    // Test 7: Successful Response & Payload Sanitization
    // -------------------------------------------------------------
    await t.test("Returns 200 with sanitized recommendation payload containing only public fields", async () => {
      (prisma.product.findUnique as any) = async () => ({
        id: "prod-1",
        slug: "valid-product",
        categoryId: "cat-1",
        manufacturerId: "mfg-1",
        minPrice: 100,
        maxPrice: 200,
        moq: 10,
        isPublished: true,
      });
      (prisma.product.findMany as any) = async () => [
        {
          id: "prod-2",
          name: "Industrial Steel Pipe",
          slug: "industrial-steel-pipe",
          images: ["img1.jpg"],
          minPrice: 100,
          maxPrice: 150,
          moq: 10,
          unit: "Piece",
          isPublished: true,
          manufacturerId: "mfg-2",
          categoryId: "cat-1",
          specifications: { material: "Steel" },
          // Sensitive fields that should be sanitized out of response
          passwordHash: "secret_hash_should_not_appear",
          manufacturer: {
            id: "mfg-2",
            name: "Steel Works Inc",
            slug: "steel-works",
            isVerified: true,
            badge: "GOLD",
            city: "Delhi",
          },
        },
      ];

      const req = new NextRequest("http://localhost/api/recommendations/similar?slug=valid-product&limit=5");
      const res = await getSimilarHandler(req);
      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.strictEqual(json.success, true);
      assert.strictEqual(json.count, 1);
      
      const rec = json.recommendations[0];
      assert.strictEqual(rec.id, "prod-2");
      assert.strictEqual(rec.name, "Industrial Steel Pipe");
      
      // Verify sensitive internal fields (like passwordHash) are stripped out
      assert.strictEqual(rec.passwordHash, undefined);
    });

    // -------------------------------------------------------------
    // Test 8: Alternative Manufacturers Endpoint Success
    // -------------------------------------------------------------
    await t.test("Alternative manufacturers endpoint responds successfully", async () => {
      (prisma.product.findUnique as any) = async () => ({
        id: "prod-1",
        slug: "valid-product",
        categoryId: "cat-1",
        manufacturerId: "mfg-1",
        minPrice: 100,
        maxPrice: 200,
        moq: 10,
        isPublished: true,
      });
      (prisma.product.findMany as any) = async () => [
        {
          id: "prod-3",
          name: "Alternative Steel Pipe",
          slug: "alt-steel-pipe",
          images: [],
          minPrice: 110,
          maxPrice: 160,
          moq: 10,
          unit: "Piece",
          isPublished: true,
          manufacturerId: "mfg-3",
          categoryId: "cat-1",
          manufacturer: {
            id: "mfg-3",
            name: "Other Works",
            slug: "other-works",
            isVerified: true,
            badge: "SILVER",
            city: "Mumbai",
          },
        },
      ];

      const req = new NextRequest("http://localhost/api/recommendations/manufacturers?slug=valid-product");
      const res = await getManufacturerHandler(req);
      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.strictEqual(json.success, true);
      assert.strictEqual(json.count, 1);
    });

    // -------------------------------------------------------------
    // Test 9: Unexpected Service/Database Failure -> HTTP 500
    // -------------------------------------------------------------
    await t.test("Returns 500 on unexpected server error", async () => {
      (prisma.product.findUnique as any) = async () => {
        throw new Error("Database connection failure");
      };

      const req = new NextRequest("http://localhost/api/recommendations/similar?slug=error-product");
      const res = await getSimilarHandler(req);
      assert.strictEqual(res.status, 500);
      const json = await res.json();
      assert.strictEqual(json.success, false);
      assert.strictEqual(json.error, "Internal server error.");
    });

  } finally {
    // Restore original Prisma methods
    prisma.product.findUnique = originalFindUnique;
    prisma.product.findMany = originalFindMany;
  }
});
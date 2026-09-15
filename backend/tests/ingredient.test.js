/**
 * Feature 3 — Ingredient Catalog
 * Spec: features/feature-3-ingredient-catalog.md
 */
const request = require("supertest");
const app = require("../server.js");
const db = require("../app/models");
const {
  syncTestDatabase,
  closeTestDatabase,
  registerAndLogin,
  bearerAuthHeader,
} = require("./helpers");

beforeEach(async () => {
  await syncTestDatabase();
});

afterAll(async () => {
  await closeTestDatabase();
});

const sampleIngredient = (overrides = {}) => ({
  name: "Flour",
  unit: "cup",
  pricePerUnit: 0.25,
  ...overrides,
});

describe("Feature 3 — Ingredient Catalog", () => {
  describe("US-3.1 — View the Ingredient Catalog", () => {
    it("View ingredients without authentication", async () => {
      await db.ingredient.create(sampleIngredient());

      const response = await request(app).get("/recipeapi/ingredients");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.some((ingredient) => ingredient.name === "Flour")).toBe(
        true
      );
    });
  });

  describe("US-3.2 — Add an Ingredient", () => {
    it("Add an ingredient successfully", async () => {
      const { token } = await registerAndLogin();

      const response = await request(app)
        .post("/recipeapi/ingredients")
        .set(bearerAuthHeader(token))
        .send(sampleIngredient());

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: expect.any(Number),
        name: "Flour",
        unit: "cup",
      });
      expect(Number(response.body.pricePerUnit)).toBe(0.25);
      expect(response.body.createdAt).toBeDefined();
      expect(response.body.updatedAt).toBeDefined();

      const stored = await db.ingredient.findByPk(response.body.id);
      expect(stored).not.toBeNull();
      expect(stored.name).toBe("Flour");
      expect(stored.unit).toBe("cup");
      expect(Number(stored.pricePerUnit)).toBe(0.25);
    });

    it("Reject an unauthenticated ingredient creation request", async () => {
      const response = await request(app)
        .post("/recipeapi/ingredients")
        .send(sampleIngredient());

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ message: "Unauthorized! No Auth Header" });

      const count = await db.ingredient.count();
      expect(count).toBe(0);
    });

    it("Reject creation when a required value is omitted", async () => {
      const { token } = await registerAndLogin();

      const response = await request(app)
        .post("/recipeapi/ingredients")
        .set(bearerAuthHeader(token))
        .send({ unit: "cup", pricePerUnit: 0.25 });

      expect(response.status).toBe(400);

      const count = await db.ingredient.count();
      expect(count).toBe(0);
    });
  });

  describe("US-3.3 — Edit an Ingredient", () => {
    it("Update an ingredient successfully", async () => {
      const { token } = await registerAndLogin();
      const created = await db.ingredient.create(sampleIngredient());

      const response = await request(app)
        .put(`/recipeapi/ingredients/${created.id}`)
        .set(bearerAuthHeader(token))
        .send({
          name: "Wheat Flour",
          unit: "cup",
          pricePerUnit: 0.25,
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: "Ingredient was updated successfully.",
      });

      const stored = await db.ingredient.findByPk(created.id);
      expect(stored.name).toBe("Wheat Flour");
      expect(stored.unit).toBe("cup");
      expect(Number(stored.pricePerUnit)).toBe(0.25);
    });

    it("Reject an unauthenticated ingredient update request", async () => {
      const created = await db.ingredient.create(sampleIngredient());

      const response = await request(app)
        .put(`/recipeapi/ingredients/${created.id}`)
        .send({ name: "No Auth" });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ message: "Unauthorized! No Auth Header" });

      const stored = await db.ingredient.findByPk(created.id);
      expect(stored.name).toBe("Flour");
    });
  });
});

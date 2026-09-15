/**
 * Feature 4 — Public Recipe Publishing & Browsing
 * Spec: features/feature-4-public-recipe-publishing-browsing.md
 */
const request = require("supertest");
const app = require("../server.js");
const db = require("../app/models");
const {
  syncTestDatabase,
  closeTestDatabase,
  registerAndLogin,
} = require("./helpers");

beforeEach(async () => {
  await syncTestDatabase();
});

afterAll(async () => {
  await closeTestDatabase();
});

const seedRecipe = async (userId, overrides = {}) =>
  db.recipe.create({
    name: "Omelette",
    description: "Simple",
    servings: 2,
    time: 10,
    isPublished: true,
    userId,
    ...overrides,
  });

describe("Feature 4 — Public Recipe Publishing & Browsing", () => {
  describe("US-4.1 — Browse published recipes while signed out", () => {
    it("Browse published recipes while signed out", async () => {
      const { user } = await registerAndLogin();
      await seedRecipe(user.id);

      const response = await request(app).get("/recipeapi/recipes");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({
        name: "Omelette",
        description: "Simple",
        servings: 2,
        time: 10,
        isPublished: true,
      });
    });
  });

  describe("US-4.2 — Do not show unpublished recipes in the public catalog", () => {
    it("Hide unpublished recipes from the public catalog", async () => {
      const { user } = await registerAndLogin();
      await seedRecipe(user.id, { name: "Omelette", isPublished: true });
      await seedRecipe(user.id, {
        name: "Draft Stew",
        description: "Not ready",
        isPublished: false,
      });

      const response = await request(app).get("/recipeapi/recipes");

      expect(response.status).toBe(200);
      const names = response.body.map((recipe) => recipe.name);
      expect(names).toContain("Omelette");
      expect(names).not.toContain("Draft Stew");
      expect(response.body.every((recipe) => recipe.isPublished === true)).toBe(
        true
      );
    });
  });
});

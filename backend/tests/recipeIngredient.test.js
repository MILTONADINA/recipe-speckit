/**
 * Feature 2 — Recipe Management
 * Spec: features/feature-2-recipe-management.md
 */
const request = require("supertest");
const app = require("../server.js");
const db = require("../app/models");
const { syncTestDatabase, closeTestDatabase, registerAndLogin, bearerAuthHeader } = require("./helpers");

beforeEach(async () => {
  await syncTestDatabase();
});

afterAll(async () => {
  await closeTestDatabase();
});

const createRecipe = async (userId, overrides = {}) =>
  db.recipe.create({
    name: "Omelette",
    description: "Simple",
    servings: 2,
    time: 10,
    isPublished: true,
    userId,
    ...overrides,
  });

const createIngredient = async (overrides = {}) =>
  db.ingredient.create({
    name: "Egg",
    unit: "egg",
    pricePerUnit: 0.3,
    ...overrides,
  });

describe("Feature 2 — Recipe Management", () => {
  describe("US-2.4 — Manage recipe ingredients", () => {
    it("Recipe owner adds an ingredient to their recipe", async () => {
      const { user, token } = await registerAndLogin();
      const recipe = await createRecipe(user.id);
      const ingredient = await createIngredient();

      const response = await request(app)
        .post(`/recipeapi/recipes/${recipe.id}/recipeIngredients`)
        .set(bearerAuthHeader(token))
        .send({ quantity: 2, recipeId: recipe.id, ingredientId: ingredient.id });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: expect.any(Number),
        quantity: 2,
        recipeId: recipe.id,
        ingredientId: ingredient.id,
        recipeStepId: null,
      });
    });

    it("A non-owner cannot add an ingredient to another user's recipe", async () => {
      const { user: owner, token: ownerToken } = await registerAndLogin({
        email: "owner@example.com",
      });
      const { token: otherToken } = await registerAndLogin({
        email: "other@example.com",
      });
      const recipe = await createRecipe(owner.id);
      const ingredient = await createIngredient();

      const response = await request(app)
        .post(`/recipeapi/recipes/${recipe.id}/recipeIngredients`)
        .set(bearerAuthHeader(otherToken))
        .send({ quantity: 2, recipeId: recipe.id, ingredientId: ingredient.id });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        message: `Cannot find Recipe with id=${recipe.id}.`,
      });

      const count = await db.recipeIngredient.count();
      expect(count).toBe(0);
    });

    it("A recipe's ingredients are publicly readable", async () => {
      const { user } = await registerAndLogin();
      const recipe = await createRecipe(user.id);
      const ingredient = await createIngredient();
      await db.recipeIngredient.create({
        quantity: 2,
        recipeId: recipe.id,
        ingredientId: ingredient.id,
      });

      const response = await request(app).get(
        `/recipeapi/recipes/${recipe.id}/recipeIngredients`
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].ingredient.name).toBe("Egg");
    });
  });
});

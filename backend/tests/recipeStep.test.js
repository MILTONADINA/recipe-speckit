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

describe("Feature 2 — Recipe Management", () => {
  describe("US-2.5 — Manage recipe steps", () => {
    it("Recipe owner adds a step to their recipe", async () => {
      const { user, token } = await registerAndLogin();
      const recipe = await createRecipe(user.id);

      const response = await request(app)
        .post(`/recipeapi/recipes/${recipe.id}/recipeSteps`)
        .set(bearerAuthHeader(token))
        .send({ stepNumber: 1, instruction: "Crack eggs", recipeId: recipe.id });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: expect.any(Number),
        stepNumber: 1,
        instruction: "Crack eggs",
        recipeId: recipe.id,
      });

      const listResponse = await request(app).get(
        `/recipeapi/recipes/${recipe.id}/recipeStepsWithIngredients`
      );
      expect(listResponse.status).toBe(200);
      expect(listResponse.body.map((step) => step.stepNumber)).toEqual([1]);
    });

    it("A recipe's steps are publicly readable", async () => {
      const { user, token } = await registerAndLogin();
      const recipe = await createRecipe(user.id);

      await request(app)
        .post(`/recipeapi/recipes/${recipe.id}/recipeSteps`)
        .set(bearerAuthHeader(token))
        .send({ stepNumber: 1, instruction: "Crack eggs", recipeId: recipe.id });

      const response = await request(app).get(
        `/recipeapi/recipes/${recipe.id}/recipeStepsWithIngredients`
      );

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
    });
  });

  describe("US-2.6 — View recipe details with linked ingredients", () => {
    it("A recipe step's linked ingredients are included when reading recipe steps with ingredients", async () => {
      const { user } = await registerAndLogin();
      const recipe = await createRecipe(user.id);
      const step = await db.recipeStep.create({
        stepNumber: 1,
        instruction: "Crack eggs",
        recipeId: recipe.id,
      });
      const ingredient = await db.ingredient.create({
        name: "Egg",
        unit: "egg",
        pricePerUnit: 0.3,
      });
      await db.recipeIngredient.create({
        quantity: 2,
        recipeId: recipe.id,
        recipeStepId: step.id,
        ingredientId: ingredient.id,
      });

      const response = await request(app).get(
        `/recipeapi/recipes/${recipe.id}/recipeStepsWithIngredients`
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].recipeIngredient).toHaveLength(1);
      expect(response.body[0].recipeIngredient[0]).toMatchObject({
        quantity: 2,
        ingredient: { name: "Egg" },
      });
    });
  });
});

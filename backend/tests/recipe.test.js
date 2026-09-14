/**
 * Feature 2 — Recipe Management
 * Spec: features/feature-2-recipe-management.md
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

const sampleRecipe = (userId, overrides = {}) => ({
  name: "Omelette",
  description: "Simple",
  servings: 2,
  time: 10,
  isPublished: true,
  userId,
  ...overrides,
});

describe("Feature 2 — Recipe Management", () => {
  describe("US-2.1 — Create a recipe", () => {
    it("Signed-in user creates a recipe with valid information", async () => {
      const { user, token } = await registerAndLogin();

      const response = await request(app)
        .post("/recipeapi/recipes")
        .set(bearerAuthHeader(token))
        .send(sampleRecipe(user.id));

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: expect.any(Number),
        name: "Omelette",
        userId: user.id,
      });

      const stored = await db.recipe.findByPk(response.body.id);
      expect(stored).not.toBeNull();
      expect(stored.userId).toBe(user.id);
    });

    it("Recipe creation is rejected without authentication", async () => {
      const response = await request(app)
        .post("/recipeapi/recipes")
        .send(sampleRecipe(1));

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ message: "Unauthorized! No Auth Header" });
    });
  });

  describe("US-2.2 — View my recipes", () => {
    it("Signed-in user's recipe list includes only their own recipes", async () => {
      const { user: userA, token: tokenA } = await registerAndLogin({
        email: "usera@example.com",
      });
      const { user: userB, token: tokenB } = await registerAndLogin({
        email: "userb@example.com",
      });

      await request(app)
        .post("/recipeapi/recipes")
        .set(bearerAuthHeader(tokenA))
        .send(sampleRecipe(userA.id, { name: "Recipe A" }));

      await request(app)
        .post("/recipeapi/recipes")
        .set(bearerAuthHeader(tokenB))
        .send(sampleRecipe(userB.id, { name: "Recipe B" }));

      const response = await request(app)
        .get(`/recipeapi/recipes/user/${userA.id}`)
        .set(bearerAuthHeader(tokenA));

      expect(response.status).toBe(200);
      const names = response.body.map((recipe) => recipe.name);
      expect(names).toContain("Recipe A");
      expect(names).not.toContain("Recipe B");
      expect(response.body.every((recipe) => recipe.userId === userA.id)).toBe(true);
    });
  });

  describe("US-2.3 — Update recipe details", () => {
    it("Recipe owner updates their recipe", async () => {
      const { user, token } = await registerAndLogin();
      const created = await request(app)
        .post("/recipeapi/recipes")
        .set(bearerAuthHeader(token))
        .send(sampleRecipe(user.id));

      const response = await request(app)
        .put(`/recipeapi/recipes/${created.body.id}`)
        .set(bearerAuthHeader(token))
        .send({ name: "Updated Omelette" });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: "Recipe was updated successfully." });

      const stored = await db.recipe.findByPk(created.body.id);
      expect(stored.name).toBe("Updated Omelette");
    });

    it("A non-owner cannot update another user's recipe", async () => {
      const { user: owner, token: ownerToken } = await registerAndLogin({
        email: "owner@example.com",
      });
      const { token: otherToken } = await registerAndLogin({
        email: "other@example.com",
      });

      const created = await request(app)
        .post("/recipeapi/recipes")
        .set(bearerAuthHeader(ownerToken))
        .send(sampleRecipe(owner.id));

      const response = await request(app)
        .put(`/recipeapi/recipes/${created.body.id}`)
        .set(bearerAuthHeader(otherToken))
        .send({ name: "Hacked" });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        message: `Cannot find Recipe with id=${created.body.id}.`,
      });

      const stored = await db.recipe.findByPk(created.body.id);
      expect(stored.name).toBe("Omelette");
    });

    it("Recipe update is rejected without authentication", async () => {
      const { user, token } = await registerAndLogin();
      const created = await request(app)
        .post("/recipeapi/recipes")
        .set(bearerAuthHeader(token))
        .send(sampleRecipe(user.id));

      const response = await request(app)
        .put(`/recipeapi/recipes/${created.body.id}`)
        .send({ name: "No Auth" });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ message: "Unauthorized! No Auth Header" });
    });
  });
});

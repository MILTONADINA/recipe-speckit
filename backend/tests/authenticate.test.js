/**
 * Feature 1 — User Authentication & Session Management
 * Spec: features/feature-1-user-authentication-session-management.md
 */
const request = require("supertest");
const app = require("../server.js");
const {
  syncTestDatabase,
  closeTestDatabase,
  registerUser,
  bearerAuthHeader,
  createExpiredSessionToken,
} = require("./helpers");

beforeEach(async () => {
  await syncTestDatabase();
});

afterAll(async () => {
  await closeTestDatabase();
});

const samplePublishedRecipe = (userId) => ({
  name: "Pancakes",
  description: "Fluffy pancakes",
  servings: 4,
  time: 20,
  isPublished: true,
  userId,
});

describe("Feature 1 — User Authentication & Session Management", () => {
  describe("US-1.3 — Stay signed in across page loads", () => {
    it("An authenticated request is sent with the stored session token", async () => {
      const { response: registerResponse } = await registerUser();
      const { token, id: userId } = registerResponse.body;

      const response = await request(app)
        .post("/recipeapi/recipes")
        .set(bearerAuthHeader(token))
        .send(samplePublishedRecipe(userId));

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ name: "Pancakes", userId });
    });
  });

  describe("US-1.5 — Block unauthenticated access to protected actions", () => {
    it("An unauthenticated write request is rejected", async () => {
      const response = await request(app)
        .post("/recipeapi/recipes")
        .send(samplePublishedRecipe(1));

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ message: "Unauthorized! No Auth Header" });
    });

    it("An expired session is rejected on a protected request", async () => {
      const { response: registerResponse } = await registerUser();
      const { id: userId, email } = registerResponse.body;

      const expiredToken = await createExpiredSessionToken(userId, email);

      const response = await request(app)
        .post("/recipeapi/recipes")
        .set(bearerAuthHeader(expiredToken))
        .send(samplePublishedRecipe(userId));

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        message: "Unauthorized! Expired Token, Logout and Login again",
      });
    });

    it("Unauthenticated read requests are not blocked", async () => {
      const recipesResponse = await request(app).get("/recipeapi/recipes");
      expect(recipesResponse.status).toBe(200);

      const ingredientsResponse = await request(app).get("/recipeapi/ingredients");
      expect(ingredientsResponse.status).toBe(200);
    });
  });
});

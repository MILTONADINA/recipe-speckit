/**
 * Feature 1 — User Authentication & Session Management
 * Spec: features/feature-1-user-authentication-session-management.md
 */
const request = require("supertest");
const app = require("../server.js");
const db = require("../app/models");
const {
  syncTestDatabase,
  closeTestDatabase,
  registerUser,
  loginUser,
  bearerAuthHeader,
} = require("./helpers");

beforeEach(async () => {
  await syncTestDatabase();
});

afterAll(async () => {
  await closeTestDatabase();
});

describe("Feature 1 — User Authentication & Session Management", () => {
  describe("US-1.1 — Create an account", () => {
    it("User creates an account with valid information", async () => {
      const { response } = await registerUser();

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        email: "jane.doe@example.com",
        firstName: "Jane",
        lastName: "Doe",
        id: expect.any(Number),
        token: expect.any(String),
      });

      const storedUser = await db.user.findOne({ where: { email: "jane.doe@example.com" } });
      expect(storedUser).not.toBeNull();
      expect(Buffer.isBuffer(storedUser.password)).toBe(true);
      expect(storedUser.password.toString("utf8")).not.toContain("secret123");

      const sessions = await db.session.findAll({ where: { userId: storedUser.id } });
      expect(sessions.length).toBe(1);
    });

    it("User attempts to register with an email that is already in use", async () => {
      await registerUser();

      const response = await request(app).post("/recipeapi/users").send({
        firstName: "Someone",
        lastName: "Else",
        email: "jane.doe@example.com",
        password: "different123",
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "This email is already in use." });
    });
  });

  describe("US-1.2 — Sign in", () => {
    it("User signs in with valid credentials", async () => {
      await registerUser();

      const response = await loginUser("jane.doe@example.com", "secret123");

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        email: "jane.doe@example.com",
        firstName: "Jane",
        lastName: "Doe",
        id: expect.any(Number),
        token: expect.any(String),
      });

      const sessionCount = await db.session.count();
      expect(sessionCount).toBe(2); // one from registration, one from this login
    });

    it("User signs in with an incorrect password", async () => {
      await registerUser();

      const response = await loginUser("jane.doe@example.com", "wrong-password");

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ message: "Invalid password!" });
    });

    it("User signs in with an email that has no account", async () => {
      const response = await loginUser("nobody@example.com", "whatever123");

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ message: "User not found!" });
    });

    it("User attempts to sign in with no Authorization header", async () => {
      const response = await request(app).post("/recipeapi/login").send({});

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ message: "Authentication required" });
    });
  });

  describe("US-1.4 — Sign out", () => {
    it("A logged-out session token no longer authorizes protected requests", async () => {
      const { response: registerResponse } = await registerUser();
      const token = registerResponse.body.token;

      const logoutResponse = await request(app)
        .post("/recipeapi/logout")
        .set(bearerAuthHeader(token));
      expect(logoutResponse.status).toBe(200);
      expect(logoutResponse.body).toEqual({ message: "Logged out successfully." });

      const retryResponse = await request(app)
        .post("/recipeapi/recipes")
        .set(bearerAuthHeader(token))
        .send({
          name: "Pancakes",
          description: "Fluffy pancakes",
          servings: 4,
          time: 20,
          isPublished: true,
          userId: registerResponse.body.id,
        });

      expect(retryResponse.status).toBe(401);
      expect(retryResponse.body).toEqual({
        message: "Unauthorized! Expired Token, Logout and Login again",
      });
    });
  });
});

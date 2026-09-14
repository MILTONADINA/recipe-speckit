const request = require("supertest");
const app = require("../server.js");
const db = require("../app/models");
const { encrypt } = require("../app/authentication/crypto");

const syncTestDatabase = async () => {
  await db.sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
  await db.sequelize.sync({ force: true });
  await db.sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
};

const closeTestDatabase = async () => {
  await db.sequelize.close();
};

const registerUser = async (overrides = {}) => {
  const payload = {
    firstName: "Jane",
    lastName: "Doe",
    email: "jane.doe@example.com",
    password: "secret123",
    ...overrides,
  };

  const response = await request(app).post("/recipeapi/users").send(payload);

  return { response, payload };
};

const basicAuthHeader = (email, password) => ({
  Authorization: "Basic " + Buffer.from(`${email}:${password}`).toString("base64"),
});

const bearerAuthHeader = (token) => ({
  Authorization: `Bearer ${token}`,
});

const loginUser = async (email = "jane.doe@example.com", password = "secret123") => {
  return request(app).post("/recipeapi/login").set(basicAuthHeader(email, password)).send({});
};

const registerAndLogin = async (overrides = {}) => {
  const { response } = await registerUser(overrides);
  return { user: response.body, token: response.body.token };
};

// Creates a session row that is already expired and returns an encrypted token for it.
const createExpiredSessionToken = async (userId, email) => {
  const past = new Date(Date.now() - 60 * 1000);
  const session = await db.session.create({
    email,
    userId,
    expirationDate: past,
  });
  return encrypt(session.id);
};

module.exports = {
  syncTestDatabase,
  closeTestDatabase,
  registerUser,
  loginUser,
  basicAuthHeader,
  bearerAuthHeader,
  registerAndLogin,
  createExpiredSessionToken,
};

/**
 * Feature 1 — User Authentication & Session Management
 * Spec: features/feature-1-user-authentication-session-management.md
 */
import { describe, it, expect, beforeEach } from "vitest";
import { flushPromises } from "@vue/test-utils";
import Login from "../src/views/Login.vue";
import { mountWithPlugins } from "./testUtils.js";

describe("Feature 1 — User Authentication & Session Management", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("US-1.3 — Stay signed in across page loads", () => {
    it("Visiting the Login page clears an existing stored session", async () => {
      localStorage.setItem(
        "user",
        JSON.stringify({
          email: "jane.doe@example.com",
          firstName: "Jane",
          lastName: "Doe",
          id: 1,
          token: "stale-token",
        })
      );

      await mountWithPlugins(Login);
      await flushPromises();

      expect(localStorage.getItem("user")).toBeNull();
    });
  });
});

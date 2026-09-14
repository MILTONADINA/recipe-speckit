/**
 * Feature 1 — User Authentication & Session Management
 * Spec: features/feature-1-user-authentication-session-management.md
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { defineComponent } from "vue";
import { flushPromises } from "@vue/test-utils";
import MenuBar from "../src/components/MenuBar.vue";
import { mountWithPlugins, createTestRouter } from "./testUtils.js";

const logoutUserMock = vi.fn();

vi.mock("../src/services/UserServices.js", () => ({
  default: {
    logoutUser: (...args) => logoutUserMock(...args),
  },
}));

const sampleUser = {
  email: "jane.doe@example.com",
  firstName: "Jane",
  lastName: "Doe",
  id: 1,
  token: "test-token",
};

const MenuBarHost = defineComponent({
  components: { MenuBar },
  template: "<v-app><MenuBar /></v-app>",
});

async function mountMenuBar(initialPath = "/recipes") {
  const router = await createTestRouter(initialPath);
  const mounted = await mountWithPlugins(MenuBarHost, {
    router,
    global: {
      stubs: {
        VMenu: {
          props: ["modelValue"],
          template: `
            <div>
              <slot name="activator" :props="{}" />
              <div class="test-menu"><slot /></div>
            </div>
          `,
        },
      },
    },
  });

  await flushPromises();
  return { ...mounted, router };
}

function findButtonByText(wrapper, text) {
  return wrapper.findAll("button, a").find((button) => button.text().includes(text));
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("Feature 1 — User Authentication & Session Management", () => {
  beforeEach(() => {
    logoutUserMock.mockReset();
    logoutUserMock.mockResolvedValue({});
    localStorage.clear();
  });

  describe("US-1.3 — Stay signed in across page loads", () => {
    it("MenuBar shows the signed-in state for a stored session", async () => {
      localStorage.setItem("user", JSON.stringify(sampleUser));

      const { wrapper } = await mountMenuBar();

      expect(findButtonByText(wrapper, "Ingredients")).toBeTruthy();
      expect(findButtonByText(wrapper, "Login")).toBeFalsy();
      expect(wrapper.find(".test-menu").text()).toContain("Jane Doe");
      expect(wrapper.find(".test-menu").text()).toContain("jane.doe@example.com");
    });
  });

  describe("US-1.4 — Sign out", () => {
    it("User signs out from the account menu", async () => {
      localStorage.setItem("user", JSON.stringify(sampleUser));

      const { wrapper, router } = await mountMenuBar();

      await findButtonByText(wrapper.find(".test-menu"), "Logout").trigger("click");
      await flushPromises();

      expect(logoutUserMock).toHaveBeenCalled();
      expect(localStorage.getItem("user")).toBeNull();
      expect(router.currentRoute.value.name).toBe("login");
    });
  });
});

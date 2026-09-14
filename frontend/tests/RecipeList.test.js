/**
 * Feature 2 — Recipe Management
 * Spec: features/feature-2-recipe-management.md
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { flushPromises } from "@vue/test-utils";
import RecipeList from "../src/views/RecipeList.vue";
import { mountWithPlugins } from "./testUtils.js";

const getRecipesByUserIdMock = vi.fn();
const getRecipesMock = vi.fn();
const addRecipeMock = vi.fn();

vi.mock("../src/services/RecipeServices.js", () => ({
  default: {
    getRecipesByUserId: (...args) => getRecipesByUserIdMock(...args),
    getRecipes: (...args) => getRecipesMock(...args),
    addRecipe: (...args) => addRecipeMock(...args),
  },
}));

const sampleUser = {
  email: "jane.doe@example.com",
  firstName: "Jane",
  lastName: "Doe",
  id: 1,
  token: "test-token",
};

function findButtonByExactText(wrapper, text) {
  return wrapper.findAll("button").find((button) => button.text().trim() === text);
}

describe("Feature 2 — Recipe Management", () => {
  beforeEach(() => {
    getRecipesByUserIdMock.mockReset();
    getRecipesMock.mockReset();
    addRecipeMock.mockReset();
    localStorage.clear();
  });

  describe("US-2.1 — Create a recipe", () => {
    it("The Add Recipe button is hidden when signed out", async () => {
      getRecipesMock.mockResolvedValue({ data: [] });

      const { wrapper } = await mountWithPlugins(RecipeList);
      await flushPromises();

      expect(findButtonByExactText(wrapper, "Add")).toBeFalsy();
      expect(getRecipesMock).toHaveBeenCalled();
      expect(getRecipesByUserIdMock).not.toHaveBeenCalled();
    });

    it("Signed-in user creates a recipe with valid information", async () => {
      localStorage.setItem("user", JSON.stringify(sampleUser));
      getRecipesByUserIdMock.mockResolvedValue({ data: [] });
      addRecipeMock.mockResolvedValue({
        data: { id: 1, name: "Omelette", userId: sampleUser.id },
      });

      const { wrapper } = await mountWithPlugins(RecipeList, {
        global: {
          stubs: {
            VDialog: {
              props: ["modelValue"],
              template: '<div v-if="modelValue"><slot /></div>',
            },
          },
        },
      });
      await flushPromises();

      expect(getRecipesByUserIdMock).toHaveBeenCalledWith(sampleUser.id);

      await findButtonByExactText(wrapper, "Add").trigger("click");
      await flushPromises();

      await wrapper.find('input[type="text"]').setValue("Omelette");
      await findButtonByExactText(wrapper, "Add Recipe").trigger("click");
      await flushPromises();

      expect(addRecipeMock).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Omelette", userId: sampleUser.id })
      );
    });
  });
});

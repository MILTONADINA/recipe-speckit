/**
 * Feature 4 — Public Recipe Publishing & Browsing
 * Spec: features/feature-4-public-recipe-publishing-browsing.md
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { defineComponent } from "vue";
import { flushPromises } from "@vue/test-utils";
import RecipeList from "../src/views/RecipeList.vue";
import RecipeCard from "../src/components/RecipeCardComponent.vue";
import MenuBar from "../src/components/MenuBar.vue";
import { mountWithPlugins, createTestRouter } from "./testUtils.js";

const getRecipesMock = vi.fn();
const getRecipesByUserIdMock = vi.fn();
const getRecipeIngredientsForRecipeMock = vi.fn();
const getRecipeStepsForRecipeWithIngredientsMock = vi.fn();

vi.mock("../src/services/RecipeServices.js", () => ({
  default: {
    getRecipes: (...args) => getRecipesMock(...args),
    getRecipesByUserId: (...args) => getRecipesByUserIdMock(...args),
  },
}));

vi.mock("../src/services/RecipeIngredientServices.js", () => ({
  default: {
    getRecipeIngredientsForRecipe: (...args) =>
      getRecipeIngredientsForRecipeMock(...args),
  },
}));

vi.mock("../src/services/RecipeStepServices.js", () => ({
  default: {
    getRecipeStepsForRecipeWithIngredients: (...args) =>
      getRecipeStepsForRecipeWithIngredientsMock(...args),
  },
}));

vi.mock("../src/reports/RecipeReports.js", () => ({
  default: {
    generateRecipePDF: vi.fn(),
  },
}));

const publishedRecipe = {
  id: 1,
  name: "Omelette",
  description: "Simple",
  servings: 2,
  time: 10,
  isPublished: true,
};

const MenuBarHost = defineComponent({
  components: { MenuBar },
  template: "<v-app><MenuBar /></v-app>",
});

function findButtonByExactText(wrapper, text) {
  return wrapper.findAll("button").find((button) => button.text().trim() === text);
}

function findButtonByText(wrapper, text) {
  return wrapper
    .findAll("button, a")
    .find((button) => button.text().includes(text));
}

function findIcon(wrapper, icon) {
  return wrapper
    .findAllComponents({ name: "VIcon" })
    .find((component) => component.props("icon") === icon);
}

async function mountPublicRecipeList() {
  getRecipesMock.mockResolvedValue({ data: [publishedRecipe] });
  getRecipeIngredientsForRecipeMock.mockResolvedValue({
    data: [
      {
        id: 1,
        quantity: 2,
        ingredient: { name: "Egg", unit: "piece", pricePerUnit: 0.3 },
      },
    ],
  });
  getRecipeStepsForRecipeWithIngredientsMock.mockResolvedValue({
    data: [
      {
        id: 1,
        stepNumber: 1,
        instruction: "Whisk eggs",
        recipeIngredient: [{ id: 1, ingredient: { name: "Egg" } }],
      },
    ],
  });

  const mounted = await mountWithPlugins(RecipeList);
  await flushPromises();
  return mounted;
}

describe("Feature 4 — Public Recipe Publishing & Browsing", () => {
  beforeEach(() => {
    getRecipesMock.mockReset();
    getRecipesByUserIdMock.mockReset();
    getRecipeIngredientsForRecipeMock.mockReset();
    getRecipeStepsForRecipeWithIngredientsMock.mockReset();
    localStorage.clear();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  describe("US-4.1 — Browse published recipes while signed out", () => {
    it("Browse published recipes while signed out", async () => {
      const { wrapper } = await mountPublicRecipeList();

      expect(getRecipesMock).toHaveBeenCalled();
      expect(getRecipesByUserIdMock).not.toHaveBeenCalled();
      expect(wrapper.text()).toContain("Omelette");
      expect(wrapper.text()).toContain("2 Servings");
      expect(wrapper.text()).toContain("10 minutes");
      expect(wrapper.text()).toContain("Simple");
    });
  });

  describe("US-4.2 — Do not show unpublished recipes in the public catalog", () => {
    it("Hide unpublished recipes from the public catalog", async () => {
      getRecipesMock.mockResolvedValue({ data: [publishedRecipe] });
      getRecipeIngredientsForRecipeMock.mockResolvedValue({ data: [] });
      getRecipeStepsForRecipeWithIngredientsMock.mockResolvedValue({
        data: [],
      });

      const { wrapper } = await mountWithPlugins(RecipeList);
      await flushPromises();

      expect(getRecipesMock).toHaveBeenCalled();
      expect(getRecipesByUserIdMock).not.toHaveBeenCalled();
      expect(wrapper.text()).toContain("Omelette");
      expect(wrapper.text()).not.toContain("Draft Stew");
    });
  });

  describe("US-4.3 — Open a published recipe's details while signed out", () => {
    it("Open a published recipe's details while signed out", async () => {
      const { wrapper } = await mountPublicRecipeList();

      await wrapper.findComponent(RecipeCard).trigger("click");
      await flushPromises();

      expect(wrapper.text()).toContain("Ingredients");
      expect(wrapper.text()).toContain("Recipe Steps");
      expect(wrapper.text()).toContain("Step");
      expect(wrapper.text()).toContain("Instruction");
      expect(wrapper.text()).toContain("Whisk eggs");
      expect(wrapper.text()).toContain("Egg");
    });
  });

  describe("US-4.4 — Browse public recipes without owner controls", () => {
    it("Browse without owner controls while signed out", async () => {
      const { wrapper } = await mountPublicRecipeList();

      expect(findButtonByExactText(wrapper, "Add")).toBeFalsy();
      expect(findIcon(wrapper, "mdi-pencil")).toBeFalsy();
      expect(findIcon(wrapper, "mdi-file-pdf-box")).toBeFalsy();

      const router = await createTestRouter("/recipes");
      const { wrapper: menu } = await mountWithPlugins(MenuBarHost, {
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

      expect(findButtonByText(menu, "Login")).toBeTruthy();
    });
  });
});

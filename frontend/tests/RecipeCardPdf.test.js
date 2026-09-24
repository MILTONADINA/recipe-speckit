/**
 * Feature 5 — Recipe PDF Export
 * Spec: features/feature-5-recipe-pdf-export.md
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { flushPromises } from "@vue/test-utils";
import RecipeCard from "../src/components/RecipeCardComponent.vue";
import RecipeReports from "../src/reports/RecipeReports.js";
import { mountWithPlugins } from "./testUtils.js";

const getRecipeIngredientsForRecipeMock = vi.fn();
const getRecipeStepsForRecipeWithIngredientsMock = vi.fn();

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

const sampleUser = {
  email: "jane.doe@example.com",
  firstName: "Jane",
  lastName: "Doe",
  id: 1,
  token: "test-token",
};

const sampleRecipe = {
  id: 7,
  name: "Omelette",
  description: "Simple",
  servings: 2,
  time: 10,
  isPublished: true,
};

function findIcon(wrapper, icon) {
  return wrapper
    .findAllComponents({ name: "VIcon" })
    .find((component) => component.props("icon") === icon);
}

async function mountRecipeCard() {
  getRecipeIngredientsForRecipeMock.mockResolvedValue({ data: [] });
  getRecipeStepsForRecipeWithIngredientsMock.mockResolvedValue({ data: [] });

  return mountWithPlugins(RecipeCard, {
    props: { recipe: sampleRecipe },
  });
}

describe("Feature 5 — Recipe PDF Export", () => {
  beforeEach(() => {
    getRecipeIngredientsForRecipeMock.mockReset();
    getRecipeStepsForRecipeWithIngredientsMock.mockReset();
    RecipeReports.generateRecipePDF.mockReset();
    localStorage.clear();
  });

  describe("US-5.1 — See the PDF control when signed in", () => {
    it("Signed-in user sees the PDF control on a recipe card", async () => {
      localStorage.setItem("user", JSON.stringify(sampleUser));
      const { wrapper } = await mountRecipeCard();
      await flushPromises();

      expect(findIcon(wrapper, "mdi-file-pdf-box")).toBeTruthy();
    });
  });

  describe("US-5.2 — Hide the PDF control when signed out", () => {
    it("Signed-out visitor does not see the PDF control on a recipe card", async () => {
      const { wrapper } = await mountRecipeCard();
      await flushPromises();

      expect(findIcon(wrapper, "mdi-file-pdf-box")).toBeFalsy();
    });
  });

  describe("US-5.3 — Export a recipe as a PDF", () => {
    it("Signed-in user starts a PDF export from the recipe card", async () => {
      localStorage.setItem("user", JSON.stringify(sampleUser));
      const { wrapper } = await mountRecipeCard();
      await flushPromises();

      await findIcon(wrapper, "mdi-file-pdf-box").trigger("click");
      await flushPromises();

      expect(RecipeReports.generateRecipePDF).toHaveBeenCalledWith(sampleRecipe);
    });
  });

  describe("US-5.4 — Keep PDF download separate from editing", () => {
    it("PDF export does not navigate to recipe edit", async () => {
      localStorage.setItem("user", JSON.stringify(sampleUser));
      const { wrapper, router } = await mountRecipeCard();
      const push = vi.spyOn(router, "push");
      await flushPromises();

      await findIcon(wrapper, "mdi-file-pdf-box").trigger("click");
      await flushPromises();

      expect(RecipeReports.generateRecipePDF).toHaveBeenCalledWith(sampleRecipe);
      expect(push).not.toHaveBeenCalled();
    });
  });
});

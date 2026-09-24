/**
 * Feature 5 — Recipe PDF Export
 * Spec: features/feature-5-recipe-pdf-export.md
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import RecipeReports from "../src/reports/RecipeReports.js";

const getRecipeIngredientsForRecipeMock = vi.fn();
const getRecipeStepsForRecipeWithIngredientsMock = vi.fn();
const saveMock = vi.fn();
const textMock = vi.fn();
const autoTableMock = vi.fn();
const setFontSizeMock = vi.fn();

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

vi.mock("jspdf-autotable", () => ({}));

vi.mock("jspdf", () => {
  return {
    default: vi.fn().mockImplementation(() => {
      const doc = {
        addImage: vi.fn(),
        setFontSize: setFontSizeMock,
        text: textMock,
        autoTable: autoTableMock,
        save: saveMock,
        internal: { pageSize: { height: 11 } },
      };
      setFontSizeMock.mockReturnValue(doc);
      return doc;
    }),
  };
});

const sampleRecipe = {
  id: 7,
  name: "Omelette",
  description: "Simple breakfast",
};

const sampleIngredients = [
  {
    id: 1,
    quantity: 2,
    ingredient: {
      name: "Egg",
      unit: "piece",
      pricePerUnit: 0.5,
    },
  },
];

const sampleSteps = [
  {
    id: 1,
    stepNumber: 1,
    instruction: "Beat the eggs",
    recipeIngredient: [{ id: 1, ingredient: { name: "Egg" } }],
  },
];

describe("Feature 5 — Recipe PDF Export", () => {
  beforeEach(() => {
    getRecipeIngredientsForRecipeMock.mockReset();
    getRecipeStepsForRecipeWithIngredientsMock.mockReset();
    saveMock.mockReset();
    textMock.mockReset();
    autoTableMock.mockReset();
    setFontSizeMock.mockReset();
  });

  describe("US-5.3 — Export a recipe as a PDF", () => {
    it("PDF export includes the recipe information", async () => {
      getRecipeIngredientsForRecipeMock.mockResolvedValue({
        data: sampleIngredients,
      });
      getRecipeStepsForRecipeWithIngredientsMock.mockResolvedValue({
        data: sampleSteps,
      });

      await RecipeReports.generateRecipePDF(sampleRecipe);

      expect(getRecipeIngredientsForRecipeMock).toHaveBeenCalledWith(
        sampleRecipe.id
      );
      expect(getRecipeStepsForRecipeWithIngredientsMock).toHaveBeenCalledWith(
        sampleRecipe.id
      );

      const writtenText = textMock.mock.calls.map((call) => String(call[0]));
      expect(writtenText).toEqual(
        expect.arrayContaining([
          "Omelette",
          "Simple breakfast",
          "Ingredients",
          "2 pieces of Egg ($0.5/piece)",
          "Steps",
        ])
      );

      expect(autoTableMock).toHaveBeenCalled();
      const tableArg = autoTableMock.mock.calls[0][0];
      expect(tableArg.body[0].stepNumber).toBe(1);
      expect(tableArg.body[0].instruction).toBe("Beat the eggs");
      expect(tableArg.body[0].ingredientList).toBe("Egg");
    });

    it("PDF export works with no ingredients", async () => {
      getRecipeIngredientsForRecipeMock.mockResolvedValue({ data: [] });
      getRecipeStepsForRecipeWithIngredientsMock.mockResolvedValue({
        data: sampleSteps,
      });

      await RecipeReports.generateRecipePDF(sampleRecipe);

      expect(saveMock).toHaveBeenCalledWith("recipeReport.pdf");
    });

    it("PDF export works with no steps", async () => {
      getRecipeIngredientsForRecipeMock.mockResolvedValue({
        data: sampleIngredients,
      });
      getRecipeStepsForRecipeWithIngredientsMock.mockResolvedValue({
        data: [],
      });

      await RecipeReports.generateRecipePDF(sampleRecipe);

      expect(saveMock).toHaveBeenCalledWith("recipeReport.pdf");
    });

    it("PDF export saves the file as recipeReport.pdf", async () => {
      getRecipeIngredientsForRecipeMock.mockResolvedValue({ data: [] });
      getRecipeStepsForRecipeWithIngredientsMock.mockResolvedValue({
        data: [],
      });

      await RecipeReports.generateRecipePDF(sampleRecipe);

      expect(saveMock).toHaveBeenCalledWith("recipeReport.pdf");
    });
  });
});

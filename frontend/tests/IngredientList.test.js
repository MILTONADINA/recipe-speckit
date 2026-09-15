/**
 * Feature 3 — Ingredient Catalog
 * Spec: features/feature-3-ingredient-catalog.md
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { flushPromises } from "@vue/test-utils";
import IngredientList from "../src/views/IngredientList.vue";
import { mountWithPlugins } from "./testUtils.js";

const getIngredientsMock = vi.fn();
const addIngredientMock = vi.fn();
const updateIngredientMock = vi.fn();

vi.mock("../src/services/IngredientServices.js", () => ({
  default: {
    getIngredients: (...args) => getIngredientsMock(...args),
    addIngredient: (...args) => addIngredientMock(...args),
    updateIngredient: (...args) => updateIngredientMock(...args),
  },
}));

const sampleUser = {
  email: "jane.doe@example.com",
  firstName: "Jane",
  lastName: "Doe",
  id: 1,
  token: "test-token",
};

const sampleIngredient = {
  id: 1,
  name: "Flour",
  unit: "cup",
  pricePerUnit: 0.25,
};

const dialogStub = {
  global: {
    stubs: {
      VDialog: {
        props: ["modelValue"],
        template: '<div v-if="modelValue"><slot /></div>',
      },
    },
  },
};

function findButtonByExactText(wrapper, text) {
  return wrapper.findAll("button").find((button) => button.text().trim() === text);
}

function findPencilIcon(wrapper) {
  return wrapper
    .findAllComponents({ name: "VIcon" })
    .find((icon) => icon.props("icon") === "mdi-pencil");
}

function findFieldByLabel(wrapper, componentName, label) {
  return wrapper
    .findAllComponents({ name: componentName })
    .find((field) => field.props("label") === label);
}

describe("Feature 3 — Ingredient Catalog", () => {
  beforeEach(() => {
    getIngredientsMock.mockReset();
    addIngredientMock.mockReset();
    updateIngredientMock.mockReset();
    localStorage.clear();
  });

  describe("US-3.1 — View the Ingredient Catalog", () => {
    it("View the ingredient catalog", async () => {
      getIngredientsMock.mockResolvedValue({ data: [sampleIngredient] });

      const { wrapper } = await mountWithPlugins(IngredientList);
      await flushPromises();

      expect(getIngredientsMock).toHaveBeenCalled();
      expect(wrapper.text()).toContain("Flour");
      expect(wrapper.text()).toContain("cup");
      expect(wrapper.text()).toContain("$0.25");
    });
  });

  describe("US-3.2 — Add an Ingredient", () => {
    it("Add an ingredient successfully", async () => {
      localStorage.setItem("user", JSON.stringify(sampleUser));
      getIngredientsMock
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: [sampleIngredient] });
      addIngredientMock.mockResolvedValue({ data: sampleIngredient });

      const { wrapper } = await mountWithPlugins(IngredientList, dialogStub);
      await flushPromises();

      await findButtonByExactText(wrapper, "Add").trigger("click");
      await flushPromises();

      await findFieldByLabel(wrapper, "VTextField", "Name").setValue("Flour");
      await findFieldByLabel(wrapper, "VSelect", "Unit").setValue("cup");
      await findFieldByLabel(wrapper, "VTextField", "Price Per Unit").setValue(
        0.25
      );
      await findButtonByExactText(wrapper, "Add Ingredient").trigger("click");
      await flushPromises();

      expect(addIngredientMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Flour",
          unit: "cup",
          pricePerUnit: 0.25,
        })
      );
      expect(wrapper.text()).toContain("Flour");
      expect(wrapper.text()).toContain("cup");
      expect(wrapper.text()).toContain("$0.25");
    });
  });

  describe("US-3.3 — Edit an Ingredient", () => {
    it("Open an ingredient for editing", async () => {
      localStorage.setItem("user", JSON.stringify(sampleUser));
      getIngredientsMock.mockResolvedValue({ data: [sampleIngredient] });

      const { wrapper } = await mountWithPlugins(IngredientList, dialogStub);
      await flushPromises();

      await findPencilIcon(wrapper).trigger("click");
      await flushPromises();

      expect(wrapper.text()).toContain("Edit Ingredient");
      expect(findFieldByLabel(wrapper, "VTextField", "Name").props("modelValue")).toBe(
        "Flour"
      );
      expect(findFieldByLabel(wrapper, "VSelect", "Unit").props("modelValue")).toBe(
        "cup"
      );
      expect(
        Number(
          findFieldByLabel(wrapper, "VTextField", "Price Per Unit").props(
            "modelValue"
          )
        )
      ).toBe(0.25);
    });

    it("Update an ingredient successfully", async () => {
      localStorage.setItem("user", JSON.stringify(sampleUser));
      getIngredientsMock
        .mockResolvedValueOnce({ data: [sampleIngredient] })
        .mockResolvedValueOnce({
          data: [{ ...sampleIngredient, name: "Wheat Flour" }],
        });
      updateIngredientMock.mockResolvedValue({
        data: { message: "Ingredient was updated successfully." },
      });

      const { wrapper } = await mountWithPlugins(IngredientList, dialogStub);
      await flushPromises();

      await findPencilIcon(wrapper).trigger("click");
      await flushPromises();

      await findFieldByLabel(wrapper, "VTextField", "Name").setValue(
        "Wheat Flour"
      );
      await findButtonByExactText(wrapper, "Update Ingredient").trigger("click");
      await flushPromises();

      expect(updateIngredientMock).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          name: "Wheat Flour",
          unit: "cup",
          pricePerUnit: 0.25,
        })
      );
      expect(wrapper.text()).toContain("Wheat Flour");
    });
  });
});

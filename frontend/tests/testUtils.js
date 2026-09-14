import { mount } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import { createMemoryHistory, createRouter } from "vue-router";

export const vuetify = createVuetify({ components, directives });

export async function createTestRouter(initialPath = "/") {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", name: "login", component: { template: "<div />" } },
      { path: "/recipes", name: "recipes", component: { template: "<div />" } },
      { path: "/recipe/:id", name: "editRecipe", component: { template: "<div />" } },
      { path: "/ingredients", name: "ingredients", component: { template: "<div />" } },
    ],
  });

  await router.push(initialPath);
  await router.isReady();

  return router;
}

export async function mountWithPlugins(component, options = {}) {
  const { router: providedRouter, global, attachTo, ...rest } = options;
  const router = providedRouter ?? (await createTestRouter());

  const wrapper = mount(component, {
    attachTo,
    ...rest,
    global: {
      plugins: [vuetify, router],
      ...global,
    },
  });

  return { wrapper, router };
}

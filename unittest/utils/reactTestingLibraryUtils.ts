import { render, queries, RenderOptions } from "@testing-library/react";
import * as customQueries from "./customQueries";

const customRender = (
  ui: any,
  options?: Pick<RenderOptions<typeof queries>, "container" | "baseElement" | "hydrate" | "wrapper">
) => render(ui, { queries: { ...queries, ...customQueries }, ...options });

// re-export everything
export * from "@testing-library/react";

// override render method
export { customRender as render };

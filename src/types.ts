import * as webjsx from "webjsx";

export type PageGenerator = (
  params: Record<string, string>,
  query: string
) => AsyncGenerator<webjsx.VNode, void, void>;

// In types.ts
export type ComponentGenerator = (
  component: any,
  attributes: Record<string, string>
) => AsyncGenerator<webjsx.VNode, void, void>;

export interface ComponentOptions {
  shadow?: "open" | "closed";
  observedAttributes?: string[];
}

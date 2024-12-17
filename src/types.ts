import * as webjsx from "webjsx";

export type PageGenerator = (
  params: Record<string, string>,
  query: string
) => AsyncGenerator<webjsx.VNode, void, void>;

export interface BloomComponent<TProps = any> {
  render(): void;
  connected: boolean;
}

export type ComponentGenerator<TProps = any> = (
  component: BloomComponent<TProps>,
  props: TProps
) => AsyncGenerator<webjsx.VNode, void, void>;

export interface ComponentOptions {
  shadow?: "open" | "closed";
  styles?: string;
}

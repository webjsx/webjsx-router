import * as webjsx from "webjsx";

export type PageGenerator = (
  params: Record<string, string>,
  query: string
) => AsyncGenerator<webjsx.VNode, webjsx.VNode | void, void>;

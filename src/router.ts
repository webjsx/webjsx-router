import { PageGenerator } from "./types.js";

export interface Route {
  pattern: string;
  pageGenerator: PageGenerator;
}

export class Router {
  private routes: Route[] = [];

  addRoute(pattern: string, pageGenerator: PageGenerator): void {
    this.routes.push({ pattern, pageGenerator });
  }

  matchRoute(
    path: string
  ): { pageGenerator: PageGenerator; params: Record<string, string> } | null {
    for (const { pattern, pageGenerator } of this.routes) {
      const regex = new RegExp(
        "^" + pattern.replace(/:[^\s/]+/g, "([\\w-]+)") + "$"
      );
      const match = path.match(regex);
      if (match) {
        const keys = [...pattern.matchAll(/:([^\s/]+)/g)].map((m) => m[1]);
        const params = keys.reduce(
          (acc: Record<string, string>, key: string, idx: number) => {
            acc[key] = match[idx + 1];
            return acc;
          },
          {}
        );
        return { pageGenerator, params };
      }
    }
    return null;
  }
}

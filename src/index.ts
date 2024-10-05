import * as webjsx from "webjsx";

type PageGenerator = (
  params: Record<string, string>,
  query: string
) => AsyncGenerator<webjsx.VNode, void, void>;

export class Bloom {
  private routes: { pattern: string; pageGenerator: PageGenerator }[] = [];
  private currentIterator: AsyncGenerator<webjsx.VNode, void, void> | null =
    null;
  private updatePromise: Promise<void> | null = null;
  private resolveUpdate: (() => void) | null = null;
  private appContainer: HTMLElement;

  constructor(elementOrId: string | HTMLElement) {
    if (typeof elementOrId === "string") {
      const el = document.getElementById(elementOrId);
      if (!el) {
        throw new Error(`Element with ID ${elementOrId} not found`);
      }
      this.appContainer = el;
    } else {
      this.appContainer = elementOrId;
    }
  }

  // Register a route with a pattern and its corresponding page generator
  public page(pattern: string, pageGenerator: PageGenerator): void {
    this.routes.push({ pattern, pageGenerator });
  }

  // Initialize updatePromise which controls when to call the next VNode
  private resetUpdatePromise(): void {
    this.updatePromise = new Promise((resolve) => {
      this.resolveUpdate = resolve;
    });
  }

  // Match a URL against the route patterns
  private matchRoute(
    path: string
  ): { pageGenerator: PageGenerator; params: Record<string, string> } | null {
    for (const { pattern, pageGenerator } of this.routes) {
      const regex = new RegExp(
        "^" + pattern.replace(/:[^\s/]+/g, "([\\w-]+)") + "$"
      );
      const match = path.match(regex);
      if (match) {
        // Extract parameter names from the route pattern
        const keys = [...pattern.matchAll(/:([^\s/]+)/g)].map((m) => m[1]);
        // Map matched segments to parameter names
        const params = keys.reduce(
          (acc: Record<string, string>, key: string, idx: number) => {
            acc[key] = match[idx + 1]; // The first match is the whole path, so params start from index 1
            return acc;
          },
          {}
        );
        return { pageGenerator, params };
      }
    }
    return null; // No match found
  }

  // Navigate to a specific route and start the rendering loop
  public async goto(path: string): Promise<void> {
    const [routePath, query] = path.split("?");
    const match = this.matchRoute(routePath);

    if (match) {
      const { pageGenerator, params } = match;
      this.currentIterator = pageGenerator(params, query || ""); // Pass params and query to generator
      this.resetUpdatePromise(); // Initialize the promise for the first render
      this.startRenderingLoop();
      return this.updatePromise as Promise<void>;
    } else {
      console.error(`No route matches the path: ${path}`);
    }
  }

  // Signal the internal promise to continue to the next generator step
  public render(): void {
    if (this.resolveUpdate) {
      this.resolveUpdate(); // Resolve the promise to signal that rendering can proceed
    }
  }

  // Rendering loop: pulls from the generator and renders the VNode
  private async startRenderingLoop(): Promise<void> {
    while (this.currentIterator) {
      // Get the next VNode from the generator
      const { value: vdom, done } = await this.currentIterator.next();

      // If the generator is done, exit the loop
      if (done) break;

      // Apply the new virtual DOM node to the actual DOM
      webjsx.applyDiff(this.appContainer, vdom);

      this.resolveUpdate!();

      this.resetUpdatePromise(); // Reset promise for the next iteration

      // And wait.
      await this.updatePromise;
    }
  }
}

import * as webjsx from "webjsx";
import {
  ComponentGenerator,
  ComponentOptions,
  PageGenerator,
} from "./types.js";
import { defineComponent } from "./component.js";
import { Router } from "./router.js";

type PropType = string | number | boolean | object | null | undefined;

export class Bloom {
  private router: Router = new Router();
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

    window.addEventListener("popstate", () => {
      this.handleNavigation(location.pathname + location.search);
    });
  }

  public component<TProps extends { [K in keyof TProps]: PropType }>(
    name: string,
    generator: ComponentGenerator<TProps>,
    initialProps: TProps,
    options: ComponentOptions = {}
  ): void {
    defineComponent(name, generator, initialProps, options);
  }

  public page(pattern: string, pageGenerator: PageGenerator): void {
    this.router.addRoute(pattern, pageGenerator);
  }

  public async goto(path: string): Promise<void> {
    history.pushState(null, "", path);
    await this.handleNavigation(path);
    return (await this.updatePromise) as void;
  }

  private async handleNavigation(path: string) {
    const [routePath, query] = path.split("?");
    const match = this.router.matchRoute(routePath);

    if (match) {
      const { pageGenerator, params } = match;
      this.currentIterator = pageGenerator(params, query || "");
      this.resetUpdatePromise();
      this.startRenderingLoop();
    } else {
      console.error(`No route matches the path: ${path}`);
    }
  }

  private resetUpdatePromise(): void {
    this.updatePromise = new Promise((resolve) => {
      this.resolveUpdate = resolve;
    });
  }

  public render(): void {
    if (this.resolveUpdate) {
      this.resolveUpdate();
    }
  }

  private async startRenderingLoop(): Promise<void> {
    while (this.currentIterator) {
      const { value: vdom, done } = await this.currentIterator.next();

      if (done) break;

      webjsx.applyDiff(this.appContainer, vdom);

      this.resolveUpdate!();

      this.resetUpdatePromise();

      await this.updatePromise;
    }
  }
}

export * from "./types.js";

import { expect } from "chai";
import { JSDOM } from "jsdom";
import { match, goto, initRouter } from "../index.js";
import { setupJSDOM } from "./setup.js";
import * as webjsx from "webjsx";

describe("Core Routing", () => {
  let dom: JSDOM;
  let container: HTMLElement;
  let renderCount: number;

  beforeEach(() => {
    dom = setupJSDOM();
    container = document.createElement("div");
    document.body.appendChild(container);
    renderCount = 0;
  });

  afterEach(() => {
    dom.window.close();
  });

  describe("Router Initialization", () => {
    it("should perform initial render", () => {
      initRouter(container, () => <div id="app">Initial Content</div>);
      expect(container.innerHTML).to.include("Initial Content");
    });

    it("should re-render on goto", () => {
      initRouter(container, () => {
        renderCount++;
        return (
          match("/about", () => <div id="about">About</div>) ||
          match("/", () => <div id="home">Home</div>)
        );
      });

      expect(renderCount).to.equal(1); // Initial render

      goto("/about");
      expect(renderCount).to.equal(2);
      expect(container.innerHTML).to.include("About");

      goto("/");
      expect(renderCount).to.equal(3);
      expect(container.innerHTML).to.include("Home");
    });

    it("should re-render on popstate", (done) => {
      initRouter(container, () => {
        renderCount++;
        return (
          match("/page1", () => <div id="page1">Page 1</div>) ||
          match("/page2", () => <div id="page2">Page 2</div>)
        );
      });

      goto("/page1");
      goto("/page2");

      const initialRenderCount = renderCount;

      window.addEventListener("popstate", () => {
        expect(renderCount).to.equal(initialRenderCount + 1);
        expect(container.innerHTML).to.include("Page 1");
        done();
      });

      window.history.back();
    });
  });

  describe("Component Integration", () => {
    it("should preserve component state across routes", () => {
      class CounterElement extends HTMLElement {
        private count = 0;

        connectedCallback() {
          this.render();
        }

        increment() {
          this.count++;
          this.render();
        }

        render() {
          webjsx.applyDiff(
            this,
            <div>
              Count: <span class="count">{this.count}</span>
              <button onclick={() => this.increment()}>+</button>
            </div>
          );
        }
      }

      if (!customElements.get("test-counter")) {
        customElements.define("test-counter", CounterElement);
      }

      initRouter(container, () => {
        return (
          match("/counter", () => <test-counter />) ||
          match("/", () => <div>Home</div>)
        );
      });

      // Navigate to counter
      goto("/counter");
      const counter = container.querySelector("test-counter")!;
      const button = counter.querySelector("button")!;

      // Increment counter
      button.click();
      expect(counter.querySelector(".count")!.textContent).to.equal("1");

      // Navigate away and back
      goto("/");
      goto("/counter");

      // Counter should reset (new instance)
      const newCounter = container.querySelector("test-counter")!;
      expect(newCounter.querySelector(".count")!.textContent).to.equal("0");
    });
  });
});

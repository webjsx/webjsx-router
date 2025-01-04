import { expect } from "chai";
import { JSDOM } from "jsdom";
import { match, goto, initRouter } from "../index.js";
import { setupJSDOM } from "./setup.js";

describe("Router Rendering", () => {
  let dom: JSDOM;
  let container: HTMLElement;

  beforeEach(() => {
    dom = setupJSDOM();
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    dom.window.close();
  });

  it("should handle errors in render functions", () => {
    let originalConsoleError = console.error;
    console.error = () => {}; // Suppress error output

    try {
      const erroringRender = () => {
        return (
          match("/error", () => {
            throw new Error("Render error");
            return <div>Never reached</div>;
          }) || <div>Home</div>
        );
      };

      initRouter(container, erroringRender);

      // Should render home initially
      expect(container.innerHTML).to.include("Home");

      goto("/error");

      // Should fallback to home when error route fails
      expect(container.innerHTML).to.include("Home");
    } finally {
      console.error = originalConsoleError; // Restore error output
    }
  });

  it("should support nested routes", () => {
    initRouter(container, () => {
      return (
        match("/users/:userId/posts/:postId", (params) => (
          <div id="user-post">
            <span class="user-id">{params.userId}</span>
            <span class="post-id">{params.postId}</span>
          </div>
        )) || <div>Not Found</div>
      );
    });

    goto("/users/123/posts/456");

    expect(container.querySelector(".user-id")!.textContent).to.equal("123");
    expect(container.querySelector(".post-id")!.textContent).to.equal("456");
  });

  it("should handle query parameters in renders", () => {
    initRouter(container, () => {
      return (
        match("/search", (params, query) => (
          <div id="search">
            <span class="query">{query.q}</span>
            <span class="sort">{query.sort}</span>
          </div>
        )) || <div>Not Found</div>
      );
    });

    goto("/search", { q: "test", sort: "desc" });

    expect(container.querySelector(".query")!.textContent).to.equal("test");
    expect(container.querySelector(".sort")!.textContent).to.equal("desc");
  });

  it("should handle consecutive navigations", () => {
    let renderCount = 0;

    initRouter(container, () => {
      renderCount++;
      return (
        match("/page/:id", (params) => <div class="page">{params.id}</div>) || (
          <div>Home</div>
        )
      );
    });

    goto("/page/1");
    goto("/page/2");
    goto("/page/3");

    expect(renderCount).to.equal(4); // Initial + 3 navigations
    expect(container.querySelector(".page")!.textContent).to.equal("3");
  });
});

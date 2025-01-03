import { expect } from "chai";
import { Router } from "../index.js";
import "./setup.js";
import { setupJSDOM } from "./setup.js";

describe("Magic Loop Router Rendering", () => {
  let router: Router;

  beforeEach(() => {
    setupJSDOM();
    const appElement = document.createElement("div");
    appElement.id = "app";
    document.body.appendChild(appElement);
    router = new Router(appElement);
  });

  afterEach(() => {
    window.close();
  });

  it("should render the initial page content", async () => {
    router.page("/home", async function* () {
      yield <div id="home">Home Page</div>;
    });

    await router.goto("/home");

    const homeElement = document.getElementById("home");
    expect(homeElement).to.not.be.null;
    expect(homeElement!.textContent).to.equal("Home Page");
  });

  it("should trigger re-render on router.render()", async () => {
    router.page("/home", async function* () {
      let count = 0;

      function increment() {
        count++;
        router.render();
      }

      while (true) {
        yield (
          <div>
            <p id="count">{count}</p>
            <button id="increment" onclick={increment}>
              Increment
            </button>
          </div>
        );
      }
    });

    await router.goto("/home");

    const countElement = document.getElementById("count");
    const button = document.getElementById("increment") as HTMLElement;

    expect(countElement!.textContent).to.equal("0");

    button.click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(countElement!.textContent).to.equal("1");
  });

  it("should render different pages when navigating between routes", async () => {
    router.page("/home", async function* () {
      yield <div id="home">Home Page</div>;
    });

    router.page("/about", async function* () {
      yield <div id="about">About Page</div>;
    });

    await router.goto("/home");
    let homeElement = document.getElementById("home");
    expect(homeElement).to.not.be.null;
    expect(homeElement!.textContent).to.equal("Home Page");

    await router.goto("/about");
    let aboutElement = document.getElementById("about");
    expect(aboutElement).to.not.be.null;
    expect(aboutElement!.textContent).to.equal("About Page");
  });

  it("should handle dynamic route rendering", async () => {
    router.page("/city/:location", async function* (params) {
      yield <div id="city">Weather in {params.location}</div>;
    });

    await router.goto("/city/London");
    const cityElement = document.getElementById("city");

    expect(cityElement).to.not.be.null;
    expect(cityElement!.textContent).to.equal("Weather in London");
  });
});

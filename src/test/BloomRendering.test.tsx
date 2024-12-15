import { expect } from "chai";
import { Bloom } from "../index.js";
import "./setup.js";
import { setupJSDOM } from "./setup.js";
import * as webjsx from "webjsx";

describe("Bloom Rendering", () => {
  let bloom: Bloom;

  beforeEach(() => {
    setupJSDOM();
    const appElement = document.createElement("div");
    appElement.id = "app";
    document.body.appendChild(appElement);
    bloom = new Bloom(appElement);
  });

  afterEach(() => {
    window.close();
  });

  it("should render the initial page content", async () => {
    bloom.page("/home", async function* () {
      yield <div id="home">Home Page</div>;
    });

    await bloom.goto("/home");

    const homeElement = document.getElementById("home");
    expect(homeElement).to.not.be.null;
    expect(homeElement!.textContent).to.equal("Home Page");
  });

  it("should trigger re-render on bloom.render()", async () => {
    bloom.page("/home", async function* () {
      let count = 0;

      function increment() {
        count++;
        bloom.render();
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

    await bloom.goto("/home");

    const countElement = document.getElementById("count");
    const button = document.getElementById("increment") as HTMLElement;

    expect(countElement!.textContent).to.equal("0");

    button.click();
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(countElement!.textContent).to.equal("1");
  });

  it("should render different pages when navigating between routes", async () => {
    bloom.page("/home", async function* () {
      yield <div id="home">Home Page</div>;
    });

    bloom.page("/about", async function* () {
      yield <div id="about">About Page</div>;
    });

    await bloom.goto("/home");
    let homeElement = document.getElementById("home");
    expect(homeElement).to.not.be.null;
    expect(homeElement!.textContent).to.equal("Home Page");

    await bloom.goto("/about");
    let aboutElement = document.getElementById("about");
    expect(aboutElement).to.not.be.null;
    expect(aboutElement!.textContent).to.equal("About Page");
  });

  it("should handle dynamic route rendering", async () => {
    bloom.page("/city/:location", async function* (params) {
      yield <div id="city">Weather in {params.location}</div>;
    });

    await bloom.goto("/city/London");
    const cityElement = document.getElementById("city");

    expect(cityElement).to.not.be.null;
    expect(cityElement!.textContent).to.equal("Weather in London");
  });
});

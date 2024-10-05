import { expect } from "chai";
import { Bloom } from "../index.js"; // Adjust path based on your actual setup
import "./setup.js";
import { setupJSDOM } from "./setup.js";
import * as webjsx from "webjsx"; // Ensure this library is set up to handle JSX

describe("Bloom", () => {
  let bloom: Bloom;

  beforeEach(() => {
    setupJSDOM();
    bloom = new Bloom();
  });

  afterEach(() => {
    window.close();
  });

  // ROUTING TESTS
  describe("Routing", () => {
    it("should register a simple route", () => {
      bloom.page("/home", async function* () {
        yield <div />;
      });

      expect(bloom["routes"]).to.have.length(1);
      expect(bloom["routes"][0].pattern).to.equal("/home");
    });

    it("should match a route with no params", async () => {
      bloom.page("/about", async function* () {
        yield <div />;
      });

      const match = bloom["matchRoute"]("/about");
      expect(match).to.not.be.null;
      expect(match!.params).to.deep.equal({});
    });

    it("should match a route with dynamic params", async () => {
      bloom.page("/city/:location", async function* () {
        yield <div />;
      });

      const match = bloom["matchRoute"]("/city/NewYork");
      expect(match).to.not.be.null;
      expect(match!.params).to.deep.equal({ location: "NewYork" });
    });

    it("should not match a non-existent route", async () => {
      bloom.page("/home", async function* () {
        yield <div />;
      });

      const match = bloom["matchRoute"]("/nonexistent");
      expect(match).to.be.null;
    });
  });

  // RENDERING TESTS
  describe("Rendering", () => {
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
          bloom.render(); // Trigger the re-render
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

      // Simulate a click on the button
      button.click();
      await new Promise((resolve) => setTimeout(resolve, 10)); // Give time for re-render

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
});

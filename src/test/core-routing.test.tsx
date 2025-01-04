import { expect } from "chai";
import { JSDOM } from "jsdom";
import { match } from "../index.js";
import { setupJSDOM } from "./setup.js";

describe("Core Routing", () => {
  let dom: JSDOM;

  beforeEach(() => {
    dom = setupJSDOM();
  });

  afterEach(() => {
    dom.window.close();
  });

  describe("Basic Matching", () => {
    it("should match static routes", () => {
      window.history.pushState({}, "", "/about");

      const result = match("/about", () => <div id="about">About</div>);
      expect(result).to.not.be.undefined;
      expect((result as any).props.id).to.equal("about");
    });

    it("should return undefined for non-matching routes", () => {
      window.history.pushState({}, "", "/about");

      const result = match("/contact", () => <div>Contact</div>);
      expect(result).to.be.undefined;
    });

    it("should handle trailing slashes correctly", () => {
      window.history.pushState({}, "", "/about/");
      const result = match("/about", () => <div />);
      expect(result).to.be.undefined;
    });

    it("should support OR chaining", () => {
      window.history.pushState({}, "", "/contact");

      const result =
        match("/about", () => <div>About</div>) ||
        match("/contact", () => <div id="contact">Contact</div>) ||
        <div>Not Found</div>;

      expect((result as any).props.id).to.equal("contact");
    });

    it("should fallback to last option if no routes match", () => {
      window.history.pushState({}, "", "/nonexistent");

      const result = match("/about", () => <div>About</div>) ||
        match("/contact", () => <div>Contact</div>) || (
          <div id="not-found">Not Found</div>
        );

      expect((result as any).props.id).to.equal("not-found");
    });
  });

  describe("Browser Navigation", () => {
    it("should respond to pushState navigation", () => {
      window.history.pushState({}, "", "/about");

      const aboutResult = match("/about", () => <div id="about">About</div>);
      expect((aboutResult as any).props.id).to.equal("about");

      window.history.pushState({}, "", "/contact");

      const contactResult = match("/contact", () => (
        <div id="contact">Contact</div>
      ));
      expect((contactResult as any).props.id).to.equal("contact");
    });

    it("should respond to popstate events", (done) => {
      window.history.pushState({}, "", "/page1");
      window.history.pushState({}, "", "/page2");

      window.addEventListener("popstate", () => {
        const result = match("/page1", () => <div id="page1">Page 1</div>);
        expect((result as any).props.id).to.equal("page1");
        done();
      });

      window.history.back();
    });
  });
});
import { expect } from "chai";
import { JSDOM } from "jsdom";
import { match } from "../index.js";
import { setupJSDOM } from "./setup.js";

describe("Parameter Routing", () => {
  let dom: JSDOM;

  beforeEach(() => {
    dom = setupJSDOM();
  });

  afterEach(() => {
    dom.window.close();
  });

  describe("Parameter Extraction", () => {
    it("should extract single parameter", () => {
      window.history.pushState({}, "", "/users/123");

      let extractedParams: any;
      match("/users/:id", (params) => {
        extractedParams = params;
        return <div />;
      });

      expect(extractedParams).to.deep.equal({ id: "123" });
    });

    it("should extract multiple parameters", () => {
      window.history.pushState({}, "", "/users/123/posts/456");

      let extractedParams: any;
      match("/users/:userId/posts/:postId", (params) => {
        extractedParams = params;
        return <div />;
      });

      expect(extractedParams).to.deep.equal({
        userId: "123",
        postId: "456"
      });
    });

    it("should not match if parameter segments are missing", () => {
      window.history.pushState({}, "", "/users");

      const result = match("/users/:id", () => <div />);
      expect(result).to.be.undefined;
    });

    it("should handle parameters in middle of segments", () => {
      window.history.pushState({}, "", "/org/123/settings");

      let params: any;
      match("/org/:id/settings", (p) => {
        params = p;
        return <div />;
      });

      expect(params).to.deep.equal({ id: "123" });
    });

    it("should handle special characters in parameters", () => {
      window.history.pushState({}, "", "/files/my-file-name.txt");

      let params: any;
      match("/files/:filename", (p) => {
        params = p;
        return <div />;
      });

      expect(params.filename).to.equal("my-file-name.txt");
    });
  });
});
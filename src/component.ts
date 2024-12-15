import * as webjsx from "webjsx";
import { ComponentGenerator, ComponentOptions } from "./types.js";

export function defineComponent(
  name: string,
  generator: ComponentGenerator,
  options: ComponentOptions = {}
): void {
  class BloomComponent extends HTMLElement {
    private iterator: AsyncGenerator<webjsx.VNode, void, void> | null = null;
    private root: ShadowRoot | HTMLElement;
    private _isConnected = false;
    private resolveUpdate: (() => void) | null = null;
    private currentVNode: webjsx.VNode | null = null;
    private initialAttributes: Record<string, string> = {};

    constructor() {
      super();
      this.root = options.shadow
        ? this.attachShadow({ mode: options.shadow })
        : this;
    }

    get connected(): boolean {
      return this._isConnected;
    }

    private getAttributes(): Record<string, string> {
      const attributes: Record<string, string> = {
        ...this.initialAttributes,
      };

      for (const attr of this.attributes) {
        attributes[attr.name] = attr.value;
      }
      return attributes;
    }

    async connectedCallback() {
      this._isConnected = true;
      await this.resetIterator();
    }

    disconnectedCallback() {
      this._isConnected = false;
      this.iterator = null;
      this.resolveUpdate = null;
      this.currentVNode = null;
    }

    render() {
      if (this.resolveUpdate) {
        this.resolveUpdate();
      }
    }

    private async resetIterator() {
      this.iterator = generator(this, this.getAttributes());
      await this.startRenderLoop();
    }

    private async startRenderLoop() {
      while (this.iterator && this._isConnected) {
        const { value: vdom, done } = await this.iterator.next();

        if (done || !this._isConnected) break;

        this.currentVNode = vdom;
        webjsx.applyDiff(this.root, vdom);

        await new Promise<void>((resolve) => {
          this.resolveUpdate = resolve;
        });
      }
    }

    static get observedAttributes() {
      return options.observedAttributes || [];
    }

    async attributeChangedCallback() {
      if (this._isConnected) {
        await this.resetIterator();
      }
    }

    // Add support for setting attributes via JSX
    setAttribute(name: string, value: string) {
      this.initialAttributes[name] = value;
      super.setAttribute(name, value);
    }
  }

  const elementName = name.includes("-") ? name : `bloom-${name}`;

  if (!customElements.get(elementName)) {
    customElements.define(elementName, BloomComponent);
  }
}

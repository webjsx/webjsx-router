import * as webjsx from "webjsx";
import {
  BloomComponent,
  ComponentGenerator,
  ComponentOptions,
} from "./types.js";

type PropType = string | number | boolean | object | null | undefined;

function isSerializableProp(value: any): boolean {
  const type = typeof value;
  return type === "string" || type === "number" || type === "boolean";
}

function deserializeAttribute(
  value: string | null,
  originalPropValue: any
): any {
  if (value === null) return value;

  const type = typeof originalPropValue;
  switch (type) {
    case "number":
      return Number(value);
    case "boolean":
      return true;
    default:
      return value;
  }
}

function serializeProp(value: any): string {
  if (typeof value === "boolean") {
    return "";
  }
  return String(value);
}

export function defineComponent<
  TProps extends { [K in keyof TProps]: PropType }
>(
  name: string,
  generator: ComponentGenerator<TProps>,
  initialProps: TProps,
  options: ComponentOptions = {}
): void {
  const observedProps = new Set<string>();
  const nonObservedProps = new Set<string>();

  for (const [key, value] of Object.entries(initialProps)) {
    if (isSerializableProp(value)) {
      observedProps.add(key);
    } else {
      nonObservedProps.add(key);
    }
  }

  class BloomComponentImpl
    extends HTMLElement
    implements BloomComponent<TProps>
  {
    private iterator: AsyncGenerator<webjsx.VNode, void, void> | null = null;
    private root: ShadowRoot | HTMLElement;
    private _isConnected = false;
    private resolveUpdate: (() => void) | null = null;
    private currentVNode: webjsx.VNode | null = null;
    private props: TProps;
    private propsProxy: TProps;

    constructor() {
      super();

      if (options.shadow) {
        this.root = this.attachShadow({ mode: options.shadow });
        if (options.styles) {
          const style = document.createElement("style");
          style.textContent = options.styles;
          this.root.appendChild(style);
        }
      } else {
        this.root = this;
      }

      this.props = { ...initialProps };

      // Initialize the internal props
      for (const [key, value] of Object.entries(initialProps)) {
        if (isSerializableProp(value)) {
          this.setAttribute(key, serializeProp(value));
        }
      }

      // Create a proxy that will be passed to the generator
      this.propsProxy = new Proxy({} as TProps, {
        get: (_, prop: string) => {
          return this.props[prop as keyof TProps];
        },
        set: (_, prop: string, value) => {
          this.set(prop as keyof TProps, value);
          return true;
        },
      });
    }

    get connected(): boolean {
      return this._isConnected;
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

    attributeChangedCallback(
      name: string,
      oldValue: string | null,
      newValue: string | null
    ) {
      if (oldValue === newValue) return;

      const currentPropValue = this.props[name as keyof TProps];
      if (name in this.props && isSerializableProp(currentPropValue)) {
        const parsedValue = deserializeAttribute(newValue, currentPropValue);
        (this.props as any)[name] = parsedValue;

        if (this._isConnected) {
          this.render();
        }
      }
    }

    render() {
      if (this.resolveUpdate) {
        this.resolveUpdate();
      }
    }

    private async resetIterator() {
      this.iterator = generator(this, this.propsProxy);
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

    set<K extends keyof TProps>(name: K, value: TProps[K]) {
      (this.props as any)[name] = value;

      if (isSerializableProp(value)) {
        if (value === false) {
          this.removeAttribute(name as string);
        } else {
          this.setAttribute(name as string, serializeProp(value));
        }
      }

      if (this._isConnected) {
        this.render();
      }
    }

    get<K extends keyof TProps>(name: K): TProps[K] | undefined {
      return this.props[name];
    }

    static get observedAttributes(): string[] {
      return Array.from(observedProps);
    }
  }

  const elementName = name.includes("-") ? name : `bloom-${name}`;

  if (!customElements.get(elementName)) {
    customElements.define(elementName, BloomComponentImpl);
  }
}

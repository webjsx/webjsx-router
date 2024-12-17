import * as webjsx from "webjsx";
import {
  ComponentGenerator,
  ComponentOptions,
  PropType,
  FunctionPropType,
  BloomComponent,
} from "./types.js";

function isSerializableProp(value: any): boolean {
  const type = typeof value;
  return type === "string" || type === "number" || type === "boolean";
}

function isFunctionProp(value: any): value is FunctionPropType {
  return typeof value === "function";
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
  return typeof value === "boolean" ? "" : String(value);
}

export function defineComponent<
  TProps extends { [K in keyof TProps]: PropType | FunctionPropType }
>(
  name: string,
  generator: ComponentGenerator<TProps>,
  initialProps: TProps,
  options: ComponentOptions = {}
): void {
  const observedProps = new Set<string>();
  const nonObservedProps = new Set<string>();
  const functionProps = new Set<string>();

  for (const [key, value] of Object.entries(initialProps)) {
    if (isFunctionProp(value)) {
      functionProps.add(key);
      nonObservedProps.add(key);
    } else if (isSerializableProp(value)) {
      observedProps.add(key);
    } else {
      nonObservedProps.add(key);
    }
  }

  class BloomComponentImpl extends HTMLElement implements BloomComponent {
    private iterator: AsyncGenerator<webjsx.VNode, void, void>;
    private root: ShadowRoot | HTMLElement;
    private _isConnected = false;
    private resolveUpdate: (() => void) | null = null;
    private currentVNode: webjsx.VNode | null = null;

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

      Object.entries(initialProps).forEach(([key, value]) => {
        (this as any)[key] = value;
      });

      Array.from(this.attributes).forEach((attr) => {
        const value = attr.value;
        const key = attr.name;
        const originalValue = initialProps[key as keyof TProps];
        if (originalValue !== undefined && !isFunctionProp(originalValue)) {
          (this as any)[key] = deserializeAttribute(value, originalValue);
        }
      });

      this.iterator = generator(
        this as unknown as HTMLElement & BloomComponent & TProps
      );
    }

    get connected(): boolean {
      return this._isConnected;
    }

    async connectedCallback() {
      this._isConnected = true;
      await this.startRenderLoop();
    }

    disconnectedCallback() {
      this._isConnected = false;
      this.resolveUpdate?.();
      this.resolveUpdate = null;
      this.currentVNode = null;
    }

    setAttribute(name: string, value: string): void {
      super.setAttribute(name, value);
      if (functionProps.has(name)) return;

      
      const currentPropValue = initialProps[name as keyof TProps];
      const parsedValue = deserializeAttribute(value, currentPropValue);
      (this as any)[name] = parsedValue;

      if (this._isConnected) {
        this.render();
      }
    }

    removeAttribute(name: string): void {
      super.removeAttribute(name);
      if (functionProps.has(name)) return;

      const currentPropValue = initialProps[name as keyof TProps];
      const parsedValue = deserializeAttribute(null, currentPropValue);
      (this as any)[name] = parsedValue;

      if (this._isConnected) {
        this.render();
      }
    }

    attributeChangedCallback(
      name: string,
      oldValue: string | null,
      newValue: string | null
    ) {
      if (oldValue === newValue || functionProps.has(name)) return;

      const currentPropValue = initialProps[name as keyof TProps];
      const parsedValue = deserializeAttribute(newValue, currentPropValue);
      (this as any)[name] = parsedValue;

      if (this._isConnected) {
        this.render();
      }
    }

    render() {
      this.resolveUpdate?.();
    }

    private async startRenderLoop() {
      while (this._isConnected) {
        const { value: vdom, done } = await this.iterator.next();
        if (done || !this._isConnected) break;

        this.currentVNode = vdom;
        webjsx.applyDiff(this.root, vdom);

        await new Promise<void>((resolve) => {
          this.resolveUpdate = resolve;
        });
      }
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

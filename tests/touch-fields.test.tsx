// @vitest-environment jsdom
/**
 * Fields on touch screens and iOS Safari: the copy fallbacks select the
 * whole value even where select() only moves the caret, at 16px so iOS
 * doesn't zoom into them, and InputMessage merges a consumer's
 * textareaProps.className with the field's own classes instead of letting
 * it replace them (which dropped the 16px touch size with everything else).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { InputCopy } from "@/registry/default/input-copy";
import { InputMessage } from "@/registry/default/input-message";
import { CopyPromptButton } from "@/lib/docs/copy-prompt-button";
import { fieldTouchClass } from "@/registry/default/lib/type-scale";

afterEach(cleanup);

// jsdom has neither ResizeObserver nor matchMedia; the composer and the
// tooltip want both.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;
Element.prototype.scrollIntoView ??= () => {};
window.matchMedia ??= ((query: string) =>
  ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }) as MediaQueryList) as typeof window.matchMedia;

describe("copy fallbacks on iOS", () => {
  const select = HTMLTextAreaElement.prototype.select;
  const execCommand = document.execCommand;
  const clipboard = Object.getOwnPropertyDescriptor(navigator, "clipboard");
  let copied: { text: string; fontSize: string } | null;

  beforeEach(() => {
    copied = null;
    // No async Clipboard API, as on an http:// LAN address.
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: () => Promise.reject(new Error("insecure context")) },
    });
    // iOS Safari: select() puts the caret at the end and selects nothing.
    HTMLTextAreaElement.prototype.select = function (this: HTMLTextAreaElement) {
      this.setSelectionRange(this.value.length, this.value.length);
    };
    // "Copy" whatever the script-made textarea has selected.
    document.execCommand = vi.fn(() => {
      const field = document.body.querySelector(":scope > textarea") as HTMLTextAreaElement;
      copied = {
        text: field.value.slice(field.selectionStart, field.selectionEnd),
        fontSize: field.style.fontSize,
      };
      return true;
    });
  });

  afterEach(() => {
    HTMLTextAreaElement.prototype.select = select;
    document.execCommand = execCommand;
    if (clipboard) Object.defineProperty(navigator, "clipboard", clipboard);
    else delete (navigator as { clipboard?: unknown }).clipboard;
  });

  const value = "npx shadcn@latest add @fluid/input-copy";
  it.each([
    ["InputCopy", () => render(<InputCopy value={value} />)],
    ["CopyPromptButton", () => render(<CopyPromptButton prompt={value} />)],
  ])("%s copies the whole value from a 16px field", async (_name, mount) => {
    const { container } = mount();
    await act(async () => {
      fireEvent.click(container.querySelector("button")!);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(copied).toEqual({ text: value, fontSize: "16px" });
  });
});

describe("InputMessage textareaProps.className", () => {
  it("adds to the field's classes, so the touch size survives it", () => {
    const { container } = render(
      <InputMessage value="" onValueChange={() => {}} textareaProps={{ className: "font-mono" }} />
    );
    const classes = container.querySelector("textarea")!.className.split(/\s+/);
    expect(classes).toContain("font-mono");
    expect(classes).toContain(fieldTouchClass);
    expect(classes).toContain("resize-none");
  });
});

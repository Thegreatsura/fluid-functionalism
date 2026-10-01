// @vitest-environment jsdom
/**
 * Checkbox and radio groups: a click focuses the row without drawing the
 * keyboard focus ring. The row's mousedown moves focus onto the row with a
 * script focus() call, and Chrome reports that focus as :focus-visible, so the
 * groups have to tell a pointer focus apart on their own. Arrow keys still
 * draw the ring right after a click.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import type { ComponentType } from "react";
import * as baseCheckbox from "@/registry/base/checkbox-group";
import * as radixCheckbox from "@/registry/radix/checkbox-group";
import * as baseRadio from "@/registry/base/radio-group";
import * as radixRadio from "@/registry/radix/radio-group";

// jsdom has no ResizeObserver; the hover hook observes the rows with one.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;

beforeEach(() => {
  // jsdom never matches :focus-visible. Chrome matches it for any script
  // focus(), the mousedown redirect included, which is what the groups face.
  const matches = Element.prototype.matches;
  vi.spyOn(Element.prototype, "matches").mockImplementation(function (
    this: Element,
    selector: string
  ) {
    if (selector === ":focus-visible") return this === document.activeElement;
    return matches.call(this, selector);
  });
  // The ring follows the row's measured rect; jsdom lays nothing out.
  vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(200);
  vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(36);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const labels = ["Apples", "Bananas", "Cherries"];

type CheckboxModule = typeof baseCheckbox;
type RadioModule = typeof baseRadio;

const checkboxGroup = ({ CheckboxGroup, CheckboxItem }: CheckboxModule) => () => (
  <CheckboxGroup checkedIndices={new Set()}>
    {labels.map((label, index) => (
      <CheckboxItem key={label} label={label} index={index} checked={false} onToggle={() => {}} />
    ))}
  </CheckboxGroup>
);

const radioGroup = ({ RadioGroup, RadioItem }: RadioModule) => () => (
  <RadioGroup selectedIndex={0}>
    {labels.map((label, index) => (
      <RadioItem key={label} label={label} index={index} />
    ))}
  </RadioGroup>
);

const groups: [string, "checkbox" | "radio", ComponentType][] = [
  ["Base UI checkbox group", "checkbox", checkboxGroup(baseCheckbox)],
  ["Radix checkbox group", "checkbox", checkboxGroup(radixCheckbox as CheckboxModule)],
  ["Base UI radio group", "radio", radioGroup(baseRadio)],
  ["Radix radio group", "radio", radioGroup(radixRadio as RadioModule)],
];

const nextFrame = () =>
  act(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));

describe.each(groups)("%s", (_name, role, Group) => {
  it("draws no ring on a click, and draws it again on arrow keys", async () => {
    const view = render(<Group />);
    // Two frames: registration schedules the measurement, which then publishes.
    await nextFrame();
    await nextFrame();
    const ring = () => view.container.querySelector('[class*="--focus-ring"]');
    const row = view.getByRole(role, { name: "Bananas" });

    fireEvent.mouseDown(row);
    expect(document.activeElement).toBe(row);
    expect(ring()).toBeNull();

    fireEvent.keyDown(row, { key: "ArrowDown" });
    expect(document.activeElement).toBe(view.getByRole(role, { name: "Cherries" }));
    expect(ring()).not.toBeNull();
  });
});

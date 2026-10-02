// @vitest-environment jsdom
/**
 * Dropdown popup rows: Enter and Space on a focused row select it, and a
 * click selects it exactly once, in both flavors. Base UI's Enter/Space call
 * the item primitive's own onClick prop and dispatch no DOM click, so a
 * handler living on the row div only heard the mouse (issue #33). Radix
 * clicks the row on Enter/Space, so its keyboard path already worked.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import * as Base from "@/registry/base/dropdown";
import * as Radix from "@/registry/radix/dropdown";
import { MenuItem } from "@/registry/default/menu-item";

afterEach(cleanup);

// jsdom has neither ResizeObserver nor matchMedia; the hover hook observes
// the rows with one, the popup's ScrollArea touch check reads the other.
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

const labels = ["Teamspaces", "Recents", "Favorites"];

const flavors = [
  ["base", Base],
  ["radix", Radix],
] as const;

const kinds = ["action", "radio", "checkbox"] as const;
const roles = {
  action: "menuitem",
  radio: "menuitemradio",
  checkbox: "menuitemcheckbox",
} as const;

describe.each(flavors)("%s dropdown popup", (_name, F) => {
  function setup(kind: (typeof kinds)[number]) {
    const onSelect = vi.fn();
    const view = render(
      <F.DropdownMenu defaultOpen>
        <F.DropdownTrigger>Open</F.DropdownTrigger>
        <F.DropdownContent
          checkedIndex={kind === "radio" ? 0 : undefined}
          checkedIndices={kind === "checkbox" ? [0] : undefined}
        >
          {labels.map((label, index) => (
            <MenuItem
              key={label}
              index={index}
              label={label}
              checked={kind === "action" ? undefined : index === 0}
              onSelect={() => onSelect(index)}
            />
          ))}
        </F.DropdownContent>
      </F.DropdownMenu>
    );
    const row = view.getByRole(roles[kind], { name: "Recents" });
    return { row, onSelect };
  }

  for (const kind of kinds) {
    it(`selects a focused ${kind} row with Enter`, () => {
      const { row, onSelect } = setup(kind);
      act(() => row.focus());
      fireEvent.keyDown(row, { key: "Enter" });
      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith(1);
    });

    it(`selects a focused ${kind} row with Space`, () => {
      const { row, onSelect } = setup(kind);
      act(() => row.focus());
      fireEvent.keyDown(row, { key: " " });
      fireEvent.keyUp(row, { key: " " });
      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith(1);
    });

    it(`selects a clicked ${kind} row once`, () => {
      const { row, onSelect } = setup(kind);
      fireEvent.click(row);
      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith(1);
    });
  }
});

// @vitest-environment jsdom
/**
 * Dropdown popup rows: Enter and Space on a focused row select it, and a
 * click selects it exactly once, in both flavors. Base UI's Enter/Space call
 * the item primitive's own onClick prop and dispatch no DOM click, so a
 * handler living on the row div only heard the mouse (issue #33). Radix
 * clicks the row on Enter/Space, so its keyboard path already worked.
 *
 * With a DropdownSearch, the field is one stop in the ring of rows: arrowing
 * off the first or last row returns to it, as its own ↓ / ↑ leave it, and
 * while it has focus no row is highlighted.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { useState } from "react";
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

describe.each(flavors)("%s dropdown search", (_name, F) => {
  function Searchable() {
    const [query, setQuery] = useState("");
    return (
      <F.DropdownMenu defaultOpen>
        <F.DropdownTrigger>Open</F.DropdownTrigger>
        <F.DropdownContent>
          <F.DropdownSearch value={query} onValueChange={setQuery} />
          {labels
            .filter((label) => label.toLowerCase().includes(query.toLowerCase()))
            .map((label, index) => (
              <MenuItem key={label} index={index} label={label} />
            ))}
        </F.DropdownContent>
      </F.DropdownMenu>
    );
  }

  function setup() {
    const view = render(<Searchable />);
    const field = view.getByRole("searchbox");
    const row = (name: string) => view.getByRole("menuitem", { name });
    const lit = () =>
      view.baseElement.querySelector<HTMLElement>("[data-fluid-hover-active]")
        ?.getAttribute("aria-label") ?? null;
    return { field, row, lit };
  }

  it("highlights the focused row, and no row while the field has focus", () => {
    const { field, row, lit } = setup();
    act(() => row("Recents").focus());
    expect(lit()).toBe("Recents");
    act(() => field.focus());
    expect(lit()).toBeNull();
    fireEvent.change(field, { target: { value: "e" } });
    expect(lit()).toBeNull();
  });

  it("clears the highlight when ArrowUp returns to the field", () => {
    const { field, row, lit } = setup();
    act(() => row("Teamspaces").focus());
    expect(lit()).toBe("Teamspaces");
    fireEvent.keyDown(row("Teamspaces"), { key: "ArrowUp" });
    expect(document.activeElement).toBe(field);
    expect(lit()).toBeNull();
  });

  it("returns to the field with ArrowUp on the first row", () => {
    const { field, row } = setup();
    act(() => row("Teamspaces").focus());
    fireEvent.keyDown(row("Teamspaces"), { key: "ArrowUp" });
    expect(document.activeElement).toBe(field);
  });

  it("returns to the field with ArrowDown on the last row", () => {
    const { field, row } = setup();
    act(() => row("Favorites").focus());
    fireEvent.keyDown(row("Favorites"), { key: "ArrowDown" });
    expect(document.activeElement).toBe(field);
  });

  it("leaves arrows between rows to the menu", () => {
    const { field, row } = setup();
    act(() => row("Recents").focus());
    fireEvent.keyDown(row("Recents"), { key: "ArrowUp" });
    expect(document.activeElement).not.toBe(field);
  });

  it("leaves the field for the first and last row", () => {
    const { field, row } = setup();
    act(() => field.focus());
    fireEvent.keyDown(field, { key: "ArrowDown" });
    expect(document.activeElement).toBe(row("Teamspaces"));
    act(() => field.focus());
    fireEvent.keyDown(field, { key: "ArrowUp" });
    expect(document.activeElement).toBe(row("Favorites"));
  });
});

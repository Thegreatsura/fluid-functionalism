// @vitest-environment jsdom
/**
 * Base UI checkbox group: a click on the square toggles its row exactly once.
 * Base UI replays a click on the square onto its hidden input, which sits
 * inside the row, so the row and the primitive's change handler could both
 * see it. With a functional updater the two toggles cancel out and the
 * square looks dead; a closure updater would hide the bug.
 */
import { afterEach, expect, it } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { useState } from "react";
import { CheckboxGroup, CheckboxItem } from "@/registry/base/checkbox-group";

afterEach(cleanup);

// jsdom has no ResizeObserver; the hover hook observes the rows with one.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;

const labels = ["Email", "Push", "SMS"];

function Settings() {
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const toggle = (index: number) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  return (
    <CheckboxGroup checkedIndices={checked}>
      {labels.map((label, index) => (
        <CheckboxItem
          key={label}
          label={label}
          index={index}
          checked={checked.has(index)}
          onToggle={() => toggle(index)}
        />
      ))}
    </CheckboxGroup>
  );
}

function setup() {
  const view = render(<Settings />);
  // The row is the accessible checkbox; the primitive inside it is aria-hidden.
  const row = view.getByRole("checkbox", { name: "Push" });
  const square = row.querySelector<HTMLElement>('span[role="checkbox"]')!;
  return { row, square };
}

it("checks and unchecks the item from the square", () => {
  const { row, square } = setup();
  expect(square).not.toBeNull();

  fireEvent.click(square);
  expect(row.getAttribute("aria-checked")).toBe("true");

  fireEvent.click(square);
  expect(row.getAttribute("aria-checked")).toBe("false");
});

it("checks the item from the row, as before", () => {
  const { row } = setup();
  fireEvent.click(row);
  expect(row.getAttribute("aria-checked")).toBe("true");
});

// @vitest-environment jsdom
/**
 * Gap clicks: the highlight promises a target, and `handlers.onClick` makes
 * the click keep that promise. A click between rows (a gap, the padding,
 * past the last row) lands on the highlighted row; a click inside a row, or
 * on a control that sits between rows, is left alone.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { useRef, type ReactNode } from "react";
import {
  useFluidHover,
  useRegisterFluidHoverItem,
  ACTIVE_ATTR,
  ACTIVE_INDEX_ATTR,
} from "@/registry/default/hooks/use-fluid-hover";

// No vitest globals, so Testing Library does not unmount between tests on its own.
afterEach(cleanup);

type Api = ReturnType<typeof useFluidHover>;

function Row({
  index,
  registerItem,
  onClick,
  children,
}: {
  index: number;
  registerItem: Api["registerItem"];
  onClick?: () => void;
  children?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useRegisterFluidHoverItem(registerItem, index, ref);
  return (
    <div ref={ref} data-testid={`row-${index}`} onClick={onClick}>
      {children ?? `Row ${index}`}
    </div>
  );
}

/** A box around a button: the sidebar's row shape. */
function BoxedRow({
  index,
  registerItem,
  onClick,
}: {
  index: number;
  registerItem: Api["registerItem"];
  onClick: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useRegisterFluidHoverItem(registerItem, index, ref);
  return (
    <div ref={ref} data-testid={`row-${index}`}>
      <button type="button" onClick={onClick}>
        Row {index}
      </button>
    </div>
  );
}

function List({
  expose,
  rows,
  boxed,
  disabled,
}: {
  expose: (api: Api) => void;
  rows: Array<() => void>;
  boxed?: boolean;
  disabled?: (el: HTMLElement) => boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const api = useFluidHover(ref, { isItemDisabled: disabled });
  expose(api);
  const RowKind = boxed ? BoxedRow : Row;
  return (
    <div ref={ref} data-testid="list" {...api.handlers}>
      <input data-testid="search" placeholder="Search" />
      {rows.map((onClick, i) => (
        <RowKind key={i} index={i} registerItem={api.registerItem} onClick={onClick} />
      ))}
      <span data-testid="gap">gap</span>
    </div>
  );
}

function setup(opts: { boxed?: boolean; disabled?: boolean } = {}) {
  const clicks = [vi.fn(), vi.fn(), vi.fn()];
  let api!: Api;
  const utils = render(
    <List
      expose={(a) => (api = a)}
      rows={clicks}
      boxed={opts.boxed}
      disabled={opts.disabled ? (el) => el.dataset.testid === "row-1" : undefined}
    />
  );
  const highlight = (index: number | null) => act(() => api.setActiveIndex(index));
  return { ...utils, clicks, highlight };
}

describe("useFluidHover: gap clicks land on the highlighted row", () => {
  it("a click between rows activates the highlighted row", () => {
    const { getByTestId, clicks, highlight } = setup();
    highlight(1);
    fireEvent.click(getByTestId("gap"));
    expect(clicks[1]).toHaveBeenCalledTimes(1);
    expect(clicks[0]).not.toHaveBeenCalled();
  });

  it("a click on the container itself counts as a gap", () => {
    const { getByTestId, clicks, highlight } = setup();
    highlight(2);
    fireEvent.click(getByTestId("list"));
    expect(clicks[2]).toHaveBeenCalledTimes(1);
  });

  it("does nothing when no row is highlighted", () => {
    const { getByTestId, clicks, highlight } = setup();
    highlight(null);
    fireEvent.click(getByTestId("gap"));
    for (const c of clicks) expect(c).not.toHaveBeenCalled();
  });

  it("a click inside a row is the row's own, not routed", () => {
    const { getByTestId, clicks, highlight } = setup();
    highlight(1);
    fireEvent.click(getByTestId("row-0"));
    expect(clicks[0]).toHaveBeenCalledTimes(1);
    expect(clicks[1]).not.toHaveBeenCalled();
  });

  it("a control between rows keeps its click (the search field)", () => {
    const { getByTestId, clicks, highlight } = setup();
    highlight(1);
    fireEvent.click(getByTestId("search"));
    for (const c of clicks) expect(c).not.toHaveBeenCalled();
  });

  it("never activates a disabled row", () => {
    const { getByTestId, clicks, highlight } = setup({ disabled: true });
    highlight(1);
    fireEvent.click(getByTestId("gap"));
    for (const c of clicks) expect(c).not.toHaveBeenCalled();
  });

  it("lands on the control inside a boxed row, so a sidebar link still fires", () => {
    const { getByTestId, clicks, highlight } = setup({ boxed: true });
    highlight(0);
    fireEvent.click(getByTestId("gap"));
    expect(clicks[0]).toHaveBeenCalledTimes(1);
  });
});

describe("useFluidHover: the hover state is in the DOM", () => {
  it("marks the highlighted row and the container's index", () => {
    const { getByTestId, highlight } = setup();
    highlight(1);
    expect(getByTestId("row-1").hasAttribute(ACTIVE_ATTR)).toBe(true);
    expect(getByTestId("row-0").hasAttribute(ACTIVE_ATTR)).toBe(false);
    expect(getByTestId("list").getAttribute(ACTIVE_INDEX_ATTR)).toBe("1");
  });

  it("moves the mark when the highlight moves, and clears it on null", () => {
    const { getByTestId, highlight } = setup();
    highlight(1);
    highlight(2);
    expect(getByTestId("row-1").hasAttribute(ACTIVE_ATTR)).toBe(false);
    expect(getByTestId("row-2").hasAttribute(ACTIVE_ATTR)).toBe(true);
    expect(getByTestId("list").getAttribute(ACTIVE_INDEX_ATTR)).toBe("2");
    highlight(null);
    expect(getByTestId("row-2").hasAttribute(ACTIVE_ATTR)).toBe(false);
    expect(getByTestId("list").hasAttribute(ACTIVE_INDEX_ATTR)).toBe(false);
  });
});

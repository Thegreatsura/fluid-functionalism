// @vitest-environment jsdom
/**
 * Button accepts both ways of rendering as another element: Radix's
 * `asChild` and Base UI's `render`. The shadcn CLI rewrites `asChild` to
 * `render` (plus `nativeButton={false}`) when it installs into a Base UI
 * project, so components that pass a link to Button (BannerAction's `href`)
 * must come out the same either way, in both flavors.
 */
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { Button as RadixButton } from "@/registry/radix/button";
import { Button as BaseButton } from "@/registry/base/button";

const flavors = [
  ["radix", RadixButton],
  ["base", BaseButton],
] as const;

describe.each(flavors)("%s Button", (_name, Button) => {
  it("renders a plain link with asChild", () => {
    const { container } = render(
      <Button asChild>
        <a href="/docs">Read the docs</a>
      </Button>
    );
    const link = container.querySelector("a");
    expect(link?.getAttribute("href")).toBe("/docs");
    expect(link?.textContent).toContain("Read the docs");
    expect(container.querySelector("button")).toBeNull();
  });

  it("renders the same plain link with render and nativeButton", () => {
    const { container } = render(
      <Button render={<a href="/docs" />} nativeButton={false}>
        Read the docs
      </Button>
    );
    const link = container.querySelector("a");
    expect(link?.getAttribute("href")).toBe("/docs");
    expect(link?.textContent).toContain("Read the docs");
    expect(container.querySelector("button")).toBeNull();
    // No Base UI button semantics bolted onto the link, and the parity prop
    // never reaches the DOM.
    expect(link?.getAttribute("role")).toBeNull();
    expect(link?.hasAttribute("nativebutton")).toBe(false);
    expect(link?.hasAttribute("nativeButton")).toBe(false);
  });

  it("keeps the render element's own children when Button has none", () => {
    const { container } = render(<Button render={<a href="/docs">Read the docs</a>} />);
    const link = container.querySelector("a");
    expect(link?.getAttribute("href")).toBe("/docs");
    expect(link?.textContent).toContain("Read the docs");
  });

  it("still renders a native button by default", () => {
    const { container } = render(<Button>Save</Button>);
    expect(container.querySelector("button")?.textContent).toContain("Save");
  });
});

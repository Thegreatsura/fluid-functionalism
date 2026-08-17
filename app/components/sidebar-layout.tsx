"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
  useSidebar,
} from "@/components/flavored/sidebar";
import { SiteSidebar } from "@/app/components/sidebar";
import { RightPanel } from "@/app/components/right-panel";
import { RightRailProvider } from "@/lib/right-rail";
import { systemList, componentList } from "@/lib/docs/components";

const pageOrder = [
  "/",
  "/docs",
  ...systemList.map((s) => `/docs/${s.slug}`),
  ...componentList.map((c) => `/docs/${c.slug}`),
];

/** Closes the mobile sheet whenever the route changes. */
function CloseSheetOnNavigate() {
  const { setOpenMobile } = useSidebar();
  const pathname = usePathname();
  useEffect(() => {
    setOpenMobile(false);
  }, [pathname, setOpenMobile]);
  return null;
}

interface SidebarLayoutProps {
  children: ReactNode;
  /** Server-read sidebar_state cookie value (see app/layout.tsx). */
  defaultOpen?: boolean;
}

export function SidebarLayout({ children, defaultOpen = true }: SidebarLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isFullscreen =
    pathname === "/demo" ||
    pathname === "/compare" ||
    pathname === "/stars" ||
    pathname.startsWith("/concepts");

  // Arrow key navigation between pages — ref-based so held keys keep advancing
  // (closures over `pathname` would re-bind per nav and lose key-repeat events).
  const expectedIndexRef = useRef(pageOrder.indexOf(pathname));
  useEffect(() => {
    expectedIndexRef.current = pageOrder.indexOf(pathname);
  }, [pathname]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      const tag = (e.target as HTMLElement).tagName;
      const role = (e.target as HTMLElement).getAttribute("role");
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        (e.target as HTMLElement).isContentEditable ||
        role === "slider" ||
        role === "tablist" ||
        role === "radiogroup" ||
        role === "listbox" ||
        role === "menu"
      ) return;

      // Also skip if focus is inside a component that uses arrow keys
      const closest = (e.target as HTMLElement).closest(
        "[role=slider],[role=tablist],[role=radiogroup],[role=listbox],[role=menu],[role=menubar]"
      );
      if (closest) return;

      const currentIndex = expectedIndexRef.current;
      if (currentIndex === -1) return;

      const nextIndex = e.key === "ArrowLeft" ? currentIndex - 1 : currentIndex + 1;
      if (nextIndex < 0 || nextIndex >= pageOrder.length) return;

      e.preventDefault();
      expectedIndexRef.current = nextIndex;
      router.push(pageOrder[nextIndex]);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  if (isFullscreen) {
    return (
      <main className="min-h-screen">
        {children}
      </main>
    );
  }

  return (
    <RightRailProvider>
      {/* The Sidebar component, dogfooded: the provider owns the desktop
          collapse (⌘B + cookie persistence via app/layout.tsx) and the
          mobile sheet. The site switches rail ↔ sheet at xl, so the
          breakpoint is 1280 instead of the component's 768 default. */}
      <SidebarProvider defaultOpen={defaultOpen} mobileBreakpoint={1280} className="min-h-screen">
        <SiteSidebar />
        <CloseSheetOnNavigate />

        {/* Mobile trigger for the sheet; desktop collapse uses ⌘B or the rail */}
        <SidebarTrigger
          className="xl:hidden fixed top-4 left-4 z-50"
          aria-label="Open navigation"
        />

        {/* Main content */}
        <SidebarInset className="min-w-0">
          {children}
        </SidebarInset>

        {/* Desktop right panel */}
        <RightPanel />
      </SidebarProvider>
    </RightRailProvider>
  );
}

export default SidebarLayout;

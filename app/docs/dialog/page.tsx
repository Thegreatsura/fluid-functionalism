"use client";

import { useState } from "react";
import { Button } from "@/registry/radix/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/flavored/dialog";
import { SettingsDialog } from "@/components/dialog-sidebar/settings-dialog";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { PropsTable, type PropDef } from "@/lib/docs/PropsTable";
import { DocPage, DocSection } from "@/lib/docs/DocPage";

const basicCode = `import {
  Button, Dialog, DialogTrigger, DialogContent,
  DialogHeader, DialogFooter, DialogTitle,
  DialogDescription, DialogClose,
} from "./components";

<Dialog>
  <DialogTrigger render={<Button variant="tertiary">Open dialog</Button>} />
  <DialogContent size="sm">
    <DialogHeader>
      <DialogTitle>Create teamspace</DialogTitle>
      <DialogDescription>
        Add a new teamspace to organize your projects.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <DialogClose render={<Button variant="ghost">Cancel</Button>} />
      <Button>Create</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>`;

const sizesCode = `import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, Button } from "./components";

{/* sm 400 · lg 540 · xl 880 — each one notch narrower in compact regions */}
<Dialog>
  <DialogTrigger render={<Button variant="secondary">Small</Button>} />
  <DialogContent size="sm">…</DialogContent>
</Dialog>

<Dialog>
  <DialogTrigger render={<Button variant="secondary">Large</Button>} />
  <DialogContent size="lg">…</DialogContent>
</Dialog>

<Dialog>
  <DialogTrigger render={<Button variant="secondary">Extra large</Button>} />
  <DialogContent size="xl">…</DialogContent>
</Dialog>`;

const sidebarCode = `import { Button } from "./components";
import { SettingsDialog } from "./components/dialog-sidebar/settings-dialog";

const [open, setOpen] = useState(false);

<Button variant="secondary" onClick={() => setOpen(true)}>Open settings</Button>
<SettingsDialog open={open} onOpenChange={setOpen} />

// Inside the block: the xl dialog drops its padding and takes a fixed
// height, so a non-collapsing Sidebar can run its full left edge while
// the panel scrolls beside it.
<DialogContent size="xl" className="flex h-[min(640px,calc(100dvh-4rem))] overflow-hidden p-0">
  <SidebarProvider persist={false} shortcut={null} width="13rem" className="h-full min-h-0">
    <Sidebar collapsible="none" className="hidden h-full sm:flex bg-[rgb(var(--overlay)/0.03)]">
      <SidebarHeader className="px-4 pt-5 pb-2">
        <DialogTitle>Settings</DialogTitle>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarMenu focusRing={false}>{/* one SidebarMenuButton per section */}</SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
    <div className="flex min-w-0 flex-1 flex-col">
      {/* section header, then a ScrollArea with the section's controls */}
    </div>
  </SidebarProvider>
</DialogContent>`;

const dialogProps: PropDef[] = [
  { name: "open", type: "boolean", description: "Controlled open state." },
  { name: "defaultOpen", type: "boolean", default: "false", description: "Initial open state (uncontrolled)." },
  { name: "onOpenChange", type: "(open: boolean) => void", description: "Called when the dialog opens or closes." },
  { name: "modal", type: "boolean", default: "true", description: "Trap focus and lock page scroll while open." },
];

const dialogSlotProps: PropDef[] = [
  { name: "render", type: "ReactElement", description: "Element to render as the control (the composition API shared with DropdownTrigger), e.g. a Button." },
  { name: "asChild", type: "boolean", default: "false", description: "Compose onto the single child element instead — the Radix spelling. Both spellings work on both primitive flavors." },
  { name: "children", type: "ReactNode", description: "Control content when no element is given." },
];

const dialogContentProps: PropDef[] = [
  { name: "size", type: '"sm" | "lg" | "xl"', default: '"sm"', description: "Width of the dialog: 400, 540, or 880. In compact regions each width narrows one notch (360 / 480 / 800) — padding is unchanged (see /docs/sizes). xl is the canvas for composed layouts; pair it with className=\"p-0\" and a fixed height." },
  { name: "container", type: "HTMLElement | null", description: "Portal target. Scopes the overlay and panel to a positioned container instead of the viewport." },
  { name: "children", type: "ReactNode", description: "Content inside the dialog." },
];

function SizeDemo({ size, label }: { size: "sm" | "lg" | "xl"; label: string }) {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="secondary">{label}</Button>} />
      <DialogContent size={size}>
        <DialogHeader>
          <DialogTitle>{label} dialog</DialogTitle>
          <DialogDescription>
            {size === "xl"
              ? "880px wide — room for two columns, a table, or a sidebar beside a panel."
              : size === "lg"
                ? "540px wide — a form with a few fields, or a longer confirmation."
                : "400px wide — a confirmation, a single field, a short message."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="ghost">Close</Button>} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SettingsDialogDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Open settings
      </Button>
      <SettingsDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

export default function DialogDoc() {
  return (
    <DocPage
      title="Dialog"
      slug="dialog"
      description="Modal dialog with spring enter and exit, in three widths."
    >
      <DocSection title="Basic">
        <ComponentPreview code={basicCode}>
          <Dialog>
            <DialogTrigger render={<Button variant="tertiary">Open dialog</Button>} />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create teamspace</DialogTitle>
                <DialogDescription>
                  Add a new teamspace to organize your projects and collaborate with your team.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose render={<Button variant="ghost">Cancel</Button>} />
                <Button>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Sizes">
        <p className="text-subtitle text-muted-foreground">
          Three widths. <code>sm</code> for a confirmation or a single field,{" "}
          <code>lg</code> for a short form, <code>xl</code> when the dialog
          hosts a layout of its own.
        </p>
        <ComponentPreview code={sizesCode}>
          <div className="flex flex-wrap items-center gap-2">
            <SizeDemo size="sm" label="Small" />
            <SizeDemo size="lg" label="Large" />
            <SizeDemo size="xl" label="Extra large" />
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="With a sidebar">
        <p className="text-subtitle text-muted-foreground">
          The <code>dialog-sidebar</code> block: an <code>xl</code> dialog with
          its padding dropped and a fixed height, a non-collapsing Sidebar of
          sections down the left edge, and a scrolling panel of settings
          beside it. Below <code>sm</code> the column hides and a Select takes
          over navigation.
        </p>
        <ComponentPreview code={sidebarCode}>
          <SettingsDialogDemo />
        </ComponentPreview>
      </DocSection>

      <DocSection title="API Reference — Dialog">
        <PropsTable props={dialogProps} />
      </DocSection>

      <DocSection title="API Reference — DialogTrigger / DialogClose">
        <PropsTable props={dialogSlotProps} />
      </DocSection>

      <DocSection title="API Reference — DialogContent">
        <PropsTable props={dialogContentProps} />
      </DocSection>
    </DocPage>
  );
}

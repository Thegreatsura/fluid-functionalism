// Docs-side alias for the installable QueuedStack block — the single source
// of truth lives in registry/blocks/queued-stack.tsx. Existing docs imports
// (QueuedStack, collapsedStackHeight, useQueueCardHeight, QUEUE_CARD_H*) all
// resolve through this re-export.
export * from "@/registry/blocks/queued-stack";

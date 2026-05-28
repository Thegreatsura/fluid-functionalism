"use client";

import { useEffect, useState } from "react";
import { ChatMessage } from "@/registry/default/chat-message";
import { ComponentPreview } from "@/lib/docs/ComponentPreview";
import { PropsTable, type PropDef } from "@/lib/docs/PropsTable";
import { DocPage, DocSection } from "@/lib/docs/DocPage";

const conversationCode = `import { ChatMessage } from "./components";

<div className="flex flex-col gap-2">
  <ChatMessage from="user">
    What does "good design" actually mean? Everyone says it, no one defines it.
  </ChatMessage>
  <ChatMessage from="assistant">
    Good design is mostly invisible — you only notice it when it's missing. It's less about how something looks and more about how effortlessly it lets you do what you came to do.
  </ChatMessage>
  <ChatMessage from="user">
    So function over form?
  </ChatMessage>
  <ChatMessage from="assistant">
    Not quite. Form is part of function — something that feels good to use is, in a real sense, working better. The split between the two is mostly a myth.
  </ChatMessage>
  <ChatMessage from="user">
    That reframes it completely.
  </ChatMessage>
</div>`;

const rolesCode = `import { ChatMessage } from "./components";

<div className="flex flex-col gap-2">
  <ChatMessage from="user">Right-aligned accent bubble.</ChatMessage>
  <ChatMessage from="assistant">Left-aligned muted bubble.</ChatMessage>
</div>`;

const attachmentsCode = `import { ChatMessage } from "./components";

// \`files\` is a standard File[] — e.g. straight from InputMessage's onSend.
<ChatMessage from="user" files={files}>
  Here's the screenshot you asked for.
</ChatMessage>`;

const chatMessageProps: PropDef[] = [
  { name: "from", type: '"user" | "assistant"', description: "Who sent the message. `user` renders a right-aligned accent bubble; `assistant` renders a left-aligned muted bubble. Also sets the entrance transform-origin." },
  { name: "children", type: "ReactNode", description: "Message body rendered inside the bubble. When omitted (attachment-only message) the text bubble is dropped and only the thumbnails show." },
  { name: "files", type: "File[]", description: "Optional attachments rendered as square thumbnails above the bubble. Images use object-cover; PDFs render their first page via pdfjs." },
  { name: "thumbnailSize", type: "number", default: "64", description: "Side length (in pixels) of each attachment thumbnail." },
  { name: "className", type: "string", description: "Merged onto the outer motion wrapper. Useful for tweaking max-width or spacing." },
];

export default function ChatMessageDoc() {
  // A real File so the attachments demo renders an actual thumbnail. Built
  // from a canvas gradient at mount so the page ships no binary asset.
  const [sampleFiles, setSampleFiles] = useState<File[]>([]);
  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 160;
    canvas.height = 160;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const grad = ctx.createLinearGradient(0, 0, 160, 160);
    grad.addColorStop(0, "#6B97FF");
    grad.addColorStop(1, "#A78BFA");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 160, 160);
    canvas.toBlob((blob) => {
      if (blob)
        setSampleFiles([
          new File([blob], "screenshot.png", { type: "image/png" }),
        ]);
    });
  }, []);

  return (
    <DocPage
      title="ChatMessage"
      slug="chat-message"
      description="A single chat transcript entry with baked-in entrance and layout motion. Right-aligned accent bubble for the user, left-aligned muted bubble for the assistant, with optional file attachments."
    >
      <DocSection title="Conversation">
        <ComponentPreview code={conversationCode} minHeightClass="min-h-[220px]">
          <div className="w-full max-w-xl flex flex-col gap-2">
            <ChatMessage from="user">
              What does &ldquo;good design&rdquo; actually mean? Everyone says
              it, no one defines it.
            </ChatMessage>
            <ChatMessage from="assistant">
              Good design is mostly invisible — you only notice it when it&apos;s
              missing. It&apos;s less about how something looks and more about
              how effortlessly it lets you do what you came to do.
            </ChatMessage>
            <ChatMessage from="user">So function over form?</ChatMessage>
            <ChatMessage from="assistant">
              Not quite. Form is part of function — something that feels good to
              use is, in a real sense, working better. The split between the two
              is mostly a myth.
            </ChatMessage>
            <ChatMessage from="user">That reframes it completely.</ChatMessage>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Roles">
        <ComponentPreview code={rolesCode} minHeightClass="min-h-[160px]">
          <div className="w-full max-w-xl flex flex-col gap-2">
            <ChatMessage from="user">Right-aligned accent bubble.</ChatMessage>
            <ChatMessage from="assistant">Left-aligned muted bubble.</ChatMessage>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Attachments">
        <ComponentPreview code={attachmentsCode} minHeightClass="min-h-[200px]">
          <div className="w-full max-w-xl flex flex-col gap-2">
            <ChatMessage from="user" files={sampleFiles}>
              Here&apos;s the screenshot you asked for.
            </ChatMessage>
            <ChatMessage from="assistant">
              Got it — the gradient looks great.
            </ChatMessage>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="API Reference">
        <PropsTable props={chatMessageProps} />
      </DocSection>
    </DocPage>
  );
}

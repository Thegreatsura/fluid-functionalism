"use client";

import { forwardRef, type ReactNode } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { springs } from "@/lib/springs";
import { useShape } from "@/lib/shape-context";
import { FileThumbnail } from "@/registry/default/file-thumbnail";

interface ChatMessageProps
  extends Omit<HTMLMotionProps<"div">, "children"> {
  /** Who sent the message. Drives alignment and bubble colour:
   *  `user` → right-aligned accent bubble, `assistant` → left-aligned muted bubble. */
  from: "user" | "assistant";
  /** Optional attachments rendered as square thumbnails above the bubble. */
  files?: File[];
  /** Side length of each attachment thumbnail in pixels. Defaults to 64. */
  thumbnailSize?: number;
  /** Message body. When omitted the text bubble is dropped (attachment-only message). */
  children?: ReactNode;
}

// ─── ChatMessage ──────────────────────────────────────────────────────────
// A single transcript entry with baked-in entrance + layout motion. Pairs with
// InputMessage's onSend: render one per sent/received message. `layout="position"`
// lets earlier messages slide up smoothly when a new one is appended.
const ChatMessage = forwardRef<HTMLDivElement, ChatMessageProps>(
  ({ from, files, thumbnailSize = 64, children, className, ...props }, ref) => {
    const shape = useShape();
    const isUser = from === "user";

    return (
      <motion.div
        ref={ref}
        layout="position"
        initial={{ opacity: 0, y: 8, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={springs.moderate}
        style={{ transformOrigin: isUser ? "bottom right" : "bottom left" }}
        className={cn(
          "flex max-w-[80%] flex-col gap-1.5",
          isUser ? "items-end self-end" : "items-start self-start",
          className
        )}
        {...props}
      >
        {files && files.length > 0 && (
          <div
            className={cn(
              "flex flex-wrap gap-1.5",
              isUser ? "justify-end" : "justify-start"
            )}
          >
            {files.map((file, i) => (
              <FileThumbnail
                key={`${file.name}-${file.size}-${file.lastModified}-${i}`}
                file={file}
                size={thumbnailSize}
              />
            ))}
          </div>
        )}
        {children != null && children !== "" && (
          <div
            className={cn(
              shape.bg,
              "px-3.5 py-2 text-[14px] whitespace-pre-wrap break-words",
              isUser
                ? "bg-accent text-accent-foreground"
                : "bg-muted text-foreground"
            )}
          >
            {children}
          </div>
        )}
      </motion.div>
    );
  }
);

ChatMessage.displayName = "ChatMessage";

export { ChatMessage };
export type { ChatMessageProps };
export default ChatMessage;

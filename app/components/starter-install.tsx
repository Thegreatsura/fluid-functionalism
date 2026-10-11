"use client";

import { track } from "@vercel/analytics";
import { InputCopy } from "@/registry/default/input-copy";
import { CopyPromptButton } from "@/lib/docs/copy-prompt-button";
import { buildStarterPrompt, starterCommand } from "@/lib/docs/install-prompt";
import { describeSettings } from "@/lib/starter/install";
import { useThemeContext } from "@/registry/default/lib/theme-context";
import { useShapeContext } from "@/lib/shape-context";
import { useSizeContext } from "@/lib/size-context";
import { useIconLibrary } from "@/lib/docs/icon-playground";
import { useBase } from "@/lib/base-context";
import type { StarterSettings } from "@/lib/starter/settings";

/** The current "Make them yours" settings, as the starter spells them. */
function useStarterSettings(): StarterSettings {
  const { theme } = useThemeContext();
  const { shape } = useShapeContext();
  const { size } = useSizeContext();
  const { iconLibrary } = useIconLibrary();
  const { base } = useBase();
  return { theme, shape, size, icons: iconLibrary, base };
}

/**
 * Home page install: one command that scaffolds a new app with every
 * component, and a Copy prompt for coding agents. Both follow the "Make them
 * yours" settings, so changing one in the panel (or with T, R, S, I) changes
 * what gets installed.
 */
export function StarterInstall() {
  const settings = useStarterSettings();
  const command = starterCommand(settings);
  const prompt = buildStarterPrompt(settings);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-site-body text-muted-foreground">
        Start a new app with every component, set to your choices:{" "}
        {describeSettings(settings)}.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <InputCopy
          value={command}
          align="left"
          className="min-w-0 sm:flex-1"
          aria-label="Starter install command"
          onCopy={() => track("Starter command copied", { base: settings.base })}
        />
        <CopyPromptButton
          prompt={prompt}
          className="shrink-0"
          onCopy={() => track("Starter prompt copied", { base: settings.base })}
        />
      </div>
    </div>
  );
}

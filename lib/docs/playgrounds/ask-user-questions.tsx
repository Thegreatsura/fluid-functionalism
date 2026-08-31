"use client";

import { useState } from "react";
import {
  AskUserQuestions,
  type AskUserQuestion,
} from "@/registry/default/ask-user-questions";
import { Switch } from "@/registry/radix/switch";
import {
  PLAY_SWITCH,
  PlayDivider,
  PlayField,
  PlaySection,
  PlaySelect,
  PlaygroundPanel,
} from "@/lib/docs/playground";
import {
  AUQ_PRESET_DEF,
  encodeAuqPreset,
  decodeAuqPreset,
  AUQ_DEFAULT_CODE,
  AUQ_OPTION_QUESTIONS,
  AUQ_FREE_TEXT_QUESTIONS,
  AUQ_OTHER_PLACEHOLDER,
  auqQuestionLines,
} from "@/lib/preset/ask-user-questions-options";
import {
  usePresetUrlSync,
  usePresetGlobals,
  GetCodeDialog,
} from "@/lib/docs/preset-ui";
import type { PlaygroundProps } from "./types";

// ── AskUserQuestions playground ──────────────────────────
// A live sandbox: the controls rebuild a real question flow (remounting it so
// the flow restarts from question 1), with the matching code kept in sync in
// the doc page's Code tab.

type PlayType = "options" | "freeText";
type PlayLayout = "inline" | "stacked";
type PlayChip = "right" | "left";

// Question data + the shared literal emitter live in the preset options
// module, so the Code tab and the installable preset can never drift.
const OPTION_QUESTIONS = AUQ_OPTION_QUESTIONS;
const FREE_TEXT_QUESTIONS = AUQ_FREE_TEXT_QUESTIONS;

interface PlayConfig {
  type: PlayType;
  layout: PlayLayout;
  chip: PlayChip;
  multiSelect: boolean;
  allowOther: boolean;
  multiline: boolean;
  count: number;
  skippable: boolean;
}

function buildQuestions(o: PlayConfig): AskUserQuestion[] {
  if (o.type === "freeText") {
    return FREE_TEXT_QUESTIONS.slice(0, o.count).map((q) => ({
      id: q.id,
      title: q.title,
      freeText: true,
      freeTextMultiline: o.multiline ? undefined : false,
      freeTextPlaceholder: q.placeholder,
      skippable: o.skippable ? undefined : false,
    }));
  }
  return OPTION_QUESTIONS.slice(0, o.count).map((q) => ({
    id: q.id,
    title: q.title,
    layout: o.layout === "stacked" ? ("stacked" as const) : undefined,
    chipPosition: o.chip === "left" ? ("left" as const) : undefined,
    multiSelect: o.multiSelect || undefined,
    allowOther: o.allowOther || undefined,
    otherPlaceholder: o.allowOther ? AUQ_OTHER_PLACEHOLDER : undefined,
    skippable: o.skippable ? undefined : false,
    options: q.options.map((opt) => ({
      id: opt.id,
      title: opt.title,
      description: o.layout === "stacked" ? opt.long : opt.short,
    })),
  }));
}

function buildAskCode(o: PlayConfig) {
  const l: string[] = [];
  l.push(`import { AskUserQuestions } from "./components";`);
  l.push(``);
  // The questions literal comes from the same emitter the install preset
  // uses — Code tab and installed file are identical by construction.
  l.push(...auqQuestionLines({ ...o, count: o.count as 1 | 2 | 3 }));
  l.push(``);
  l.push(`<AskUserQuestions`);
  l.push(`  questions={questions}`);
  l.push(`  onComplete={(answers) => console.log(answers)}`);
  l.push(`/>`);
  return l.join("\n");
}

export function AskUserQuestionsPlayground({ children }: PlaygroundProps) {
  const [type, setType] = useState<PlayType>("options");
  const [layout, setLayout] = useState<PlayLayout>("inline");
  const [chip, setChip] = useState<PlayChip>("right");
  const [multiSelect, setMultiSelect] = useState(false);
  const [allowOther, setAllowOther] = useState(false);
  const [multiline, setMultiline] = useState(true);
  const [count, setCount] = useState("3");
  const [skippable, setSkippable] = useState(true);
  // Bumped by Replay (and shuffle) so the flow restarts even when the config
  // itself didn't change.
  const [replaySeed, setReplaySeed] = useState(0);

  const isFreeText = type === "freeText";
  const config: PlayConfig = {
    type,
    layout,
    chip,
    multiSelect,
    allowOther,
    multiline,
    count: Number(count),
    skippable,
  };

  // Preset code: ?preset= reopens this configuration; Get code installs it.
  const globals = usePresetGlobals();
  const presetCode = encodeAuqPreset({
    ...config,
    count: Number(count) as 1 | 2 | 3,
    ...globals,
  });
  usePresetUrlSync(presetCode, AUQ_DEFAULT_CODE, (raw) => {
    const res = decodeAuqPreset(raw);
    if (!res.ok) return;
    const p = res.preset;
    setType(p.type);
    setLayout(p.layout);
    setChip(p.chip);
    setMultiSelect(p.multiSelect);
    setAllowOther(p.allowOther);
    setMultiline(p.multiline);
    setCount(String(p.count));
    setSkippable(p.skippable);
  });

  const questions = buildQuestions(config);
  const code = buildAskCode(config);

  // The flow holds internal step/answer state, so any config change remounts
  // it — a half-answered flow against freshly swapped questions would be
  // incoherent.
  const flowKey = [
    type,
    layout,
    chip,
    multiSelect,
    allowOther,
    multiline,
    count,
    skippable,
    replaySeed,
  ].join("|");

  const randomize = () => {
    const pick = <T,>(arr: readonly T[]) =>
      arr[Math.floor(Math.random() * arr.length)];
    setType(pick(["options", "options", "options", "freeText"] as const));
    setLayout(pick(["inline", "inline", "stacked"] as const));
    setChip(pick(["right", "right", "left"] as const));
    setMultiSelect(Math.random() > 0.6);
    setAllowOther(Math.random() > 0.7);
    setMultiline(Math.random() > 0.3);
    setCount(pick(["1", "2", "3"] as const));
    setSkippable(Math.random() > 0.2);
    setReplaySeed((s) => s + 1);
  };

  const controls = (
    <PlaygroundPanel onShuffle={randomize}>
      <PlaySection label="Question" />
      <div>
        <PlayField label="Type">
          <PlaySelect
            value={type}
            onChange={(v) => setType(v as PlayType)}
            options={[
              { value: "options", label: "Options" },
              { value: "freeText", label: "Free text" },
            ]}
          />
        </PlayField>
        <PlayField label="Layout" disabled={isFreeText}>
          <PlaySelect
            value={layout}
            onChange={(v) => setLayout(v as PlayLayout)}
            options={[
              { value: "inline", label: "Inline" },
              { value: "stacked", label: "Stacked" },
            ]}
          />
        </PlayField>
        <PlayField label="Chip position" disabled={isFreeText}>
          <PlaySelect
            value={chip}
            onChange={(v) => setChip(v as PlayChip)}
            options={[
              { value: "right", label: "Right" },
              { value: "left", label: "Left" },
            ]}
          />
        </PlayField>
        <Switch
          label="Multi-select"
          checked={multiSelect}
          onToggle={() => setMultiSelect((v) => !v)}
          disabled={isFreeText}
          className={PLAY_SWITCH}
        />
        <Switch
          label="Allow other"
          checked={allowOther}
          onToggle={() => setAllowOther((v) => !v)}
          disabled={isFreeText}
          className={PLAY_SWITCH}
        />
        <Switch
          label="Multiline"
          checked={multiline}
          onToggle={() => setMultiline((v) => !v)}
          disabled={!isFreeText}
          className={PLAY_SWITCH}
        />
      </div>

      <PlayDivider />

      <PlaySection label="Flow" />
      <div>
        <PlayField label="Questions">
          <PlaySelect
            value={count}
            onChange={setCount}
            options={[
              { value: "1", label: "1" },
              { value: "2", label: "2" },
              { value: "3", label: "3" },
            ]}
          />
        </PlayField>
        <Switch
          label="Skippable"
          checked={skippable}
          onToggle={() => setSkippable((v) => !v)}
          className={PLAY_SWITCH}
        />
      </div>
      <PlayDivider />
      {/* shadcn's preset principle: the exact configuration above, as a
          stateless code the registry can turn into an installable flow. */}
      <GetCodeDialog def={AUQ_PRESET_DEF} code={presetCode} />
    </PlaygroundPanel>
  );

  const preview = <AskUserQuestions key={flowKey} questions={questions} />;

  // Same bottom anchoring as the static bento preview: content height changes
  // per question (taller multi-select vs short single-select), so pinning the
  // card to the bottom of a fixed stage keeps the footer button + chip column
  // in place instead of drifting as the user navigates.
  const demoPreview = (
    <div className="flex h-[440px] w-full max-w-[420px] items-end">
      <AskUserQuestions key={flowKey} questions={questions} />
    </div>
  );

  return children({
    preview,
    demoPreview,
    controls,
    code,
    onReplay: () => setReplaySeed((s) => s + 1),
  });
}

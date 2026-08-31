// ---------------------------------------------------------------------------
// AskUserQuestions preset (tag "q") — SHARE-ONLY. The playground's snippet
// is already copy-paste-complete (component + a questions array users
// replace wholesale), so there is no install generator; the code exists so
// a configured flow can be shared as a link that reopens the rail exactly.
//
// Same codec compat rules as every component: append-only value arrays,
// defaults at index 0, only append fields, under 53 bits.
// ---------------------------------------------------------------------------

import {
  registerPresetComponent,
  encodePreset,
  decodePreset,
  type PresetComponentDef,
  type PresetField,
} from "./codec";

export interface AskUserQuestionsPlayState {
  type: "options" | "freeText";
  layout: "inline" | "stacked";
  chip: "right" | "left";
  multiSelect: boolean;
  allowOther: boolean;
  multiline: boolean;
  count: 1 | 2 | 3;
  skippable: boolean;
}

export const DEFAULT_AUQ_STATE: AskUserQuestionsPlayState = {
  type: "options",
  layout: "inline",
  chip: "right",
  multiSelect: false,
  allowOther: false,
  multiline: true,
  count: 3,
  skippable: true,
};

// Defaults-first ordering (count [3, 1, 2]).
export const AUQ_PRESET_FIELDS: readonly PresetField[] = [
  { key: "type", values: ["options", "freeText"], bits: 2 },
  { key: "layout", values: ["inline", "stacked"], bits: 2 },
  { key: "chip", values: ["right", "left"], bits: 1 },
  { key: "multiSelect", values: [false, true], bits: 1 },
  { key: "allowOther", values: [false, true], bits: 1 },
  { key: "multiline", values: [true, false], bits: 1 },
  { key: "count", values: [3, 1, 2], bits: 3 },
  { key: "skippable", values: [true, false], bits: 1 },
];

export const AUQ_PRESET_DEF: PresetComponentDef = {
  tag: "q",
  label: "AskUserQuestions",
  docsPath: "/docs/ask-user-questions",
  versions: { a: AUQ_PRESET_FIELDS },
  currentVersion: "a",
  defaults: DEFAULT_AUQ_STATE as unknown as PresetComponentDef["defaults"],
  installable: false,
};
registerPresetComponent(AUQ_PRESET_DEF);

export function encodeAuqPreset(
  config: Partial<AskUserQuestionsPlayState>
): string {
  return encodePreset(AUQ_PRESET_DEF, config);
}

export type AuqDecodeResult =
  | { ok: true; preset: AskUserQuestionsPlayState; version: string }
  | { ok: false; error: string };

export function decodeAuqPreset(code: string): AuqDecodeResult {
  const res = decodePreset(code);
  if (!res.ok) return res;
  if (res.def.tag !== "q") {
    return { ok: false, error: `Not an AskUserQuestions preset (tag "${res.def.tag}").` };
  }
  return {
    ok: true,
    preset: res.preset as unknown as AskUserQuestionsPlayState,
    version: res.version,
  };
}

export const AUQ_DEFAULT_CODE = encodeAuqPreset({});

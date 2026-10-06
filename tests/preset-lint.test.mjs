// Preset installs write a generated file (the demo section) into someone
// else's project, and a fresh `create-next-app` lints it with
// eslint-plugin-react-hooks' recommended set: the React Compiler rules
// (refs, immutability, static-components, ...). The registry sources are held
// to the same rules by eslint.config.mjs; this holds the generated files to
// them too, over every field flipped once from its default plus a seeded
// sample of mixed presets.
import { describe, it, expect } from "vitest";
import { ESLint } from "eslint";
import tsParser from "@typescript-eslint/parser";
import reactHooks from "eslint-plugin-react-hooks";
// components.ts registers every tag with the codec.
import "../lib/preset/components.ts";
import { getAllPresetComponents } from "../lib/preset/codec.ts";
import { PRESET_GENERATORS } from "../lib/preset/generators.ts";

const eslint = new ESLint({
  overrideConfigFile: true,
  overrideConfig: [
    {
      files: ["**/*.{ts,tsx}"],
      languageOptions: {
        parser: tsParser,
        parserOptions: { ecmaFeatures: { jsx: true } },
      },
      plugins: { "react-hooks": reactHooks },
      rules: reactHooks.configs.recommended.rules,
    },
  ],
});

/** Defaults, each field flipped to each of its other values once, and a
 *  seeded sample of presets where every field is drawn at random. */
function presetsFor(def) {
  const fields = def.versions[def.currentVersion];
  const presets = [{ ...def.defaults }];
  for (const f of fields) {
    for (const value of f.values.slice(1)) presets.push({ ...def.defaults, [f.key]: value });
  }
  let a = 7;
  const rand = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = 0; i < 20; i++) {
    const p = { ...def.defaults };
    for (const f of fields) p[f.key] = f.values[Math.floor(rand() * f.values.length)];
    presets.push(p);
  }
  return presets;
}

describe("generated preset files pass the react-hooks lint", () => {
  for (const def of getAllPresetComponents()) {
    const generator = PRESET_GENERATORS[def.tag];
    if (!generator) continue;
    it(`${def.label} (${def.tag})`, async () => {
      const problems = new Set();
      for (const preset of presetsFor(def)) {
        for (const file of generator.files(preset)) {
          if (!/\.tsx?$/.test(file.path)) continue;
          const [result] = await eslint.lintText(file.content, { filePath: file.path });
          for (const m of result.messages) {
            problems.add(`${file.path}:${m.line} ${m.ruleId}: ${m.message.split("\n")[0]}`);
          }
        }
      }
      expect([...problems], [...problems].join("\n")).toEqual([]);
    }, 60_000);
  }
});

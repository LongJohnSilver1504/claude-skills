#!/usr/bin/env node
/**
 * PreToolUse hook (matcher: Write|Edit).
 * Blocks raw Tailwind palette classes (`text-red-500`, `bg-blue-100`, ...) in
 * .tsx/.jsx files — the deterministic enforcement of the color-usage rule.
 *
 * Opt-in by project: only active when `.claude/rules/color-usage.md` exists in
 * the project. Projects without semantic-token discipline are untouched.
 */
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

let input
try {
  input = JSON.parse(readFileSync(0, 'utf8'))
} catch {
  process.exit(0)
}

const filePath = input?.tool_input?.file_path ?? ''
if (!/\.(tsx|jsx)$/.test(filePath)) process.exit(0)

const cwd = input?.cwd ?? process.cwd()
if (!existsSync(join(cwd, '.claude/rules/color-usage.md'))) process.exit(0)

const content =
  input?.tool_input?.content ?? input?.tool_input?.new_string ?? ''
if (!content) process.exit(0)

const RAW_PALETTE =
  /\b(?:text|bg|border|ring|fill|stroke|from|via|to|outline|decoration|divide|accent|caret|shadow)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}(?:\/\d{1,3})?\b/g

const matches = [...new Set(content.match(RAW_PALETTE) ?? [])]
if (matches.length === 0) process.exit(0)

console.error(
  `Raw Tailwind palette classes are not allowed in this project (see .claude/rules/color-usage.md): ` +
    matches.join(', ') +
    `. Use the project's semantic tokens instead (e.g. text-muted-foreground, bg-destructive).`
)
process.exit(2)

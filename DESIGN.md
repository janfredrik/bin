---
name: bin
description: A paste bin set as a component datasheet; every paste is a part with a part number and a spec strip.
colors:
  datasheet-paper: "#f5f6f3"
  sheet-white: "#fbfcfa"
  ink: "#15181b"
  ink-secondary: "#48525a"
  ink-tertiary: "#5c656e"
  hairline-rule: "#c9d1d8"
  pin-tint: "#e4ebf1"
  datasheet-blue: "#0b4f8a"
  datasheet-blue-deep: "#083d6b"
  band-ink: "#ffffff"
  band-ink-muted: "#bcd3e8"
  burn-orange: "#b93c0a"
  burn-tint: "#fbe9df"
  on-burn: "#ffffff"
  selection-blue: "#cfe0f0"
  hl-keyword: "#0b4f8a"
  hl-string: "#1d6b47"
  hl-number: "#8f2a6a"
  hl-title: "#6b3fa0"
  hl-attr: "#7a5300"
  hl-comment: "#5c656e"
  dark-paper: "#0d1115"
  dark-sheet: "#11161b"
  dark-ink: "#e3e8ec"
  dark-ink-secondary: "#a5afb8"
  dark-ink-tertiary: "#87929c"
  dark-rule: "#28313a"
  dark-tint: "#161d24"
  dark-band: "#0c5696"
  dark-band-deep: "#0a467b"
  dark-band-ink-muted: "#c3d8ec"
  dark-burn: "#f07a46"
  dark-burn-tint: "#2b1810"
  dark-on-burn: "#15181b"
  dark-selection: "#1e3d5c"
  dark-signal-blue: "#6fb0ec"
  dark-hl-keyword: "#7cb6ee"
  dark-hl-string: "#7fd1a3"
  dark-hl-number: "#f09bcd"
  dark-hl-title: "#c4a6f2"
  dark-hl-attr: "#e8c070"
typography:
  part-number:
    fontFamily: "Archivo, Helvetica Neue, Arial, sans-serif"
    fontSize: "46px"
    fontWeight: 850
    lineHeight: 1
    letterSpacing: "0.01em"
    fontFeature: "tnum"
    fontVariation: "'wdth' 68"
  brand:
    fontFamily: "Archivo, Helvetica Neue, Arial, sans-serif"
    fontSize: "34px"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "-0.02em"
    fontVariation: "'wdth' 72"
  headline:
    fontFamily: "Archivo, Helvetica Neue, Arial, sans-serif"
    fontSize: "clamp(30px, 4vw, 44px)"
    fontWeight: 850
    lineHeight: 1.05
    letterSpacing: "-0.01em"
    fontVariation: "'wdth' 70"
  action:
    fontFamily: "Archivo, Helvetica Neue, Arial, sans-serif"
    fontSize: "24px"
    fontWeight: 850
    lineHeight: 1
    letterSpacing: "0.005em"
    fontVariation: "'wdth' 72"
  spec-value:
    fontFamily: "Archivo, Helvetica Neue, Arial, sans-serif"
    fontSize: "18px"
    fontWeight: 700
    fontVariation: "'wdth' 80"
  body:
    fontFamily: "Archivo, Helvetica Neue, Arial, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.45
  control:
    fontFamily: "Archivo, Helvetica Neue, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1
    fontVariation: "'wdth' 88"
  note:
    fontFamily: "Archivo, Helvetica Neue, Arial, sans-serif"
    fontSize: "12.5px"
    fontWeight: 400
  label:
    fontFamily: "Archivo, Helvetica Neue, Arial, sans-serif"
    fontSize: "11px"
    fontWeight: 650
    letterSpacing: "0.07em"
    fontVariation: "'wdth' 85"
  gutter:
    fontFamily: "Archivo, Helvetica Neue, Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: "22px"
    fontFeature: "tnum"
    fontVariation: "'wdth' 80"
  code:
    fontFamily: "JetBrains Mono, ui-monospace, SF Mono, Menlo, Consolas, monospace"
    fontSize: "13.5px"
    fontWeight: 400
    lineHeight: "22px"
  figure:
    fontFamily: "JetBrains Mono, ui-monospace, SF Mono, Menlo, Consolas, monospace"
    fontSize: "11.5px"
    fontWeight: 400
rounded:
  none: "0px"
spacing:
  hair: "2px"
  xs: "6px"
  sm: "8px"
  md: "10px"
  lg: "12px"
  cell: "16px"
  edge: "20px"
  band: "22px"
  line: "22px"
components:
  title-band:
    backgroundColor: "{colors.datasheet-blue}"
    textColor: "{colors.band-ink}"
    height: "64px"
    padding: "0 0 0 20px"
  part-slot:
    backgroundColor: "{colors.datasheet-blue-deep}"
    textColor: "{colors.band-ink}"
    typography: "{typography.part-number}"
    padding: "0 22px"
  meta-rule:
    textColor: "{colors.ink-secondary}"
    height: "34px"
    padding: "0 20px"
  gutter:
    backgroundColor: "{colors.pin-tint}"
    textColor: "{colors.ink-tertiary}"
    typography: "{typography.gutter}"
    width: "60px"
    padding: "14px 12px 14px 0"
  editor:
    backgroundColor: "{colors.sheet-white}"
    textColor: "{colors.ink}"
    typography: "{typography.code}"
    padding: "14px 20px 40px"
  spec-cell:
    backgroundColor: "{colors.datasheet-paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "10px 16px 12px"
  spec-cell-go:
    backgroundColor: "{colors.datasheet-blue}"
    textColor: "{colors.band-ink}"
    typography: "{typography.action}"
    padding: "12px 22px"
  spec-cell-go-hover:
    backgroundColor: "{colors.datasheet-blue-deep}"
  spec-cell-go-burn:
    backgroundColor: "{colors.burn-orange}"
    textColor: "{colors.on-burn}"
  segment:
    textColor: "{colors.ink-secondary}"
    rounded: "{rounded.none}"
    height: "34px"
    padding: "0 11px"
  segment-hover:
    backgroundColor: "{colors.pin-tint}"
    textColor: "{colors.ink}"
  segment-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.datasheet-paper}"
  burn-check:
    backgroundColor: "{colors.sheet-white}"
    rounded: "{rounded.none}"
    size: "20px"
  burn-check-on:
    backgroundColor: "{colors.burn-orange}"
    textColor: "{colors.on-burn}"
  button:
    textColor: "{colors.ink}"
    typography: "{typography.control}"
    rounded: "{rounded.none}"
    height: "38px"
    padding: "0 14px"
  button-hover:
    backgroundColor: "{colors.pin-tint}"
  button-solid:
    backgroundColor: "{colors.datasheet-blue}"
    textColor: "{colors.band-ink}"
    rounded: "{rounded.none}"
    height: "38px"
    padding: "0 14px"
  button-solid-hover:
    backgroundColor: "{colors.datasheet-blue-deep}"
  input:
    backgroundColor: "{colors.sheet-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    height: "34px"
    padding: "0 10px"
  notice:
    backgroundColor: "{colors.sheet-white}"
    textColor: "{colors.ink}"
    typography: "{typography.headline}"
    width: "560px"
---

# Design System: bin

## Overview

**Creative North Star: "The Component Datasheet"**

Every paste is a part. Its short code is set in a blue title band like a component part number, and its terms (language, expiry, burn, password) are listed in a ruled spec strip docked at the bottom. The paste itself sits on a near-white sheet with a tinted line-number gutter that reads like a pin column. The frame never changes between create, view, password gate and missing states; only the content of the sheet and the cells of the strip change.

The density is technical and calm: hairline cool-grey rules divide everything, nothing floats, nothing is rounded, nothing casts a shadow. Scale contrast does the hierarchy work. A condensed black Archivo part number sits against small, tracked uppercase cell labels, and JetBrains Mono is kept for code and figures. The one solid colour is datasheet blue. Orange appears only when something is destructive or ephemeral.

Dark mode inverts the paper to a blue-black sheet; the title band stays blue.

**Key Characteristics:**
- One fixed frame: 64px band, 34px meta rule, full-height sheet, ruled spec strip (`grid-template-rows: band meta 1fr auto`).
- Square corners everywhere (0 radius); depth from rules and fills, never shadows.
- Archivo variable width axis carries hierarchy: 68-72% width for display, 80-88% for values and controls, 100% for body.
- Blue is structure and primary action; orange is burn and danger only.
- A shared 22px line rhythm locks gutter and code together.

## Colors

A cool, near-monochrome datasheet palette: off-white paper, cool-grey ink and rules, one structural blue and one warning orange.

### Primary
- **Datasheet Blue** (`datasheet-blue`): the title band, the Create/Open cell, solid buttons, focus rings, the editor caret, the loading bar and the "ok" status square. Hovers step down to **Datasheet Blue Deep** (`datasheet-blue-deep`), which is also the resting fill of the part-number slot so it reads as a recessed plate inside the band.
- **Band Ink** and **Band Ink Muted** (`band-ink`, `band-ink-muted`): text on blue. Muted is for the host part of the link in the wordmark (`.x99.no/`) and the key hint under the Create label.

### Secondary
- **Burn Orange** (`burn-orange`, dark `dark-burn`): burn-after-reading only. The checked burn box, its "On" text and note, the burn notice's top rule and icon, the gate strip's Open-and-delete cell, error text and expiring-soon notes. **Burn Tint** backs highlighted deletions in diffs.

### Neutral
- **Datasheet Paper** (`datasheet-paper`): page ground, meta rule and spec strip.
- **Sheet White** (`sheet-white`): the content sheet, inputs and notice panel; one step lighter than the paper so the sheet reads as the document.
- **Ink / Ink Secondary / Ink Tertiary** (`ink`, `ink-secondary`, `ink-tertiary`): text, labels and notes, then gutter numerals, placeholders and comments.
- **Hairline Rule** (`hairline-rule`): every 1px divider, cell separator, input stroke and scrollbar thumb.
- **Pin Tint** (`pin-tint`): the gutter fill and the hover wash on buttons and segments.
- **Selection Blue** (`selection-blue`): text selection.

### Dark mode
The custom properties are redefined under `prefers-color-scheme: dark` (all `dark-*` tokens). The paper goes to blue-black, the band stays blue (`dark-band`), and burn brightens to `dark-burn` with ink-coloured text on it (`dark-on-burn`). **Dark Signal Blue** (`dark-signal-blue`) replaces the band blue wherever blue has to read as a mark on the dark sheet: the focus outline and the ok-status square. The dark caret uses `dark-hl-keyword`.

### Code palette
Highlight.js tokens map onto the datasheet palette: keywords and built-ins in the band blue (keywords also at 600 weight), strings green, numbers and variables plum, titles and functions violet, attributes and properties amber-brown, comments in tertiary ink and italic. Meta, tags and operators share the plum (`--hl-meta`). Each has a brightened dark counterpart.

### Named Rules
**The One Blue Rule.** Blue is the only structural colour. The band, the primary action cell and focus all use it, and no other hue gets used for chrome.

**The Burn Is Orange Rule.** Orange means something will be destroyed or is about to expire. It never decorates and never marks a non-destructive primary action.

## Typography

**Display / UI Font:** Archivo variable (weight 100-900, width 62-125%), with Helvetica Neue, Arial fallback
**Code / Figures Font:** JetBrains Mono (400-700), with ui-monospace, SF Mono, Menlo, Consolas fallback

**Character:** A condensed industrial grotesk for part numbers and values set against a plain mono for code and byte/line counts, like a printed component datasheet.

### Hierarchy
- **Wordmark link** (34px, width 72%, tabular; 30px under 640px): `bin` and the paste code at 900 in band ink, with the host between them (`.x99.no/`) at 450 in muted band ink, so the band reads as the full link `bin.x99.no/ABCD`.
- **Brand** (900, 34px, width 72%, -0.02em): the "bin" wordmark at band left; 30px on mobile.
- **Headline** (850, clamp(30px, 4vw, 44px), width 70%, 1.05): notice titles only (password, burn, missing).
- **Action** (850, 24px, width 72%): the label in the Create / Open cell; 22px on mobile.
- **Spec value** (700, 18px, width 80%): a stated fact inside a spec cell (dates, sizes, protection); 16px on mobile.
- **Body** (400, 15px/1.45): base text; notice body runs at 16px/1.55, max 60ch.
- **Control** (600, 14px, width 88%): buttons; segment labels at 13.5px/600/85%; select at 14px/550.
- **Note** (400, 12.5px): the one-line consequence under each spec cell, ellipsised.
- **Label** (650, 11px, width 85%, 0.07em, uppercase): spec-cell labels, the password field label and the key hint. Meta language uses the same treatment at 12px/0.05em.
- **Gutter** (500, 12px/22px, width 80%, tabular): line numbers, right-aligned.
- **Code** (mono 400, 13.5px/22px, tab-size 4): editor and viewer; 13px on mobile. Inputs use mono at 13px; meta byte and line counts at 11.5px.

### Named Rules
**The Width Axis Rule.** Hierarchy comes from Archivo's width axis together with its weight. The bigger and more important the text, the narrower it gets (part number 68%, controls 88%, body 100%).

**The Mono Is For Machines Rule.** JetBrains Mono is for code, links, commands, byte/line counts and typed input. Labels, values and prose stay in Archivo.

## Layout

The body is one viewport-height grid: `64px band / 34px meta / 1fr sheet / auto spec strip` (56px / 30px under 640px). The sheet scrolls internally; the strip is always docked. Horizontal edges are 20px (16px on mobile). The gutter is 60px wide (44px on mobile) and shares the 22px line height with the code so numerals and lines never drift apart; the editor gutter is translated with the textarea's scroll, the viewer gutter is sticky.

The spec strip is a CSS grid of cells divided by 1px vertical rules under a 2px ink top rule. On desktop it is one row with a fixed-content column per field and the action cell at the far right. At 1080px or less it reflows to 2-3 columns with horizontal rules between rows and the action cell spanning full width. At 640px or less the create strip uses named areas (`lang burn / exp exp / pw go`), the segmented control stretches to full width, and the key hint is hidden.

Notices sit top-left inside the sheet with clamp-based offsets (`clamp(32px, 9vh, 120px)` top, `clamp(20px, 8vw, 140px)` left), max 560px wide.

Spacing is small and step-based: 2 / 6 / 8 / 10 / 12 / 16 / 20 / 22px. Cells are padded 10px 16px 12px with a 6px internal gap.

## Elevation & Depth

Flat. There are no drop shadows. Depth comes from three tonal planes (paper, sheet, tint), hairline rules, and heavier rules for structure: a 2px ink rule over the spec strip, and a 3px ink rule (or burn orange) over notices. The only `box-shadow` in the system is an inset 1px underline that thickens a focused input's bottom edge, so it is a rule and not a lift.

### Named Rules
**The Ruled Not Raised Rule.** Separate things with rules and fills. Nothing floats over anything else.

## Shapes

Every corner is square (0px radius) on buttons, inputs, segments, checkboxes, cells and the part slot. Borders are 1px hairlines; the checkbox uses 1.5px. Icons are 16px stroked SVGs (1.6 stroke, round caps and joins) drawn from one inline sprite; the notice icon is 30px at 1.8 stroke and the check mark 14px at 2.6.

## Components

### Title band + wordmark link
A solid blue band with only the `bin` wordmark at left while a paste is being written. When a paste has an ID, the wordmark grows into the full link: a copy button directly after `bin` holds the host (the hostname minus its leading `bin.`, then `/`) and the code. On creation the host wipes out from behind the wordmark (clip-path, 460ms), then each code character stamps in (520ms, 240ms lead, staggered 70ms, dropping from -0.4em at 1.3 scale with a 6px blur clearing), and a faint white flash fades over the button. Opening an existing link shows it without motion; reduced motion skips the animation. Hover is a 9% white wash; focus ring is band ink.

### Meta rule
A 34px line under the band with a hairline bottom rule. Facts on the left are separated by 1px x 11px rule ticks, with the language in uppercase tracked ink and the size and lines in mono. Status is on the right at 600 weight. An "ok" status carries a 7px square blue mark; a burn status is orange.

### Gutter / editor / viewer
The tinted gutter has a hairline right rule and tertiary numerals, which step up to secondary ink while the editor has focus. The textarea is borderless and transparent, wrap off, with a blue caret and no focus outline (the gutter shift is its focus signal). The viewer shares the frame and adds highlight.js colouring.

### Spec strip cells
Each cell stacks label / control-or-value / note. Every option states its consequence in the note line (for example "Readable until it expires" changing to an orange burn note). Strip variants: create, view (link, created, expires, from-a-terminal, actions) and gate (protection, size, expires, action).

### Action cell (Create / Open)
A full-height blue cell with the Action label and a key hint ("Ctrl + Enter", "Enter") in muted uppercase. Hover goes to deep blue; focus is a band-ink outline inset -5px. In the burn gate the cell turns orange with on-burn text.

### Segmented control (expiry)
A row of 34px square segments with collapsed hairline borders. Unselected segments are secondary ink; hover is the tint wash. The selected segment is filled solid ink with paper text (inverted). Keyboard focus draws the blue outline on the label.

### Burn checkbox
A 20px square box with a 1.5px secondary-ink stroke on the sheet colour. Checked, it fills burn orange and the check mark scales in from 0.6 (220ms) and fades in (140ms). The adjacent state text ("Off" / "On") turns orange.

### Buttons
- **Shape:** square (0px), 38px tall, 0 14px padding, 8px icon gap.
- **Outline (default):** 1px ink border, transparent fill, ink text; hover fills with the tint.
- **Solid:** blue fill and border with band-ink text; hover goes to deep blue. Only one per strip (Copy code).
- **Transition:** 140ms background and colour on the system ease. Disabled is 0.5 opacity with a progress cursor.

### Inputs / select
34px tall, square, sheet fill, hairline stroke with a darker secondary-ink bottom edge (a ruled field). Hover darkens the stroke. Focus turns the border blue and adds an inset 1px blue underline, with no outline. The select uses Archivo 14px/550 with an inline chevron. Text input is mono, and placeholders fall back to Archivo.

### Link-out
A borderless mono button for the share link and the terminal command (15px/600, or 13px/500 for the command) with a trailing copy icon. Hover underlines the text in rule colour at a 4px offset and darkens the icon.

### Notice + gate strip
The notice panel replaces the sheet content for password, burn and missing states: a 3px top rule (ink, or orange for burn), a 30px icon inline with the headline, a secondary-ink body and an optional ruled password field. It always pairs with the gate strip, whose action cell submits the notice form.

### Motion
One ease (`cubic-bezier(0.16, 1, 0.3, 1)`) for everything. Durations are 140ms for control colour, 160ms for band/action fills, 220ms for the check scale and 520ms for the part-number stamp. The loading state is a 2px blue bar sweeping the top of the sheet (900ms loop). `prefers-reduced-motion` disables all animation and transition.

## Do's and Don'ts

### Do:
- **Do** keep the four-row frame (band, meta rule, sheet, spec strip) on every state; change cell contents, not the frame.
- **Do** give every spec option a one-line note that states its consequence.
- **Do** set part numbers, values and action labels in condensed heavy Archivo (68-80% width), and code, links and figures in JetBrains Mono.
- **Do** separate with 1px hairline rules, and use the 2px/3px ink rules only for strip and notice tops.
- **Do** define every colour as a custom property with a dark-mode counterpart.

### Don't:
- **Don't** round corners or add drop shadows; the system is square and flat (0px radius, no elevation).
- **Don't** use orange for anything that is not destructive, ephemeral or an error.
- **Don't** introduce a second structural hue alongside datasheet blue.
- **Don't** put more than one solid blue button in a strip; the action cell or Copy code is the single primary.

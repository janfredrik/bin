---
version: 1
slug: "public-index-html"
primary_target: "public/index.html"
related_targets: []
---

# Surface: paste (create + view), public/index.html

Mode: Operate. One page serves `/` (create) and `/<id>` (view); both states share one frame.

## Direction contract

THESIS: Every paste is a part. Its short code is set like a component part number, and its expiry, burn and password are listed as a spec strip. It refuses the usual pastebin of a dark editor with dropdowns and a pill button.

OWN-WORLD: Cool off-white "datasheet paper" (#f5f6f3), ink #15181b, one solid datasheet blue (#0b4f8a) title band, hairline cool-grey rules (#c9d1d8), a pale blue tint for header cells, and orange (#c2410c) used only for destructive/ephemeral states (burn). The type is Archivo condensed, set in caps for labels and black weight for the part number, with JetBrains Mono for code and figures only. The line-number gutter reads like pin numbers. Dark mode inverts the paper, and the band stays blue.

STORY: Paste, glance at the spec strip, press Create (or Ctrl/Cmd+Enter). The part-number slot fills with the code, and the link is copied. The reader sees the code highlighted and can copy it, go to raw, or edit it as a new paste.

FIRST VIEWPORT: A 64px blue band on top with "bin" at left and the part-number slot at right (`bin/····` ghost → `bin/k7qx`, 44px+ condensed black). Under it, a one-line meta rule (language · bytes · lines | expires). The paste area with gutter fills the rest, about 85% of the height. A ruled spec strip is docked at the bottom: Language, Expires (segmented), Burn, Password, plus a solid blue Create cell at the far right.

FORM: Component Datasheet, my candidate 5 of 7, seed 99b7144a. Raises: scale contrast alone (specimen); every option states its consequence (monochrome); one fixed frame across states (folio).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

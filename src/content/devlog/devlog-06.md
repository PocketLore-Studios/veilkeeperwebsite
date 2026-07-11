---
label: "Devlog 06"
title: "Tag Validation Layer"
date: 2026-04-18
image: "/assets/devlog/devlog-06.png"
alt: "Tag validation system catching invalid data entries in development"
summary: "A startup validation layer prevents silent failures in the data-driven tag system."
---

Veilkeeper’s combat system is heavily data-driven, which makes it flexible—but it also introduces a subtle risk: silent failure.

If a tag is misspelled, nothing breaks. For example, adding a “poison” effect but typing “pooison” on a weapon won’t cause an error—the system simply falls back to a default and the effect never applies. These kinds of issues are easy to miss and can persist unnoticed for long periods.

To address this, I added a validation layer that runs at startup. It checks all tag usage across data files against a centralized registry of valid tags. If an invalid tag is found, the game will fail fast in development builds and log the issue in release builds. This allows errors to be caught early without impacting runtime stability.

The result is a safer data-driven system. Tags can still be extended freely without modifying core code, but mistakes are now surfaced immediately instead of silently degrading behavior. As more systems build on tags, catching these issues early becomes critical.

## Current progress

- Centralized tag registry established
- Startup validation checks across all data definitions
- Debug builds fail on invalid tags
- Release builds log issues without interrupting gameplay
- Tag system supports safe extension without code changes

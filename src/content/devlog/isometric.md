---
label: "Devlog 10"
title: "Building Veilkeeper’s Isometric Battlefield"
date: 2026-10-03
image: "/assets/devlog/isometric.png"
alt: "Veilkeeper combat running on the new isometric battlefield, with units positioned across the grid, a floating crystal cursor marking the selected space, and movement and targeting information displayed around the battle."
summary: "Veilkeeper’s battlefield has been rebuilt in isometric perspective, bringing the combat presentation closer to its intended direction alongside a completely reworked cursor and directional-input system."
draft: false
---

Veilkeeper’s original top-down grid was built to prove the combat system.

It worked well for that purpose, but it was never intended to define the final look of the game.

With Veilkeeper now public-facing and the core tactical systems already established, the next major step was to rebuild the battlefield around the isometric presentation the game was always intended to use.

The result is the foundation of Veilkeeper’s new combat view.

Tiles, units, movement ranges, attack ranges, deployment areas, facing indicators, and selection effects have all been adapted to the new projection. Units now sort correctly as they move in front of and behind one another, helping the battlefield read naturally from the new perspective.

The cursor received an equally substantial overhaul.

A new floating crystal pointer now tracks the player’s position across the battlefield. It glides between spaces, rises when hovering over units, and works alongside the existing tile highlight to make the current focus easier to follow.

Controller input has also been rebuilt around the new view. Digital movement now supports eight directions, while analog input can move the cursor continuously across the battlefield. Directional input is resolved relative to the screen rather than the underlying grid, so controls remain intuitive despite the board being rotated into isometric space.

Several smaller input problems surfaced during that work and were addressed as part of the same pass. Analog-stick movement is now more stable near directional boundaries, held input repeats more consistently, and quick D-pad diagonals resolve as a single diagonal movement instead of accidentally producing two separate steps.

The conversion also exposed places where Veilkeeper’s prototype code had accumulated repeated assumptions about grid positioning and directional input.

Rather than adapting each of those systems independently, board projection and directional input now flow through shared abstractions. This means future changes to battlefield geometry can happen in fewer places without requiring movement, targeting, presentation, and unit logic to each understand the details of the visual projection.

That architectural cleanup is less visible than the new battlefield, but it is one of the most important results of the update.

The artwork shown here is still part of an alpha build and will continue to evolve. The goal of this update was not to establish final battlefield art. It was to establish the structure future battlefields can be built on.

Veilkeeper now looks much closer to the kind of tactical game it was always meant to become.

## Current Progress

- Rebuilt the combat board in isometric perspective
- Added per-cell isometric battlefield art
- Adapted units, deployment zones, movement ranges, and attack ranges to the new projection
- Added depth sorting for overlapping units
- Added a floating crystal cursor with glide and hover behavior
- Added continuous analog cursor movement
- Added eight-direction digital cursor controls
- Made directional input screen-relative for the isometric view
- Improved analog-stick stability and held-input behavior
- Fixed quick D-pad diagonals so they resolve as a single movement
- Consolidated board projection behind a shared geometry system
- Consolidated directional input through a shared input pipeline
- Added automated coverage for projection, input mapping, depth sorting, and battlefield presentation
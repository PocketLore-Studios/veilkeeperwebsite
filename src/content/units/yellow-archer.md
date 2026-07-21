---
name: "Yellow Archer"
role: "Archer"
faction:
tags: ["Ranged", "Skirmisher"]
order: 2
image: "/assets/units/yellow-archer.png"
alt: "Pixel-art archer in yellow garb, idling with a bow"
summary: "A nimble ranged attacker who softens targets before the frontline commits."
sprite: "/assets/units/Archer_Yellow.png"
frameWidth: 192
frameHeight: 192
frameCount: 6
spriteRow: 0
fps: 8
---
Light Ranged Skirmisher - fast, able to kite units and strikes from a distance.

## Strengths

- Deals reliable ranged damage from safe distance.
- Large movement speed.

## Weakness

- Ranged unit - cannot attack adjacent targets

> Sprite: `Archer_Yellow.png` is an 8×7 grid of 192×192 cells; each row is a
> separate animation. This unit plays **row 0** (front idle, 6 frames). Point
> other units at rows 1–6 with `spriteRow` to reuse the same sheet.

We need to reconsider Scorch's presentation and terrain simulation, not just polish the existing UI.

New requirements:

1. **Fullscreen battlefield:** The game must fill the available browser viewport. The battlefield is the primary interface, with compact controls overlaid on it. No dashboard-style layout or unnecessary scrolling.

2. **Tank physics:** Tanks must respond dynamically to terrain destruction. An unsupported tank falls under gravity, collides with the remaining terrain, and may take fall damage. No instantaneous repositioning.

3. **Destructible terrain:** Reconsider the current terrain representation. Would a pixel-based, cell-based, or voxel-inspired approach provide more convincing craters, overhangs, falling material, and interactions?

4. **Visual identity:** Propose a coherent arcade-artillery aesthetic rather than incremental CSS improvements. Tanks, terrain, projectiles, explosions, and controls should belong to the same visual style.

Before implementing:

- Evaluate whether the current architecture supports these requirements.
- Compare heightmap, pixel/cell-based terrain, and voxel approaches.
- Determine whether an external physics engine is justified.
- Identify the simplest architecture that supports the desired gameplay.
- Explain the trade-offs in performance, complexity, testability, and visual quality.
- Propose observable acceptance criteria for both gameplay and presentation.

Preserve useful simulation tests and existing quality tooling.

Do not modify code yet. Challenge the proposed technical choices when appropriate. Avoid unnecessary abstractions.
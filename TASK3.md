The current connectivity-based terrain collapse works, but connected terrain is treated as infinitely strong.

We now want connected bridges and overhangs to fail when their structural support is insufficient.

Inspect `terrain-connectivity.ts` and `material.ts` first.

Propose a minimal deterministic structural stability model that extends the existing system, without replacing the terrain representation.

Explain how support distance, material thickness, and supported mass would affect collapse.

Provide test cases for stable arches, thin bridges, heavy overhangs, and progressive destruction.

Do not implement yet.
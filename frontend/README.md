# Generative Art World Frontend

An immersive abstract generative world viewer built with Three.js.

**This is not a game. This is not an app. This is a place.**

## What Is This?

This project implements an abstract generative world that:
- Emerges from your initial behavior (Phase 8: Creation Without Control)
- Breathes slowly over time (Phase 3: Time & Breath)
- Feels permanent and owned (Phase 5: Ownership & Permanence)
- Has intentional silence and negative space (Phase 6)
- Can be shared without exposure (Phase 7)

The world does not ask you to do anything. It simply exists.

## Architecture

This frontend is an **engine**, not a UI. It interprets `WorldDefinition` data from the backend into a continuous 3D abstract world.

```
src/
├── world/           # World rendering and interpretation
│   ├── World.ts          # Main orchestrator
│   ├── WorldLoader.ts    # Fetches WorldDefinition from backend
│   ├── WorldScene.ts     # Three.js scene, fog, lighting
│   ├── WorldInterpreter.ts # Converts WorldDefinition to geometry
│   ├── LineFieldGenerator.ts # Generates lines following flow field
│   ├── CameraController.ts # First/third person camera logic
│   ├── WorldBounds.ts    # Enforces invisible world limits
│   ├── Presence.ts       # Embodied character representation
│   ├── PresenceBreath.ts # Subtle breathing motion
│   ├── SessionPersistence.ts # Saves/restores position
│   ├── Genesis.ts        # Phase 8: Observes initial behavior
│   ├── GenesisScene.ts   # Phase 8: Minimal pre-world space
│   └── types.ts          # WorldDefinition types
├── engine/          # Core utilities
│   ├── Determinism.ts    # Seed-based randomness
│   ├── Noise.ts          # Simplex noise implementation
│   ├── FlowField.ts      # Flow field math
│   └── WorldTime.ts      # Centralized time for breathing
└── app/
    └── router.tsx        # Minimal routing only
```

## Running

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Routes

- `/` - **Genesis moment** - Observes your initial behavior, then creates your world
- `/world/:id` - Loads and displays a specific world

## The Genesis Experience

When you visit `/` for the first time:

1. You arrive in a minimal, almost empty space
2. You can move freely (WASD + mouse) or stay still
3. The system observes your natural behavior for ~8 seconds
4. The world commits and you're taken to it
5. Your world is permanent and unique to your initial approach

**There is no "Create" button. This moment is not announced.**

The system observes:
- How long you stay still before moving
- What direction you move first
- Whether you look up or down
- How fast you explore
- How often you change direction

These subtle signals shape your world:
- Long stillness → calmer flow, denser fog
- Immediate movement → stronger directionality
- Vertical looking → more vertical structures  
- Slow exploration → lower density
- Direction changes → more complexity

**You do not design the world. The world emerges from how you approach it.**

## Controls

- **WASD / Arrow Keys** - Move
- **Mouse** - Look around (click to lock pointer)
- **Scroll** - Shift perspective (first to third person)

## Sharing

To share your world, simply share the URL. Others will visit the same place, but:
- At their own time
- In their own instance  
- Without seeing you
- Without altering it

This is invitation, not exposure.

## Core Principles

1. The user is always in control
2. The world feels like home
3. The world feels safe
4. Nothing demands attention
5. Nothing surprises abruptly

## Implementation Phases

This project implements phases 1-8 of the design:
- ✅ Phase 1: Movement & Control
- ✅ Phase 2: Generative World Structure
- ✅ Phase 3: Time, Breath & Presence
- ✅ Phase 4: Embodiment & Silent Presence
- ✅ Phase 5: Ownership & Permanence
- ✅ Phase 6: Silence, Absence & Negative Space
- ✅ Phase 7: Sharing Without Exposure
- ✅ Phase 8: Creation Without Control

See [PHASES_6_7_8.md](./PHASES_6_7_8.md) for detailed implementation notes.

## Technology

- Three.js for 3D rendering
- React (minimal shell for routing only)
- Vite for development and building
- TypeScript for type safety

---

**This is not a product. This is a place people arrive at once and then carry with them.**

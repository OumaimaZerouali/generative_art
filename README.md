# generative-art-world

Spring Boot backend for a generative art world generator. Produces deterministic 3D world definitions — palette, flow fields, geometry, ambient settings, and patterns — from a seed. Consumed by the [generative-art-world-frontend](https://github.com/oumaimazerouali/generative-art-world-frontend).

## Stack

- Java 25 / Spring Boot 4
- H2 (in-memory, JPA)
- OpenAPI-driven controllers (contract-first via `openapi.yml`)
- `generative-art-library` for seeded random, Perlin noise, flow fields

## Run

```bash
./mvnw spring-boot:run
```

API available at `http://localhost:8080/api`.

H2 console at `http://localhost:8080/api/h2-console` (JDBC URL: `jdbc:h2:mem:genartdb`).

## API

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/world` | Create a new world |
| `GET` | `/api/world` | List all worlds |
| `GET` | `/api/world/{id}` | Get world by ID |
| `GET` | `/api/world/{id}/export` | Export world as JSON |

### Create world request (all fields optional)

```json
{
  "seed": 42,
  "flowScale": 1.0,
  "flowComplexity": 0.5,
  "density": 0.5,
  "verticalBias": 0.3,
  "fogDensity": 0.02,
  "patternType": "FLOW_LINES"
}
```

Available pattern types: `FLOW_LINES`, `L_SYSTEM`, `VORONOI`, `SPIROGRAPH`, `WAVE_INTERFERENCE`, `CELLULAR_AUTOMATA`, `FRACTAL`, `PARTICLE_SYSTEM`, `REACTION_DIFFUSION`, `CONCENTRIC`, `GEOMETRIC_GRID`.

## Architecture

Hexagonal architecture — domain is isolated from adapters.

```
src/main/java/be/oz/generative_art_world/
├── domain/          # WorldGenerator, PatternGenerator, PaletteGenerator, FlowField
├── usecase/         # CreateWorldUseCase, GetWorldUseCase, ExportWorldUseCase
├── adapter/
│   ├── controller/  # OpenAPI-generated interfaces, WorldController, WorldMapper
│   └── repository/  # WorldDefinitionRepository, WorldJpaRepository, WorldEntity
└── config/
```

Controllers are generated from `openapi.yml` at compile time (`mvn compile`). Do not edit generated files — edit the spec instead.

## Design invariants

Three invariants govern all world generation decisions:

- **Control** — the user always decides what happens
- **Home** — the world feels safe and inhabitable
- **Safety** — nothing hostile, urgent, or alarming

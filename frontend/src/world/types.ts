/**
 * World Definition Types
 *
 * These types mirror the backend's WorldDefinition schema.
 * They are immutable once loaded - the backend defines what exists,
 * the frontend defines how it feels.
 */

export type FlowFieldType =
  | 'VECTOR_NOISE'
  | 'PERLIN_NOISE'
  | 'CURL_NOISE'
  | 'SIMPLEX_NOISE'
  | 'RANDOM';

export interface FlowField {
  readonly type: FlowFieldType;
  readonly scale: number;
  readonly strength: number;
}

export interface GeometryField {
  readonly type: string;
  readonly density: number;
  readonly size: number;
}

export interface AmbientSettings {
  readonly lightIntensity: number;
  readonly fogDensity: number;
  readonly motionNoise: number;
}

export interface WorldBounds {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface WorldDefinition {
  readonly id: string;
  readonly seed: number;
  readonly palette: readonly string[];
  readonly flowFields: readonly FlowField[];
  readonly geometryFields: readonly GeometryField[];
  readonly ambient: AmbientSettings;
  readonly bounds: WorldBounds;
}


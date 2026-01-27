/**
 * Threshold State
 *
 * Tracks user position and derives world parameters with smooth interpolation.
 * The state smoothly blends between target values to create fluid transitions.
 */

export interface ThresholdConfig {
  readonly fogDensity: number;
  readonly flowScale: number;
  readonly flowComplexity: number;
  readonly density: number;
  readonly verticalBias: number;
  readonly palette: string[];
}

/**
 * Manages the current state and smooth interpolation of threshold parameters.
 */
export class ThresholdState {
  // Current smoothed values
  private currentFogDensity: number = 0.03;
  private currentFlowScale: number = 1.0;
  private currentFlowComplexity: number = 0.5;
  private currentDensity: number = 0.5;
  private currentVerticalBias: number = 0.5;

  // Target values (from position)
  private targetFogDensity: number = 0.03;
  private targetFlowScale: number = 1.0;
  private targetFlowComplexity: number = 0.5;
  private targetDensity: number = 0.5;
  private targetVerticalBias: number = 0.5;

  // Selected palette colors
  private selectedPalette: string[] = [];

  // Interpolation speed (lower = smoother)
  private readonly lerpSpeed: number = 2.0;

  /**
   * Updates target values based on user position and pitch.
   */
  setTargets(
    fogDensity: number,
    flowScale: number,
    flowComplexity: number,
    density: number,
    verticalBias: number
  ): void {
    this.targetFogDensity = fogDensity;
    this.targetFlowScale = flowScale;
    this.targetFlowComplexity = flowComplexity;
    this.targetDensity = density;
    this.targetVerticalBias = verticalBias;
  }

  /**
   * Updates the selected palette.
   */
  setPalette(colors: string[]): void {
    this.selectedPalette = [...colors];
  }

  /**
   * Adds a color to the palette if not already present.
   */
  addColor(color: string): void {
    if (!this.selectedPalette.includes(color)) {
      this.selectedPalette.push(color);
    }
  }

  /**
   * Smoothly interpolates current values toward targets.
   */
  update(deltaTime: number): void {
    const t = Math.min(1, deltaTime * this.lerpSpeed);

    this.currentFogDensity = lerp(this.currentFogDensity, this.targetFogDensity, t);
    this.currentFlowScale = lerp(this.currentFlowScale, this.targetFlowScale, t);
    this.currentFlowComplexity = lerp(this.currentFlowComplexity, this.targetFlowComplexity, t);
    this.currentDensity = lerp(this.currentDensity, this.targetDensity, t);
    this.currentVerticalBias = lerp(this.currentVerticalBias, this.targetVerticalBias, t);
  }

  /**
   * Returns the current smoothed configuration.
   */
  getConfig(): ThresholdConfig {
    return {
      fogDensity: this.currentFogDensity,
      flowScale: this.currentFlowScale,
      flowComplexity: this.currentFlowComplexity,
      density: this.currentDensity,
      verticalBias: this.currentVerticalBias,
      palette: this.selectedPalette.length > 0
        ? [...this.selectedPalette]
        : ['#4a4a6a', '#6a4a5a', '#4a6a5a'], // Default muted palette
    };
  }

  /**
   * Returns raw current values for debugging or preview updates.
   */
  getCurrentValues(): {
    fogDensity: number;
    flowScale: number;
    flowComplexity: number;
    density: number;
    verticalBias: number;
  } {
    return {
      fogDensity: this.currentFogDensity,
      flowScale: this.currentFlowScale,
      flowComplexity: this.currentFlowComplexity,
      density: this.currentDensity,
      verticalBias: this.currentVerticalBias,
    };
  }
}

/**
 * Linear interpolation utility.
 */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

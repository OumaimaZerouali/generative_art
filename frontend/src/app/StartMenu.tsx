import React, { useState } from 'react';

/**
 * User choices from the start menu that influence world generation.
 */
export interface StartMenuChoices {
  flowFieldType: 'PERLIN_NOISE' | 'CURL_NOISE' | 'SIMPLEX_NOISE' | 'VECTOR_NOISE' | 'RANDOM';
  intensity: 'low' | 'medium' | 'high';
  complexity: 'simple' | 'moderate' | 'complex';
  palette: 'warm' | 'cool' | 'earth' | 'neon' | 'monochrome';
}

interface StartMenuProps {
  onStart: (choices: StartMenuChoices) => void;
}

const FLOW_TYPES = [
  { value: 'PERLIN_NOISE', label: 'Perlin', description: 'Smooth, organic waves' },
  { value: 'CURL_NOISE', label: 'Curl', description: 'Swirling, fluid motion' },
  { value: 'SIMPLEX_NOISE', label: 'Simplex', description: 'Natural, flowing patterns' },
  { value: 'VECTOR_NOISE', label: 'Vector', description: 'Layered, complex flow' },
  { value: 'RANDOM', label: 'Random', description: 'Unpredictable chaos' },
] as const;

const INTENSITIES = [
  { value: 'low', label: 'Gentle', description: 'Subtle, calm movement' },
  { value: 'medium', label: 'Moderate', description: 'Balanced flow' },
  { value: 'high', label: 'Intense', description: 'Strong, dynamic force' },
] as const;

const COMPLEXITIES = [
  { value: 'simple', label: 'Minimal', description: 'Clean, sparse lines' },
  { value: 'moderate', label: 'Balanced', description: 'Medium density' },
  { value: 'complex', label: 'Dense', description: 'Rich, layered art' },
] as const;

const PALETTES = [
  { value: 'warm', label: 'Warm', description: 'Reds, oranges, yellows' },
  { value: 'cool', label: 'Cool', description: 'Blues, purples, teals' },
  { value: 'earth', label: 'Earth', description: 'Greens, browns, naturals' },
  { value: 'neon', label: 'Neon', description: 'Bright, vibrant colors' },
  { value: 'monochrome', label: 'Mono', description: 'Grayscale elegance' },
] as const;

/**
 * Start Menu
 *
 * A minimal menu where users configure their generative art world.
 */
export function StartMenu({ onStart }: StartMenuProps) {
  const [flowFieldType, setFlowFieldType] = useState<StartMenuChoices['flowFieldType'] | null>(null);
  const [intensity, setIntensity] = useState<StartMenuChoices['intensity'] | null>(null);
  const [complexity, setComplexity] = useState<StartMenuChoices['complexity'] | null>(null);
  const [palette, setPalette] = useState<StartMenuChoices['palette'] | null>(null);

  const canStart = flowFieldType && intensity && complexity && palette;

  const handleStart = () => {
    if (flowFieldType && intensity && complexity && palette) {
      onStart({ flowFieldType, intensity, complexity, palette });
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.title}>Create Your World</h1>
        <p style={styles.subtitle}>Configure your generative art experience</p>

        <div style={styles.sections}>
          <ChoiceSection
            title="Flow Type"
            options={FLOW_TYPES}
            selected={flowFieldType}
            onSelect={(value) => setFlowFieldType(value as StartMenuChoices['flowFieldType'])}
          />

          <ChoiceSection
            title="Intensity"
            options={INTENSITIES}
            selected={intensity}
            onSelect={(value) => setIntensity(value as StartMenuChoices['intensity'])}
            columns={3}
          />

          <ChoiceSection
            title="Complexity"
            options={COMPLEXITIES}
            selected={complexity}
            onSelect={(value) => setComplexity(value as StartMenuChoices['complexity'])}
            columns={3}
          />

          <ChoiceSection
            title="Color Palette"
            options={PALETTES}
            selected={palette}
            onSelect={(value) => setPalette(value as StartMenuChoices['palette'])}
          />
        </div>

        <button
          style={{
            ...styles.startButton,
            opacity: canStart ? 1 : 0.3,
            cursor: canStart ? 'pointer' : 'default',
          }}
          onClick={handleStart}
          disabled={!canStart}
        >
          Generate World
        </button>

        {canStart && (
          <p style={styles.hint}>Click to create your unique generative art world</p>
        )}
      </div>
    </div>
  );
}

interface ChoiceSectionProps {
  title: string;
  options: readonly { value: string; label: string; description: string }[];
  selected: string | null;
  onSelect: (value: string) => void;
  columns?: number;
}

function ChoiceSection({ title, options, selected, onSelect, columns }: ChoiceSectionProps) {
  return (
    <div style={styles.section}>
      <h2 style={styles.sectionTitle}>{title}</h2>
      <div style={{ ...styles.options, gridTemplateColumns: `repeat(${columns || options.length}, 1fr)` }}>
        {options.map((option) => (
          <button
            key={option.value}
            style={{
              ...styles.option,
              borderColor: selected === option.value ? '#6a8aaa' : '#2a2a3a',
              backgroundColor: selected === option.value ? '#1a2a3a' : 'transparent',
            }}
            onClick={() => onSelect(option.value)}
          >
            <span style={styles.optionLabel}>{option.label}</span>
            <span style={styles.optionDescription}>{option.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: '#080810',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    overflow: 'auto',
  },
  content: {
    maxWidth: '900px',
    padding: '40px',
    textAlign: 'center',
  },
  title: {
    color: '#8a8aaa',
    fontSize: '32px',
    fontWeight: 300,
    margin: 0,
    marginBottom: '12px',
    letterSpacing: '2px',
  },
  subtitle: {
    color: '#5a5a7a',
    fontSize: '16px',
    margin: 0,
    marginBottom: '40px',
  },
  sections: {
    display: 'flex',
    flexDirection: 'column',
    gap: '28px',
    marginBottom: '40px',
  },
  section: {
    textAlign: 'left',
  },
  sectionTitle: {
    color: '#6a6a8a',
    fontSize: '13px',
    fontWeight: 500,
    margin: 0,
    marginBottom: '10px',
    textTransform: 'uppercase',
    letterSpacing: '3px',
  },
  options: {
    display: 'grid',
    gap: '10px',
  },
  option: {
    padding: '14px',
    border: '1px solid #2a2a3a',
    borderRadius: '8px',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  optionLabel: {
    color: '#9a9aba',
    fontSize: '14px',
    fontWeight: 500,
  },
  optionDescription: {
    color: '#5a5a7a',
    fontSize: '11px',
  },
  startButton: {
    padding: '16px 48px',
    backgroundColor: '#1a2a3a',
    border: '1px solid #3a5a7a',
    borderRadius: '8px',
    color: '#9abacc',
    fontSize: '16px',
    fontWeight: 400,
    letterSpacing: '1px',
    transition: 'all 0.3s ease',
  },
  hint: {
    color: '#4a4a6a',
    fontSize: '13px',
    marginTop: '16px',
  },
};

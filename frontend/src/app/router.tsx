import React, { useEffect, useRef, useState } from 'react';
import { Routes, Route, useParams, Navigate, useNavigate } from 'react-router-dom';
import { World, WorldLoader } from '../world';
import { StartMenu, StartMenuChoices } from './StartMenu';

/**
 * Instructions Overlay
 *
 * Shows control hints to the user. Fades out after a few seconds
 * or when the user starts interacting.
 */
function InstructionsOverlay({ onDismiss }: { onDismiss: () => void }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Auto-fade after 8 seconds
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 500);
    }, 8000);

    // Dismiss on any key press or click
    const handleInteraction = () => {
      setVisible(false);
      setTimeout(onDismiss, 500);
    };

    window.addEventListener('keydown', handleInteraction);
    window.addEventListener('click', handleInteraction);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('click', handleInteraction);
    };
  }, [onDismiss]);

  return (
    <div style={{
      position: 'absolute',
      bottom: '40px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: 'rgba(8, 8, 16, 0.9)',
      padding: '20px 32px',
      borderRadius: '12px',
      border: '1px solid #2a2a4a',
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.5s ease',
      pointerEvents: 'none',
      zIndex: 1000,
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        fontFamily: 'system-ui, sans-serif',
      }}>
        <div style={{ color: '#8a8aaa', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>
          Controls
        </div>
        <div style={{ display: 'flex', gap: '24px' }}>
          <Instruction keys="↑ ↓ ← →" label="Move" />
          <Instruction keys="Click" label="Enable look" />
          <Instruction keys="Mouse" label="Look around" />
          <Instruction keys="ESC" label="Release cursor" />
          <Instruction keys="Scroll" label="Zoom" />
        </div>
        <div style={{ color: '#4a4a6a', fontSize: '11px', marginTop: '8px' }}>
          Click anywhere or press any key to dismiss
        </div>
      </div>
    </div>
  );
}

function Instruction({ keys, label }: { keys: string; label: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
      <span style={{
        color: '#9abacc',
        fontSize: '13px',
        fontWeight: 600,
        backgroundColor: '#1a2a3a',
        padding: '4px 10px',
        borderRadius: '4px',
        border: '1px solid #3a4a5a',
      }}>
        {keys}
      </span>
      <span style={{ color: '#6a6a8a', fontSize: '11px' }}>{label}</span>
    </div>
  );
}

/**
 * World View with instructions overlay.
 */
function WorldView() {
  const { id } = useParams<{ id: string }>();
  const containerRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<World | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(true);

  useEffect(() => {
    if (!id || !containerRef.current) return;

    const loader = new WorldLoader();
    let world: World | null = null;

    const initWorld = async () => {
      try {
        const definition = await loader.load(id);

        if (!definition) {
          setError('World not found');
          return;
        }

        if (!containerRef.current) return;

        world = World.create(definition, containerRef.current);
        worldRef.current = world;
        world.start();
      } catch (err) {
        console.error('Failed to initialize world:', err);
        setError('Failed to load world');
      }
    };

    initWorld();

    return () => {
      if (world) {
        world.dispose();
      }
    };
  }, [id]);

  if (error) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#4a4a6a',
        fontFamily: 'system-ui, sans-serif',
      }}>
        {error}
      </div>
    );
  }

  return (
    <>
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      />
      {showInstructions && (
        <InstructionsOverlay onDismiss={() => setShowInstructions(false)} />
      )}
    </>
  );
}

/**
 * Palette definitions for each choice.
 */
const PALETTE_COLORS: Record<StartMenuChoices['palette'], string[]> = {
  warm: ['#e85a4f', '#e98074', '#d4a373', '#faedcd', '#ccd5ae'],
  cool: ['#4a6fa5', '#6b9ac4', '#97d8c4', '#b8b8d1', '#5b5ea6'],
  earth: ['#606c38', '#283618', '#bc6c25', '#dda15e', '#fefae0'],
  neon: ['#ff006e', '#8338ec', '#3a86ff', '#06ffa5', '#ffbe0b'],
  monochrome: ['#f8f9fa', '#adb5bd', '#6c757d', '#495057', '#212529'],
};

/**
 * Derives world generation parameters from user's menu choices.
 */
function deriveParametersFromChoices(choices: StartMenuChoices) {
  // Intensity affects flow scale
  const intensitySettings = {
    low: { flowScale: 0.5, strength: 0.3 },
    medium: { flowScale: 1.0, strength: 0.5 },
    high: { flowScale: 1.8, strength: 0.8 },
  };

  // Complexity affects density and layers
  const complexitySettings = {
    simple: { density: 0.4, flowComplexity: 0.2 },
    moderate: { density: 0.7, flowComplexity: 0.5 },
    complex: { density: 1.0, flowComplexity: 0.9 },
  };

  const intensity = intensitySettings[choices.intensity];
  const complexity = complexitySettings[choices.complexity];
  const palette = PALETTE_COLORS[choices.palette];

  return {
    flowFieldType: choices.flowFieldType,
    flowScale: intensity.flowScale,
    flowStrength: intensity.strength,
    flowComplexity: complexity.flowComplexity,
    density: complexity.density,
    palette: palette,
    // Lower fog for better visibility
    fogDensity: 0.015,
    // Keep art at eye level
    verticalBias: 0.3,
  };
}

/**
 * World Creator
 *
 * Shows the start menu, then directly creates the world
 * based on the user's choices.
 */
function WorldCreator() {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async (choices: StartMenuChoices) => {
    setIsCreating(true);

    try {
      const params = deriveParametersFromChoices(choices);
      const loader = new WorldLoader();

      const world = await loader.createWorld({
        seed: Date.now(),
        flowFieldType: params.flowFieldType,
        flowScale: params.flowScale,
        flowComplexity: params.flowComplexity,
        density: params.density,
        verticalBias: params.verticalBias,
        fogDensity: params.fogDensity,
        palette: params.palette,
      });

      // Navigate directly to the new world
      navigate(`/world/${world.id}`, { replace: true });
    } catch (err) {
      console.error('Failed to create world:', err);
      setError('Failed to create world');
      setIsCreating(false);
    }
  };

  if (error) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '16px',
        color: '#4a4a6a',
        fontFamily: 'system-ui, sans-serif',
        backgroundColor: '#080810',
      }}>
        <span>{error}</span>
        <button
          onClick={() => setError(null)}
          style={{
            padding: '8px 24px',
            backgroundColor: '#1a1a2a',
            border: '1px solid #3a3a5a',
            borderRadius: '4px',
            color: '#9a9aba',
            cursor: 'pointer',
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (isCreating) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#6a6a8a',
        fontFamily: 'system-ui, sans-serif',
        backgroundColor: '#080810',
      }}>
        Creating your world...
      </div>
    );
  }

  return <StartMenu onStart={handleStart} />;
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/world/:id" element={<WorldView />} />
      <Route path="/" element={<WorldCreator />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

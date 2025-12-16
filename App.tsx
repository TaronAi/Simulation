import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { SimulationCanvas } from './components/SimulationCanvas';
import { Graphs } from './components/Graphs';
import { SimulationParams, SimulationState, DataPoint } from './types';
import { DEFAULT_PARAMS } from './constants';

const App: React.FC = () => {
  // --- State ---
  const [params, setParams] = useState<SimulationParams>(DEFAULT_PARAMS);
  
  // We keep current physics state in a ref for the high-frequency loop
  // but we also sync it to React state for rendering the canvas/UI.
  const physicsState = useRef<SimulationState>({
    time: 0,
    y: DEFAULT_PARAMS.height,
    v: 0,
    a: -DEFAULT_PARAMS.gravity,
    hasLanded: false,
  });

  const [displayState, setDisplayState] = useState<SimulationState>(physicsState.current);
  const [history, setHistory] = useState<DataPoint[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [, setForceUpdate] = useState(0); // Dummy state to force re-render on resize
  
  // Initialize refs with null explicitly for safety
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  // --- Physics Engine ---
  const stepPhysics = useCallback((dt: number) => {
    const current = physicsState.current;
    
    if (current.hasLanded) return;

    // Safety check: Detect NaN or Infinite values
    if (isNaN(current.y) || isNaN(current.v) || !isFinite(current.v)) {
        // Emergency reset if physics exploded
        physicsState.current = {
            y: params.height,
            v: 0,
            a: -params.gravity,
            time: 0,
            hasLanded: false
        };
        return;
    }

    // Forces
    // Gravity: Downwards (negative y direction)
    const Fg = -params.mass * params.gravity;

    // Air Resistance: Opposes velocity
    // Fd = 0.5 * rho * v^2 * Cd * A
    // Calculate Area from Diameter: A = pi * (d/2)^2
    const radius = params.diameter / 2;
    const area = Math.PI * radius * radius;
    
    const v = current.v;
    const dragMagnitude = 0.5 * params.airDensity * (v * v) * params.dragCoeff * area;
    
    // Direction of drag is opposite to velocity.
    // If falling (v < 0), drag is positive (up).
    // If rising (v > 0), drag is negative (down).
    const dragForce = v === 0 ? 0 : -Math.sign(v) * dragMagnitude;

    const Fnet = Fg + dragForce;
    const a = Fnet / params.mass;

    // Euler Integration
    let newV = v + a * dt;
    
    // Safety Cap: Clamp velocity to prevent explosion
    // 500m/s is well above Mach 1 and terminal velocity for this sim
    const MAX_VELOCITY = 500;
    if (Math.abs(newV) > MAX_VELOCITY) {
        newV = Math.sign(newV) * MAX_VELOCITY;
    }

    const newY = current.y + newV * dt;
    const newTime = current.time + dt;

    // Ground collision
    if (newY <= 0) {
      physicsState.current = {
        y: 0,
        v: 0, // Stop on impact
        a: 0,
        time: newTime,
        hasLanded: true,
      };
    } else {
      physicsState.current = {
        y: newY,
        v: newV,
        a: a,
        time: newTime,
        hasLanded: false,
      };
    }
  }, [params]);

  // --- Animation Loop ---
  const animate = useCallback((time: number) => {
    if (lastTimeRef.current === null) {
      lastTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
      return;
    }

    // Calculate delta time in seconds
    // Cap total frame time to 0.1s to avoid spiraling if tab is backgrounded
    const rawDt = (time - lastTimeRef.current) / 1000;
    const cappedDt = Math.min(rawDt, 0.1);
    lastTimeRef.current = time;

    // Apply simulation speed multiplier
    const timeScale = params.timeScale ?? 1.0;
    const deltaTime = cappedDt * timeScale;

    // Sub-stepping for physics stability
    // Divide the frame time into small fixed chunks (e.g. 10ms)
    // This prevents the Euler integration from exploding with large forces/velocities
    const FIXED_STEP = 0.01; 
    let remainingDt = deltaTime;

    while (remainingDt > 0) {
      const step = Math.min(remainingDt, FIXED_STEP);
      if (!physicsState.current.hasLanded) {
        stepPhysics(step);
      }
      remainingDt -= step;
    }

    if (physicsState.current.hasLanded) {
      setIsPlaying(false);
    }

    // Update UI (once per frame)
    setDisplayState({ ...physicsState.current });
    
    // Update Graph History
    // Sampling rate: 0.03s
    setHistory(prev => {
      const lastPoint = prev[prev.length - 1];
      if (!lastPoint || physicsState.current.time - lastPoint.time > 0.03 || physicsState.current.hasLanded) {
         const newPoint = {
          time: physicsState.current.time,
          position: physicsState.current.y,
          velocity: physicsState.current.v,
          acceleration: physicsState.current.a
        };
        
        // Keep history manageable
        const newArr = [...prev, newPoint];
        if (newArr.length > 500) return newArr.slice(newArr.length - 500); 
        return newArr;
      }
      return prev;
    });

    if (isPlaying && !physicsState.current.hasLanded) {
      requestRef.current = requestAnimationFrame(animate);
    }
  }, [isPlaying, stepPhysics, params.timeScale]);

  useEffect(() => {
    if (isPlaying) {
      requestRef.current = requestAnimationFrame(animate);
    } else {
      lastTimeRef.current = null;
      if (requestRef.current !== null) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
    }
    return () => {
      if (requestRef.current !== null) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isPlaying, animate]);

  // --- Handlers ---
  const handleStart = () => {
    if (physicsState.current.hasLanded) {
        handleReset();
        // Small timeout to allow state reset before starting
        setTimeout(() => setIsPlaying(true), 10);
    } else {
        setIsPlaying(true);
    }
  };

  const handlePause = () => setIsPlaying(false);

  const handleReset = () => {
    setIsPlaying(false);
    physicsState.current = {
      time: 0,
      y: params.height,
      v: 0,
      a: -params.gravity,
      hasLanded: false,
    };
    setDisplayState({ ...physicsState.current });
    setHistory([{
        time: 0,
        position: params.height,
        velocity: 0,
        acceleration: -params.gravity
    }]);
  };

  // When params change (e.g. initial height), if not playing, reset position
  useEffect(() => {
    if (!isPlaying && physicsState.current.time === 0) {
       physicsState.current.y = params.height;
       physicsState.current.a = -params.gravity;
       setDisplayState(prev => ({ ...prev, y: params.height, a: -params.gravity }));
       setHistory([{
         time: 0,
         position: params.height,
         velocity: 0,
         acceleration: -params.gravity
       }]);
    }
  }, [params.height, params.gravity, isPlaying]);

  // --- Resize / Fullscreen Handling ---
  useEffect(() => {
    const handleResize = () => {
      // Force a re-render to ensure layout recalculates
      setForceUpdate(prev => prev + 1);
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('fullscreenchange', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('fullscreenchange', handleResize);
    };
  }, []);

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] bg-slate-100 font-sans text-slate-900 overflow-hidden">
      {/* 
         Desktop: Controls Left, Content Right
         Mobile: Content Top, Controls Bottom
      */}
      
      {/* Control Panel: Fixed width on Desktop, Bottom on Mobile */}
      <div className="order-2 md:order-1 flex-none z-20">
        <ControlPanel 
          params={params} 
          onChange={setParams} 
          isPlaying={isPlaying}
          onStart={handleStart}
          onPause={handlePause}
          onReset={handleReset}
        />
      </div>

      {/* Main Content: Row on Desktop, Col on Mobile */}
      <div className="order-1 md:order-2 flex-1 flex flex-col md:flex-row min-w-0 min-h-0 relative z-10">
        
        {/* Simulation Canvas:
            Desktop: Fixed width narrow column (~350px), Full Height ("Tall not wide")
            Mobile: Fixed height share of screen
        */}
        <div className="w-full h-[45vh] md:w-[350px] md:h-full border-b md:border-b-0 md:border-r border-slate-200 relative flex-none">
          <SimulationCanvas state={displayState} params={params} />
        </div>

        {/* Graphs:
            Desktop: Fills all remaining space ("Area bigger")
            Mobile: Fills remaining vertical space
            Added 'relative' to ensure Recharts ResponsiveContainer works correctly.
        */}
        <div className="flex-1 w-full h-full min-w-0 bg-white relative">
          <Graphs data={history} params={params} />
        </div>

      </div>
    </div>
  );
};

export default App;
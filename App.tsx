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
  
  const requestRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number | undefined>(undefined);

  // --- Physics Engine ---
  const stepPhysics = useCallback((dt: number) => {
    const current = physicsState.current;
    
    if (current.hasLanded) return;

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
    const newV = v + a * dt;
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
    if (lastTimeRef.current === undefined) {
      lastTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
      return;
    }

    // Calculate delta time in seconds
    // Cap total frame time to 0.1s to avoid spiraling if tab is backgrounded
    const deltaTime = Math.min((time - lastTimeRef.current) / 1000, 0.1);
    lastTimeRef.current = time;

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
  }, [isPlaying, stepPhysics]);

  useEffect(() => {
    if (isPlaying) {
      requestRef.current = requestAnimationFrame(animate);
    } else {
      lastTimeRef.current = undefined;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
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


  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-100 font-sans text-slate-900 overflow-hidden">
      {/* Left Sidebar */}
      <ControlPanel 
        params={params} 
        onChange={setParams} 
        isPlaying={isPlaying}
        onStart={handleStart}
        onPause={handlePause}
        onReset={handleReset}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Visualization */}
        <SimulationCanvas state={displayState} params={params} />
        
        {/* Data/Graphs */}
        <Graphs data={history} params={params} />
      </div>
    </div>
  );
};

export default App;
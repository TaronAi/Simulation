
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { SimulationState, SimulationParams } from '../types';

interface SimulationCanvasProps {
  state: SimulationState;
  params: SimulationParams;
}

export const SimulationCanvas: React.FC<SimulationCanvasProps> = ({ state, params }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  // Pre-generate stars for Space theme so they don't flicker
  const stars = useMemo(() => {
    const starCount = 100;
    const arr = [];
    for (let i = 0; i < starCount; i++) {
      arr.push({
        x: Math.random(),
        y: Math.random(),
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.8 + 0.2
      });
    }
    return arr;
  }, []);

  // Resize Observer to handle container resizing
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        // Prevent infinite loops by checking if size actually changed
        setSize(prev => {
          if (Math.abs(prev.width - width) < 1 && Math.abs(prev.height - height) < 1) {
            return prev;
          }
          return { width, height };
        });
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // Monitor Device Pixel Ratio changes (Zoom / Move to new screen)
  useEffect(() => {
    const handleResize = () => {
      // Trigger a re-evaluation of the canvas size
      setSize(prev => ({ ...prev }));
    };
    // Window resize events usually cover zoom and DPR changes in modern browsers
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    // Use the state size which comes from ResizeObserver, fallback to getBoundingClientRect if 0
    const rectWidth = size.width || canvas.getBoundingClientRect().width;
    const rectHeight = size.height || canvas.getBoundingClientRect().height;
    
    // Safety check for 0 dimensions
    if (rectWidth === 0 || rectHeight === 0) return;

    // Set actual canvas size (resolution)
    if (canvas.width !== rectWidth * dpr || canvas.height !== rectHeight * dpr) {
        canvas.width = rectWidth * dpr;
        canvas.height = rectHeight * dpr;
    }
    
    // Reset transform before scaling again
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    const width = rectWidth;
    const height = rectHeight;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    const theme = params.theme || 'sky';

    // --- Background Drawing ---
    let groundColor = '#10b981'; // emerald-500
    let groundLine = '#047857'; // emerald-700
    let textColor = '#1e293b';

    if (theme === 'space') {
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#0f172a'); // slate-900
        gradient.addColorStop(1, '#334155'); // slate-700
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // Draw stars
        ctx.fillStyle = '#ffffff';
        stars.forEach(star => {
            ctx.globalAlpha = star.opacity;
            ctx.beginPath();
            ctx.arc(star.x * width, star.y * height, star.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1.0;

        groundColor = '#64748b'; // slate-500 (Moon surface)
        groundLine = '#475569';
        textColor = '#f8fafc'; // white text

    } else if (theme === 'sunset') {
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#1e1b4b'); // indigo-950 (top)
        gradient.addColorStop(0.4, '#a855f7'); // purple-500
        gradient.addColorStop(0.8, '#f59e0b'); // amber-500
        gradient.addColorStop(1, '#fef3c7'); // amber-100 (horizon)
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        groundColor = '#451a03'; // amber-950
        groundLine = '#78350f';
        textColor = '#f8fafc'; // white text

    } else if (theme === 'mars') {
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#7c2d12'); // orange-900
        gradient.addColorStop(1, '#fdba74'); // orange-300
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        groundColor = '#9a3412'; // orange-800
        groundLine = '#431407';
        textColor = '#431407';

    } else {
        // Sky (Default)
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#e0f2fe'); // sky-100
        gradient.addColorStop(1, '#bae6fd'); // sky-200
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        groundColor = '#10b981'; // emerald-500
        groundLine = '#047857'; // emerald-700
        textColor = '#1e293b';
    }


    // Coordinate System
    const paddingBottom = 40;
    const paddingTop = 40;
    const availableHeight = height - paddingBottom - paddingTop;
    
    // Scale: pixels per meter. 
    // Fix the view to the initial height + 10% buffer.
    const viewHeight = Math.max(params.height * 1.1, 10);
    const scaleY = availableHeight / viewHeight;

    const mapY = (simY: number) => {
      // Invert Y axis: simY=0 is bottom, simY=max is top
      return height - paddingBottom - (simY * scaleY);
    };

    // Draw Ground
    ctx.fillStyle = groundColor;
    ctx.fillRect(0, mapY(0), width, height - mapY(0));
    
    ctx.strokeStyle = groundLine;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, mapY(0));
    ctx.lineTo(width, mapY(0));
    ctx.stroke();

    // Draw Grid lines / Ruler
    ctx.strokeStyle = theme === 'space' || theme === 'sunset' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)';
    ctx.fillStyle = theme === 'space' || theme === 'sunset' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.4)';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    const step = Math.pow(10, Math.floor(Math.log10(viewHeight)) - 1) * 5 || 10;
    
    for (let h = 0; h <= viewHeight; h += step) {
      const yPos = mapY(h);
      ctx.beginPath();
      ctx.moveTo(40, yPos);
      ctx.lineTo(width, yPos);
      ctx.stroke();
      ctx.fillText(`${Math.round(h)}m`, 35, yPos + 3);
    }

    // Draw Object
    const objY = mapY(state.y);
    
    // Visual radius calculation
    const realRadiusPx = (params.diameter / 2) * scaleY;
    
    // Clamp the radius:
    // Min: 6px (visibility)
    // Max: 15% of width or 100px (prevent taking over screen but allow large objects)
    const maxRadius = Math.min(100, width * 0.15); 
    const objRadius = Math.max(6, Math.min(realRadiusPx, maxRadius));

    // Shadow
    const shadowY = mapY(0);
    const distToGround = state.y;
    const shadowScale = Math.max(0.2, 1 - distToGround / (params.height || 1));
    const shadowAlpha = Math.max(0.1, 0.5 - distToGround / (params.height || 1) * 0.4);
    
    ctx.save();
    ctx.translate(width / 2, shadowY);
    ctx.scale(shadowScale, 0.3);
    ctx.beginPath();
    ctx.arc(0, 0, objRadius, 0, Math.PI * 2);
    ctx.fillStyle = theme === 'space' ? `rgba(0,0,0,${shadowAlpha * 0.8})` : `rgba(0,0,0,${shadowAlpha})`;
    ctx.fill();
    ctx.restore();

    // -- Object Rendering --
    ctx.save();
    ctx.translate(width / 2, objY);
    
    const skin = params.objType || 'ball';
    
    if (skin === 'watermelon') {
        // Watermelon Skin
        ctx.beginPath();
        ctx.arc(0, 0, objRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#10b981'; // Base Green (emerald-500)
        ctx.fill();
        ctx.clip(); // Clip stripes to circle

        // Stripes
        ctx.strokeStyle = '#064e3b'; // Dark Green (emerald-900)
        ctx.lineWidth = objRadius * 0.15;
        
        // Draw varied jagged or curved stripes
        for (let i = -objRadius; i < objRadius; i += objRadius * 0.4) {
             ctx.beginPath();
             // Draw arcs to simulate spherical stripes
             ctx.ellipse(i, 0, objRadius * 0.1, objRadius, 0, 0, Math.PI * 2);
             ctx.stroke();
        }
        
        // Simple shine
        ctx.beginPath();
        ctx.arc(-objRadius * 0.3, -objRadius * 0.3, objRadius * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fill();

    } else if (skin === 'egg') {
        // Egg Skin
        // Draw ellipse
        ctx.beginPath();
        // Eggs are slightly oval. Let's cheat a bit visually while keeping collision circle logic.
        ctx.ellipse(0, 0, objRadius * 0.85, objRadius * 1.05, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#fef3c7'; // Eggshell (amber-100)
        ctx.fill();
        
        // Subtle shading
        const grad = ctx.createRadialGradient(-objRadius * 0.2, -objRadius * 0.3, objRadius * 0.1, 0, 0, objRadius);
        grad.addColorStop(0, 'rgba(255,255,255,0.8)');
        grad.addColorStop(1, 'rgba(0,0,0,0.05)');
        ctx.fillStyle = grad;
        ctx.fill();
        
        // Outline
        ctx.strokeStyle = '#d4d4d8'; // zinc-300
        ctx.lineWidth = 1;
        ctx.stroke();

    } else {
        // Default Red Ball
        ctx.beginPath();
        ctx.arc(0, 0, objRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444'; // red-500
        ctx.fill();
        ctx.strokeStyle = '#991b1b'; // red-800
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Shine
        ctx.beginPath();
        ctx.arc(-objRadius * 0.3, -objRadius * 0.3, objRadius * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fill();
    }
    ctx.restore();

    // Check for Terminal Velocity Visual
    // Vt = sqrt((2mg) / (pACd))
    const p = params;
    const r = p.diameter / 2;
    const area = Math.PI * r * r;
    let vt = 0;
    if (p.dragCoeff > 0 && p.airDensity > 0 && area > 0) {
      vt = Math.sqrt((2 * p.mass * p.gravity) / (p.airDensity * area * p.dragCoeff));
    }
    
    const isAtTerminal = vt > 0 && Math.abs(state.v) >= vt * 0.99 && Math.abs(state.v) > 0.1;
    
    if (isAtTerminal) {
       ctx.save();
       ctx.translate(width / 2 + objRadius + 10, objY);
       ctx.fillStyle = textColor;
       ctx.font = 'italic 12px sans-serif';
       ctx.textAlign = 'left';
       ctx.fillText("Terminal Velocity Reached", 0, 4);
       // Small arrow pointing to ball
       ctx.beginPath();
       ctx.moveTo(-5, 0);
       ctx.lineTo(-2, 0);
       ctx.strokeStyle = textColor;
       ctx.stroke();
       ctx.restore();
    }


    // Info Overlay
    ctx.fillStyle = textColor;
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Height: ${state.y.toFixed(1)} m`, width - 180, 30);
    ctx.fillText(`Speed:  ${Math.abs(state.v).toFixed(1)} m/s`, width - 180, 50);
    ctx.fillText(`Time:   ${state.time.toFixed(2)} s`, width - 180, 70);

  }, [state, params, size, stars]);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-slate-50 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="block w-full h-full"
      />
    </div>
  );
};

import React, { useEffect, useRef } from 'react';
import { SimulationState, SimulationParams } from '../types';

interface SimulationCanvasProps {
  state: SimulationState;
  params: SimulationParams;
}

export const SimulationCanvas: React.FC<SimulationCanvasProps> = ({ state, params }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw Sky Background Gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#e0f2fe'); // sky-100
    gradient.addColorStop(1, '#bae6fd'); // sky-200
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

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
    ctx.fillStyle = '#10b981'; // emerald-500
    ctx.fillRect(0, mapY(0), width, height - mapY(0));
    ctx.strokeStyle = '#047857'; // emerald-700
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, mapY(0));
    ctx.lineTo(width, mapY(0));
    ctx.stroke();

    // Draw Grid lines / Ruler
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
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
    // Max: 30px (prevent taking over screen at low heights)
    const maxRadius = Math.min(30, width * 0.08); 
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
    ctx.fillStyle = `rgba(0,0,0,${shadowAlpha})`;
    ctx.fill();
    ctx.restore();

    // The Ball
    ctx.beginPath();
    ctx.arc(width / 2, objY, objRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#ef4444'; // red-500
    ctx.fill();
    ctx.strokeStyle = '#991b1b'; // red-800
    ctx.lineWidth = 2;
    ctx.stroke();

    // Info Overlay
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Height: ${state.y.toFixed(1)} m`, width - 180, 30);
    ctx.fillText(`Speed:  ${Math.abs(state.v).toFixed(1)} m/s`, width - 180, 50);
    ctx.fillText(`Time:   ${state.time.toFixed(2)} s`, width - 180, 70);

  }, [state, params]);

  return (
    <div className="flex-1 relative w-full bg-slate-50 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
      />
    </div>
  );
};
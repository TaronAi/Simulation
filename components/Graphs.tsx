
import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend
} from 'recharts';
import { DataPoint, SimulationParams } from '../types';

interface GraphsProps {
  data: DataPoint[];
  params: SimulationParams;
}

export const Graphs: React.FC<GraphsProps> = ({ data, params }) => {
  // Calculate terminal velocity and fixed domains
  const { yDomain, xDomain, terminalVelocity, vacuumImpactSpeed } = useMemo(() => {
    const { height, gravity, mass, dragCoeff, airDensity, diameter } = params;
    
    // Safety defaults
    const safeGravity = gravity > 0 ? gravity : 9.81;
    const safeHeight = height > 0 ? height : 10;
    
    const radius = diameter / 2;
    const area = Math.PI * radius * radius;
    
    // Terminal Velocity: Vt = sqrt((2mg) / (pACd))
    let vt = 0;
    if (dragCoeff > 0 && airDensity > 0 && area > 0 && mass > 0) {
      vt = Math.sqrt((2 * mass * safeGravity) / (airDensity * area * dragCoeff));
    }
    
    // Theoretical max speed at impact (Vacuum)
    // Energy conservation: mgh = 0.5mv^2 -> v = sqrt(2gh)
    const maxPossibleSpeed = Math.sqrt(2 * safeGravity * safeHeight);
    
    // Y-Axis Domain
    // strictly cap at maxPossibleSpeed + 10% buffer. 
    // Ensure axisMaxY is finite and valid
    let axisMaxY = Math.max(10, Math.ceil(maxPossibleSpeed * 1.1));
    if (!isFinite(axisMaxY)) axisMaxY = 100;

    // X-Axis Domain (Time)
    // Estimate fall time: t = sqrt(2h/g)
    const vacuumTime = Math.sqrt(2 * safeHeight / safeGravity);
    // Add buffer for drag
    let estimatedTime = Math.max(5, vacuumTime * 1.5);
    let axisMaxX = Math.max(1, Math.ceil(estimatedTime));
    if (!isFinite(axisMaxX)) axisMaxX = 20;

    return { 
      yDomain: [0, axisMaxY],
      xDomain: [0, axisMaxX],
      terminalVelocity: (dragCoeff > 0 && airDensity > 0 && isFinite(vt) && vt < axisMaxY) ? vt : null,
      vacuumImpactSpeed: isFinite(maxPossibleSpeed) ? maxPossibleSpeed : 0
    };
  }, [params]);

  // Transform data to show Speed (absolute velocity)
  // AND clamp values to preventing rendering glitches if physics explodes
  const chartData = useMemo(() => {
    const maxSafe = yDomain[1] * 1.5;
    return data.map(d => ({
      ...d,
      speed: Math.min(Math.abs(d.velocity), maxSafe)
    }));
  }, [data, yDomain]);

  if (!params) return null;

  return (
    <div className="w-full h-full bg-white p-2 md:p-4 flex flex-col">
      <h3 className="text-xs md:text-sm font-semibold text-slate-600 mb-1 md:mb-2 text-center">Speed vs Time</h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              dataKey="time" 
              label={{ value: 'Time (s)', position: 'insideBottomRight', offset: -5, fontSize: 10 }} 
              type="number" 
              domain={xDomain}
              allowDataOverflow={false} 
              tick={{fontSize: 10}}
              height={30}
            />
            <YAxis 
              label={{ value: 'Speed (m/s)', angle: -90, position: 'insideLeft', fontSize: 10 }} 
              domain={yDomain} 
              tick={{fontSize: 10}}
              width={35}
              allowDataOverflow={true}
            />
            <Tooltip 
              contentStyle={{ fontSize: '12px', padding: '6px', borderRadius: '4px', border: '1px solid #e2e8f0' }}
              labelFormatter={(v) => `Time: ${Number(v).toFixed(2)}s`}
              formatter={(value: number, name: string) => [
                Math.min(value, vacuumImpactSpeed * 1.5).toFixed(1), // cap display too
                name === 'speed' ? 'Speed' : name
              ]}
            />
            <Legend verticalAlign="top" height={24} iconSize={10} wrapperStyle={{ fontSize: '10px'}}/>
            
            <Line 
              name="Speed"
              type="monotone" 
              dataKey="speed" 
              stroke="#ef4444" 
              dot={false} 
              strokeWidth={3} 
              isAnimationActive={false} 
            />
            
            {terminalVelocity && (
              <ReferenceLine 
                y={terminalVelocity} 
                stroke="#64748b" 
                strokeDasharray="5 5" 
                label={{ 
                  value: `TV: ${terminalVelocity.toFixed(1)}`, 
                  position: 'insideBottomRight', 
                  fill: '#64748b',
                  fontSize: 10,
                  offset: 5
                }} 
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

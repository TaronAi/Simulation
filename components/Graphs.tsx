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
  const { yDomain, xDomain, terminalVelocity } = useMemo(() => {
    const { height, gravity, mass, dragCoeff, airDensity, diameter } = params;
    
    const radius = diameter / 2;
    const area = Math.PI * radius * radius;
    
    // Terminal Velocity: Vt = sqrt((2mg) / (pACd))
    let vt = 0;
    if (dragCoeff > 0 && airDensity > 0 && area > 0) {
      vt = Math.sqrt((2 * mass * gravity) / (airDensity * area * dragCoeff));
    } else {
      // If no drag, theoretical max at impact
      vt = Math.sqrt(2 * gravity * height);
    }
    
    // Theoretical max speed at impact (Vacuum)
    const vacuumImpactSpeed = Math.sqrt(2 * gravity * height);
    
    // Y-Axis Domain
    // We want the graph to accommodate the terminal velocity or impact speed comfortably.
    // If vt is huge (low drag), we cap at vacuumImpactSpeed because you can't go faster than free fall in vacuum.
    // If vt is small (high drag), we cap slightly above vt.
    const axisMaxY = Math.min(vacuumImpactSpeed * 1.1, Math.max(vt * 1.2, 10));

    // X-Axis Domain (Time)
    // Estimate fall time: t = sqrt(2h/g)
    // With drag, it takes longer. We estimate a reasonable upper bound to start with
    // so the axis doesn't constantly rescale during the first few seconds.
    const vacuumTime = Math.sqrt(2 * height / gravity);
    // Add 50% buffer for drag, but ensure at least 5 seconds for visibility
    const estimatedTime = Math.max(5, vacuumTime * 1.5);
    const axisMaxX = Math.ceil(estimatedTime);

    return { 
      yDomain: [0, axisMaxY],
      xDomain: [0, axisMaxX],
      terminalVelocity: dragCoeff > 0 && airDensity > 0 ? vt : null
    };
  }, [params]);

  // Transform data to show Speed (absolute velocity)
  const chartData = useMemo(() => {
    return data.map(d => ({
      ...d,
      speed: Math.abs(d.velocity)
    }));
  }, [data]);

  return (
    <div className="h-72 bg-white border-t border-slate-200 p-4 flex flex-col">
      <h3 className="text-sm font-semibold text-slate-600 mb-2 text-center">Speed vs Time</h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              dataKey="time" 
              label={{ value: 'Time (s)', position: 'insideBottomRight', offset: -5 }} 
              type="number" 
              domain={xDomain}
              allowDataOverflow={true}
              tick={{fontSize: 12}}
            />
            <YAxis 
              label={{ value: 'Speed (m/s)', angle: -90, position: 'insideLeft' }} 
              domain={yDomain} 
              tick={{fontSize: 12}}
              width={40}
              allowDataOverflow={true}
            />
            <Tooltip 
              contentStyle={{ fontSize: '12px', padding: '8px', borderRadius: '4px' }}
              labelFormatter={(v) => `Time: ${Number(v).toFixed(2)}s`}
              formatter={(value: number, name: string) => [value.toFixed(2), name === 'speed' ? 'Speed' : name]}
            />
            <Legend verticalAlign="top" height={36}/>
            
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
                  value: `Terminal Vel: ${terminalVelocity.toFixed(1)} m/s`, 
                  position: 'insideTopRight', 
                  fill: '#64748b',
                  fontSize: 12
                }} 
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
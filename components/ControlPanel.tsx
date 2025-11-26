import React from 'react';
import { SimulationParams } from '../types';

interface ControlPanelProps {
  params: SimulationParams;
  onChange: (newParams: SimulationParams) => void;
  isPlaying: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
}

const SliderControl: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (val: number) => void;
  disabled?: boolean;
}> = ({ label, value, min, max, step, unit, onChange, disabled }) => (
  <div className="mb-4">
    <div className="flex justify-between items-center mb-1">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <span className="text-xs font-mono text-slate-500">{value.toFixed(2)} {unit}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      disabled={disabled}
      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
    />
  </div>
);

const GravityButton: React.FC<{
  name: string;
  value: number;
  currentValue: number;
  onClick: (val: number) => void;
}> = ({ name, value, currentValue, onClick }) => {
  const isSelected = Math.abs(currentValue - value) < 0.01;
  return (
    <button
      onClick={() => onClick(value)}
      className={`
        flex flex-col items-center justify-center p-2 rounded-lg border transition-all
        ${isSelected 
          ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-1 ring-indigo-500' 
          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
        }
      `}
    >
      <span className="text-xs font-semibold">{name}</span>
      <span className="text-[10px] opacity-75">{value} m/s²</span>
    </button>
  );
};

export const ControlPanel: React.FC<ControlPanelProps> = ({
  params,
  onChange,
  isPlaying,
  onStart,
  onPause,
  onReset,
}) => {
  const updateParam = (key: keyof SimulationParams, value: number) => {
    onChange({ ...params, [key]: value });
  };

  return (
    <div className="w-full md:w-80 bg-white border-r border-slate-200 flex flex-col h-full overflow-y-auto z-10 shadow-xl">
      <div className="p-6 border-b border-slate-100">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
          Physics Sim
        </h1>
        <p className="text-xs text-slate-500 mt-1">Free Fall w/ Air Resistance</p>
      </div>

      <div className="p-6 flex-1 space-y-6">
        <div className="space-y-2">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Object Properties</h2>
          <SliderControl
            label="Initial Height (h)"
            value={params.height}
            min={10}
            max={500}
            step={10}
            unit="m"
            onChange={(v) => updateParam('height', v)}
            disabled={isPlaying} // Lock height during sim to avoid jumping
          />
          <SliderControl
            label="Mass (m)"
            value={params.mass}
            min={0.1}
            max={100}
            step={0.1}
            unit="kg"
            onChange={(v) => updateParam('mass', v)}
          />
          <SliderControl
            label="Diameter (d)"
            value={params.diameter}
            min={0.01}
            max={3.0}
            step={0.01}
            unit="m"
            onChange={(v) => updateParam('diameter', v)}
          />
        </div>

        <div className="space-y-2">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Environment</h2>
          <SliderControl
            label="Drag Coefficient (Cd)"
            value={params.dragCoeff}
            min={0.0}
            max={2.0}
            step={0.01}
            unit=""
            onChange={(v) => updateParam('dragCoeff', v)}
          />
          <SliderControl
            label="Air Density (ρ)"
            value={params.airDensity}
            min={0}
            max={5.0}
            step={0.01}
            unit="kg/m³"
            onChange={(v) => updateParam('airDensity', v)}
          />
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">Gravity (g)</label>
            <div className="grid grid-cols-3 gap-2">
              <GravityButton 
                name="Earth" 
                value={9.81} 
                currentValue={params.gravity} 
                onClick={(v) => updateParam('gravity', v)} 
              />
              <GravityButton 
                name="Moon" 
                value={1.62} 
                currentValue={params.gravity} 
                onClick={(v) => updateParam('gravity', v)} 
              />
              <GravityButton 
                name="Mars" 
                value={3.71} 
                currentValue={params.gravity} 
                onClick={(v) => updateParam('gravity', v)} 
              />
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-slate-100 bg-slate-50">
        <div className="flex gap-3">
          {!isPlaying ? (
            <button
              onClick={onStart}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg shadow transition-colors flex justify-center items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              Start
            </button>
          ) : (
            <button
              onClick={onPause}
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-medium py-2 px-4 rounded-lg shadow transition-colors flex justify-center items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Pause
            </button>
          )}
          <button
            onClick={onReset}
            className="flex-none bg-white hover:bg-slate-50 text-slate-700 font-medium py-2 px-4 border border-slate-300 rounded-lg transition-colors"
            title="Reset Simulation"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
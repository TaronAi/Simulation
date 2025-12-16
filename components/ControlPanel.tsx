
import React, { useState } from 'react';
import { SimulationParams } from '../types';
import { OBJECT_PRESETS, ObjectPreset } from '../constants';

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
      <span className="text-xs font-mono text-slate-500">{value < 0.01 ? value.toExponential(2) : value.toFixed(3)} {unit}</span>
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
  // Set default to TRUE (Advanced Mode)
  const [isAdvancedMode, setIsAdvancedMode] = useState(true);

  const updateParam = (key: keyof SimulationParams, value: number | string) => {
    // If the user manually tweaks mass, diameter, or drag, and we are currently
    // using a special skin (like watermelon), reset to the default 'ball' skin.
    let newParams = { ...params, [key]: value };
    
    if (['mass', 'diameter', 'dragCoeff'].includes(key) && params.objType !== 'ball') {
       newParams.objType = 'ball';
    }
    
    onChange(newParams);
  };

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const presetName = e.target.value;
    const preset = OBJECT_PRESETS.find(p => p.name === presetName);
    if (preset) {
      onChange({
        ...params,
        mass: preset.mass,
        diameter: preset.diameter,
        dragCoeff: preset.dragCoeff,
        objType: preset.objType
      });
    } else if (presetName === 'Custom') {
       onChange({
           ...params,
           objType: 'ball'
       });
    }
  };

  // Determine current preset
  const currentPresetName = React.useMemo(() => {
    const tol = 0.0001;
    const match = OBJECT_PRESETS.find(p => 
      Math.abs(p.mass - params.mass) < tol &&
      Math.abs(p.diameter - params.diameter) < tol &&
      Math.abs(p.dragCoeff - params.dragCoeff) < tol
    );
    return match ? match.name : 'Custom';
  }, [params.mass, params.diameter, params.dragCoeff]);

  return (
    <div className="w-full md:w-80 bg-white md:border-r border-t border-slate-200 flex flex-col h-auto max-h-[40vh] md:h-full md:max-h-full overflow-y-auto shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] md:shadow-xl">
      <div className="p-4 md:p-6 border-b border-slate-100 flex-none bg-white sticky top-0 z-10 flex flex-col gap-3">
        <div className="flex justify-between items-center w-full">
          <div>
            <h1 className="text-lg md:text-xl font-bold text-slate-800 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              Physics Sim
            </h1>
            <p className="text-xs text-slate-500 mt-1 hidden md:block">Free Fall w/ Air Resistance</p>
          </div>
        </div>
        
        {/* Segmented Mode Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-lg w-full">
          <button 
            onClick={() => setIsAdvancedMode(false)}
            className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${!isAdvancedMode ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Simple
          </button>
          <button 
            onClick={() => setIsAdvancedMode(true)}
            className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${isAdvancedMode ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Advanced
          </button>
        </div>
      </div>

      <div className="p-4 md:p-6 flex-1 space-y-6 overflow-y-auto">
        
        {/* Object Selection */}
        <div className="space-y-3">
           <div className="flex justify-between items-center">
             <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Object</h2>
           </div>
           
           <div className="relative">
             <select 
               value={currentPresetName}
               onChange={handlePresetChange}
               className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 appearance-none"
             >
               <option value="Custom">Custom Object</option>
               <optgroup label="Presets">
                 {OBJECT_PRESETS.map(p => (
                   <option key={p.name} value={p.name}>{p.name}</option>
                 ))}
               </optgroup>
             </select>
             <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-700">
               <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
             </div>
           </div>

           {/* Manual Sliders for Object - Hide in Simple Mode */}
           {isAdvancedMode && (
             <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <SliderControl
                label="Mass (m)"
                value={params.mass}
                min={0.01}
                max={50}
                step={0.001}
                unit="kg"
                onChange={(v) => updateParam('mass', v)}
              />
              <SliderControl
                label="Diameter (d)"
                value={params.diameter}
                min={0.01}
                max={1.0}
                step={0.001}
                unit="m"
                onChange={(v) => updateParam('diameter', v)}
              />
               <SliderControl
                label="Drag Coefficient (Cd)"
                value={params.dragCoeff}
                min={0.01}
                max={2.0}
                step={0.01}
                unit=""
                onChange={(v) => updateParam('dragCoeff', v)}
              />
             </div>
           )}
        </div>

        {/* Environment */}
        <div className="space-y-2 border-t border-slate-100 pt-4">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Environment</h2>
          
           <div className="mb-4">
             <label className="block text-sm font-medium text-slate-700 mb-1">Background Theme</label>
             <div className="relative">
              <select 
                value={params.theme || 'sky'}
                onChange={(e) => updateParam('theme', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 appearance-none"
              >
                <option value="sky">Blue Sky</option>
                <option value="space">Space</option>
                <option value="sunset">Sunset</option>
                <option value="mars">Mars</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
           </div>

          <SliderControl
            label="Initial Height (h)"
            value={params.height}
            min={10}
            max={500}
            step={10}
            unit="m"
            onChange={(v) => updateParam('height', v)}
            disabled={isPlaying} 
          />
          
          {isAdvancedMode && (
            <SliderControl
              label="Air Density (ρ)"
              value={params.airDensity}
              min={0}
              max={5.0}
              step={0.01}
              unit="kg/m³"
              onChange={(v) => updateParam('airDensity', v)}
            />
          )}
          
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

          <SliderControl
            label="Simulation Speed"
            value={params.timeScale || 1.0}
            min={0.1}
            max={5.0}
            step={0.1}
            unit="x"
            onChange={(v) => updateParam('timeScale', v)}
          />
        </div>
      </div>

      <div className="p-4 md:p-6 border-t border-slate-100 bg-slate-50 flex-none">
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

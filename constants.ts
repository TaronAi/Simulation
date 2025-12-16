
import { SimulationParams } from './types';

export const DEFAULT_PARAMS: SimulationParams = {
  mass: 10,           // 10 kg
  height: 200,        // 200 m
  dragCoeff: 0.47,    // Sphere
  airDensity: 1.225,  // Sea level
  diameter: 0.5,      // m (50cm)
  gravity: 9.81,      // Earth
  objType: 'ball',    // Default Red Ball
  timeScale: 1.0,     // Normal speed
  theme: 'sky',       // Default theme
};

export const TIME_STEP = 0.016; // ~60 FPS
export const MAX_HISTORY_POINTS = 200; // Limit graph points for performance

export interface ObjectPreset {
  name: string;
  mass: number;
  diameter: number;
  dragCoeff: number;
  objType: string;
}

export const OBJECT_PRESETS: ObjectPreset[] = [
  { 
    name: 'Red Ball', 
    mass: 10, 
    diameter: 0.5, 
    dragCoeff: 0.47,
    objType: 'ball'
  },
  { 
    name: 'Watermelon', 
    mass: 9.0, 
    diameter: 0.25, 
    dragCoeff: 0.47,
    objType: 'watermelon'
  },
  { 
    name: 'Chicken Egg', 
    mass: 0.06, 
    diameter: 0.045, 
    dragCoeff: 0.45,
    objType: 'egg'
  }
];

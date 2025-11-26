import { SimulationParams } from './types';

export const DEFAULT_PARAMS: SimulationParams = {
  mass: 10,           // 10 kg
  height: 200,        // 200 m
  dragCoeff: 0.47,    // Sphere
  airDensity: 1.225,  // Sea level
  diameter: 0.5,      // m (50cm)
  gravity: 9.81,      // Earth
};

export const TIME_STEP = 0.016; // ~60 FPS
export const MAX_HISTORY_POINTS = 200; // Limit graph points for performance
export interface SimulationParams {
  mass: number;        // kg
  height: number;      // m
  dragCoeff: number;   // dimensionless
  airDensity: number;  // kg/m^3
  diameter: number;    // m
  gravity: number;     // m/s^2
}

export interface SimulationState {
  time: number;
  y: number;
  v: number;
  a: number;
  hasLanded: boolean;
}

export interface DataPoint {
  time: number;
  position: number;
  velocity: number;
  acceleration: number;
}
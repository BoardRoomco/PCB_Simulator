import {stampConductance, stampCurrentSource, stampMOSFET} from '../equation';

const MOSFET_TYPE = {
  NMOS: 'nmos',
  PMOS: 'pmos'
};

const DEFAULT_MOSFET_PARAMS = {
  W: 10e-6,     // Width in meters
  L: 1e-6,      // Length in meters
  Cox: 2e-3,    // Gate oxide capacitance F/m²
  μn: 0.06,     // Carrier mobility m²/(V·s)
  Vth: 0.7,     // Threshold voltage
  λ: 0.01       // Channel length modulation
};

const COMPANION_MODEL_TYPE = {
  // Current source in parallel with a resistor
  // Better for DC steady state analysis where Δt→∞
  NORTON: {
    numVoltSources: 0
  },

  // Voltage source in series with a resistor
  // Better for small time steps where Δt→0
  // TODO should maybe use this when we support internal nodes?
  THEVENIN: {
    numVoltSources: 1,
    vSourceNums: [],
    internalNodes: 1 // NOTE we don't support internal nodes yet
  }
};

const INTEGRATION_METHOD = {
  // More accurate than FE or BE
  // Less stable than BE, more stable than FE
  TRAPEZOIDAL: {
    stampDynamic(data, equation, previousState = {}, timestep) {
      const {
        editables: {
          capacitance: {
            value: capacitance
          }
        },
        nodes: [n0, n1]
      } = data;

      const {
        currents: [previousCurrent] = [0],
        voltages: [pv0, pv1] = [0, 0]
      } = previousState;

      const conductance = (2 * capacitance) / timestep;
      stampConductance(equation)(conductance, n0, n1);

      const previousVoltage = pv0 - pv1;
      const currentSourceValue = previousCurrent + (conductance * previousVoltage);
      stampCurrentSource(equation)(currentSourceValue, n1, n0);

      return voltages => {
        const [v0, v1] = voltages;
        const resistorCurrent = (v0 - v1) * conductance;
        return [resistorCurrent - currentSourceValue];
      };
    }
  },

  // Similar accuracies, but BE is more stable
  FORWARD_EULER: 'NOT IMPLEMENTED',
  BACKWARD_EULER: 'NOT IMPLEMENTED'
};

export default {
  data: {
    nodes: [],
    type: MOSFET_TYPE.NMOS,
    params: DEFAULT_MOSFET_PARAMS
  },
  functions: {
    stamp: (data, equation) => {
      const {
        nodes: [drain, gate, source],  // Only 3 nodes provided from UI
        type,
        params
      } = data;

      // Use source node as bulk node by default
      const bulk = source;  

      // Stamp the MOSFET using the equation module's stampMOSFET function
      stampMOSFET(equation)(type, drain, gate, source, bulk, params);
    }
  }
}; 
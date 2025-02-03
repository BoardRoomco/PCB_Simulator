import {stampResistor} from '../equation';

export default {
  data: {
    nodes: []
  },
  functions: {
    stamp: (data, equation) => {
      const {
        editables: {
          resistance: {
            value: resistance
          },
          faulty: {
            value: faultyState
          }
        },
        nodes: [n1, n2]
      } = data;
      
      // Use a very small resistance (1e-6 ohms) when faulty to simulate a short
      const effectiveResistance = faultyState === 'Short' ? 1e-6 : resistance;
      stampResistor(equation)(effectiveResistance, n1, n2);
    }
  }
};

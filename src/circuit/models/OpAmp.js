import { stampVoltageSource, stampVCVS } from '../equation';

// Ideal op-amp model
export default {
  data: {
    nodes: [], // Will contain [vPlus, vMinus, vOut]
    numVoltages: 3,
    numCurrentPaths: 2,
    numOfConnectors: 3,
    numVoltSources: 1,
    vSourceNums: []
  },
  editablesSchema: {
    gain: {
      type: 'number',
      unit: ''
    }
  },
  defaultEditables: {
    gain: {
      value: 1e6
    }
  },
  functions: {
    stamp: (data, equation) => {
      const {
        nodes: [vPlus, vMinus, vOut], 
        vSourceNums: [vNum],
        editables: {
          gain: {
            value: gainValue = 1e6
          }
        }
      } = data;
      
      // For ideal op-amp, we enforce v+ = v- through high gain
      // Using voltage-controlled voltage source (VCVS) with high gain
      stampVoltageSource(equation)(0, vOut, 0, vNum);
      
      // Then add the controlling voltage gain
      const vIndex = equation.numOfNodes + vNum - 1;
      stampNodalAdmittanceMatrix(equation)(vIndex, vPlus, -gainValue);
      stampNodalAdmittanceMatrix(equation)(vIndex, vMinus, gainValue);
    },

    getCurrents: (props, state) => {
      const {
        voltages: [vPlus, vMinus, vOut] = [0, 0, 0],
        currents: [iIn, iOut] = [0, 0]
      } = state;

      return [iIn, iOut];
    },

    renderCurrent: (props, state, renderBetween) => {
      const {
        tConnectors: [vPlus, vMinus, vOut],
        currentOffsets: [offset1, offset2]
      } = props;

      renderBetween(vPlus, vOut, offset1);
      renderBetween(vMinus, vOut, offset2);
    }
  }
}; 
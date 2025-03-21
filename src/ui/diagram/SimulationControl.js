import React from 'react';
import { connect } from 'react-redux';
import { startSimulation, stopSimulation } from '../../state/actions';

class SimulationControl extends React.Component {
  componentDidUpdate(prevProps) {
    if (!prevProps.isSimulationRunning && this.props.isSimulationRunning) {
      // Start timer when simulation starts
      this.timer = setTimeout(() => {
        this.props.stopSimulation();
      }, 2000); // 2 seconds
    } else if (prevProps.isSimulationRunning && !this.props.isSimulationRunning) {
      // Clear timer when simulation stops
      if (this.timer) {
        clearTimeout(this.timer);
      }
    }
  }

  componentWillUnmount() {
    if (this.timer) {
      clearTimeout(this.timer);
    }
  }

  render() {
    const { isSimulationRunning, startSimulation, stopSimulation, competitionMode } = this.props;
    
    // Don't render anything in competition mode
    if (competitionMode) {
      return null;
    }

    return (
      <div style={styles.container}>
        <button 
          onClick={isSimulationRunning ? stopSimulation : startSimulation}
          style={{
            ...styles.button,
            backgroundColor: isSimulationRunning ? '#f44336' : '#4CAF50'
          }}
        >
          {isSimulationRunning ? 'Stop Simulation' : 'Start Simulation'}
        </button>
      </div>
    );
  }
}

const styles = {
  container: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    zIndex: 1000
  },
  button: {
    padding: '10px 20px',
    fontSize: '16px',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    transition: 'all 0.3s'
  }
};

const mapStateToProps = (state) => ({
  isSimulationRunning: state.circuit.isSimulationRunning,
  competitionMode: state.tools.competitionMode
});

const mapDispatchToProps = {
  startSimulation,
  stopSimulation
};

export default connect(mapStateToProps, mapDispatchToProps)(SimulationControl); 
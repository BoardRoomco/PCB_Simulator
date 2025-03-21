import R from 'ramda';
import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { Style } from 'radium';

import Sidebar from './sidebar/Sidebar.js';
import CircuitDiagram from './diagram';
import Toaster from './components/Toaster.js';

import {
  selectMode,
  deleteComponent,
  editComponent,
  changeCurrentSpeed,
  printCircuit,
  toggleCompetitionMode
} from '../state/actions';

class App extends React.Component {

  getChildContext() {
    return {
      theme: this.props.theme
    };
  }

  render() {
    const {
      styles,
      getCanvasSize,
      selectedComponent,
      showAddToaster,
      currentSpeed,
      competitionMode,
      selectMode: handleSelectMode,
      onDeleteComponent: handleDelete,
      oneditComponent: handleeditComponent,
      onChangeCurrentSpeed: handleChangeCurrentSpeed,
      onPrintCircuit: handlePrintCircuit,
      onToggleCompetitionMode: handleToggleCompetitionMode
    } = this.props;
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        width: '100%',
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        backgroundColor: '#333',  // Fallback color
        backgroundImage: 'url("icons/ideal_background.jpg")',
        backgroundSize: '100% 100%',  // Stretch to exactly fit width and height
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}>
        <Style
          rules={styles.global}
        />
        {!competitionMode && (
          <Sidebar
            style={styles.side}
            onSelectMode={handleSelectMode}
            currentSpeed={currentSpeed}
            selectedComponent={selectedComponent}
            onDeleteComponent={handleDelete}
            oneditComponent={handleeditComponent}
            onChangeCurrentSpeed={handleChangeCurrentSpeed}
            onPrintCircuit={handlePrintCircuit}
            onToggleCompetitionMode={handleToggleCompetitionMode}
          />
        )}
        <CircuitDiagram
          getDimensions={getCanvasSize}
          competitionMode={competitionMode}
        />
        <Toaster show={showAddToaster}>
          {"Click and drag on the canvas to create a component"}
        </Toaster>
      </div>
    );
  }
}

App.childContextTypes = {
  theme: React.PropTypes.object
};

App.propTypes = {
  styles: PropTypes.shape({
    global: PropTypes.object,
    side: PropTypes.object
  }).isRequired,
  theme: PropTypes.object.isRequired,
  getCanvasSize: PropTypes.func.isRequired,

  /* Injected by redux */
  // state
  selectedComponent: PropTypes.shape({
    typeID: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    editables: PropTypes.object
  }),
  showAddToaster: PropTypes.bool,
  currentSpeed: PropTypes.number,
  competitionMode: PropTypes.bool.isRequired,

  // action creators
  selectMode: PropTypes.func.isRequired,
  onDeleteComponent: PropTypes.func.isRequired,
  oneditComponent: PropTypes.func.isRequired,
  onChangeCurrentSpeed: PropTypes.func.isRequired,
  onPrintCircuit: PropTypes.func.isRequired,
  onToggleCompetitionMode: PropTypes.func.isRequired
};

// Which props do we want to inject, given the global state?
// Note: use https://github.com/faassen/reselect for better performance.
function mapStateToProps({ showAddToaster, selected, currentSpeed, views, tools }) {
  const fullSelectedComponent = views[selected];
  const selectedComponent = fullSelectedComponent
    ? R.pick(['typeID', 'id', 'editables'], fullSelectedComponent)
    : null;
  return {
    showAddToaster,
    selectedComponent,
    currentSpeed,
    competitionMode: tools.competitionMode
  };
}

const mapDispatchToProps = {
  selectMode,
  onDeleteComponent: deleteComponent,
  oneditComponent: editComponent,
  onChangeCurrentSpeed: changeCurrentSpeed,
  onPrintCircuit: printCircuit,
  onToggleCompetitionMode: toggleCompetitionMode
};

export default connect(mapStateToProps, mapDispatchToProps)(App);

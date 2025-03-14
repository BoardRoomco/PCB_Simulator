import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Style } from 'radium';
import CircuitDiagram from './diagram';
import Theme from './theme.js';
import getWindowDimensions from './utils/getWindowDimensions.js';

const COLORS = Theme.COLORS;
const {fontSize, fontFamily} = Theme.TYPOGRAPHY;

const defaultStyles = {
  fontSize,
  fontFamily,
  color: COLORS.base
};

const styles = {
  global: {
    html: defaultStyles,
    a: defaultStyles,
    button: defaultStyles
  }
};

// Create theme context
export const ThemeContext = React.createContext(Theme);

class AssessmentApp extends React.Component {
  static contextTypes = {
    store: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);
    this.state = getWindowDimensions();
    this.updateDimensions = this.updateDimensions.bind(this);
  }

  componentDidMount() {
    window.addEventListener('resize', this.updateDimensions);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateDimensions);
  }

  updateDimensions() {
    this.setState(getWindowDimensions());
  }

  render() {
    return (
      <ThemeContext.Provider value={Theme}>
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          backgroundColor: '#333333',
          width: '100%',
          height: '100vh',
          position: 'fixed',
          top: 0,
          left: 0
        }}>
          <Style rules={styles.global} />
          <CircuitDiagram
            width={this.state.width}
            height={this.state.height}
            getDimensions={getWindowDimensions}
            competitionMode={true}
          />
        </div>
      </ThemeContext.Provider>
    );
  }
}

export default connect()(AssessmentApp); 
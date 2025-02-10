import React from 'react';
import { connect } from 'react-redux';

class AnswerBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      answer: ''
    };
  }

  handleSubmit = (e) => {
    e.preventDefault();
    if (this.props.onSubmitAnswer) {
      this.props.onSubmitAnswer(this.state.answer);
      this.setState({ answer: '' }); // Clear input after submission
    }
  }

  render() {
    const { competitionMode } = this.props;
    
    if (!competitionMode) return null;

    return (
      <div style={styles.container}>
        <form onSubmit={this.handleSubmit} style={styles.form}>
          <input
            type="text"
            value={this.state.answer}
            onChange={(e) => this.setState({ answer: e.target.value })}
            placeholder="Enter your answer..."
            style={styles.input}
          />
          <button type="submit" style={styles.button}>
            Submit Answer
          </button>
        </form>
      </div>
    );
  }
}

const styles = {
  container: {
    position: 'fixed',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 1000,
    backgroundColor: '#333333',
    padding: '15px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
  },
  form: {
    display: 'flex',
    gap: '10px'
  },
  input: {
    padding: '8px 12px',
    fontSize: '16px',
    borderRadius: '4px',
    border: '1px solid #666',
    backgroundColor: '#444',
    color: '#fff',
    width: '300px'
  },
  button: {
    padding: '8px 16px',
    fontSize: '16px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  }
};

const mapStateToProps = (state) => ({
  competitionMode: state.tools.competitionMode
});

export default connect(mapStateToProps)(AnswerBar); 
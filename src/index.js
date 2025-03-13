import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import App from './ui/App';
import rootReducer from './state/reducers';

// Create store
const store = createStore(rootReducer, applyMiddleware(thunk));

// Expose the initialization function globally
window.initEditor = function() {
    // Use createRoot for React 18+
    ReactDOM.render(
        <React.StrictMode>
            <Provider store={store}>
                <App />
            </Provider>
        </React.StrictMode>,
        document.getElementById('root')
    );
}; 
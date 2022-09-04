// Dependencies create-react-app, @emotion/react, @emotion/styled,
// react, react-dom, react-scripts
// were released under MIT license.
// Dependencies @types/node, @types/react, @types/react-dom, typescript
// were released under Apache 2.0 license.
// The full license text can be found in the main directory of their respective
// github repositories.
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

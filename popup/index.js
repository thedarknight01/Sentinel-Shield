// popup/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Popup } from './Popup.jsx';

const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement);

root.render(<Popup />);

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './LandingPage';
import CommandCenter from './CommandCenter';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/app" element={<CommandCenter />} />
      </Routes>
    </Router>
  );
}

export default App;

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './Dashboard';
import ArchitecturePage from './Architecture';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/architecture" element={<ArchitecturePage />} />
      </Routes>
    </Router>
  );
}

export default App;
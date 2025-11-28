import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Calendar from './pages/Calendar';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/" element={<Navigate to="/calendar" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

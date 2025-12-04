import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Calendar from './pages/Calendar';
import Callback from './pages/Callback';
import Login from './pages/Login';  
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/callback" element={<Callback />} />
        
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/" element={<Navigate to="/calendar" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

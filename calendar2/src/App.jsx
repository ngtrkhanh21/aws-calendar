import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
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
        <Route path="/" element={<Navigate to="/callback" replace />} />
      </Routes>
      <ToastContainer position="top-right" autoClose={3000} />
    </BrowserRouter>
  );
}

export default App;

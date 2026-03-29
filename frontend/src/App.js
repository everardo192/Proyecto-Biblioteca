import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';

import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Books from './pages/Books';
import Users from './pages/Users';
import Loans from './pages/Loans';
import Profile from './pages/Profile';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <ToastContainer position="top-right" autoClose={3000} />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Navigate to="/dashboard" />} />
          
          <Route path="/dashboard" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />
          
          <Route path="/books" element={
            <PrivateRoute>
              <Books />
            </PrivateRoute>
          } />
          
          <Route path="/users" element={
            <PrivateRoute roles={['administrador', 'bibliotecario']}>
              <Users />
            </PrivateRoute>
          } />
          
          <Route path="/loans" element={
            <PrivateRoute roles={['administrador', 'bibliotecario']}>
              <Loans />
            </PrivateRoute>
          } />
          
          <Route path="/profile" element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
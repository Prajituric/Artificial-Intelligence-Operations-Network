import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import AgentCreator from './components/AgentCreator';
import TaskRunner from './components/TaskRunner';
import History from './components/History';
import AdminPanel from './components/AdminPanel';
import Navbar from './components/Navbar';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './App.css';

// Componenta pentru rute protejate
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

// Componenta pentru rute admin
const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  
  if (!user || user.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-100">
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={
              <ProtectedRoute>
                <div className="flex">
                  <Navbar />
                  <div className="flex-1">
                    <Dashboard />
                  </div>
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <div className="flex">
                  <Navbar />
                  <div className="flex-1">
                    <Dashboard />
                  </div>
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="/agents" element={
              <ProtectedRoute>
                <div className="flex">
                  <Navbar />
                  <div className="flex-1">
                    <AgentCreator />
                  </div>
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="/tasks" element={
              <ProtectedRoute>
                <div className="flex">
                  <Navbar />
                  <div className="flex-1">
                    <TaskRunner />
                  </div>
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="/history" element={
              <ProtectedRoute>
                <div className="flex">
                  <Navbar />
                  <div className="flex-1">
                    <History />
                  </div>
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="/admin" element={
              <AdminRoute>
                <div className="flex">
                  <Navbar />
                  <div className="flex-1">
                    <AdminPanel />
                  </div>
                </div>
              </AdminRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
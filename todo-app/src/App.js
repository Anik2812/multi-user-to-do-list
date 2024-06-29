import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import Login from './components/Login';
import Register from './components/Register';
import TodoList from './components/TodoList';
import './App.css';

const AppContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
`;

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  const setAndStoreToken = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  return (
    <Router>
      <AppContainer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Routes>
          <Route path="/login" element={<Login setToken={setAndStoreToken} />} />
          <Route path="/register" element={<Register setToken={setAndStoreToken} />} />
          <Route 
            path="/todos" 
            element={token ? <TodoList token={token} /> : <Navigate to="/login" />} 
          />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </AppContainer>
    </Router>
  );
}

export default App;
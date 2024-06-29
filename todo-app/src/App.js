// src/App.js
import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import api from './api';
import TaskList from './components/TaskList';

const socket = io('http://localhost:5000');

const App = () => {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const { data } = await api.get('/tasks');
        setTasks(data);
      } catch (error) {
        console.error('Error fetching tasks', error);
      }
    };
    fetchTasks();

    socket.on('taskCreated', (task) => {
      setTasks((prevTasks) => [...prevTasks, task]);
    });

    socket.on('taskUpdated', (updatedTask) => {
      setTasks((prevTasks) =>
        prevTasks.map((task) => (task._id === updatedTask._id ? updatedTask : task))
      );
    });

    socket.on('taskDeleted', (taskId) => {
      setTasks((prevTasks) => prevTasks.filter((task) => task._id !== taskId));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div>
      <h1>Real-Time To-Do List</h1>
      <TaskList tasks={tasks} setTasks={setTasks} />
    </div>
  );
};

export default App;
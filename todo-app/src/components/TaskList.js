// src/components/TaskList.js
import React, { useState, useEffect } from 'react';
import api from '../api';

const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [searchParams, setSearchParams] = useState({
    title: '',
    assignee: '',
    dueDate: '',
    status: '',
    priority: '',
  });

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
  }, []);

  const handleSearch = async () => {
    try {
      const { data } = await api.get('/tasks/search', { params: searchParams });
      setTasks(data);
    } catch (error) {
      console.error('Error searching tasks', error);
    }
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Title"
        value={searchParams.title}
        onChange={(e) => setSearchParams({ ...searchParams, title: e.target.value })}
      />
      {/* Add more search inputs for assignee, dueDate, status, priority */}
      <button onClick={handleSearch}>Search</button>
      <ul>
        {tasks.map((task) => (
          <li key={task._id}>{task.title}</li>
        ))}
      </ul>
    </div>
  );
};

export default TaskList;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';
import TodoItem from './TodoItem';
import TodoForm from './TodoForm';

const TodoContainer = styled(motion.div)`
  width: 400px;
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h1`
  color: #333;
  text-align: center;
`;

function TodoList({ token }) {
  const [todos, setTodos] = useState([]);

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const response = await axios.get('http://localhost:5000/todos', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTodos(response.data);
    } catch (error) {
      console.error('Failed to fetch todos', error);
    }
  };

  const addTodo = async (todo) => {
    try {
      const response = await axios.post('http://localhost:5000/todos', todo, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTodos([...todos, response.data]);
    } catch (error) {
      console.error('Failed to add todo', error);
    }
  };

  const updateTodo = async (id, updatedTodo) => {
    try {
      await axios.put(`http://localhost:5000/todos/${id}`, updatedTodo, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTodos(todos.map(todo => (todo.id === id ? updatedTodo : todo)));
    } catch (error) {
      console.error('Failed to update todo', error);
    }
  };

  const removeTodo = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/todos/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTodos(todos.filter(todo => todo.id !== id));
    } catch (error) {
      console.error('Failed to remove todo', error);
    }
  };

  return (
    <TodoContainer
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Title>What's the Plan for Today?</Title>
      <TodoForm onSubmit={addTodo} />
      <AnimatePresence>
        {todos.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            removeTodo={removeTodo}
            updateTodo={updateTodo}
          />
        ))}
      </AnimatePresence>
    </TodoContainer>
  );
}

export default TodoList;
import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FaTrash, FaEdit } from 'react-icons/fa';

const TodoItemContainer = styled(motion.div)`
  display: flex;
  align-items: center;
  padding: 10px;
  margin: 10px 0;
  background: ${props => props.completed ? '#e9e9e9' : '#f9f9f9'};
  border-radius: 5px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
`;

const TodoText = styled.span`
  flex-grow: 1;
  text-decoration: ${props => props.completed ? 'line-through' : 'none'};
`;

const IconButton = styled(motion.button)`
  background: none;
  border: none;
  cursor: pointer;
  margin-left: 10px;
  color: #555;
`;

function TodoItem({ todo, removeTodo, updateTodo }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);

  const handleUpdate = () => {
    updateTodo(todo.id, { ...todo, text: editText });
    setIsEditing(false);
  };

  const toggleComplete = () => {
    updateTodo(todo.id, { ...todo, completed: !todo.completed });
  };

  return (
    <TodoItemContainer
      layout
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ duration: 0.3 }}
      completed={todo.completed}
    >
      {isEditing ? (
        <>
          <input
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={handleUpdate}
            autoFocus
          />
          <IconButton onClick={handleUpdate}>
            <FaEdit />
          </IconButton>
        </>
      ) : (
        <>
          <TodoText completed={todo.completed} onClick={toggleComplete}>
            {todo.text}
          </TodoText>
          <IconButton
            onClick={() => setIsEditing(true)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <FaEdit />
          </IconButton>
          <IconButton
            onClick={() => removeTodo(todo.id)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <FaTrash />
          </IconButton>
        </>
      )}
    </TodoItemContainer>
  );
}

export default TodoItem;
import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const Form = styled.form`
  display: flex;
  margin-bottom: 20px;
`;

const Input = styled.input`
  flex-grow: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px 0 0 5px;
`;

const Button = styled(motion.button)`
  padding: 10px 20px;
  border: none;
  border-radius: 0 5px 5px 0;
  background: #4CAF50;
  color: white;
  cursor: pointer;
`;

function TodoForm({ onSubmit }) {
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSubmit({ id: Math.floor(Math.random() * 10000), text: input, completed: false });
    setInput('');
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Add a todo"
      />
      <Button
        type="submit"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        Add
      </Button>
    </Form>
  );
}

export default TodoForm;
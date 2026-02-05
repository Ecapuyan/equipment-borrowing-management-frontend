// src/components/chatbot/Chatbot.jsx
import React, { useState } from 'react';
import { Box, Paper, Typography, TextField, IconButton } from '@mui/material';
import { Send as SendIcon, Close as CloseIcon } from '@mui/icons-material';

const Chatbot = ({ toggleChatbot }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim() === '') return;

    const newMessages = [...messages, { text: input, sender: 'user' }];
    setMessages(newMessages);

    // Basic bot logic
    const botResponse = getBotResponse(input);
    setMessages([...newMessages, { text: botResponse, sender: 'bot' }]);

    setInput('');
  };

  const getBotResponse = (userInput) => {
    const lowerCaseInput = userInput.toLowerCase();
    if (lowerCaseInput.includes('hello')) {
      return 'Hi there! How can I help you?';
    }
    if (lowerCaseInput.includes('equipment')) {
        return 'You can find the available equipment on the "Borrow Equipment" page.';
    }
    if (lowerCaseInput.includes('reservation')) {
        return 'You can view your reservations on the "My Reservations" page.';
    }
    return "I'm sorry, I don't understand. Can you please rephrase?";
  };

  return (
    <Paper 
        elevation={10} 
        sx={{ 
            position: 'fixed', 
            bottom: 100, 
            right: 20, 
            width: 350, 
            height: 500, 
            display: 'flex', 
            flexDirection: 'column',
            zIndex: 1500,
            borderRadius: '15px',
            overflow: 'hidden'
        }}
    >
        <Box 
            sx={{ 
                p: 2, 
                backgroundColor: 'primary.main', 
                color: 'white', 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center'
            }}
        >
            <Typography variant="h6">Chat with Us</Typography>
            <IconButton onClick={toggleChatbot} size="small" sx={{ color: 'white' }}>
                <CloseIcon />
            </IconButton>
        </Box>
        <Box sx={{ flexGrow: 1, p: 2, overflowY: 'auto', backgroundColor: '#f5f5f5' }}>
            {messages.map((msg, index) => (
                <Box 
                    key={index} 
                    sx={{ 
                        mb: 1, 
                        display: 'flex', 
                        justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start' 
                    }}
                >
                    <Paper 
                        elevation={1} 
                        sx={{ 
                            p: 1, 
                            borderRadius: '10px',
                            backgroundColor: msg.sender === 'user' ? 'primary.light' : 'white'
                        }}
                    >
                        <Typography variant="body2">{msg.text}</Typography>
                    </Paper>
                </Box>
            ))}
        </Box>
        <Box sx={{ p: 1, display: 'flex', borderTop: '1px solid #ddd' }}>
            <TextField
                fullWidth
                size="small"
                variant="outlined"
                placeholder="Type a message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            />
            <IconButton color="primary" onClick={handleSend} sx={{ ml: 1 }}>
                <SendIcon />
            </IconButton>
        </Box>
    </Paper>
  );
};

export default Chatbot;
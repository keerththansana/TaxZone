import React, { useState, useRef, useEffect } from 'react';
import './Assistant.css';
import assistantImage from '../../../assets/Assistant.png';
import userImage from '../../../assets/User.jpg';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

// Configure axios with base URL and default headers
axios.defaults.baseURL = 'http://localhost:8000';
axios.defaults.headers.common['Content-Type'] = 'application/json';

const CopyIcon = () => (
    <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
);

const ChatMessage = ({ message }) => {
    const handleCopyClick = (text) => {
        navigator.clipboard.writeText(text).then(
            () => {
                // Optional: Add a visual feedback that text was copied
                console.log('Text copied');
            },
            (err) => {
                console.error('Failed to copy text:', err);
            }
        );
    };

    return (
        <div className={`message-container ${message.type}`}>
            <div className={`chat-message ${message.type}`}>
                <img
                    src={message.type === 'user' ? userImage : assistantImage}
                    alt={message.type}
                    className="chat-avatar"
                />
                <div className="chat-bubble">
                    {message.type === 'user' ? (
                        <p>{message.content}</p>
                    ) : (
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                    )}
                    <button
                        className="copy-button"
                        onClick={() => handleCopyClick(message.content)}
                        title="Copy to clipboard"
                    >
                        <CopyIcon />
                    </button>
                </div>
            </div>
        </div>
    );
};

const Assistant = () => {
    const [query, setQuery] = useState('');
    const [messages, setMessages] = useState([]);
    const [chatHistory, setChatHistory] = useState([
        { id: 1, title: 'Tax Rate Discussion', date: '2024-04-04' },
        { id: 2, title: 'Income Tax Calculation', date: '2024-04-04' },
    ]);
    const [selectedChat, setSelectedChat] = useState(null);
    const messagesEndRef = useRef(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recognition, setRecognition] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        // Initialize speech recognition
        if ('webkitSpeechRecognition' in window) {
            const recognition = new window.webkitSpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-US';

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setQuery(transcript); // Set the transcript as input value
                setIsRecording(false);
            };

            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                setIsRecording(false);
            };

            recognition.onend = () => {
                setIsRecording(false);
            };

            setRecognition(recognition);
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        try {
            setMessages(prev => [...prev, { type: 'user', content: query }]);
            setLoading(true);
            setError(null);

            const response = await axios.post('/api/chatbot/chat', { query });
            
            if (response.data.success) {
                setMessages(prev => [...prev, { 
                    type: 'bot', 
                    content: response.data.response,
                    hasContext: response.data.has_context 
                }]);
            } else {
                setError(response.data.error || 'Failed to get response');
            }

        } catch (err) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
            setQuery('');
            scrollToBottom();
        }
    };

    const handleVoiceInput = () => {
        if (recognition) {
            if (!isRecording) {
                recognition.start();
                setIsRecording(true);
            } else {
                recognition.stop();
                setIsRecording(false);
            }
        }
    };

    const startNewChat = () => {
        const newChat = {
            id: Date.now(),
            title: 'New Chat',
            date: new Date().toISOString().split('T')[0],
            messages: [],
        };
        setChatHistory([newChat, ...chatHistory]);
        setSelectedChat(newChat.id);
        setMessages([]);
    };

    const VoiceIcon = ({ isRecording }) => (
        <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke={isRecording ? "#ff0000" : "currentColor"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="22" />
        </svg>
    );

    return (
        <div className="assistant-layout">
            <div className="chat-history-sidebar">
                <button className="new-chat-button" onClick={startNewChat}>
                    + New Chat
                </button>
                <div className="chat-history-list">
                    {chatHistory.map((chat) => (
                        <div
                            key={chat.id}
                            className={`chat-history-item ${selectedChat === chat.id ? 'selected' : ''}`}
                            onClick={() => setSelectedChat(chat.id)}
                        >
                            <div className="chat-history-title">{chat.title}</div>
                            <div className="chat-history-date">{chat.date}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="assistant-container">
                <div className="chat-box">
                    {messages.length === 0 ? (
                        <div className="welcome-container">
                            <div className="assistant-welcome">
                                <img src={assistantImage} alt="AI Assistant" className="assistant-image" />
                                <h1 className="assistant-title">Tax Assistant</h1>
                            </div>
                            <div className="empty-state">
                                <p>Hi! I'm your Tax Assistant. How can I help you today?</p>
                            </div>
                        </div>
                    ) : (
                        messages.map((msg, index) => (
                            <ChatMessage key={index} message={msg} />
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>
                <form
                    className="assistant-input-container"
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSubmit(e);
                    }}
                >
                    <input
                        type="text"
                        placeholder="Enter Your Questions Here..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="assistant-input"
                    />
                    <button
                        type="button"
                        className={`mic-button ${isRecording ? 'recording' : ''}`}
                        onClick={handleVoiceInput}
                        title={recognition ? 'Click to speak' : 'Speech recognition not supported'}
                        disabled={!recognition}
                    >
                        <VoiceIcon isRecording={isRecording} />
                    </button>
                    <button type="submit" className="assistant-button" disabled={!query.trim()}>
                        &#x2191;
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Assistant;

import React, { useState, useRef, useEffect } from 'react';
import Header from '../../common/Header/Header';
import './Assistant.css';
import assistantImage from '../../../assets/Assistant.png';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../../../contexts/AuthContext';
import { FaUser } from 'react-icons/fa';
//import AuthPrompt from '../../common/AuthPrompt/AuthPrompt';

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

const UserIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#023636" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-2.2 3.6-4 8-4s8 1.8 8 4" />
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
                {message.type === 'user' ? (
                    <span className="chat-avatar user-avatar">
                        <FaUser size={36} color="#023636" />
                    </span>
                ) : (
                    <img
                        src={assistantImage}
                        alt={message.type}
                        className="chat-avatar"
                    />
                )}
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
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [query, setQuery] = useState('');
    const [messages, setMessages] = useState([]);
    const [chatHistory, setChatHistory] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const messagesEndRef = useRef(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recognition, setRecognition] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentConversation, setCurrentConversation] = useState(null);
    const { user } = useAuth(); // Get authenticated user

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (messages.length > 0) {
            scrollToBottom();
        }
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

    useEffect(() => {
        const fetchChatHistory = async () => {
            try {
                const authAxios = getAuthenticatedAxios();
                const response = await authAxios.get('/api/chatbot/history/');
                if (response.data.success) {
                    setChatHistory(response.data.history.map(chat => ({
                        id: chat.id,
                        title: chat.title,
                        date: new Date(chat.created_at).toLocaleDateString()
                    })));
                }
            } catch (err) {
                console.error('Error fetching chat history:', err);
            }
        };

        fetchChatHistory();
    }, []);

    //if (!isAuthenticated) {
    //    return <AuthPrompt service="AI Tax Assistant" />;
    //}

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        try {
            setMessages(prev => [...prev, { type: 'user', content: query }]);
            setLoading(true);
            setError(null);

            const authAxios = getAuthenticatedAxios();
            const response = await authAxios.post('/api/chatbot/chat', { 
                query,
                conversation_id: currentConversation?.id
            });
            
            if (response.data.success) {
                // Add bot response to messages
                setMessages(prev => [...prev, { 
                    type: 'bot', 
                    content: response.data.response,
                    hasContext: response.data.has_context 
                }]);

                // Update conversation title and history
                if (response.data.conversation_id && response.data.title) {
                    const newChat = {
                        id: response.data.conversation_id,
                        title: response.data.title,
                        date: new Date().toISOString().split('T')[0]
                    };

                    if (!currentConversation) {
                        // New conversation
                        setChatHistory(prev => [newChat, ...prev]);
                        setCurrentConversation(newChat);
                        setSelectedChat(newChat.id);
                    } else if (currentConversation.id === response.data.conversation_id) {
                        // Update existing conversation
                        setChatHistory(prev => prev.map(chat => 
                            chat.id === currentConversation.id 
                                ? { ...chat, title: response.data.title }
                                : chat
                        ));
                    }
                }
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
        setCurrentConversation(null);
        setSelectedChat(null);
        setMessages([]);
    };

    const handleChatSelect = async (chat) => {
        try {
            setLoading(true);
            setError(null);
            
            // Fetch conversation history from backend
            const authAxios = getAuthenticatedAxios();
            const response = await authAxios.get(`/api/chatbot/history/${chat.id}/`);
            
            if (response.data.success) {
                // Update current conversation
                setSelectedChat(chat.id);
                setCurrentConversation(chat);
                
                // Create an array to hold the conversation messages
                let formattedMessages = [];
                
                // Process each message pair
                response.data.messages.forEach(message => {
                    // Add user message
                    formattedMessages.push({
                        type: 'user',
                        content: message.query
                    });
                    
                    // Add assistant response
                    formattedMessages.push({
                        type: 'bot',
                        content: message.response
                    });
                });
                
                // Update messages state
                setMessages(formattedMessages);
                
                // Scroll to bottom after messages load
                setTimeout(scrollToBottom, 100);
            } else {
                setError('Failed to load conversation history');
            }
        } catch (err) {
            setError(err.message || 'Failed to load conversation');
            console.error('Error loading conversation:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteConversation = async (conversationId, e) => {
        e.stopPropagation(); // Prevent triggering chat selection
        try {
            const authAxios = getAuthenticatedAxios();
            const response = await authAxios.delete(`/api/chatbot/history/${conversationId}/delete/`);
            if (response.data.success) {
                // Remove from chat history
                setChatHistory(prev => prev.filter(chat => chat.id !== conversationId));
                
                // If deleted conversation was selected, clear messages
                if (selectedChat === conversationId) {
                    setMessages([]);
                    setSelectedChat(null);
                    setCurrentConversation(null);
                }
            }
        } catch (error) {
            console.error('Error deleting conversation:', error);
            setError('Failed to delete conversation');
        }
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

    // Function to get authenticated axios instance
    const getAuthenticatedAxios = () => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            return axios.create({
                baseURL: 'http://localhost:8000',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
        }
        return axios;
    };

    return (
        <div className="assistant-page">
            <Header />
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
                            >
                                <div 
                                    className="chat-history-content"
                                    onClick={() => handleChatSelect(chat)}
                                >
                                    <div className="chat-history-title">{chat.title}</div>
                                    <div className="chat-history-date">{chat.date}</div>
                                </div>
                                <button
                                    className="delete-button"
                                    onClick={(e) => handleDeleteConversation(chat.id, e)}
                                    title="Delete conversation"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path d="M3 6h18" strokeWidth="2" strokeLinecap="round"/>
                                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" strokeWidth="2"/>
                                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" strokeWidth="2"/>
                                    </svg>
                                </button>
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
                        <textarea
                            placeholder="Enter Your Questions Here..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="assistant-input"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && e.ctrlKey) {
                                    e.preventDefault();
                                    handleSubmit(e);
                                }
                            }}
                        />
                        
                        <button type="submit" className="assistant-button" disabled={!query.trim()}>
                            &#x2191;
                        </button>
                        <button
                            type="button"
                            className={`mic-button mic-icon-only${isRecording ? ' recording' : ''}`}
                            onClick={handleVoiceInput}
                            title={recognition ? 'Click to speak' : 'Speech recognition not supported'}
                            disabled={!recognition}
                        >
                            <VoiceIcon isRecording={isRecording} />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Assistant;

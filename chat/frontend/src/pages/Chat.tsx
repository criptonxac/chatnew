import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { Box, Grid, Paper, Typography, List, ListItem, ListItemText, ListItemAvatar, Avatar, TextField, IconButton, Divider, CircularProgress, Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import SendIcon from '@mui/icons-material/Send';
import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import LogoutIcon from '@mui/icons-material/Logout';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { getConversations, getMessages, sendMessage, getWebSocketUrl, searchUsers, createConversation, uploadFile } from '../services/api';

// Types
interface Conversation {
  id: number;
  name: string | null;
  is_group: boolean;
  created_by: number;
  created_at: string;
}

interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  is_read: boolean;
  timestamp: string;
  file_url?: string;
  file_name?: string;
  file_type?: string;
}

interface User {
  id: number;
  name: string;
  email: string;
}

// Styled Components
const ChatContainer = styled(Box)(() => ({
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: '#f5f5f5',
}));

const Sidebar = styled(Paper)(() => ({
  height: '100%',
  borderRadius: 0,
  borderRight: '1px solid #e0e0e0',
  display: 'flex',
  flexDirection: 'column',
}));

const SidebarHeader = styled(Box)(() => ({
  padding: '16px',
  backgroundColor: '#5288c1',
  color: 'white',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}));

const SearchBar = styled(Box)(() => ({
  padding: '8px 16px',
  backgroundColor: '#f5f5f5',
}));

const ConversationList = styled(List)(() => ({
  overflow: 'auto',
  flex: 1,
}));

const ConversationItem = styled(ListItem)<{ active?: boolean }>(({ active }) => ({
  cursor: 'pointer',
  backgroundColor: active ? '#e3f2fd' : 'transparent',
  '&:hover': {
    backgroundColor: active ? '#e3f2fd' : '#f5f5f5',
  },
}));

const ChatContent = styled(Box)(() => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
}));

const ChatHeader = styled(Box)(() => ({
  padding: '16px',
  backgroundColor: '#5288c1',
  color: 'white',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}));

const MessagesContainer = styled(Box)(() => ({
  flex: 1,
  padding: '16px',
  overflow: 'auto',
  backgroundColor: '#e6ebee', // Telegram-ga o'xshash fon rangi
  backgroundImage: 'linear-gradient(rgba(82, 136, 193, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(82, 136, 193, 0.05) 1px, transparent 1px)',
  backgroundSize: '20px 20px', // Telegram-ga o'xshash pattern
}));

const MessageBubble = styled(Box)<{ isOwn?: boolean }>(({ isOwn }) => ({
  maxWidth: '70%',
  padding: '8px 16px',
  borderRadius: isOwn ? '12px 12px 0 12px' : '12px 12px 12px 0', // Telegram-ga o'xshash burchaklar
  marginBottom: '4px',
  backgroundColor: isOwn ? '#5288c1' : 'white', // Telegram-ga o'xshash ranglar
  color: isOwn ? 'white' : 'black',
  alignSelf: isOwn ? 'flex-end' : 'flex-start',
  boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
  position: 'relative',
}));

const MessageInputContainer = styled(Box)(() => ({
  padding: '16px',
  backgroundColor: 'white',
  borderTop: '1px solid #e0e0e0',
  display: 'flex',
  alignItems: 'center',
}));

const Chat: React.FC = () => {
  const { user, logout } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileUploading, setFileUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await getConversations();
        setConversations(response.data);
        
        // Select first conversation by default if available
        if (response.data.length > 0 && !selectedConversation) {
          setSelectedConversation(response.data[0]);
        }
      } catch (error) {
        console.error('Error fetching conversations:', error);
      }
    };

    fetchConversations();
  }, []);

  // Fetch messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      const fetchMessages = async () => {
        setLoading(true);
        try {
          const response = await getMessages(selectedConversation.id);
          setMessages(response.data);
        } catch (error) {
          console.error('Error fetching messages:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchMessages();
      
      // Connect to WebSocket
      const wsUrl = getWebSocketUrl(selectedConversation.id);
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('WebSocket connected');
      };
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'message') {
          setMessages(prev => [...prev, {
            id: data.id,
            conversation_id: selectedConversation.id,
            sender_id: data.sender_id,
            content: data.content,
            is_read: false,
            timestamp: data.timestamp
          }]);
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      wsRef.current = ws;
      
      return () => {
        ws.close();
      };
    }
  }, [selectedConversation]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || !selectedConversation) return;
    
    try {
      let fileData = {};
      
      // Agar fayl tanlangan bo'lsa, uni yuklash
      if (selectedFile) {
        setFileUploading(true);
        try {
          const response = await uploadFile(selectedFile);
          fileData = {
            file_url: response.data.file_url,
            file_name: response.data.file_name,
            file_type: response.data.file_type
          };
        } catch (error) {
          console.error('Error uploading file:', error);
        } finally {
          setFileUploading(false);
        }
      }
      
      // Xabar yuborish
      await sendMessage({
        conversation_id: selectedConversation.id,
        content: newMessage.trim() || 'Fayl yuborildi',
        ...fileData
      });
      
      // Xabar yuborilgandan keyin maydonlarni tozalash
      setNewMessage('');
      setSelectedFile(null);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };
  
  // Fayl tanlash funksiyasi
  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
    }
  };
  
  // Fayl tanlash tugmasini bosish
  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  // Yangi suhbat yaratish funksiyasi
  const createNewConversation = async (userId: number, userName: string) => {
    try {
      setLoading(true);
      const response = await createConversation({
        name: userName,
        is_group: false,
        participant_ids: [userId]
      });
      
      // Suhbatlar ro'yxatini yangilash
      const newConversation = response.data;
      setConversations(prev => [newConversation, ...prev]);
      
      // Yangi yaratilgan suhbatni tanlash
      setSelectedConversation(newConversation);
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Error creating conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };


  useEffect(() => {
    const searchTimer = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setIsSearching(true);
        try {
          const response = await searchUsers(searchQuery);
          setSearchResults(response.data);
        } catch (error) {
          console.error('Error searching users:', error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(searchTimer);
  }, [searchQuery]);

  const filteredConversations = conversations.filter(conv => 
    conv.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    !searchQuery
  );

  return (
    <ChatContainer>
      <Grid container sx={{ height: '100%' }}>
        {/* Sidebar */}
        <Grid item xs={12} sm={4} md={3} sx={{ height: '100%' }}>
          <Sidebar elevation={0}>
            <SidebarHeader>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Free Chat
              </Typography>
              <IconButton color="inherit" onClick={logout}>
                <LogoutIcon />
              </IconButton>
            </SidebarHeader>
            
            <SearchBar>
              <TextField
                fullWidth
                placeholder="Search users or conversations..."
                variant="outlined"
                size="small"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
                }}
              />
            </SearchBar>
            
            <ConversationList>
              {/* Foydalanuvchilar qidiruv natijalari */}
              {searchQuery.length >= 2 && searchResults.length > 0 && (
                <>
                  <Typography variant="subtitle2" sx={{ px: 2, py: 1, color: 'text.secondary' }}>
                    Users
                  </Typography>
                  {searchResults.map((user) => (
                    <React.Fragment key={`user-${user.id}`}>
                      <ConversationItem
                        onClick={() => {
                          // Create new conversation with this user
                          createNewConversation(user.id, user.name);
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: '#5288c1' }}>
                            {user.name[0].toUpperCase()}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={user.name}
                          secondary={user.email}
                        />
                      </ConversationItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </>
              )}
              
              {/* Suhbatlar ro'yxati */}
              {searchQuery.length < 2 || searchResults.length === 0 ? (
                filteredConversations.length === 0 ? (
                  <Box sx={{ p: 2, textAlign: 'center' }}>
                    <Typography color="textSecondary">
                      {isSearching ? 'Searching...' : 'No conversations found'}
                    </Typography>
                  </Box>
                ) : (
                  filteredConversations.map((conversation) => (
                    <React.Fragment key={conversation.id}>
                      <ConversationItem 
                        active={selectedConversation?.id === conversation.id}
                        onClick={() => setSelectedConversation(conversation)}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: '#5288c1' }}>
                            {conversation.name ? conversation.name[0].toUpperCase() : 'C'}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText 
                          primary={conversation.name || 'Unnamed Chat'} 
                          secondary={format(new Date(conversation.created_at), 'MMM d, yyyy')}
                        />
                      </ConversationItem>
                      <Divider />
                    </React.Fragment>
                  ))
                )
              ) : null}
            </ConversationList>
          </Sidebar>
        </Grid>
        
        {/* Chat Content */}
        <Grid item xs={12} sm={8} md={9} sx={{ height: '100%' }}>
          {selectedConversation ? (
            <ChatContent>
              <ChatHeader>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: '#3a6ea5', mr: 1 }}>
                    {selectedConversation.name ? selectedConversation.name[0].toUpperCase() : 'C'}
                  </Avatar>
                  <Typography variant="h6">{selectedConversation.name || 'Unnamed Chat'}</Typography>
                </Box>
                <IconButton color="inherit">
                  <MoreVertIcon />
                </IconButton>
              </ChatHeader>
              
              <MessagesContainer>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <CircularProgress />
                  </Box>
                ) : messages.length === 0 ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Typography color="textSecondary">No messages yet. Start the conversation!</Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    {messages.map((message) => (
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: message.sender_id === user?.id ? 'flex-end' : 'flex-start', mb: 2, position: 'relative' }} key={message.id}>
                        {/* Foydalanuvchi nomi (faqat boshqa foydalanuvchilar uchun) */}
                        {message.sender_id !== user?.id && (
                          <Typography variant="caption" sx={{ ml: 1, mb: 0.5, color: '#5288c1', fontWeight: 'bold' }}>
                            {selectedConversation?.name || 'Foydalanuvchi'}
                          </Typography>
                        )}
                        
                        <MessageBubble isOwn={message.sender_id === user?.id}>
                          <Typography variant="body1">{message.content}</Typography>
                          
                          {/* Fayl mavjud bo'lsa, uni ko'rsatish */}
                          {message.file_url && (
                            <Box sx={{ mt: 1, mb: 1 }}>
                              {message.file_type?.startsWith('image/') ? (
                                // Agar rasm bo'lsa
                                <Box 
                                  component="img" 
                                  src={`http://localhost:8005${message.file_url}`}
                                  sx={{ 
                                    maxWidth: '100%', 
                                    maxHeight: '200px',
                                    borderRadius: 1,
                                    cursor: 'pointer'
                                  }}
                                  onClick={() => window.open(`http://localhost:8005${message.file_url}`, '_blank')}
                                />
                              ) : (
                                // Agar boshqa turdagi fayl bo'lsa
                                <Button
                                  variant="outlined"
                                  startIcon={<InsertDriveFileIcon />}
                                  href={`http://localhost:8005${message.file_url}`}
                                  target="_blank"
                                  size="small"
                                  sx={{ textTransform: 'none', color: message.sender_id === user?.id ? 'white' : '#5288c1', borderColor: message.sender_id === user?.id ? 'white' : '#5288c1' }}
                                >
                                  {message.file_name}
                                </Button>
                              )}
                            </Box>
                          )}
                          
                          <Typography variant="caption" color={message.sender_id === user?.id ? 'rgba(255,255,255,0.7)' : 'textSecondary'} sx={{ display: 'block', textAlign: 'right', mt: 0.5 }}>
                            {format(new Date(message.timestamp), 'HH:mm')}
                          </Typography>
                        </MessageBubble>
                        
                        {/* O'qilganlik holati (faqat o'z xabarlari uchun) */}
                        {message.sender_id === user?.id && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5, mr: 1 }}>
                            <Typography variant="caption" sx={{ fontSize: '0.7rem', color: message.is_read ? '#5288c1' : 'text.disabled', mr: 0.5 }}>
                              {message.is_read ? 'O\'qildi' : 'Yuborildi'}
                            </Typography>
                            {message.is_read ? (
                              <Box sx={{ fontSize: '1rem', color: '#5288c1', lineHeight: 1 }}>✓✓</Box>
                            ) : (
                              <Box sx={{ fontSize: '1rem', color: 'text.disabled', lineHeight: 1 }}>✓</Box>
                            )}
                          </Box>
                        )}
                      </Box>
                    ))}
                    <div ref={messagesEndRef} />
                  </Box>
                )}
              </MessagesContainer>
              
              <MessageInputContainer>
                {/* Tanlangan fayl ko'rsatiladi */}
                {selectedFile && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, p: 1, bgcolor: '#f0f0f0', borderRadius: 1 }}>
                    <InsertDriveFileIcon sx={{ mr: 1, color: '#5288c1' }} />
                    <Typography variant="body2" sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {selectedFile.name}
                    </Typography>
                    <IconButton size="small" onClick={() => setSelectedFile(null)}>
                      &times;
                    </IconButton>
                  </Box>
                )}
                
                <Box sx={{ display: 'flex', width: '100%' }}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileSelect}
                  />
                  <IconButton color="primary" onClick={handleAttachClick}>
                    <AttachFileIcon />
                  </IconButton>
                  <TextField
                    fullWidth
                    placeholder="Type a message..."
                    variant="outlined"
                    size="small"
                    multiline
                    maxRows={4}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    sx={{ mx: 1 }}
                    disabled={fileUploading}
                  />
                  <IconButton 
                    color="primary" 
                    onClick={handleSendMessage}
                    disabled={fileUploading || (!newMessage.trim() && !selectedFile)}
                  >
                    {fileUploading ? <CircularProgress size={24} /> : <SendIcon />}
                  </IconButton>
                </Box>
              </MessageInputContainer>
            </ChatContent>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', bgcolor: '#f5f5f5' }}>
              <Typography color="textSecondary">Select a conversation to start chatting</Typography>
            </Box>
          )}
        </Grid>
      </Grid>
    </ChatContainer>
  );
};

export default Chat;

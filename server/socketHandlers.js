const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Message = require('./models/Message');
const Conversation = require('./models/Conversation');

// Store active users and their socket connections
const activeUsers = new Map();

const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return next(new Error('Authentication error'));
    }

    socket.userId = user._id.toString();
    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
};

const handleConnection = (io, socket) => {
  console.log(`User ${socket.user.username} connected`);

  // Add user to active users
  activeUsers.set(socket.userId, {
    socketId: socket.id,
    user: socket.user,
    isTyping: false
  });

  // Update user online status
  User.findByIdAndUpdate(socket.userId, { 
    isOnline: true, 
    lastSeen: new Date() 
  }).exec();

  // Join user to their personal room
  socket.join(`user_${socket.userId}`);

  // Notify other users that this user is online
  socket.broadcast.emit('user:online', {
    userId: socket.userId,
    isOnline: true
  });

  // Handle sending messages
  socket.on('message:send', async (data) => {
    try {
      const { conversationId, content, messageType = 'text' } = data;

      // Verify user is participant in this conversation
      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: socket.userId
      });

      if (!conversation) {
        socket.emit('error', { message: 'Conversation not found' });
        return;
      }

      // Create new message
      const message = new Message({
        conversationId,
        sender: socket.userId,
        content,
        messageType
      });

      await message.save();
      await message.populate('sender', 'username');

      // Update conversation's last message
      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: message._id,
        lastMessageAt: new Date()
      });

      // Send message to all participants in the conversation
      const conversationData = await Conversation.findById(conversationId)
        .populate('participants', 'username email isOnline lastSeen');

      conversationData.participants.forEach(participant => {
        io.to(`user_${participant._id}`).emit('message:new', {
          message,
          conversationId
        });
      });

    } catch (error) {
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle typing indicators
  socket.on('typing:start', async (data) => {
    const { conversationId } = data;
    
    // Verify user is participant in this conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: socket.userId
    });

    if (conversation) {
      const userData = activeUsers.get(socket.userId);
      if (userData) {
        userData.isTyping = true;
        userData.typingIn = conversationId;
      }

      // Notify other participants
      conversation.participants.forEach(participantId => {
        if (participantId.toString() !== socket.userId) {
          io.to(`user_${participantId}`).emit('typing:start', {
            conversationId,
            userId: socket.userId,
            username: socket.user.username
          });
        }
      });
    }
  });

  socket.on('typing:stop', async (data) => {
    const { conversationId } = data;
    
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: socket.userId
    });

    if (conversation) {
      const userData = activeUsers.get(socket.userId);
      if (userData) {
        userData.isTyping = false;
        userData.typingIn = null;
      }

      // Notify other participants
      conversation.participants.forEach(participantId => {
        if (participantId.toString() !== socket.userId) {
          io.to(`user_${participantId}`).emit('typing:stop', {
            conversationId,
            userId: socket.userId
          });
        }
      });
    }
  });

  // Handle message read receipts
  socket.on('message:read', async (data) => {
    const { conversationId, messageIds } = data;

    try {
      // Verify user is participant in this conversation
      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: socket.userId
      });

      if (conversation) {
        // Mark messages as read
        await Message.updateMany(
          { 
            _id: { $in: messageIds },
            conversationId,
            sender: { $ne: socket.userId } // Don't mark own messages as read
          },
          { 
            isRead: true,
            readAt: new Date()
          }
        );

        // Notify sender that messages were read
        const updatedMessages = await Message.find({
          _id: { $in: messageIds },
          conversationId
        }).populate('sender', 'username');

        updatedMessages.forEach(message => {
          if (message.sender._id.toString() !== socket.userId) {
            io.to(`user_${message.sender._id}`).emit('message:read', {
              messageId: message._id,
              conversationId,
              readBy: socket.userId
            });
          }
        });
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  });

  // Handle disconnection
  socket.on('disconnect', async () => {
    console.log(`User ${socket.user.username} disconnected`);

    const userData = activeUsers.get(socket.userId);
    if (userData && userData.isTyping && userData.typingIn) {
      // Notify that user stopped typing
      socket.broadcast.emit('typing:stop', {
        conversationId: userData.typingIn,
        userId: socket.userId
      });
    }

    // Remove user from active users
    activeUsers.delete(socket.userId);

    // Update user offline status
    await User.findByIdAndUpdate(socket.userId, { 
      isOnline: false,
      lastSeen: new Date()
    });

    // Notify other users that this user is offline
    socket.broadcast.emit('user:offline', {
      userId: socket.userId,
      isOnline: false
    });
  });
};

module.exports = { authenticateSocket, handleConnection, activeUsers };

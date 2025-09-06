# 💬 Real-time Chat App

A complete real-time 1:1 chat application built with React Native (frontend) and Node.js (Express + Socket.IO) backend with MongoDB database.


## 🚀 Live Demo

- **Backend API**: http://localhost:3000/api/health
- **Socket.IO**: http://localhost:3000
- **Mobile App**: Run on iOS/Android simulator or device

## Features

- **Authentication**: JWT-based register/login system
- **Real-time Messaging**: Socket.IO for instant message delivery
- **User Management**: View all users with online/offline status
- **Typing Indicators**: See when someone is typing
- **Message Delivery**: Read receipts and delivery status
- **Persistent Storage**: Messages stored in MongoDB
- **Modern UI**: Clean and intuitive interface



## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- React Native development environment
- iOS Simulator or Android Emulator

## Setup Instructions

### 1. Backend Setup

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file (copy from `env.example`):
   ```bash
   cp env.example .env
   ```

4. Update the `.env` file with your configuration:
   ```env
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/chat-app
   JWT_SECRET=your-super-secret-jwt-key-here
   NODE_ENV=development
   ```

5. Start MongoDB (if running locally):
   ```bash
   mongod
   ```

6. Start the server:
   ```bash
   npm run dev
   ```

The server will run on `http://localhost:3000`

### 2. Mobile App Setup

1. Navigate to the mobile app directory:
   ```bash
   cd mobile/ChatApp
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. For iOS (macOS only):
   ```bash
   cd ios && pod install && cd ..
   ```

4. Start the Metro bundler:
   ```bash
   npx react-native start
   ```

5. Run the app:
   - **iOS**: `npx react-native run-ios`
   - **Android**: `npx react-native run-android`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users` - Get all users

### Conversations
- `POST /api/conversations` - Create/Get conversation
- `GET /api/conversations` - Get user conversations
- `GET /api/conversations/:id/messages` - Get conversation messages

## Socket.IO Events

### Client to Server
- `message:send` - Send new message
- `typing:start` - Start typing indicator
- `typing:stop` - Stop typing indicator
- `message:read` - Mark messages as read

### Server to Client
- `message:new` - Receive new message
- `typing:start` - User started typing
- `typing:stop` - User stopped typing
- `message:read` - Message was read
- `user:online` - User came online
- `user:offline` - User went offline

## Sample Users

You can create test users through the registration screen or directly in MongoDB:

```javascript
// Example user document
{
  "username": 
  "email": 
  "password": 
  "isOnline": 
  "lastSeen": 
}
```

## Environment Variables

### Server (.env)
- `PORT` - Server port (default: 3000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `NODE_ENV` - Environment (development/production)

### Mobile App
Update the `API_BASE_URL` in `src/services/api.js` if your server runs on a different host/port.


## Development

### Backend Development
- Uses nodemon for auto-restart
- MongoDB for data persistence
- JWT for authentication
- Socket.IO for real-time features

### Frontend Development
- React Native with navigation
- Context API for state management
- AsyncStorage for local data persistence
- Socket.IO client for real-time communication




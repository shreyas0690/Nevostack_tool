# 🔄 Automatic Token Refresh System

## Overview

Ye system automatically handle karta hai access token expiry aur refresh token ka use karke seamless user experience provide karta hai. Jab bhi access token expire hota hai (15 minutes baad), system automatically refresh token use karke naya access token generate karta hai.

## 🚀 Features

- ✅ **Automatic Token Refresh**: Access token expire hone par automatically refresh
- ✅ **Seamless API Calls**: User ko pata nahi chalta ki token refresh hua hai
- ✅ **Queue Management**: Multiple API calls ko handle karta hai during refresh
- ✅ **Error Handling**: Proper error handling aur fallback mechanisms
- ✅ **Security**: Secure token storage aur transmission
- ✅ **Device Tracking**: Device-based token management

## 🏗️ Architecture

### Backend Components

1. **Enhanced Auth Middleware** (`backend/middleware/auth.js`)
   - `attemptTokenRefresh()` function
   - Automatic token refresh logic
   - Response headers for new tokens

2. **Refresh Endpoint** (`backend/routes/auth.js`)
   - `/api/auth/refresh` endpoint
   - Manual token refresh support

### Frontend Components

1. **API Service** (`tiny-typer-tool-09/src/services/api.ts`)
   - Axios interceptors for automatic refresh
   - Token storage management
   - Request/response handling

2. **Auth Service** (`tiny-typer-tool-09/src/services/auth.ts`)
   - Login/logout functionality
   - User state management
   - Authentication utilities

## 📋 Token Flow

```
1. User Login
   ↓
2. Get Access Token (15 min) + Refresh Token (7 days)
   ↓
3. API Call with Access Token
   ↓
4. Token Expired? (401 Error)
   ↓
5. Automatic Refresh Token Call
   ↓
6. Get New Tokens
   ↓
7. Retry Original API Call
   ↓
8. Success!
```

## 🛠️ Usage

### Backend Setup

Backend already configured hai. Koi additional setup nahi chahiye.

### Frontend Setup

1. **Import Services**:
```typescript
import apiService from './services/api';
import authService from './services/auth';
```

2. **Login**:
```typescript
const loginResponse = await authService.login({
  email: 'user@example.com',
  password: 'password123'
});
```

3. **Make API Calls**:
```typescript
// Ye automatically handle karega token refresh
const profile = await apiService.get('/api/auth/profile');
const tasks = await apiService.get('/api/members/tasks');
```

4. **Listen for Auth Events**:
```typescript
window.addEventListener('auth:failed', (event) => {
  // Handle authentication failure
  console.log('Auth failed:', event.detail);
});

window.addEventListener('auth:logout', () => {
  // Handle logout
  console.log('User logged out');
});
```

## 🧪 Testing

### Backend Test

```bash
cd backend
node test-automatic-token-refresh.js
```

### Frontend Test

```typescript
// Example component mein test karein
import AutomaticTokenRefreshExample from './examples/automatic-token-refresh-usage';
```

## 🔧 Configuration

### Token Durations

```javascript
// backend/middleware/auth.js
const ACCESS_TOKEN_EXPIRY = '15m';  // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d';  // 7 days
```

### Environment Variables

```env
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
```

## 📱 Device Management

System har device ke liye separate tokens maintain karta hai:

- **Device ID**: Unique identifier for each device
- **Device Tracking**: Login history aur activity tracking
- **Multi-Device Support**: Multiple devices per user
- **Device Security**: Device locking aur trust management

## 🔒 Security Features

1. **Secure Token Storage**: localStorage mein encrypted storage
2. **HTTP-Only Cookies**: Server-side cookie support
3. **Device Validation**: Device ID verification
4. **Token Rotation**: Refresh token bhi rotate hota hai
5. **Session Management**: Proper session cleanup

## 🚨 Error Handling

### Common Scenarios

1. **Token Expired**: Automatic refresh attempt
2. **Refresh Failed**: Redirect to login
3. **Network Error**: Retry mechanism
4. **Device Locked**: Security response
5. **Invalid Tokens**: Clear storage aur redirect

### Error Events

```typescript
// Auth failure event
window.addEventListener('auth:failed', (event) => {
  const { message } = event.detail;
  // Show login modal or redirect
});

// Logout event
window.addEventListener('auth:logout', () => {
  // Clear UI state
});
```

## 📊 Monitoring

### Backend Logs

```javascript
// Automatic refresh logs
console.log('🔄 Tokens automatically refreshed by server');
console.log('❌ Token refresh attempt failed:', error);
```

### Frontend Logs

```javascript
// API service logs
console.log('🔄 Attempting automatic token refresh...');
console.log('✅ Tokens refreshed successfully');
console.log('❌ Token refresh failed:', error);
```

## 🔄 Migration Guide

### Existing Code Update

1. **Replace axios calls**:
```typescript
// Old way
const response = await axios.get('/api/users');

// New way
const response = await apiService.get('/api/users');
```

2. **Update auth handling**:
```typescript
// Old way
const token = localStorage.getItem('token');
axios.defaults.headers.Authorization = `Bearer ${token}`;

// New way
// Automatic handling by apiService
```

## 🐛 Troubleshooting

### Common Issues

1. **Tokens not refreshing**:
   - Check device ID in headers
   - Verify refresh token validity
   - Check network connectivity

2. **Infinite refresh loop**:
   - Check refresh token expiry
   - Verify device status
   - Clear localStorage

3. **CORS issues**:
   - Check backend CORS configuration
   - Verify credentials setting

### Debug Mode

```typescript
// Enable debug logging
localStorage.setItem('debug', 'true');
```

## 📈 Performance

- **Minimal Overhead**: Only refreshes when needed
- **Queue Management**: Efficient handling of multiple requests
- **Caching**: Token caching for performance
- **Background Refresh**: Non-blocking refresh process

## 🔮 Future Enhancements

- [ ] Token refresh prediction
- [ ] Background refresh scheduling
- [ ] Advanced device management
- [ ] Token analytics
- [ ] Multi-tenant token support

## 📞 Support

Agar koi issue hai to:

1. Check console logs
2. Run test scripts
3. Verify configuration
4. Check network requests

---

**Note**: Ye system production-ready hai aur security best practices follow karta hai. Regular testing aur monitoring recommend karte hain.

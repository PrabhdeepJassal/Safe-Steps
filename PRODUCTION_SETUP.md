# Safe Steps - Production Deployment Guide

## Current Development vs Production

### Development (Current Setup)
- Each team member runs backend locally
- Frontend connects to local IP addresses (e.g., `192.168.29.111:3000`)
- Shared MongoDB Atlas database
- Expo Go for testing

### Production (Recommended)
- Backend deployed to cloud service
- Frontend uses production API URL
- Same MongoDB Atlas database
- Built apps distributed via app stores

## Backend Deployment Options

### Option 1: Railway (Recommended - Free & Easy)
Railway is modern, simple, and has good free tier.

1. **Setup Railway**:
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login to Railway
   railway login
   
   # Deploy from backend folder
   cd backend
   railway deploy
   ```

2. **Environment Variables**:
   - Copy your `.env` variables to Railway dashboard
   - Railway will provide a production URL like: `https://safesteps-production.up.railway.app`

3. **Update Frontend**:
   ```javascript
   // In config/api.js
   const getApiUrl = () => {
     if (__DEV__) {
       // Development URLs (current setup)
       return 'http://192.168.29.111:3000';
     } else {
       // Production URL from Railway
       return 'https://safesteps-production.up.railway.app';
     }
   };
   ```

### Option 2: Render (Also Good & Free)
1. **Connect GitHub**: Link your repository to Render
2. **Deploy Backend**: Select the `backend` folder as root
3. **Add Environment Variables**: Copy from your `.env` file
4. **Get Production URL**: Render provides a URL like `https://safesteps.onrender.com`

### Option 3: Heroku (Classic Choice)
```bash
# Install Heroku CLI
# Create Heroku app
heroku create safesteps-backend

# Set environment variables
heroku config:set MONGO_URI="your_mongo_uri"
heroku config:set JWT_SECRET="your_jwt_secret"
heroku config:set PORT=5000

# Deploy
git subtree push --prefix backend heroku main
```

### Option 4: Vercel (Good for Node.js)
1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy Backend**:
   ```bash
   cd backend
   vercel
   ```

3. **Configure**: Add environment variables in Vercel dashboard

## Frontend Production Build

### Option 1: Expo EAS Build (Recommended)
```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Configure EAS
eas build:configure

# Build for production
eas build --platform all
```

### Option 2: React Native CLI Build
If you eject from Expo:
```bash
# Android
cd android && ./gradlew assembleRelease

# iOS
cd ios && xcodebuild -workspace SafeSteps.xcworkspace -scheme SafeSteps archive
```

## Production Configuration Template

Create a production-ready API configuration:

```javascript
// config/api.js - Production Version
import { Platform } from 'react-native';

const getApiUrl = () => {
  // Check if we're in development or production
  if (__DEV__) {
    // Development mode - local testing
    console.log('Running in DEVELOPMENT mode');
    
    if (Platform.OS === 'android') {
      // For Android emulator
      return 'http://10.0.2.2:3000';
      
      // For Android physical device (uncomment and update IP)
      // return 'http://192.168.29.111:3000';
    }
    
    if (Platform.OS === 'ios') {
      // For iOS simulator
      return 'http://localhost:3000';
      
      // For iOS physical device (uncomment and update IP)
      // return 'http://192.168.29.111:3000';
    }
    
    // Default fallback for development
    return 'http://localhost:3000';
    
  } else {
    // Production mode - deployed app
    console.log('Running in PRODUCTION mode');
    
    // Your production backend URL (update this after deployment)
    return 'https://safesteps-production.up.railway.app';
    // or 'https://safesteps.onrender.com'
    // or 'https://safesteps-backend.herokuapp.com'
  }
};

const API_CONFIG = {
  BASE_URL: getApiUrl(),
  TIMEOUT: 10000, // 10 second timeout for production
};

export const API_ENDPOINTS = {
  LOGIN: `${API_CONFIG.BASE_URL}/api/auth/login`,
  SIGNUP: `${API_CONFIG.BASE_URL}/api/auth/signup`,
  // Add more endpoints as needed
};

// Enhanced logging for production debugging
console.log('API Configuration:', {
  Platform: Platform.OS,
  BaseURL: API_CONFIG.BASE_URL,
  isDev: __DEV__,
  timestamp: new Date().toISOString()
});

export default API_CONFIG;
```

## Database Production Setup

Your MongoDB Atlas is already production-ready, but ensure:

1. **Security**:
   - Whitelist only production server IPs
   - Use strong passwords
   - Enable database auditing

2. **Performance**:
   - Set up indexes for frequently queried fields
   - Monitor database performance

3. **Backup**:
   - Enable automatic backups
   - Test restore procedures

## Deployment Workflow

### Step-by-Step Production Deployment

1. **Prepare Backend**:
   ```bash
   # Test backend locally
   cd backend && npm run dev
   
   # Deploy to chosen platform (Railway example)
   railway deploy
   ```

2. **Update Frontend Configuration**:
   ```javascript
   // Update production URL in config/api.js
   return 'https://your-production-url.com';
   ```

3. **Test Production API**:
   ```bash
   curl -X POST https://your-production-url.com/api/auth/login \
   -H "Content-Type: application/json" \
   -d '{"emailPhone":"test@test.com","password":"wrongpass"}'
   ```

4. **Build Production App**:
   ```bash
   # Using EAS
   eas build --platform all
   
   # Or using Expo build (deprecated but still works)
   expo build:android
   expo build:ios
   ```

5. **Test Production Build**:
   - Install the built APK/IPA on test devices
   - Verify all features work with production backend

## Environment Management

### Development vs Production Environment Variables

**Backend `.env` files**:

`.env.development`:
```
MONGO_URI=mongodb+srv://...@cluster.mongodb.net/safe_steps_dev
JWT_SECRET=dev_secret_key
PORT=3000
NODE_ENV=development
```

`.env.production`:
```
MONGO_URI=mongodb+srv://...@cluster.mongodb.net/safe_steps_prod
JWT_SECRET=super_secure_production_key
PORT=5000
NODE_ENV=production
```

### Frontend Environment Detection

```javascript
// utils/environment.js
export const isDevelopment = __DEV__;
export const isProduction = !__DEV__;

export const config = {
  API_URL: isDevelopment 
    ? 'http://192.168.29.111:3000' 
    : 'https://your-production-url.com',
  TIMEOUT: isDevelopment ? 5000 : 10000,
  RETRY_ATTEMPTS: isDevelopment ? 2 : 3,
};
```

## Monitoring & Analytics

### Add Production Monitoring

1. **Error Tracking**: Sentry
2. **Analytics**: Google Analytics for Firebase
3. **Performance**: Flipper (development) + production monitoring
4. **Logs**: Backend logging service

### Basic Error Handling

```javascript
// utils/apiClient.js
const apiCall = async (endpoint, options) => {
  try {
    const response = await fetch(endpoint, {
      ...options,
      timeout: config.TIMEOUT,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    // Log to monitoring service in production
    if (isProduction) {
      console.error('API Error:', error);
      // Send to error tracking service
    }
    throw error;
  }
};
```

## Team Production Workflow

1. **Development**: Local testing with current setup
2. **Staging**: Deploy to staging environment for team testing
3. **Production**: Deploy to production after team approval
4. **Rollback Plan**: Keep previous versions available

## Cost Considerations

### Free Tier Limits
- **Railway**: 500 hours/month, $5/month after
- **Render**: 750 hours/month free
- **Heroku**: 550-1000 dyno hours/month (limited)
- **Vercel**: Generous free tier for hobby projects

### Paid Options
- Start with free tiers
- Upgrade when you have active users
- Monitor usage and costs

## Security Checklist

- [ ] Environment variables secured
- [ ] Database access restricted
- [ ] API rate limiting implemented
- [ ] Input validation on all endpoints
- [ ] CORS properly configured
- [ ] HTTPS enforced
- [ ] JWT secrets are strong and unique
- [ ] Regular security updates

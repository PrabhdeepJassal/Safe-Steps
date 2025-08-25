# 🚀 Deploy Safe Steps Backend to Render

## Step-by-Step Deployment Guide

### 1. Push Your Code to GitHub
First, make sure your latest code is on GitHub:

```bash
git add .
git commit -m "Prepare backend for Render deployment"
git push origin main
```

### 2. Deploy to Render

1. **Go to [render.com](https://render.com)** and sign up/login
2. **Click "New +"** → **"Web Service"**
3. **Connect your GitHub repository** (Safe-Steps)
4. **Configure the service:**
   - **Name:** `safesteps-api`
   - **Environment:** `Node`
   - **Region:** Choose closest to your users
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`

### 3. Set Environment Variables

In Render dashboard, add these environment variables:

```
MONGO_URI=mongodb+srv://ShamanDeep:%40%40%23%23Lubana123@safestepssafetyapp.cqomcda.mongodb.net/safe_steps?retryWrites=true&w=majority&appName=SafeStepsDB
JWT_SECRET=9717235511
EMAIL_USER=safestepssafetyapp@gmail.com
EMAIL_PASS=qenimhyzjynhfaog
PORT=10000
```

### 4. Deploy!

Click **"Create Web Service"** and wait for deployment (5-10 minutes).

### 5. Get Your URL

After deployment, you'll get a URL like:
`https://safesteps-api.onrender.com`

### 6. Update Frontend

Your app is already configured! The URL `https://safesteps-api.onrender.com` is set in your API config.

### 7. Test Your Deployment

Test these endpoints:
- Health: `https://safesteps-api.onrender.com/api/health`
- Email test: `https://safesteps-api.onrender.com/api/auth/test-email`

## 🎉 Your App Now Works Everywhere!

After deployment:
- ✅ Works on any device
- ✅ Works on any network
- ✅ Works anywhere in the world
- ✅ No more IP address changes needed
- ✅ Free hosting with Render

## 📱 Frontend Configuration

Your `config/api.js` is already set up:

```javascript
const getApiUrl = () => {
  if (__DEV__) {
    // Development: Uses your local IP
    return 'http://192.168.29.111:3000';
  } else {
    // Production: Uses Render URL
    return 'https://safesteps-api.onrender.com';
  }
};
```

## 🔧 Development vs Production

- **Development (Expo Go):** Uses your local server
- **Production (Built app):** Uses Render server

## 🆘 Troubleshooting

**If deployment fails:**
1. Check build logs in Render dashboard
2. Ensure all environment variables are set
3. Verify package.json has correct start script

**If app can't connect:**
1. Check if Render service is running
2. Test the health endpoint
3. Verify the URL in your app config

**Free tier limitations:**
- Service sleeps after 15 minutes of inactivity
- Takes 30-60 seconds to wake up
- Upgrade to paid plan for always-on service

## 🎯 Next Steps

1. Deploy to Render (follow steps above)
2. Test your app on different devices
3. Build and publish your app to app stores
4. Your users can access it from anywhere! 🌍

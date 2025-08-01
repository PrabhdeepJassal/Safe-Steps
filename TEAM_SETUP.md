# Safe Steps - Team Development Setup

## For Team Members

### 1. Clone and Setup
```bash
git clone https://github.com/PrabhdeepJassal/Safe-Steps.git
cd Safe-Steps

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 2. Backend Server Setup

Each team member needs to run the backend server on their machine:

```bash
cd backend
npm run dev
```

The server will start on `http://localhost:3000` (or the port specified in .env)

### 3. Network Configuration

#### Option A: Using Android/iOS Emulator (Recommended for development)
- **Android Emulator**: Update `config/api.js` to use `http://10.0.2.2:3000`
- **iOS Simulator**: Update `config/api.js` to use `http://localhost:3000`

#### Option B: Using Physical Device with Expo Go (Current Setup)
1. Find your computer's IP address:
   - **Windows**: Run `ipconfig` in terminal, look for "IPv4 Address" under Wi-Fi adapter
   - **Mac**: Run `ifconfig | grep inet` in terminal
   - **Linux**: Run `hostname -I` in terminal

2. Update the IP in `/config/api.js`:
   ```javascript
   // Replace 192.168.29.111 with YOUR computer's IP address
   return 'http://YOUR.IP.ADDRESS.HERE:3000';
   ```

3. **Important**: Make sure your phone and computer are on the same WiFi network

4. **Backend Server Configuration**: The server is already configured to accept connections from any IP (`0.0.0.0:3000`)

### 4. Quick IP Address Reference
Current team member IPs (update as needed):
- **Shaman**: `192.168.29.111`
- **Team Member 2**: `192.168.X.XXX` (update this)
- **Team Member 3**: `192.168.X.XXX` (update this)

### 5. Database Access
- Everyone uses the same MongoDB Atlas database
- Database credentials are in `backend/.env`
- No additional setup needed for database

### 6. Testing the Setup
1. Start backend server: `cd backend && npm run dev`
2. Update your IP in `config/api.js` if using physical device
3. Start React Native app: `npm start` or `expo start`
4. Scan QR code with Expo Go app
5. Check console logs for "API Configuration" message
6. Try to register a new user
7. Try to login with the registered user

## Common Issues & Solutions

### Network Request Failed
- **Physical Device**: 
  - Verify your computer's IP is correct in `config/api.js`
  - Ensure phone and computer are on same WiFi
  - Check if Windows Firewall is blocking port 3000
- **Emulator**: 
  - Make sure backend server is running
  - Use `10.0.2.2:3000` for Android, `localhost:3000` for iOS
- **General**: 
  - Check console logs for API Configuration details
  - Test network connection using the built-in network test

### Backend Server Won't Start
- Check if port 3000 is already in use: `netstat -an | grep :3000`
- Kill any process using port 3000: `taskkill /f /im node.exe` (Windows)
- Try changing port in `.env` file

### Database Connection Error
- Check internet connection
- Verify MongoDB Atlas credentials in `.env`
- Make sure your IP is whitelisted in MongoDB Atlas

### Firewall Issues (Windows)
- Temporarily disable Windows Firewall for testing
- Or add an exception for port 3000:
  - Windows Security → Firewall & network protection → Allow an app through firewall
  - Add Node.js and allow it through both private and public networks

## Development Workflow

1. **Before coding**: 
   ```bash
   git pull origin main
   ```

2. **Create feature branch**: 
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Update your IP** (if changed):
   - Update `config/api.js` with your current IP address

4. **Start development**:
   ```bash
   # Terminal 1: Start backend
   cd backend && npm run dev
   
   # Terminal 2: Start frontend
   npm start
   ```

5. **Make changes and test**

6. **Commit and push**:
   ```bash
   git add .
   git commit -m "Add feature description"
   git push origin feature/your-feature-name
   ```

7. **Create Pull Request** on GitHub

## API Configuration Details

The app automatically detects your platform and uses appropriate URLs:

```javascript
// Current configuration in config/api.js
if (Platform.OS === 'android') {
  return 'http://192.168.29.111:3000';  // Update with your IP
}
if (Platform.OS === 'ios') {
  return 'http://192.168.29.111:3000';  // Update with your IP
}
```

## Important Notes

- ⚠️ **Never commit `.env` files** with real credentials
- ⚠️ **Update IP addresses** when working from different locations
- ⚠️ **Always test on both emulator and physical device**
- ⚠️ **Ensure same WiFi network** for physical device testing
- ✅ Use the same Node.js version (check `package.json`)
- ✅ Keep dependencies updated with `npm install`
- ✅ Check console logs for debugging information

## Debugging Steps

1. **Check API Configuration**:
   - Look for console log: `API Configuration: {Platform: 'ios', BaseURL: 'http://...', isDev: true}`

2. **Test Network Connection**:
   - The app includes an automatic network test on login screen
   - Check console for "Network test result" messages

3. **Verify Backend**:
   ```bash
   curl -X POST http://YOUR.IP.ADDRESS:3000/api/auth/login \
   -H "Content-Type: application/json" \
   -d '{"emailPhone":"test@test.com","password":"wrongpass"}'
   ```
   Should return: `{"success":false,"message":"Invalid credentials"}`

# Safe Steps

## Project Overview
Safe Steps is a mobile application focused on ensuring women's safety and travel security for tourists. The app provides safe route recommendations based on crime data analysis, GPS navigation, and emergency safety features.

## Features
1. **GPS-Based Navigation and Maps**: Displays city maps and analyzes routes based on safety levels.
2. **Safety Prediction**: Evaluates routes using historical crime data.
3. **Safe Route Recommendation**: Suggests the safest paths by comparing crime severity along different routes.
4. **Emergency Features**: Includes periodic safety check-ins and automatic alert mechanisms if a user feels unsafe.
5. **Future Crime Prediction**: Uses past crime data to forecast potential future risks and flags unsafe areas on the map.

## Requirements

### **Technical Requirements**
- **Frontend**: React Native (for cross-platform mobile development)
- **Backend**: Node.js with Express.js
- **Database**: MongoDB (for storing crime data, user details, and preferences)
- **Maps & Location**:
  - Google Maps API (for route and navigation)
  - OpenStreetMap (alternative map provider)
- **Crime Data Processing**:
  - Python for data preprocessing and crime severity analysis
  - Pandas & NumPy for handling CSV-based crime records
  - Machine Learning (Scikit-learn) for future crime prediction
- **Authentication & Security**:
  - Firebase Authentication / OAuth for secure user login
  - AES-256 Encryption for user location and personal data security
- **Notifications & Alerts**:
  - Firebase Cloud Messaging (FCM) for emergency notifications
  - Twilio API (for SMS-based emergency alerts to contacts)

### **Non-Technical Requirements**
- **User Interface (UI/UX)**:
  - Intuitive and easy-to-use design
  - Dark mode and accessibility-friendly features
- **Data Privacy & Ethics**:
  - Compliance with data protection regulations (GDPR, CCPA)
  - Transparency in data collection and usage
- **Performance & Scalability**:
  - Fast response times (< 1s for route calculations)
  - Scalable backend to support a large number of users

## Installation & Setup
### Prerequisites
- Node.js and npm installed
- MongoDB installed or cloud-based database set up
- Python (for crime data processing and ML models)

### Steps
1. Clone the repository:
   ```sh
   git clone https://github.com/your-repo/safe-steps.git
   cd safe-steps
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Set up environment variables (.env file for API keys and database connection)
4. Start the backend server:
   ```sh
   npm start
   ```
5. Run the frontend application:
   ```sh
   npm run android  # or npm run ios
   ```

## Contributors
- Prabhdeep Singh
- Shamandeep Singh
- Nupur
- Purva

## License
This project is licensed under the NO-SHARING SOFTWARE LICENSE. See the [LICENSE](LICENSE) file for details.



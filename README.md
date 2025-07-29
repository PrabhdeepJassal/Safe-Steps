# Safe Steps

## Project Overview
Safe Steps is a mobile application designed to enhance safety for women and tourists by providing secure travel route recommendations. Leveraging advanced crime data analysis, GPS navigation, and machine learning, the app identifies the safest paths between locations, offers real-time safety features, and empowers users with emergency response tools. The project integrates historical crime data with predictive modeling to flag high-risk areas and ensure informed travel decisions.

## Features
1. **GPS-Based Navigation and Maps**:
   - Interactive city maps powered by OpenStreetMap (OSRM for routing) and Google Maps API (for visualization).
   - Real-time route rendering with safety overlays highlighting crime-prone areas.
2. **Safety Prediction**:
   - Evaluates route safety using historical crime data, considering factors like crime severity, frequency, and proximity.
   - Employs a RandomForestRegressor model to predict route safety scores based on extracted features.
3. **Safe Route Recommendation**:
   - Generates 6–7 unique routes using OSRM, including direct and waypoint-based alternatives.
   - Ranks routes by safety score (0.1 to 1.0), with the safest route at the top, based on crime data, time of day, and crime hotspot proximity.
4. **Emergency Features**:
   - Periodic safety check-ins via push notifications to confirm user safety during travel.
   - Automatic SMS/email alerts to emergency contacts using Twilio API if a user reports feeling unsafe or misses a check-in.
5. **Future Crime Prediction**:
   - Uses historical crime data (e.g., 2021–2024 Delhi dataset) to forecast potential crime risks.
   - Applies DBSCAN clustering to identify crime hotspots and flag high-risk zones on the map.
6. **Time-Sensitive Routing**:
   - Adjusts safety scores based on time of day (Morning, Afternoon, Evening, Night) using dynamic multipliers (e.g., 0.7 for Night).
7. **Crime Hotspot Detection**:
   - Identifies high-severity crime clusters using DBSCAN (~100m radius) for proactive risk avoidance.

## Technical Architecture
**Backend**
- **Framework**: Flask (Python) with CORS for cross-origin frontend compatibility.
- **Routing Service**: OSRM (OpenStreetMap-based) for generating direct and alternative routes.
- **Machine Learning**:
  - **Model**: RandomForestRegressor for safety score prediction.
  - **Preprocessing**: Pandas for crime data handling, NumPy for numerical computations, Scikit-learn for feature extraction and model training.
  - **Spatial Analysis**: SciPy’s KDTree for efficient crime proximity queries; DBSCAN for crime hotspot clustering.
  - **Training Data**: Synthetic routes (2000 samples) with features like crime count, severity, distance, and time category.
  - **Persistence**: Pickle for model serialization (`safe_route_model.pkl`).
- **API Endpoints**:
  - `/evaluate_routes` (POST): Accepts source, destination, and time category; returns ranked routes with safety scores.
  - `/load_crime_data` (POST): Loads and processes crime data from CSV files.
- **Logging**: Python’s logging module for debugging and monitoring.

**Frontend**
- **Framework**: React Native for cross-platform mobile development (iOS and Android).
- **Map Integration**: Google Maps API for map rendering; OSRM for route coordinates.
- **UI/UX**: Intuitive design with dark mode, accessibility features (e.g., high-contrast text), and real-time route visualization.

**Database**
- **Type**: MongoDB for storing user profiles, preferences, and processed crime data.
- **Schema**:
  - Crime Data: Latitude, Longitude, Severity, CrimeID, CrimeCategory.
  - User Data: Encrypted location history, emergency contacts, and preferences.

**External Services**
- **Maps & Navigation**: Google Maps API (visualization), OSRM (routing).
- **Notifications**:
  - Firebase Cloud Messaging (FCM) for push notifications.
  - Twilio API for SMS-based emergency alerts.
- **Authentication**: Firebase Authentication with OAuth for secure user login.

**Security**
- **Data Encryption**: AES-256 for user location and personal data.
- **Compliance**: Adheres to GDPR and CCPA for data privacy.
- **API Security**: Input validation and error handling in Flask endpoints.

## Requirements

### **Technical Requirements**
- **Frontend**:
  - React Native v0.73+ (with Expo for development).
  - Libraries: `react-native-maps`, `axios` for API calls, `react-native-firebase` for notifications.
- **Backend**:
  - Python 3.9+ with Flask 2.3+, Flask-CORS, Pandas, NumPy, Scikit-learn, SciPy, Geopy.
  - OSRM server (Dockerized or external: `http://router.project-osrm.org`).
- **Database**:
  - MongoDB 6.0+ (local or MongoDB Atlas).
- **Maps & Location**:
  - Google Maps API key for map rendering.
  - OpenStreetMap (OSRM) for route generation.
- **Crime Data Processing**:
  - CSV dataset with columns: Latitude, Longitude, Severity, CrimeID, CrimeCategory.
  - Example: `2021-2024_DELHI_DATA.csv`.
- **Authentication & Security**:
  - Firebase Authentication for user management.
  - AES-256 encryption for sensitive data.
- **Notifications & Alerts**:
  - Firebase Cloud Messaging (FCM) for real-time notifications.
  - Twilio API key for SMS alerts.
- **DevOps**:
  - Docker for containerizing backend services.
  - Git for version control.

### **Non-Technical Requirements**
- **User Interface (UI/UX)**:
  - Clean, intuitive navigation with minimal learning curve.
  - Accessibility: Screen reader support, adjustable font sizes, and high-contrast modes.
- **Data Privacy & Ethics**:
  - Transparent data usage policies displayed in the app.
  - User consent for location and crime data processing.
- **Performance & Scalability**:
  - Route evaluation latency: <1s for 6–7 routes.
  - Backend scalability: Supports 10,000+ concurrent users via load balancing.
- **Reliability**:
  - 99.9% uptime for backend services.
  - Graceful error handling for API failures or missing crime data.

## Installation & Setup
### Prerequisites
- Node.js v18+ and npm v9+.
- Python 3.9+ with pip.
- MongoDB 6.0+ (local or cloud-based).
- Docker (optional for OSRM or backend deployment).
- API Keys: Google Maps, Firebase, Twilio.

### Steps
1. **Clone the Repository**:
   ```sh
   git clone https://github.com/your-repo/safe-steps.git
   cd safe-steps
   ```
2. **Backend Setup**:
   - Install dependencies:
     ```sh
     cd backend
     pip install -r requirements.txt
     ```
   - Create a `.env` file in the backend directory:
     ```sh
     MONGO_URI=mongodb://localhost:27017/safe_steps
     OSRM_BASE_URL=http://router.project-osrm.org/route/v1/driving/
     TWILIO_SID=your_twilio_sid
     TWILIO_AUTH_TOKEN=your_twilio_auth_token
     FIREBASE_CONFIG=your_firebase_config_json
     ```
   - Place crime data (`2021-2024_DELHI_DATA.csv`) in the backend directory.
   - Start the Flask server:
     ```sh
     python app.py
     ```
3. **Frontend Setup**:
   - Install dependencies:
     ```sh
     cd frontend
     npm install
     ```
   - Create a `.env` file in the frontend directory:
     ```sh
     GOOGLE_MAPS_API_KEY=your_google_maps_api_key
     API_BASE_URL=http://localhost:5000
     ```
   - Run the app:
     ```sh
     npm run android  # or npm run ios
     ```
4. **Database Setup**:
   - Ensure MongoDB is running.
   - Initialize collections for users and crime data (handled automatically by backend).
5. **OSRM Setup (Optional)**:
   - Run OSRM server locally using Docker:
     ```sh
     docker run -t -i -p 5000:5000 osrm/osrm-backend osrm-routed --algorithm mld
     ```
   - Or use the public OSRM server (default).

## Testing
- **Unit Tests**: Run backend tests with `pytest` in the `backend/tests` directory.
- **Integration Tests**: Test API endpoints using Postman or cURL.
- **Frontend Tests**: Use Jest and React Native Testing Library.

**How It Works**
1. **User Input**: The user enters a source, destination, and optional time category (Morning, Afternoon, Evening, Night) via the React Native app.
2. **Route Generation**: The backend queries OSRM to fetch 6–7 routes, including direct and waypoint-based alternatives.
3. **Crime Analysis**:
   - Loads crime data from `2021-2024_DELHI_DATA.csv`.
   - Uses KDTree to find crimes within ~11 km of route points.
   - Applies DBSCAN to detect crime hotspots (~100m radius).
4. **Safety Scoring**:
   - Extracts features: crime count, severity, distance, time category, hotspot proximity.
   - Computes a raw safety score with penalties for severity and hotspots.
   - Predicts a score using the RandomForest model.
   - Combines scores (50% raw, 50% predicted) and normalizes to [0.1, 1.0].
5. **Route Ranking**: Sorts routes by safety score (highest first) and returns them to the frontend.
6. **Visualization**: The frontend displays routes on a map, with the safest route highlighted and crime hotspots marked.
7. **Emergency Features**: Users can trigger alerts or enable periodic check-ins during travel.

## Future Enhancements
- **Real-Time Crime Data**: Integrate live crime feeds from public APIs or police databases.
- **Crowdsourced Safety Reports**: Allow users to report unsafe areas for community-driven insights.
- **Advanced ML Models**: Experiment with deep learning (e.g., LSTMs) for better crime prediction.
- **Offline Mode**: Cache maps and routes for areas with poor connectivity.
- **Multi-Modal Routing**: Support walking, cycling, and public transport routes.

## Contributors
- **Prabhdeep Singh**: Backend development, ML model training.
- **Shamandeep Singh**: Frontend development, map integration.
- **Nupur**: UI/UX design, accessibility features.
- **Purva**: Data preprocessing, crime analysis.

## License
This project is licensed under the NO-SHARING SOFTWARE LICENSE. See the [LICENSE](LICENSE) file for details.

## Contact
For inquiries, please reach out to the project maintainers via GitHub issues or email (safestepssafetyapp@gmail.com).
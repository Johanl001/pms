# 🔗 Dashboard Component Connections & Data Flow

## 📊 **Component Architecture Diagram**

```
┌─────────────────────────────────────────────────────────────────┐
│                         App.jsx                                  │
│                    (Root Component)                              │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  State Management:                                        │  │
│  │  - activeTab: 'dashboard' | 'profile' | 'disease' | ...  │  │
│  │  - plantData: { currentReadings, healthScore, ... }      │  │
│  │  - loading: true | false                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           │                                      │
│  ┌────────────────────────▼─────────────────────────────────┐  │
│  │  Data Fetching (useEffect):                              │  │
│  │  1. Fetches from: GET /dashboard_data                    │  │
│  │  2. Transforms: snake_case → camelCase                   │  │
│  │  3. Updates: Every 10 seconds (setInterval)              │  │
│  │  4. Fallback: Mock data if backend unavailable           │  │
│  └────────────────────────┬─────────────────────────────────┘  │
│                           │                                      │
│  ┌────────────────────────▼─────────────────────────────────┐  │
│  │  Tab Navigation:                                         │  │
│  │  - Dashboard → <Dashboard plantData={plantData} />      │  │
│  │  - Profile → <PlantProfile />                           │  │
│  │  - Disease → <DiseaseDetection />                       │  │
│  │  - Recommendations → <Recommendations plantData={...} /> │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  Dashboard    │   │ Recommendations│   │ DiseaseDetection│
│  Component    │   │  Component     │   │  Component      │
└───────┬───────┘   └───────┬───────┘   └───────┬───────┘
        │                   │                   │
        │                   │                   │
        ▼                   ▼                   ▼
   [Displays]          [Analyzes]          [Uploads]
   - Sensor cards      - Health score      - Image file
   - Health score      - Sensor data       - Gets analysis
   - Charts            - Generates recs    - Shows results
   - Controls          - Shows tips        - Treatment info
        │
        │ POST /actuate
        ▼
   Backend Server
```

---

## 🎯 **Component Responsibilities**

### 1. **App.jsx** - Main Container & Data Fetcher

**Props**: None (root component)

**State**:
- `activeTab`: Current tab ('dashboard', 'profile', 'disease', 'recommendations')
- `plantData`: Complete plant data object
- `loading`: Loading state (true/false)

**Functions**:
- `fetchPlantData()`: Fetches data from backend, transforms format
- `renderTabContent()`: Renders appropriate component based on active tab

**API Calls**:
```javascript
GET http://localhost:5000/dashboard_data
// Every 10 seconds
```

**Data Transformation**:
```javascript
// Backend returns (snake_case):
{
  current_readings: { soil_moisture: 4095, ... },
  health_score: 57.65,
  watering_prediction: { water_now: true, ... },
  recent_data: [...]
}

// Transformed to (camelCase):
{
  currentReadings: { soilMoisture: 4095, ... },
  healthScore: 57.65,
  wateringPrediction: { waterNow: true, ... },
  recentData: [...]
}
```

**Child Components**:
- `<Dashboard plantData={plantData} loading={loading} />`
- `<PlantProfile />`
- `<DiseaseDetection />`
- `<Recommendations plantData={plantData} />`

---

### 2. **Dashboard.jsx** - Main Display & Controls

**Props**:
- `plantData`: Plant data object from App.jsx
- `loading`: Loading state

**State**:
- `mode`: 'auto' | 'manual'
- `watering`: Boolean (watering in progress)
- `light`: Boolean (light on/off)

**Functions**:
- `handleWaterNow()`: Sends water command to backend
- `toggleLight()`: Toggles grow light
- `toggleMode()`: Switches between auto/manual mode

**API Calls**:
```javascript
POST http://localhost:5000/actuate
Body: { action: 'water', force: true }
Body: { action: 'light', state: true/false }
```

**Displays**:
1. **Health Score Card**: Shows health score (0-100) with progress bar
2. **Watering Prediction Card**: Next watering time, confidence, "Water Now" button
3. **Mode Control Card**: Auto/Manual toggle, Light toggle
4. **Sensor Cards** (4 cards):
   - Soil Moisture
   - Temperature
   - Humidity
   - Light Intensity
5. **Charts**:
   - Soil Moisture Trend (Line Chart)
   - Temperature Trend (Bar Chart)
   - Health Distribution (Pie Chart)

**Data Processing**:
```javascript
// Chart data transformation
const soilMoistureData = recentData.map(point => ({
  time: new Date(point.timestamp).toLocaleTimeString(),
  moisture: point.soilMoisture
}));
```

**User Interactions**:
- Click "Water Now" → Sends POST /actuate
- Toggle Light → Sends POST /actuate
- Toggle Mode → Updates local state (future: send to backend)

---

### 3. **Recommendations.jsx** - AI Suggestions

**Props**:
- `plantData`: Plant data object from App.jsx

**State**:
- `recommendations`: Array of recommendation objects
- `loading`: Loading state

**Functions**:
- `generateRecommendations()`: Analyzes plantData and generates recommendations

**Logic**:
```javascript
// Health-based recommendations
if (healthScore < 70) → Warning: "Plant health concern"
if (healthScore < 90) → Info: "Good health"
else → Success: "Excellent health"

// Sensor-based recommendations
if (soilMoisture < 300) → Warning: "Low soil moisture"
if (soilMoisture > 800) → Warning: "High soil moisture"
if (temperature < 18) → Info: "Cool environment"
if (temperature > 30) → Warning: "Warm environment"
if (humidity < 40) → Info: "Low humidity"
if (humidity > 80) → Info: "High humidity"
if (lightIntensity < 200) → Info: "Low light"
if (lightIntensity > 1000) → Info: "High light"

// Action-based recommendations
if (wateringPrediction.waterNow) → Action: "Watering recommended"
```

**Displays**:
- List of recommendations with priority colors
- Care tips section
- Icons based on recommendation type (warning, info, success, action)

**No API Calls**: Generates recommendations locally based on plantData

---

### 4. **DiseaseDetection.jsx** - Image Analysis

**Props**: None

**State**:
- `selectedImage`: File object
- `previewUrl`: Image preview URL
- `analysisResult`: Disease analysis result
- `loading`: Loading state
- `error`: Error message

**Functions**:
- `handleImageChange()`: Handles file selection
- `handleAnalyze()`: Sends image to backend for analysis
- `handleReset()`: Resets form

**API Calls**:
```javascript
POST http://localhost:5000/upload_image
Body: FormData with image file
Headers: { 'Content-Type': 'multipart/form-data' }
```

**Process**:
1. User selects image file
2. Image preview displayed
3. User clicks "Analyze Image"
4. Image sent to backend as FormData
5. Backend processes with TensorFlow Lite model
6. Result displayed: disease, confidence, treatment

**Displays**:
- Image upload area
- Image preview
- Analysis results (disease, confidence, treatment)
- Treatment recommendations
- Care tips

---

### 5. **PlantProfile.jsx** - Plant Information

**Props**: None

**State**:
- `plantName`: String
- `plantType`: String
- `plantAge`: String
- `wateringPref`: String
- `lightPref`: String
- `notes`: String

**Functions**:
- `handleSave()`: Saves profile (currently: alert only)

**API Calls**: None (currently static)

**Displays**:
- Plant image placeholder
- Plant information form
- Care preferences
- Care history table

**Future Enhancement**: Connect to backend to save/load profile data

---

## 🔄 **Data Flow Between Components**

### Flow 1: Initial Data Load
```
1. App.jsx mounts
   ↓
2. useEffect triggers fetchPlantData()
   ↓
3. GET /dashboard_data → Backend
   ↓
4. Backend returns data (snake_case)
   ↓
5. App.jsx transforms to camelCase
   ↓
6. setPlantData(transformedData)
   ↓
7. plantData passed to Dashboard/Recommendations
   ↓
8. Components render with data
```

### Flow 2: Real-time Updates
```
1. setInterval triggers every 10 seconds
   ↓
2. fetchPlantData() called
   ↓
3. GET /dashboard_data → Backend
   ↓
4. Backend returns latest data
   ↓
5. App.jsx updates plantData state
   ↓
6. React re-renders child components
   ↓
7. Dashboard/Recommendations update with new data
```

### Flow 3: Manual Water Control
```
1. User clicks "Water Now" button in Dashboard
   ↓
2. handleWaterNow() called
   ↓
3. POST /actuate → Backend
   Body: { action: 'water', force: true }
   ↓
4. Backend processes request
   ↓
5. Backend logs actuation
   ↓
6. Backend returns response
   ↓
7. Dashboard updates UI (watering state)
   ↓
8. Backend sends command to ESP32 (if connected)
   ↓
9. ESP32 activates water pump
```

### Flow 4: Disease Detection
```
1. User selects image in DiseaseDetection
   ↓
2. handleImageChange() sets selectedImage
   ↓
3. Image preview displayed
   ↓
4. User clicks "Analyze Image"
   ↓
5. handleAnalyze() called
   ↓
6. FormData created with image
   ↓
7. POST /upload_image → Backend
   ↓
8. Backend processes image with TensorFlow Lite
   ↓
9. Backend returns analysis result
   ↓
10. DiseaseDetection displays results
```

---

## 📡 **API Endpoint Usage**

### Backend → Frontend

| Endpoint | Method | Called By | Purpose |
|----------|--------|-----------|---------|
| `/dashboard_data` | GET | App.jsx | Get current sensor data |
| `/upload_image` | POST | DiseaseDetection.jsx | Analyze plant image |
| `/actuate` | POST | Dashboard.jsx | Control actuators |

### Frontend → Backend Data Format

**Request (Dashboard Controls)**:
```json
POST /actuate
{
  "action": "water",
  "force": true
}
```

**Request (Disease Detection)**:
```
POST /upload_image
Content-Type: multipart/form-data
Body: FormData with 'image' field
```

**Response (Dashboard Data)**:
```json
GET /dashboard_data
{
  "current_readings": {
    "soil_moisture": 4095,
    "temperature": 28.7,
    "humidity": 39.4,
    "light_intensity": 263
  },
  "health_score": 57.65,
  "watering_prediction": {
    "water_now": true,
    "confidence": 1.0,
    "next_watering": 1762692586
  },
  "recent_data": [...]
}
```

---

## 🎨 **Component Styling**

All components use **Tailwind CSS** for styling:

- **Dashboard**: Cards, charts, buttons
- **Recommendations**: Priority-colored cards (red/yellow/green)
- **DiseaseDetection**: Image upload area, results display
- **PlantProfile**: Form inputs, tables

**Custom CSS Classes** (in App.css):
- `.health-score-card`: Gradient background for health score
- `.sensor-card`: Card styling for sensor readings
- `.action-button`: Styled button for actions
- `.mode-toggle`: Toggle switch styling

---

## 🔧 **Component Dependencies**

### Dashboard.jsx
- `react`: React library
- `recharts`: Chart components (LineChart, BarChart, PieChart)
- `axios`: HTTP client for API calls

### DiseaseDetection.jsx
- `react`: React library
- `axios`: HTTP client for API calls

### Recommendations.jsx
- `react`: React library
- (No external dependencies)

### PlantProfile.jsx
- `react`: React library
- (No external dependencies)

### App.jsx
- `react`: React library
- All child components

---

## 🐛 **Common Issues & Solutions**

### Issue 1: Data Not Updating
**Cause**: Backend not running or CORS issue
**Solution**: Check backend is running on port 5000, CORS enabled

### Issue 2: Charts Not Showing
**Cause**: recentData is empty or malformed
**Solution**: Check data transformation in App.jsx

### Issue 3: API Calls Failing
**Cause**: Backend endpoint not available
**Solution**: Check backend logs, verify endpoint URLs

### Issue 4: Image Upload Not Working
**Cause**: Backend model not loaded or image format issue
**Solution**: Check backend logs, verify image format (JPG/PNG)

---

## 📊 **Data Flow Summary**

```
ESP32 → Backend → App.jsx → Dashboard/Recommendations
                    ↓
              DiseaseDetection → Backend → Results
                    ↓
              Dashboard → Backend → ESP32 (actuators)
```

**Key Points**:
1. App.jsx is the central data hub
2. All components receive data from App.jsx
3. Dashboard can send commands back to backend
4. DiseaseDetection is independent (uploads images)
5. Real-time updates every 10 seconds

---

## 🚀 **Performance Considerations**

1. **Polling Interval**: 10 seconds (configurable in App.jsx)
2. **Data Storage**: Last 100 entries in memory
3. **Chart Rendering**: Optimized with Recharts
4. **Image Processing**: Backend handles TensorFlow Lite model
5. **State Management**: React useState hooks (simple, effective)

---

## 📝 **Summary**

**Component Hierarchy**:
```
App.jsx (Root)
├── Dashboard.jsx (Main display, controls)
├── Recommendations.jsx (AI suggestions)
├── DiseaseDetection.jsx (Image analysis)
└── PlantProfile.jsx (Plant information)
```

**Data Flow**:
- **Down**: App.jsx → Child components (props)
- **Up**: Child components → Backend (API calls)
- **Real-time**: Backend → App.jsx → Child components (polling)

**Key Features**:
- Real-time sensor data display
- Manual controls (water, light)
- AI recommendations
- Disease detection
- Historical data visualization

All components work together to create a complete plant monitoring and control system!


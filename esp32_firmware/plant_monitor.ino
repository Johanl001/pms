#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

// Pin definitions
#define SOIL_MOISTURE_PIN 34
#define DHT_PIN 27
#define DHT_TYPE DHT11
#define LIGHT_SENSOR_PIN 35
#define WATER_PUMP_PIN 18
#define GROW_LIGHT_PIN 19

// Network credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverUrl = "http://192.168.0.102:5000/data";

// Timing constants
const unsigned long SENSOR_READ_INTERVAL = 10000; // 10 seconds
const unsigned long MIN_WATERING_INTERVAL = 21600000; // 6 hours
const unsigned long MAX_PUMP_TIME = 20000; // 20 seconds
const unsigned long MAX_DAILY_WATERING = 60000; // 60 seconds

// Global variables
DHT dht(DHT_PIN, DHT_TYPE);
unsigned long lastSensorRead = 0;
unsigned long lastWateringTime = 0;
unsigned long dailyWateringTime = 0;
unsigned long pumpStartTime = 0;
bool pumpRunning = false;

void setup() {
  Serial.begin(115200);
  
  // Initialize pins
  pinMode(WATER_PUMP_PIN, OUTPUT);
  pinMode(GROW_LIGHT_PIN, OUTPUT);
  digitalWrite(WATER_PUMP_PIN, LOW);
  digitalWrite(GROW_LIGHT_PIN, LOW);
  
  // Initialize sensors
  dht.begin();
  
  // Connect to WiFi
  connectToWiFi();
}

void loop() {
  // Read sensors at intervals
  if (millis() - lastSensorRead >= SENSOR_READ_INTERVAL) {
    readSensorsAndSendData();
    lastSensorRead = millis();
  }
  
  // Check if pump needs to be turned off
  if (pumpRunning && (millis() - pumpStartTime >= MAX_PUMP_TIME)) {
    stopWatering();
  }
  
  // Reset daily watering counter at midnight (simplified)
  static unsigned long lastDayReset = 0;
  if (millis() - lastDayReset >= 86400000) { // 24 hours
    dailyWateringTime = 0;
    lastDayReset = millis();
  }
  
  delay(100);
}

void connectToWiFi() {
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println();
  Serial.print("Connected to WiFi. IP Address: ");
  Serial.println(WiFi.localIP());
}

void readSensorsAndSendData() {
  // Read sensor values
  int soilMoisture = analogRead(SOIL_MOISTURE_PIN);
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();
  int lightIntensity = analogRead(LIGHT_SENSOR_PIN);
  
  // Check for sensor read errors
  if (isnan(temperature) || isnan(humidity)) {
    Serial.println("Failed to read from DHT sensor!");
    return;
  }
  
  // Print values to serial monitor
  Serial.println("=== Sensor Readings ===");
  Serial.print("Soil Moisture: ");
  Serial.println(soilMoisture);
  Serial.print("Temperature: ");
  Serial.print(temperature);
  Serial.println(" °C");
  Serial.print("Humidity: ");
  Serial.print(humidity);
  Serial.println(" %");
  Serial.print("Light Intensity: ");
  Serial.println(lightIntensity);
  
  // Send data to backend
  sendDataToBackend(soilMoisture, temperature, humidity, lightIntensity);
}

void sendDataToBackend(int soilMoisture, float temperature, float humidity, int lightIntensity) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");
    
    // Create JSON payload
    DynamicJsonDocument doc(1024);
    doc["soil_moisture"] = soilMoisture;
    doc["temperature"] = temperature;
    doc["humidity"] = humidity;
    doc["light_intensity"] = lightIntensity;
    doc["timestamp"] = millis();
    
    String jsonString;
    serializeJson(doc, jsonString);
    
    // Send POST request
    int httpResponseCode = http.POST(jsonString);
    
    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("HTTP Response code: " + String(httpResponseCode));
      Serial.println("Response: " + response);
      
      // Parse response for actuation commands
      parseActuationCommands(response);
    } else {
      Serial.print("Error on sending POST: ");
      Serial.println(httpResponseCode);
    }
    
    http.end();
  } else {
    Serial.println("WiFi Disconnected");
  }
}

void parseActuationCommands(String response) {
  // Parse JSON response for actuation commands
  DynamicJsonDocument doc(1024);
  DeserializationError error = deserializeJson(doc, response);
  
  if (error) {
    Serial.print("deserializeJson() failed: ");
    Serial.println(error.c_str());
    return;
  }
  
  // Check for watering command
  if (doc.containsKey("water") && doc["water"]) {
    startWatering();
  }
  
  // Check for light command
  if (doc.containsKey("light")) {
    bool lightState = doc["light"];
    digitalWrite(GROW_LIGHT_PIN, lightState ? HIGH : LOW);
    Serial.println("Grow light turned " + String(lightState ? "ON" : "OFF"));
  }
}

void startWatering() {
  // Safety checks before watering
  unsigned long currentTime = millis();
  
  // Check if minimum interval has passed
  if (currentTime - lastWateringTime < MIN_WATERING_INTERVAL) {
    Serial.println("Too soon to water again");
    return;
  }
  
  // Check if daily limit would be exceeded
  if (dailyWateringTime >= MAX_DAILY_WATERING) {
    Serial.println("Daily watering limit reached");
    return;
  }
  
  // Start watering
  digitalWrite(WATER_PUMP_PIN, HIGH);
  pumpRunning = true;
  pumpStartTime = millis();
  lastWateringTime = currentTime;
  
  Serial.println("Started watering");
}

void stopWatering() {
  // Stop watering and update counters
  digitalWrite(WATER_PUMP_PIN, LOW);
  pumpRunning = false;
  
  // Update daily watering time
  dailyWateringTime += (millis() - pumpStartTime);
  
  Serial.println("Stopped watering");
}
import React, { useState } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import axios from 'axios';
import PlantAlerts from './PlantAlerts';

const Dashboard = ({ plantData, loading }) => {
  const [mode, setMode] = useState('auto'); // 'auto' or 'manual'
  const [watering, setWatering] = useState(false);
  const [light, setLight] = useState(false);

  if (loading || !plantData) {
    return <div>Loading...</div>;
  }

  const { currentReadings, healthScore, wateringPrediction, recentData } = plantData;

  // Format data for charts
  const soilMoistureData = (recentData || []).map(point => ({
    time: new Date(point.timestamp).toLocaleTimeString(),
    moisture: point.soilMoisture || 0
  }));

  const temperatureData = (recentData || []).map(point => ({
    time: new Date(point.timestamp).toLocaleTimeString(),
    temperature: point.temperature || 0
  }));

  const healthData = [
    { name: 'Health', value: healthScore },
    { name: 'Remaining', value: 100 - healthScore }
  ];

  const COLORS = ['#10b981', '#e5e7eb'];

  const handleWaterNow = async () => {
    try {
      setWatering(true);
      const response = await axios.post('http://localhost:5000/actuate', { 
        action: 'water', 
        force: true 
      });
      console.log('Watering response:', response.data);
      setTimeout(() => setWatering(false), 2000);
      return response.data;
    } catch (error) {
      console.error('Error watering plant:', error);
      setWatering(false);
      alert('Failed to water plant. Please try again.');
      throw error;
    }
  };

  const toggleLight = async () => {
    try {
      const newState = !light;
      const response = await axios.post('http://localhost:5000/actuate', { 
        action: 'light', 
        state: newState 
      });
      console.log('Light toggle response:', response.data);
      setLight(newState);
      return response.data;
    } catch (error) {
      console.error('Error toggling light:', error);
      alert('Failed to toggle light. Please try again.');
      throw error;
      // Don't revert state on error to avoid confusion
    }
  };

  const toggleMode = async () => {
    try {
      const newMode = mode === 'auto' ? 'manual' : 'auto';
      setMode(newMode);
      // In a real implementation, you would send a request to your backend
      // await axios.post('/api/mode', { mode: newMode });
    } catch (error) {
      console.error('Error changing mode:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Plant Alerts - Blynk-style notifications */}
      <PlantAlerts 
        plantData={plantData} 
        onWaterNow={handleWaterNow}
        onToggleLight={toggleLight}
      />

      {/* Health Score and Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Health Score Card */}
        <div className="health-score-card p-6">
          <h3 className="text-lg font-medium mb-2">Plant Health Score</h3>
          <div className="flex items-end justify-between">
            <div className="text-5xl font-bold">{healthScore.toFixed(1)}</div>
            <div className="text-right">
              <div className="text-sm">Excellent</div>
              <div className="text-xs opacity-80">Condition</div>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-green-300 rounded-full h-2.5">
              <div 
                className="bg-white h-2.5 rounded-full" 
                style={{ width: `${healthScore}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Watering Prediction */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Next Watering</h3>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {wateringPrediction.waterNow ? 'Now' : 
                 new Date(wateringPrediction.nextWatering).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Confidence: {(wateringPrediction.confidence * 100).toFixed(1)}%
              </div>
            </div>
            <div className="text-right">
              <button
                onClick={handleWaterNow}
                disabled={watering}
                className={`action-button ${watering ? 'opacity-75 cursor-not-allowed' : ''}`}
              >
                {watering ? 'Watering...' : 'Water Now'}
              </button>
              <div className="text-xs text-gray-500 mt-2">
                {wateringPrediction.waterNow ? 'Recommended' : 'Scheduled'}
              </div>
            </div>
          </div>
        </div>

        {/* Mode Control */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">System Mode</h3>
          <div className="flex items-center justify-between">
            <span className="text-gray-700">Manual Control</span>
            <label className="mode-toggle">
              <input 
                type="checkbox" 
                checked={mode === 'auto'} 
                onChange={toggleMode}
              />
              <span className="mode-slider"></span>
            </label>
            <span className="text-gray-700">Auto Pilot</span>
          </div>
          
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-700">Grow Light</span>
              <label className="mode-toggle">
                <input 
                  type="checkbox" 
                  checked={light} 
                  onChange={toggleLight}
                />
                <span className="mode-slider"></span>
              </label>
            </div>
            
            <div className="text-sm text-gray-500">
              Current mode: <span className="font-medium">{mode === 'auto' ? 'Automatic' : 'Manual'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sensor Readings */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="sensor-card p-6">
          <div className="flex items-center">
            <div className="rounded-lg bg-blue-100 p-3">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4 4 0 003 15z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Soil Moisture</h3>
              <p className="text-2xl font-semibold text-gray-900">{currentReadings.soilMoisture}</p>
            </div>
          </div>
        </div>

        <div className="sensor-card p-6">
          <div className="flex items-center">
            <div className="rounded-lg bg-red-100 p-3">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Temperature</h3>
              <p className="text-2xl font-semibold text-gray-900">{currentReadings.temperature}°C</p>
            </div>
          </div>
        </div>

        <div className="sensor-card p-6">
          <div className="flex items-center">
            <div className="rounded-lg bg-green-100 p-3">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4 4 0 003 15z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Humidity</h3>
              <p className="text-2xl font-semibold text-gray-900">{currentReadings.humidity}%</p>
            </div>
          </div>
        </div>

        <div className="sensor-card p-6">
          <div className="flex items-center">
            <div className="rounded-lg bg-yellow-100 p-3">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Light Intensity</h3>
              <p className="text-2xl font-semibold text-gray-900">{currentReadings.lightIntensity}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Soil Moisture Chart */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Soil Moisture Trend</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={soilMoistureData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="moisture" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Temperature Chart */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Temperature Trend</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={temperatureData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="temperature" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Health Distribution */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Health Distribution</h3>
        <div className="h-80 flex items-center justify-center">
          <ResponsiveContainer width="50%" height="100%">
            <PieChart>
              <Pie
                data={healthData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {healthData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
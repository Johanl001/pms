import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import PlantProfile from './components/PlantProfile';
import DiseaseDetection from './components/DiseaseDetection';
import Recommendations from './components/Recommendations';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [plantData, setPlantData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real implementation, you would fetch data from your backend
    // For now, we'll use mock data
    const mockData = {
      currentReadings: {
        soilMoisture: 520,
        temperature: 24.5,
        humidity: 62,
        lightIntensity: 450
      },
      healthScore: 87.5,
      wateringPrediction: {
        waterNow: false,
        confidence: 0.23,
        nextWatering: Date.now() + 7200000 // 2 hours from now
      },
      recentData: [
        { timestamp: Date.now() - 300000, soilMoisture: 515, temperature: 24.2 },
        { timestamp: Date.now() - 600000, soilMoisture: 518, temperature: 24.3 },
        { timestamp: Date.now() - 900000, soilMoisture: 522, temperature: 24.4 },
        { timestamp: Date.now() - 1200000, soilMoisture: 525, temperature: 24.1 },
        { timestamp: Date.now() - 1500000, soilMoisture: 528, temperature: 24.0 },
      ]
    };
    
    setPlantData(mockData);
    setLoading(false);
    
    // Set up polling for real-time data updates
    const interval = setInterval(() => {
      // In a real implementation, you would fetch updated data from your backend
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard plantData={plantData} loading={loading} />;
      case 'profile':
        return <PlantProfile />;
      case 'disease':
        return <DiseaseDetection />;
      case 'recommendations':
        return <Recommendations plantData={plantData} />;
      default:
        return <Dashboard plantData={plantData} loading={loading} />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-green-800">🌱 PlantCare AI</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">Automated Plant Care System</span>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex space-x-8">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`${
                    activeTab === 'dashboard'
                      ? 'border-green-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`${
                    activeTab === 'profile'
                      ? 'border-green-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  Plant Profile
                </button>
                <button
                  onClick={() => setActiveTab('disease')}
                  className={`${
                    activeTab === 'disease'
                      ? 'border-green-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  Disease Detection
                </button>
                <button
                  onClick={() => setActiveTab('recommendations')}
                  className={`${
                    activeTab === 'recommendations'
                      ? 'border-green-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  Recommendations
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {renderTabContent()}
        </div>
      </main>
    </div>
  );
}

export default App;
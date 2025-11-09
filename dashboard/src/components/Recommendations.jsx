import React, { useState, useEffect } from 'react';

const Recommendations = ({ plantData }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real implementation, you would fetch recommendations from your backend
    // For now, we'll generate mock recommendations based on plant data
    generateRecommendations();
  }, [plantData]);

  const generateRecommendations = () => {
    if (!plantData) return;

    const { currentReadings, healthScore, wateringPrediction } = plantData;
    const newRecommendations = [];

    // Health-based recommendations
    if (healthScore < 70) {
      newRecommendations.push({
        id: 1,
        type: 'warning',
        title: 'Plant Health Concern',
        message: 'Your plant health score is below optimal. Consider adjusting care routine.',
        priority: 'high'
      });
    } else if (healthScore < 90) {
      newRecommendations.push({
        id: 2,
        type: 'info',
        title: 'Good Health',
        message: 'Your plant is in good health. Continue current care routine.',
        priority: 'medium'
      });
    } else {
      newRecommendations.push({
        id: 3,
        type: 'success',
        title: 'Excellent Health',
        message: 'Your plant is thriving! Current care routine is working well.',
        priority: 'low'
      });
    }

    // Soil moisture recommendations
    if (currentReadings.soilMoisture < 300) {
      newRecommendations.push({
        id: 4,
        type: 'warning',
        title: 'Low Soil Moisture',
        message: 'Soil moisture is low. Consider watering your plant soon.',
        priority: 'high'
      });
    } else if (currentReadings.soilMoisture > 800) {
      newRecommendations.push({
        id: 5,
        type: 'warning',
        title: 'High Soil Moisture',
        message: 'Soil moisture is high. Check drainage and avoid overwatering.',
        priority: 'high'
      });
    }

    // Temperature recommendations
    if (currentReadings.temperature < 18) {
      newRecommendations.push({
        id: 6,
        type: 'info',
        title: 'Cool Environment',
        message: 'Temperature is on the cooler side. Consider moving to a warmer location.',
        priority: 'medium'
      });
    } else if (currentReadings.temperature > 30) {
      newRecommendations.push({
        id: 7,
        type: 'warning',
        title: 'Warm Environment',
        message: 'Temperature is high. Ensure good ventilation and consider shading.',
        priority: 'high'
      });
    }

    // Humidity recommendations
    if (currentReadings.humidity < 40) {
      newRecommendations.push({
        id: 8,
        type: 'info',
        title: 'Low Humidity',
        message: 'Air humidity is low. Consider using a humidifier or misting.',
        priority: 'medium'
      });
    } else if (currentReadings.humidity > 80) {
      newRecommendations.push({
        id: 9,
        type: 'info',
        title: 'High Humidity',
        message: 'Air humidity is high. Ensure good air circulation to prevent mold.',
        priority: 'medium'
      });
    }

    // Light recommendations
    if (currentReadings.lightIntensity < 200) {
      newRecommendations.push({
        id: 10,
        type: 'info',
        title: 'Low Light',
        message: 'Light levels are low. Consider moving to a brighter location or supplementing with grow lights.',
        priority: 'medium'
      });
    } else if (currentReadings.lightIntensity > 1000) {
      newRecommendations.push({
        id: 11,
        type: 'info',
        title: 'High Light',
        message: 'Light levels are high. Ensure the plant is not getting scorched.',
        priority: 'medium'
      });
    }

    // Watering recommendations
    if (wateringPrediction.waterNow) {
      newRecommendations.push({
        id: 12,
        type: 'action',
        title: 'Watering Recommended',
        message: 'Based on current conditions, it\'s time to water your plant.',
        priority: 'high'
      });
    }

    setRecommendations(newRecommendations);
    setLoading(false);
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'high': return 'border-l-4 border-red-500 bg-red-50';
      case 'medium': return 'border-l-4 border-yellow-500 bg-yellow-50';
      case 'low': return 'border-l-4 border-green-500 bg-green-50';
      default: return 'border-l-4 border-blue-500 bg-blue-50';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'warning':
        return (
          <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
          </svg>
        );
      case 'info':
        return (
          <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        );
      case 'success':
        return (
          <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        );
      case 'action':
        return (
          <svg className="h-5 w-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"></path>
          </svg>
        );
      default:
        return (
          <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-green-500 to-teal-600 p-6">
          <h2 className="text-2xl font-bold text-white">AI Recommendations</h2>
          <p className="text-green-100 mt-1">Personalized care suggestions based on your plant's current condition</p>
        </div>
        
        <div className="p-6">
          {recommendations.length > 0 ? (
            <div className="space-y-4">
              {recommendations.map((rec) => (
                <div 
                  key={rec.id} 
                  className={`${getPriorityClass(rec.priority)} p-4 rounded-lg flex`}
                >
                  <div className="flex-shrink-0">
                    {getTypeIcon(rec.type)}
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-900">{rec.title}</h3>
                    <div className="mt-1 text-sm text-gray-700">
                      <p>{rec.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No recommendations</h3>
              <p className="mt-1 text-sm text-gray-500">Your plant is doing great! No actions needed at this time.</p>
            </div>
          )}
          
          <div className="mt-8 border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Care Tips</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800">Watering Best Practices</h4>
                <ul className="mt-2 list-disc pl-5 space-y-1 text-blue-700 text-sm">
                  <li>Water when the top inch of soil feels dry</li>
                  <li>Use room temperature water</li>
                  <li>Ensure proper drainage to prevent root rot</li>
                  <li>Adjust frequency based on season and humidity</li>
                </ul>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-800">Light Requirements</h4>
                <ul className="mt-2 list-disc pl-5 space-y-1 text-green-700 text-sm">
                  <li>Place near a bright, indirect light source</li>
                  <li>Rotate plant regularly for even growth</li>
                  <li>Supplement with grow lights in winter months</li>
                  <li>Protect from direct afternoon sun</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Recommendations;
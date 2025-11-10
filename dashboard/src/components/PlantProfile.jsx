import React, { useState, useEffect } from 'react';

const PlantProfile = () => {
  const [plantName, setPlantName] = useState('Green Friend');
  const [plantType, setPlantType] = useState('Pothos');
  const [plantAge, setPlantAge] = useState('8 months');
  const [wateringPref, setWateringPref] = useState('Medium');
  const [lightPref, setLightPref] = useState('Low to Medium');
  const [notes, setNotes] = useState('Thriving in the corner by the window');
  const [plantImage, setPlantImage] = useState(null);
  const [careHistory, setCareHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load plant profile data when component mounts
  useEffect(() => {
    const loadPlantProfile = async () => {
      try {
        const response = await fetch('http://localhost:5000/plant_profile');
        const data = await response.json();
        
        setPlantName(data.plantName || 'Green Friend');
        setPlantType(data.plantType || 'Pothos');
        setPlantAge(data.plantAge || '8 months');
        setWateringPref(data.wateringPref || 'Medium');
        setLightPref(data.lightPref || 'Low to Medium');
        setNotes(data.notes || 'Thriving in the corner by the window');
        setPlantImage(data.plantImage || null);
        setCareHistory(data.careHistory || []);
      } catch (error) {
        console.error('Error loading plant profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPlantProfile();
  }, []);

  const handleSave = async () => {
    try {
      const profileData = {
        plantName,
        plantType,
        plantAge,
        wateringPref,
        lightPref,
        notes,
        plantImage,
        careHistory
      };

      const response = await fetch('http://localhost:5000/plant_profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      if (response.ok) {
        alert('Plant profile saved successfully!');
      } else {
        alert('Failed to save plant profile.');
      }
    } catch (error) {
      console.error('Error saving plant profile:', error);
      alert('Error saving plant profile.');
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPlantImage(e.target.result);
      };
      reader.readAsDataURL(file);
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
          <h2 className="text-2xl font-bold text-white">Plant Profile</h2>
          <p className="text-green-100 mt-1">Manage your plant's personal information and preferences</p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="md:col-span-1 flex justify-center">
              <div className="relative">
                {plantImage ? (
                  <img 
                    src={plantImage} 
                    alt="Plant" 
                    className="w-48 h-48 object-cover rounded-xl border-2 border-green-300"
                  />
                ) : (
                  <div className="bg-gray-200 border-2 border-dashed rounded-xl w-48 h-48 flex items-center justify-center text-gray-500">
                    Plant Image
                  </div>
                )}
                <div className="mt-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Upload Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-green-50 file:text-green-700
                      hover:file:bg-green-100"
                  />
                </div>
              </div>
            </div>
            
            <div className="md:col-span-2">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plant Name</label>
                  <input
                    type="text"
                    value={plantName}
                    onChange={(e) => setPlantName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plant Type</label>
                  <input
                    type="text"
                    value={plantType}
                    onChange={(e) => setPlantType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                    <input
                      type="text"
                      value={plantAge}
                      onChange={(e) => setPlantAge(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Watering Preference</label>
                    <select
                      value={wateringPref}
                      onChange={(e) => setWateringPref(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    >
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Care Preferences</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Light Preference</label>
                <select
                  value={lightPref}
                  onChange={(e) => setLightPref(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                >
                  <option>Low</option>
                  <option>Low to Medium</option>
                  <option>Medium</option>
                  <option>Medium to High</option>
                  <option>High</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Special Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-6 mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Care History</h3>
            
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Date
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Action
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {careHistory.length > 0 ? (
                    careHistory.map((entry, index) => (
                      <tr key={index}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {entry.date}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {entry.action}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {entry.notes}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="py-4 pl-4 pr-3 text-sm text-gray-500 text-center">
                        No care history recorded yet. History will appear here as you care for your plant.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSave}
              className="action-button ml-3"
            >
              Save Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlantProfile;
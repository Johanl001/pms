import React, { useState } from 'react';
import axios from 'axios';

const DiseaseDetection = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setAnalysisResult(null);
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) {
      setError('Please select an image first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedImage);
      const response = await axios.post('http://localhost:5000/upload_image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setAnalysisResult(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error analyzing image:', err);
      setError('Failed to analyze image. Please try again.');
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setAnalysisResult(null);
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-green-500 to-teal-600 p-6">
          <h2 className="text-2xl font-bold text-white">Plant Disease Detection</h2>
          <p className="text-green-100 mt-1">Upload an image of your plant to detect diseases and get treatment recommendations</p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Image Upload Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Plant Image</h3>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {previewUrl ? (
                  <div className="space-y-4">
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="mx-auto max-h-64 rounded-lg object-contain"
                    />
                    <div className="flex justify-center space-x-3">
                      <button
                        onClick={handleAnalyze}
                        disabled={loading}
                        className={`action-button ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
                      >
                        {loading ? 'Analyzing...' : 'Analyze Image'}
                      </button>
                      <button
                        onClick={handleReset}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Choose Another
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="flex text-sm text-gray-600">
                      <label className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500">
                        <span>Upload a file</span>
                        <input 
                          type="file" 
                          className="sr-only" 
                          accept="image/*" 
                          onChange={handleImageChange}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, GIF up to 10MB
                    </p>
                  </div>
                )}
              </div>
              
              {error && (
                <div className="mt-4 rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">{error}</h3>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Results Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Analysis Results</h3>
              
              {analysisResult ? (
                <div className="space-y-6">
                  <div className="bg-green-50 rounded-lg p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-8 w-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-lg font-medium text-green-800">Analysis Complete</h3>
                        <div className="mt-1 text-green-700">
                          <p>Disease Detected: <span className="font-semibold">{analysisResult.disease}</span></p>
                          <p>Confidence: <span className="font-semibold">{(analysisResult.confidence * 100).toFixed(1)}%</span></p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-2">Treatment Recommendation</h4>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-blue-800">{analysisResult.treatment}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-2">What You Can Do</h4>
                    <ul className="list-disc pl-5 space-y-2 text-gray-700">
                      <li>Monitor your plant closely for any changes</li>
                      <li>Follow the treatment recommendation above</li>
                      <li>Take preventive measures to avoid spreading to other plants</li>
                      <li>Re-scan in a week to track progress</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center h-full flex items-center justify-center">
                  <div className="text-gray-500">
                    {loading ? (
                      <div className="space-y-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
                        <p>Analyzing your plant image...</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                        </svg>
                        <p>Upload an image to see analysis results</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Information Section */}
          <div className="mt-8 border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">How It Works</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-green-600 font-bold text-lg">1</div>
                <h4 className="font-medium text-gray-900 mt-2">Upload Image</h4>
                <p className="text-gray-600 mt-1">Take a clear photo of your plant's leaves, focusing on any areas showing signs of damage or discoloration.</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-green-600 font-bold text-lg">2</div>
                <h4 className="font-medium text-gray-900 mt-2">AI Analysis</h4>
                <p className="text-gray-600 mt-1">Our AI model analyzes the image to detect common plant diseases and assess overall plant health.</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-green-600 font-bold text-lg">3</div>
                <h4 className="font-medium text-gray-900 mt-2">Get Recommendations</h4>
                <p className="text-gray-600 mt-1">Receive treatment recommendations and steps to help your plant recover and thrive.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiseaseDetection;
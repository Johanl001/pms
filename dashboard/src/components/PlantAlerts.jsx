import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PlantAlerts = ({ plantData, onWaterNow, onToggleLight }) => {
  const [alerts, setAlerts] = useState([]);
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set());

  useEffect(() => {
    if (!plantData) return;

    const { currentReadings, healthScore, wateringPrediction } = plantData;
    const newAlerts = [];

    // Critical Alerts (High Priority - Red)
    
    // 1. Critical Health Score
    if (healthScore < 50) {
      newAlerts.push({
        id: 'critical-health',
        type: 'critical',
        title: '🚨 Critical: Plant Health Emergency',
        message: `Your plant health score is critically low (${healthScore.toFixed(1)}/100). Immediate action required!`,
        action: 'Check all sensors and provide immediate care.',
        priority: 1,
        persistent: true
      });
    }

    // 2. Extremely Low Soil Moisture
    if (currentReadings.soilMoisture < 200) {
      newAlerts.push({
        id: 'critical-moisture-low',
        type: 'critical',
        title: '🚨 Critical: Plant Dehydration',
        message: `Soil moisture is extremely low (${currentReadings.soilMoisture}). Your plant needs water immediately!`,
        action: 'water',
        actionLabel: 'Water Now',
        priority: 1,
        persistent: true
      });
    }

    // 3. Extremely High Soil Moisture (Potential Root Rot)
    if (currentReadings.soilMoisture > 3500) {
      newAlerts.push({
        id: 'critical-moisture-high',
        type: 'critical',
        title: '🚨 Critical: Overwatering Risk',
        message: `Soil moisture is extremely high (${currentReadings.soilMoisture}). Risk of root rot!`,
        action: 'Check drainage and avoid watering.',
        priority: 1,
        persistent: true
      });
    }

    // 4. Extreme Temperature
    if (currentReadings.temperature > 35) {
      newAlerts.push({
        id: 'critical-temp-high',
        type: 'critical',
        title: '🚨 Critical: Excessive Heat',
        message: `Temperature is dangerously high (${currentReadings.temperature.toFixed(1)}°C). Move plant to cooler location immediately!`,
        action: 'Move to shade and increase ventilation.',
        priority: 1,
        persistent: true
      });
    } else if (currentReadings.temperature < 10) {
      newAlerts.push({
        id: 'critical-temp-low',
        type: 'critical',
        title: '🚨 Critical: Freezing Temperature',
        message: `Temperature is dangerously low (${currentReadings.temperature.toFixed(1)}°C). Risk of frost damage!`,
        action: 'Move to warmer location immediately.',
        priority: 1,
        persistent: true
      });
    }

    // Warning Alerts (Medium Priority - Yellow/Orange)
    
    // 5. Low Health Score
    if (healthScore >= 50 && healthScore < 70) {
      newAlerts.push({
        id: 'warning-health',
        type: 'warning',
        title: '⚠️ Warning: Plant Health Declining',
        message: `Plant health score is below optimal (${healthScore.toFixed(1)}/100). Monitor closely.`,
        action: 'Review care routine and check all conditions.',
        priority: 2,
        persistent: false
      });
    }

    // 6. Low Soil Moisture
    if (currentReadings.soilMoisture >= 200 && currentReadings.soilMoisture < 400) {
      newAlerts.push({
        id: 'warning-moisture-low',
        type: 'warning',
        title: '⚠️ Warning: Low Soil Moisture',
        message: `Soil moisture is low (${currentReadings.soilMoisture}). Consider watering soon.`,
        action: 'water',
        actionLabel: 'Water Now',
        priority: 2,
        persistent: false
      });
    }

    // 7. High Soil Moisture
    if (currentReadings.soilMoisture > 800 && currentReadings.soilMoisture <= 3500) {
      newAlerts.push({
        id: 'warning-moisture-high',
        type: 'warning',
        title: '⚠️ Warning: High Soil Moisture',
        message: `Soil moisture is high (${currentReadings.soilMoisture}). Check drainage before next watering.`,
        action: 'Ensure proper drainage and reduce watering frequency.',
        priority: 2,
        persistent: false
      });
    }

    // 8. Temperature Warning
    if (currentReadings.temperature > 30 && currentReadings.temperature <= 35) {
      newAlerts.push({
        id: 'warning-temp-high',
        type: 'warning',
        title: '⚠️ Warning: High Temperature',
        message: `Temperature is elevated (${currentReadings.temperature.toFixed(1)}°C). Ensure adequate ventilation.`,
        action: 'Increase air circulation and provide shade.',
        priority: 2,
        persistent: false
      });
    } else if (currentReadings.temperature >= 10 && currentReadings.temperature < 18) {
      newAlerts.push({
        id: 'warning-temp-low',
        type: 'warning',
        title: '⚠️ Warning: Cool Temperature',
        message: `Temperature is on the cool side (${currentReadings.temperature.toFixed(1)}°C). Consider warmer location.`,
        action: 'Move to warmer area if plant requires higher temperatures.',
        priority: 2,
        persistent: false
      });
    }

    // 9. Low Humidity
    if (currentReadings.humidity < 30) {
      newAlerts.push({
        id: 'warning-humidity-low',
        type: 'warning',
        title: '⚠️ Warning: Very Low Humidity',
        message: `Air humidity is very low (${currentReadings.humidity.toFixed(1)}%). Plant may need more moisture.`,
        action: 'light',
        actionLabel: 'Use Humidifier',
        secondaryAction: 'Consider misting or using a humidity tray.',
        priority: 2,
        persistent: false
      });
    }

    // 10. High Humidity
    if (currentReadings.humidity > 85) {
      newAlerts.push({
        id: 'warning-humidity-high',
        type: 'warning',
        title: '⚠️ Warning: Very High Humidity',
        message: `Air humidity is very high (${currentReadings.humidity.toFixed(1)}%). Risk of mold growth.`,
        action: 'Increase ventilation to prevent mold.',
        priority: 2,
        persistent: false
      });
    }

    // 11. Low Light
    if (currentReadings.lightIntensity < 150) {
      newAlerts.push({
        id: 'warning-light-low',
        type: 'warning',
        title: '⚠️ Warning: Insufficient Light',
        message: `Light intensity is very low (${currentReadings.lightIntensity}). Plant needs more light.`,
        action: 'light',
        actionLabel: 'Turn On Grow Light',
        secondaryAction: 'Move to brighter location or supplement with grow lights.',
        priority: 2,
        persistent: false
      });
    }

    // Info Alerts (Low Priority - Blue/Green)
    
    // 12. Watering Recommendation
    if (wateringPrediction.waterNow && wateringPrediction.confidence >= 0.85) {
      newAlerts.push({
        id: 'info-watering',
        type: 'info',
        title: '💧 Action: Watering Recommended',
        message: `AI recommends watering now (${(wateringPrediction.confidence * 100).toFixed(0)}% confidence).`,
        action: 'water',
        actionLabel: 'Water Now',
        priority: 3,
        persistent: false
      });
    }

    // 13. Anomaly Detection Alert
    if (plantData.anomalyDetected) {
      newAlerts.push({
        id: 'warning-anomaly',
        type: 'warning',
        title: '⚠️ Warning: Anomaly Detected',
        message: 'Unusual sensor readings detected. This could indicate a sensor issue or abnormal plant conditions.',
        action: 'Check sensor connections and plant condition. Verify readings are accurate.',
        priority: 2,
        persistent: false
      });
    }

    // 14. Good Health (Positive)
    if (healthScore >= 85) {
      newAlerts.push({
        id: 'success-health',
        type: 'success',
        title: '✅ Excellent: Plant is Thriving',
        message: `Plant health score is excellent (${healthScore.toFixed(1)}/100). Keep up the great care!`,
        action: 'Continue current care routine.',
        priority: 4,
        persistent: false,
        autoHide: true
      });
    }

    // Sort alerts by priority (lower number = higher priority)
    newAlerts.sort((a, b) => a.priority - b.priority);

    // Filter out dismissed alerts
    const activeAlerts = newAlerts.filter(alert => !dismissedAlerts.has(alert.id));
    
    setAlerts(activeAlerts);

    // Auto-hide success alerts after 5 seconds
    activeAlerts.forEach(alert => {
      if (alert.autoHide) {
        setTimeout(() => {
          setDismissedAlerts(prev => new Set([...prev, alert.id]));
        }, 5000);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plantData]);

  const handleDismiss = (alertId) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
  };

  const handleAction = async (alert) => {
    try {
      if (alert.action === 'water') {
        if (onWaterNow) {
          await onWaterNow();
        }
      } else if (alert.action === 'light') {
        if (onToggleLight) {
          await onToggleLight();
        }
      }
      // Dismiss alert after action (only if not persistent)
      if (!alert.persistent) {
        setTimeout(() => {
          handleDismiss(alert.id);
        }, 1000);
      }
    } catch (error) {
      console.error('Error executing alert action:', error);
    }
  };

  const getAlertStyles = (type) => {
    switch (type) {
      case 'critical':
        return {
          bg: 'bg-red-50 border-red-500',
          text: 'text-red-800',
          icon: 'text-red-500',
          button: 'bg-red-600 hover:bg-red-700 text-white'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50 border-yellow-500',
          text: 'text-yellow-800',
          icon: 'text-yellow-500',
          button: 'bg-yellow-600 hover:bg-yellow-700 text-white'
        };
      case 'info':
        return {
          bg: 'bg-blue-50 border-blue-500',
          text: 'text-blue-800',
          icon: 'text-blue-500',
          button: 'bg-blue-600 hover:bg-blue-700 text-white'
        };
      case 'success':
        return {
          bg: 'bg-green-50 border-green-500',
          text: 'text-green-800',
          icon: 'text-green-500',
          button: 'bg-green-600 hover:bg-green-700 text-white'
        };
      default:
        return {
          bg: 'bg-gray-50 border-gray-500',
          text: 'text-gray-800',
          icon: 'text-gray-500',
          button: 'bg-gray-600 hover:bg-gray-700 text-white'
        };
    }
  };

  if (alerts.length === 0) {
    return null;
  }

  // Show only top 3 alerts to avoid clutter
  const displayAlerts = alerts.slice(0, 3);

  return (
    <div className="space-y-3 mb-6">
      {displayAlerts.map((alert) => {
        const styles = getAlertStyles(alert.type);
        return (
          <div
            key={alert.id}
            className={`${styles.bg} border-l-4 ${styles.text} p-4 rounded-lg shadow-md animate-slide-in`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center">
                  <h3 className={`text-lg font-semibold ${styles.text} mr-2`}>
                    {alert.title}
                  </h3>
                </div>
                <p className={`mt-1 text-sm ${styles.text} opacity-90`}>
                  {alert.message}
                </p>
                {alert.action && typeof alert.action === 'string' && alert.action !== 'water' && alert.action !== 'light' && (
                  <p className={`mt-2 text-sm font-medium ${styles.text}`}>
                    💡 {alert.action}
                  </p>
                )}
                {alert.secondaryAction && (
                  <p className={`mt-1 text-xs ${styles.text} opacity-75`}>
                    {alert.secondaryAction}
                  </p>
                )}
                {(alert.action === 'water' || alert.action === 'light') && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => handleAction(alert)}
                      className={`${styles.button} px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 shadow-sm`}
                    >
                      {alert.actionLabel || 'Take Action'}
                    </button>
                    {!alert.persistent && (
                      <button
                        onClick={() => handleDismiss(alert.id)}
                        className="px-4 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors duration-200"
                      >
                        Dismiss
                      </button>
                    )}
                  </div>
                )}
              </div>
              {!alert.persistent && (
                <button
                  onClick={() => handleDismiss(alert.id)}
                  className={`ml-4 ${styles.text} hover:opacity-75 transition-opacity`}
                  aria-label="Dismiss alert"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        );
      })}
      {alerts.length > 3 && (
        <div className="text-center text-sm text-gray-500">
          + {alerts.length - 3} more alert{alerts.length - 3 !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};

export default PlantAlerts;


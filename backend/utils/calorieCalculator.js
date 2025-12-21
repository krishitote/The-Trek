// backend/utils/calorieCalculator.js
// Calorie calculation using MET (Metabolic Equivalent of Task) values

/**
 * Calculate calories burned based on activity type, duration, distance, and user weight
 * Formula: Calories = MET * weight(kg) * duration(hours)
 * 
 * MET values (Metabolic Equivalent of Task):
 * - Running (8 km/h): 8.3 METs
 * - Running (10 km/h): 10.0 METs
 * - Running (12+ km/h): 11.5 METs
 * - Cycling (16-19 km/h): 6.8 METs
 * - Cycling (19-22 km/h): 8.0 METs
 * - Cycling (22+ km/h): 10.0 METs
 * - Swimming (moderate): 8.0 METs
 * - Swimming (vigorous): 10.0 METs
 * - Walking (5 km/h): 3.5 METs
 * - Walking (6 km/h): 4.3 METs
 * - Hiking (moderate): 6.0 METs
 * - Hiking (steep): 7.5 METs
 */

export function calculateCalories(type, distanceKm, durationMin, weightKg = 70) {
  // Default weight to 70kg if not provided
  const weight = weightKg || 70;
  const durationHours = durationMin / 60;
  
  let met = 8.0; // Default MET value
  
  // Calculate pace (km/h) if distance is available
  const pace = distanceKm > 0 ? (distanceKm / durationHours) : 0;
  
  switch (type.toLowerCase()) {
    case 'running':
      if (pace >= 12) met = 11.5;
      else if (pace >= 10) met = 10.0;
      else if (pace >= 8) met = 8.3;
      else met = 7.0; // Slow running/jogging
      break;
      
    case 'cycling':
      if (pace >= 22) met = 10.0;
      else if (pace >= 19) met = 8.0;
      else if (pace >= 16) met = 6.8;
      else met = 4.0; // Leisurely cycling
      break;
      
    case 'swimming':
      // Swimming is duration-based, not pace-based
      // Assume moderate to vigorous based on duration
      met = durationMin > 30 ? 10.0 : 8.0;
      break;
      
    case 'walking':
      if (pace >= 6) met = 4.3;
      else if (pace >= 5) met = 3.5;
      else met = 2.8; // Slow walking
      break;
      
    case 'hiking':
      // Hiking intensity based on pace (slower = steeper)
      met = pace < 4 ? 7.5 : 6.0;
      break;
      
    default:
      // Generic moderate activity
      met = 6.0;
      break;
  }
  
  // Calculate calories
  const calories = Math.round(met * weight * durationHours);
  
  return calories;
}

/**
 * Get estimated calories per kilometer for a given activity type
 * Useful for quick estimates without duration
 */
export function getCaloriesPerKm(type, weightKg = 70) {
  const weight = weightKg || 70;
  
  const caloriesPerKm = {
    'running': weight * 1.036,      // ~1 calorie per kg per km
    'cycling': weight * 0.57,       // ~0.57 cal/kg/km
    'walking': weight * 0.75,       // ~0.75 cal/kg/km
    'hiking': weight * 0.85,        // ~0.85 cal/kg/km
    'swimming': weight * 1.3,       // Rough estimate (swimming is time-based)
  };
  
  return Math.round(caloriesPerKm[type.toLowerCase()] || weight * 0.8);
}

/**
 * Format calories for display
 */
export function formatCalories(calories) {
  if (calories >= 1000) {
    return `${(calories / 1000).toFixed(1)}k`;
  }
  return calories.toString();
}

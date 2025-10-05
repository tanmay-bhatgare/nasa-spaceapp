# Debugging Guide: Why Am I Getting Default Data (50%)?

## The Problem

Your weather app shows:
- ⚪ "Default Estimates" badge
- 🔴 50% probability (constant)
- 📊 Hardcoded chart pattern (same every time)
- ❌ Temperature showing 59% (not real data)

## Root Causes & Solutions

### 1. **Historical Archive API Date Limit** ✅ FIXED

**Problem:** Open-Meteo Archive API only has data up to 5-7 days ago, not today.

**Solution Applied:**
```typescript
// OLD (WRONG):
const endDateStr = `${currentYear}-${currentMonth + 1}-${lastDayOfMonth}`

// NEW (CORRECT):
const archiveEndDate = new Date(today)
archiveEndDate.setDate(archiveEndDate.getDate() - 7)  // 7 days ago
const endDateStr = archiveEndDate.toISOString().split('T')[0]
```

**Why:** The archive API needs time to process and make data available. Requesting today's date will fail.

### 2. **Check Browser Console Logs** 🔍

Open your browser console (F12) and look for these log patterns:

#### ✅ SUCCESS Pattern (Good):
```
🔍 Fetching weather data for coordinates: (22.72, 75.86)
📅 Date range: 2015-01-01 to 2025-09-28
🌍 Historical API URL: https://archive-api.open-meteo.com/...
✅ Historical API success: 3950 days received
📈 Processing 3950 days of historical data
📊 Monthly stats collected for: Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct
📅 Oct: 310 temp readings, 310 precip readings, 310 wind readings
   Oct: 95/310 adverse days = 31% probability
🎯 Final probability for Oct: 31%
🎉 SUCCESS! Returning real data:
   - Final probability: 31%
   - Data source: historical
```

#### ❌ FAILURE Pattern (Bad):
```
🔍 Fetching weather data for coordinates: (22.72, 75.86)
📅 Date range: 2015-01-01 to 2025-10-05
🌍 Historical API URL: https://archive-api.open-meteo.com/...
❌ Historical API error: 400 Bad Request
Response: {"error":true,"reason":"Data not available for this date range"}
❌ Historical data fetch failed - USING DEFAULT DATA
⚠️  Returning hardcoded default data as fallback
```

### 3. **Common API Error Reasons**

#### A. **Invalid Date Range**
**Symptom:** API returns 400 error
**Fix:** Use date range ending 7+ days ago

#### B. **CORS Error**
**Symptom:** `Failed to fetch` or `CORS policy` error
**Fix:** This shouldn't happen with Open-Meteo (they allow CORS), but check:
- Are you behind a corporate firewall?
- Is your internet connection working?
- Try accessing the API URL directly in browser

#### C. **Invalid Coordinates**
**Symptom:** API returns error about coordinates
**Fix:** Ensure coordinates are:
- Latitude: -90 to 90
- Longitude: -180 to 180
- Not null/undefined

#### D. **Empty Response**
**Symptom:** API succeeds but returns 0 days
**Fix:** Check the date range and variable mapping

### 4. **Manual API Test** 🧪

Test the API directly in your browser:

```
https://archive-api.open-meteo.com/v1/archive?latitude=22.72&longitude=75.86&start_date=2015-01-01&end_date=2025-09-28&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max&timezone=auto
```

**Expected Response:**
```json
{
  "latitude": 22.72,
  "longitude": 75.86,
  "daily": {
    "time": ["2015-01-01", "2015-01-02", ...],
    "temperature_2m_max": [28.5, 29.1, ...],
    "precipitation_sum": [0.0, 0.0, ...],
    "windspeed_10m_max": [12.3, 13.5, ...]
  }
}
```

### 5. **Step-by-Step Debugging**

1. **Open Browser Console** (F12 → Console tab)

2. **Clear Console** (click 🚫 icon)

3. **Select Location** (e.g., Indor, India)
   - Look for: `🔍 Fetching weather data for coordinates:`
   - Verify coordinates are numbers, not null

4. **Check API Call**
   - Look for: `🌍 Historical API URL:`
   - Copy URL and test in browser
   - Should return JSON with data

5. **Check API Response**
   - Look for: `✅ Historical API success: X days received`
   - If X = 0, API returned empty dataset
   - If error, read error message carefully

6. **Check Data Processing**
   - Look for: `📊 Monthly stats collected for:`
   - Should list all 12 months (or at least Oct)
   - If missing, data grouping failed

7. **Check Probability Calculation**
   - Look for: `🎯 Final probability for Oct: X%`
   - If X = 50, either calculation failed or it's coincidentally 50%
   - Look at individual month calculations above

8. **Check Final Result**
   - Look for: `🎉 SUCCESS! Returning real data:`
   - Should show data source as 'historical' or 'combined'
   - If you see 'default', something failed

### 6. **Component Not Updating?** 🔄

If the console shows SUCCESS but UI still shows default data:

**Check:**
```typescript
// In ProbabilityResults.tsx
useEffect(() => {
  const fetchWeatherData = async () => {
    // ... fetch code
    
    // ADD THIS DEBUG LOG:
    console.log('📱 Setting state:', {
      probability: result.probability,
      dataSource: result.dataSource,
      monthlyDataLength: result.monthlyData.length
    })
    
    setChartData(result.monthlyData);
    setProbability(result.probability);
    setDataSource(result.dataSource);
  }
  
  fetchWeatherData();
}, [coordinates.lat, coordinates.lng, date, variables]);
```

**Issue:** Component might not be re-rendering
**Fix:** Check that dependencies array is correct

### 7. **Network Tab Check** 🌐

1. Open Dev Tools → Network tab
2. Click XHR or Fetch filter
3. Trigger the analysis
4. Look for requests to `archive-api.open-meteo.com`
5. Check:
   - Status code (should be 200)
   - Response preview (should have data array)
   - Response size (should be >1KB)

### 8. **Still Stuck?** 🆘

**Add this temporary debug code:**

```typescript
// In weatherApi.ts, at the very start of getWeatherProbabilityAnalysis:
export async function getWeatherProbabilityAnalysis(...) {
  console.log('🚀 FUNCTION CALLED WITH:', {
    latitude,
    longitude,
    selectedDate: selectedDate.toISOString(),
    variables
  })
  
  // ... rest of code
}
```

**Then add this in the component:**

```typescript
// In ProbabilityResults.tsx
useEffect(() => {
  console.log('🎬 useEffect triggered with:', {
    coordinates,
    date: date.toISOString(),
    variables
  })
  // ... rest of code
}, [coordinates.lat, coordinates.lng, date, variables])
```

### 9. **Quick Fixes Checklist** ✅

- [ ] Browser console open (F12)
- [ ] No errors in console
- [ ] API URL shows in console logs
- [ ] API returns 200 status (check Network tab)
- [ ] Days received > 0 (check console)
- [ ] Monthly stats shows October (or selected month)
- [ ] Probability ≠ 50% (or if 50%, check individual calculations)
- [ ] Data source = 'historical' or 'combined' (not 'default')
- [ ] Component state updates (add debug logs)
- [ ] UI re-renders after state update

### 10. **Expected Working Flow**

```
1. User selects location → Coordinates extracted (lat, lng)
   ↓
2. Component calls getWeatherProbabilityAnalysis(lat, lng, date, vars)
   ↓
3. Function calculates date range (ending 7 days ago)
   ↓
4. Parallel fetch: Historical API + Forecast API
   ↓
5. Historical API returns ~3,650 days of data
   ↓
6. Data grouped by month (Jan-Dec)
   ↓
7. Probability calculated per month (adverse days / total days)
   ↓
8. Forecast data blended in (70/30 split)
   ↓
9. Function returns {probability: X%, monthlyData: [...], dataSource: 'combined'}
   ↓
10. Component sets state with real data
   ↓
11. UI updates with real probability and chart
   ↓
12. Badge shows "Combined Historical + Forecast Data" (green)
```

### 11. **Test Coordinates**

Try these known working coordinates:

- **New York**: `40.7128, -74.0060`
- **London**: `51.5074, -0.1278`
- **Tokyo**: `35.6762, 139.6503`
- **Sydney**: `-33.8688, 151.2093`
- **Mumbai**: `19.0760, 72.8777`

### 12. **Date Range Validation**

```typescript
// Your end date should be:
const today = new Date()
const archiveEndDate = new Date(today)
archiveEndDate.setDate(archiveEndDate.getDate() - 7)

// Test it:
console.log('Today:', today.toISOString().split('T')[0])
console.log('Archive end:', archiveEndDate.toISOString().split('T')[0])

// Archive end should be 7 days before today
// Example: If today is 2025-10-05, archive end should be 2025-09-28
```

---

## Quick Summary

**Most Common Issue:** Date range includes today's date, but archive API only has data up to 7 days ago.

**Fix:** Already applied - end date is now automatically set to 7 days ago.

**How to Verify Fix:** 
1. Open console
2. Select location
3. Click Analyze
4. Look for: `✅ Historical API success: X days received` (X should be 3000+)
5. Look for: `🎉 SUCCESS! Returning real data`
6. Check UI shows green badge and probability ≠ 50%

**If Still Failing:**
- Check console for error messages
- Test API URL manually in browser
- Verify coordinates are valid numbers
- Check Network tab for failed requests
- Add debug logs to track data flow

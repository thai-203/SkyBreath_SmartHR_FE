# Face Recognition Configuration Module

## 📋 Overview
This module provides a comprehensive UI for managing face recognition system settings, including recognition thresholds, anti-spoof settings, camera configuration, and AI model selection.

## 📁 Project Structure

```
src/
├── app/(protected)/
│   └── configurations/
│       ├── layout.jsx                           # Layout component for configurations
│       ├── page.jsx                             # Index page with configuration options
│       └── face-recognition/
│           ├── page.jsx                         # Main face recognition config page
│           └── components/
│               └── FaceRecognitionConfigForm.jsx  # Reusable configuration form
├── services/
│   ├── face-recognition.service.js              # API service for face recognition
│   └── index.js                                 # Service exports
```

## 🎯 Features

### 1. **Recognition Settings**
- `recognitionThreshold` - Similarity threshold (0-1)
- `similarityMetric` - Comparison method (Cosine, Euclidean)
- `maxEmbeddingsPerUser` - Max face embeddings per user

### 2. **Anti-Spoof Settings**
- `spoofThreshold` - Spoof detection threshold (0-1)
- `livenessMode` - Liveness detection mode (MULTI_FRAME, SINGLE_FRAME, ADVANCED)
- `requiredFrames` - Number of frames required for liveness check

### 3. **Camera Settings**
- `captureIntervalMs` - Interval between captures (milliseconds)
- `faceDetectionMinSize` - Minimum face size in pixels
- `maxFacesAllowed` - Maximum faces allowed in frame

### 4. **Model Settings**
- `arcfaceModelName` - ArcFace model (buffalo_l, buffalo_m, buffalo_s, vit_l, vit_m)
- `antiSpoofModelVersion` - Anti-spoof model version
- `saveAttendanceImage` - Save attendance images toggle

## 🔌 API Integration

### Service Methods

```javascript
// Get current configuration
const config = await faceRecognitionService.getConfig();

// Update configuration
const response = await faceRecognitionService.updateConfig(configData);

// Reset to defaults
const response = await faceRecognitionService.resetToDefaults();
```

### Expected API Endpoints

- `GET /face-recognition-config` - Fetch current config
- `PUT /face-recognition-config` - Update config
- `POST /face-recognition-config/reset` - Reset to defaults

## 📝 Data Format

```javascript
{
  // Recognition Section
  recognitionThreshold: 0.6,          // decimal (0-1)
  similarityMetric: "cosine",         // string
  maxEmbeddingsPerUser: 5,            // integer

  // Anti-Spoof Section
  spoofThreshold: 0.8,                // decimal (0-1)
  livenessMode: "MULTI_FRAME",        // string
  requiredFrames: 10,                 // integer

  // Camera Section
  captureIntervalMs: 1000,            // integer (ms)
  faceDetectionMinSize: 80,           // integer (pixels)
  maxFacesAllowed: 1,                 // integer

  // Model Section
  arcfaceModelName: "buffalo_l",      // string
  antiSpoofModelVersion: null,        // string (nullable)
  saveAttendanceImage: true           // boolean
}
```

## 🎨 Components

### FaceRecognitionConfigForm
A reusable form component with organized sections:
- Validates all numeric inputs
- Displays helpful hints for each field
- Shows validation errors
- Supports save and reset actions
- Responsive design

### FaceRecognitionPage
Main page component that:
- Loads current configuration
- Handles API calls
- Manages form state and errors
- Displays loading states
- Shows informational alerts

### ConfigurationsIndexPage
Overview page listing all available configurations:
- Navigation to different configuration modules
- Color-coded cards for easy identification
- Support for disabled/coming-soon modules
- Informational section with best practices

## 🔐 Validation Rules

| Field | Min | Max | Required |
|-------|-----|-----|----------|
| recognitionThreshold | 0 | 1 | ✓ |
| spoofThreshold | 0 | 1 | ✓ |
| maxEmbeddingsPerUser | 1 | 100 | ✓ |
| requiredFrames | 1 | 100 | ✓ |
| captureIntervalMs | 100 | 10000 | ✓ |
| faceDetectionMinSize | 20 | 500 | ✓ |
| maxFacesAllowed | 1 | 10 | ✓ |

## 🚀 Usage

1. Navigate to `/configurations` to see all available configurations
2. Click "Nhận Diện Khuôn Mặt" to access face recognition settings
3. Modify values as needed
4. Click "Lưu Cấu Hình" to save changes
5. Use "Đặt Lại Mặc Định" to reset all values to defaults

## 📚 Best Practices

- Higher recognition threshold = higher accuracy requirement but fewer false matches
- Larger AI models offer better accuracy but slower processing
- Lower detection min size catches small faces but may increase false positives
- Multi-frame liveness mode is more secure but requires more processing

## 🔄 Error Handling

- API errors are caught and displayed to user via toast notifications
- Form validation errors prevent invalid submissions
- Fallback default values are used if API load fails
- Detailed error messages guide users to correct issues

## 🌐 Language

All UI text is in Vietnamese (vi-VN):
- Field labels and descriptions
- Toast notifications
- Validation messages
- Informational alerts
- Buttons and action text

## 📱 Responsive Design

- Mobile-friendly form layout
- Sticky action buttons
- Responsive grid for configuration cards
- Touch-friendly input fields

## 🔧 Dependencies

- React 18+
- Next.js 13+ (App Router)
- TailwindCSS
- Lucide React (icons)
- Custom API client

## 📖 Making Changes

To add a new field:
1. Update the entity in BE
2. Add field to the `sections` array in `FaceRecognitionConfigForm`
3. Add validation rule in form or API
4. Add API documentation above

To add a new configuration module:
1. Create new folder in `/configurations`
2. Create `page.jsx` with main logic
3. Create service file in `/services`
4. Add module card to index page
5. Update `index.js` exports

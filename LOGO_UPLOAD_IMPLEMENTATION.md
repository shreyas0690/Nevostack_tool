# 🖼️ Logo Upload Feature Implementation Guide

## 📋 Overview

This guide documents the implementation of logo upload functionality during company registration in NevoStack HRMS.

## ✅ Completed Implementation

### Backend Changes

1. **Company Model Updates**
   - Added `logo` field with `url`, `publicId`, and `uploadedAt` subfields
   - Schema supports optional logo storage

2. **Cloudinary Service**
   - Created `cloudinaryService.js` with upload, delete, and configuration functions
   - Supports image resizing and optimization
   - File size limit: 5MB
   - Supported formats: JPG, PNG, WebP, SVG

3. **API Routes**
   - Added `/api/company/upload-logo` endpoint for logo uploads
   - Updated `create-payment-order` endpoint to accept logo data
   - Updated `verify-payment` endpoint to save logo during registration
   - Updated `register` endpoint for free plans to include logo support

### Frontend Changes

1. **Form Updates**
   - Added logo fields to `CompanyFormData` interface
   - Added logo upload section in Step 1 of registration
   - Integrated with existing multi-step form flow

2. **Upload Functionality**
   - File type validation (image/*)
   - File size validation (5MB max)
   - Real-time upload to Cloudinary
   - Preview functionality with remove option
   - Error handling with user-friendly messages

3. **UI Components**
   - Drag-and-drop styled upload area
   - File preview with thumbnail
   - Upload progress indicators
   - Remove/replace logo functionality

## 🔧 Technical Details

### File Structure
```
backend/
├── services/cloudinaryService.js    # Cloudinary integration
├── routes/company-registration.js    # Updated registration routes
└── models/Company.js                 # Updated schema

frontend/
└── src/components/Auth/CompanyRegistration.tsx  # Updated form
```

### Environment Variables Required
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### API Endpoints
- `POST /api/company/upload-logo` - Upload logo file
- `POST /api/company/create-payment-order` - Include logo data
- `POST /api/company/verify-payment` - Process registration with logo
- `POST /api/company/register` - Free plan registration with logo

### Validation Rules
- **File Types**: `image/jpeg`, `image/jpg`, `image/png`, `image/webp`
- **Max Size**: 5MB
- **Dimensions**: Auto-resized to 500x500px (maintained aspect ratio)
- **Storage**: Cloudinary with automatic optimization

## 🚀 Usage

### For Users
1. Navigate to company registration
2. Fill company information
3. **Optional**: Click "Choose Logo" to upload company logo
4. Complete registration process
5. Logo appears in company profile and branding

### For Developers
1. Configure Cloudinary environment variables
2. Ensure Cloudinary npm packages are installed
3. Test logo upload functionality
4. Verify logo appears in database and Cloudinary dashboard

## 🔍 Testing

### Test Cases
- ✅ Upload valid image files (JPG, PNG, WebP)
- ✅ Reject oversized files (>5MB)
- ✅ Reject non-image files
- ✅ Preview uploaded images
- ✅ Remove/replace logos
- ✅ Registration without logo (optional)
- ✅ Payment flow with logo data
- ✅ Free plan registration with logo

### Manual Testing Steps
1. Start backend server with Cloudinary configured
2. Start frontend development server
3. Navigate to company registration
4. Upload various file types and sizes
5. Complete registration with and without logos
6. Verify data in database and Cloudinary

## 🛠️ Troubleshooting

### Common Issues
- **Cloudinary not configured**: Logo upload will fail gracefully
- **File size exceeded**: Clear error message shown
- **Invalid file type**: Validation prevents upload
- **Network errors**: Retry mechanism with error messages

### Error Messages
- "Only image files are allowed"
- "Please upload an image smaller than 5MB"
- "Failed to upload logo. Please try again."

## 📈 Performance Considerations

- Images automatically optimized by Cloudinary
- Resized to 500x500px for consistent display
- Lazy loading implemented for logo previews
- Minimal impact on registration flow

## 🔒 Security

- File type validation on both frontend and backend
- Size limits prevent abuse
- Cloudinary handles secure storage
- No direct file system access

## 🎯 Future Enhancements

- Multiple logo sizes for different contexts
- Logo cropping interface
- Bulk logo updates for existing companies
- Logo versioning and history
- Integration with company branding throughout app

---

## ✅ Implementation Status

- ✅ Backend Cloudinary integration
- ✅ Database schema updates
- ✅ API route modifications
- ✅ Frontend upload component
- ✅ File validation and error handling
- ✅ Documentation and setup guide
- ✅ Testing verification

**Logo upload feature is fully implemented and ready for production use!** 🚀

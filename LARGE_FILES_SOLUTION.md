# Large File Upload Solution for Vercel

## Problem
Vercel has file upload limits (around 4.5MB for free tier) which prevents users from uploading large audio/video files for transcription.

## Solution
Implemented a **smart dual upload system**:

### Small Files (≤4MB) - Standard Upload
- Uses the original `/api/transcribe` endpoint
- Files go through Vercel's serverless function
- Fast and simple for small files

### Large Files (>4MB) - Direct Upload
- Uses presigned URLs to upload directly to Cloudflare R2 storage
- Bypasses Vercel's file size limits completely
- Three-step process:
  1. Get presigned URL from `/api/upload/presigned-url`
  2. Upload file directly to R2 using the presigned URL
  3. Confirm upload and start transcription via `/api/upload/confirm`

## New API Endpoints

### `/api/upload/presigned-url` (POST)
Generates a presigned URL for direct R2 upload.

**Request:**
```json
{
  "fileName": "audio.mp3",
  "fileType": "audio/mpeg", 
  "fileSize": 52428800
}
```

**Response:**
```json
{
  "presignedUrl": "https://...",
  "fileName": "userId/timestamp_audio.mp3",
  "publicUrl": "https://...",
  "expiresIn": 3600
}
```

### `/api/upload/confirm` (POST)
Confirms successful upload and starts transcription.

**Request:**
```json
{
  "fileName": "audio.mp3",
  "fileSize": 52428800,
  "fileType": "audio/mpeg",
  "fileUrl": "https://...",
  "fileKey": "userId/timestamp_audio.mp3",
  "language": "en",
  "quality": "standard",
  "speakerIdentification": false,
  "includeTimestamps": true,
  "filterProfanity": false,
  "autoPunctuation": true
}
```

## Frontend Changes

### Upload.js
- Automatically detects file size and chooses appropriate upload method
- Shows upload method indicator for each file
- Improved error handling and progress tracking
- Better user feedback

### Visual Indicators
- Files show "Standard" (green) or "Direct Upload" (blue) labels
- Info box explains the smart upload system
- Better error messages for oversized files

## Environment Variables Required
All existing R2 variables must be configured:
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID` 
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_PUBLIC_URL`

## Benefits
1. **Unlimited file size** (up to 500MB app limit)
2. **Reliable uploads** for large files
3. **Better user experience** with appropriate feedback
4. **Backward compatible** - small files still work as before
5. **Cost effective** - reduces Vercel function execution time

## Testing
Visit `/test-upload` to test both upload methods independently.

## Deployment Notes
- Requires `@aws-sdk/s3-request-presigner` package
- Updated `vercel.json` with new function configurations
- No changes needed to existing database or storage setup

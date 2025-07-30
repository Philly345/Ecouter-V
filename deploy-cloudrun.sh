#!/bin/bash

# Google Cloud Run Deployment Script
echo "🚀 Deploying to Google Cloud Run..."

# Set your project ID
PROJECT_ID="your-project-id"  # Replace with your actual project ID
SERVICE_NAME="transcription-app"
REGION="us-central1"

# Build and deploy
echo "📦 Building and deploying..."
gcloud run deploy $SERVICE_NAME \
  --source . \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --memory 2Gi \
  --timeout 3600 \
  --max-instances 10 \
  --set-env-vars "NODE_ENV=production" \
  --port 3000

echo "✅ Deployment complete!"
echo "🌐 Your app should be available at the URL shown above"

# 🔧 Chat with AI Setup Guide

## Problem
The chat is showing "Sorry, I encountered an error. Please try again" because the OpenRouter API key is not configured.

## Quick Fix

### Step 1: Get Your Free API Key
1. Go to **https://openrouter.ai/keys**
2. Sign up for a free account (they give you $5 free credits!)
3. Click "Create Key" and copy the generated key

### Step 2: Configure Your Environment
1. Open `.env.local` in your project root
2. Find the line: `OPENROUTER_API_KEY=your-openrouter-key-here`
3. Replace `your-openrouter-key-here` with your actual API key
4. Save the file

**Example:**
```bash
OPENROUTER_API_KEY=sk-or-v1-1234567890abcdef...
```

### Step 3: Restart Your Server
```bash
# Stop your development server (Ctrl+C)
# Then restart it
npm run dev
```

## ✅ What's Fixed

- **Better Error Handling**: Chat now provides helpful fallback responses when the API is unavailable
- **OpenRouter Integration**: Uses free models that work great for chat functionality
- **Markdown Formatting**: AI responses now show **bold** and *italic* text properly instead of asterisks

## 🆓 Free Models Available

The chat uses OpenRouter's free tier which includes:
- `openai/gpt-oss-20b:free` (currently used)
- `microsoft/wizardlm-2-8x22b:free`
- `google/gemma-7b-it:free`
- And many more!

## 🛠️ Troubleshooting

### Still getting errors?
1. **Check your API key**: Make sure it starts with `sk-or-v1-`
2. **Restart server**: Always restart after changing environment variables
3. **Check credits**: Log into OpenRouter to see if you have credits remaining
4. **Test the key**: Visit https://openrouter.ai/playground to test your key

### Error: "User not found"
This means the API key is invalid or not set. Follow steps 1-3 above.

### Error: "Rate limit reached"
The chat will now show a friendly message asking you to wait and try again.

## 🎉 Benefits

- **Free to use** with OpenRouter's generous free tier
- **Better formatting** with bold and italic text support
- **Helpful error messages** instead of generic failures
- **Fallback responses** when the service is temporarily unavailable

## 📞 Need Help?

- OpenRouter docs: https://openrouter.ai/docs
- OpenRouter Discord: Available on their website
- Free credits: $5 included with new accounts
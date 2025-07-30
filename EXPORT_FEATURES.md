# Export Features Documentation

## Overview
The transcript export system allows users to export their transcripts in multiple formats for various use cases.

## Available Export Formats

### 1. Text Export (.txt)
- **Format**: Plain text file
- **Contains**: 
  - File metadata (name, date, duration, language)
  - Full transcript
  - Timestamps (if available)
- **Use Case**: Simple text sharing, backup, or importing into other text editors

### 2. PDF Export (.pdf)
- **Format**: PDF document
- **Contains**:
  - Professional formatted document
  - File metadata header
  - Full transcript with proper pagination
  - Timestamps section (if available)
- **Use Case**: Professional reports, sharing with clients, archival purposes

### 3. DOCX Export (.docx)
- **Format**: Microsoft Word document
- **Contains**:
  - Structured document with headings
  - File metadata
  - Full transcript
  - Timestamps section (if available)
- **Use Case**: Further editing in Word, collaborative document editing

### 4. Notion Export
- **Format**: Notion page
- **Contains**:
  - Structured Notion page with headings
  - File metadata
  - Full transcript (chunked for Notion limits)
  - Timestamps (limited to 50 entries to avoid API limits)
- **Use Case**: Knowledge management, team collaboration, integration with Notion workflows

## How to Use

### Basic Export (TXT, PDF, DOCX)
1. Navigate to any transcript detail page
2. Click the "Export" button in the top right
3. Select your desired format from the dropdown
4. The file will automatically download to your default download folder

### Notion Export Setup
1. Create a Notion integration:
   - Go to https://notion.com/my-integrations
   - Click "New integration"
   - Give it a name and select your workspace
   - Copy the "Internal Integration Token"

2. Share a page with your integration (optional):
   - Go to the Notion page where you want to add the transcript
   - Click "Share" → "Invite"
   - Search for your integration name and invite it
   - Copy the page ID from the URL

3. Export to Notion:
   - Click "Export" → "Export to Notion"
   - Paste your integration token
   - Optionally add the page ID (leave blank to create a new page)
   - Click "Export"

## Technical Details

### PDF Generation
- Uses jsPDF library
- Automatic pagination
- Proper text wrapping
- Professional formatting

### DOCX Generation
- Uses docx library
- Structured document format
- Compatible with Microsoft Word and other word processors

### Notion Integration
- Uses official Notion API
- Handles text chunking for API limits
- Creates properly formatted Notion blocks
- Supports both new page creation and appending to existing pages

## Error Handling
- Authentication verification for all exports
- File ownership verification
- Proper error messages for failed exports
- Toast notifications for success/failure states

## Limitations
- Notion export limited to 50 timestamps to avoid API rate limits
- PDF export may have formatting limitations for very long transcripts
- Notion integration requires manual setup of integration token

## Security
- All exports require user authentication
- Users can only export their own files
- Notion tokens are not stored on the server
- All file access is verified before export

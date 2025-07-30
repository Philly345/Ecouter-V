import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { Client } from '@notionhq/client';
import { filesDB } from '../../../utils/database.js';
import { verifyToken, getTokenFromRequest } from '../../../utils/auth.js';
import { connectDB } from '../../../lib/mongodb.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const token = getTokenFromRequest(req);
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Find user in MongoDB
    const { db } = await connectDB();
    const user = await db.collection('users').findOne({ email: decoded.email });
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const { fileId, format, notionToken, notionPageId } = req.body;

    if (!fileId || !format) {
      return res.status(400).json({ error: 'File ID and format are required' });
    }

    // Get file details
    const file = filesDB.findById(fileId);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Verify user owns the file
    const userId = user.id || user._id.toString();
    if (file.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    switch (format) {
      case 'pdf':
        return await exportToPDF(req, res, file);
      case 'docx':
        return await exportToDocx(req, res, file);
      case 'notion':
        return await exportToNotion(req, res, file, notionToken, notionPageId);
      default:
        return res.status(400).json({ error: 'Invalid format' });
    }
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Export failed' });
  }
}

async function exportToPDF(req, res, file) {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - (margin * 2);
    
    // Title
    doc.setFontSize(20);
    doc.text('Transcript Export', margin, 30);
    
    // File info
    doc.setFontSize(12);
    doc.text(`File: ${file.name}`, margin, 50);
    doc.text(`Date: ${new Date(file.createdAt).toLocaleDateString()}`, margin, 65);
    doc.text(`Duration: ${formatDuration(file.duration)}`, margin, 80);
    doc.text(`Language: ${file.language || 'English'}`, margin, 95);
    
    // Transcript content
    doc.setFontSize(10);
    let yPosition = 120;
    
    if (file.transcript) {
      const lines = doc.splitTextToSize(file.transcript, maxWidth);
      
      lines.forEach((line) => {
        if (yPosition > 280) { // Near bottom of page
          doc.addPage();
          yPosition = 20;
        }
        doc.text(line, margin, yPosition);
        yPosition += 7;
      });
    }
    
    // If timestamps exist, add them on a new page
    if (file.timestamps && file.timestamps.length > 0) {
      doc.addPage();
      doc.setFontSize(16);
      doc.text('Timestamps', margin, 30);
      
      doc.setFontSize(10);
      yPosition = 50;
      
      file.timestamps.forEach((timestamp) => {
        if (yPosition > 280) {
          doc.addPage();
          yPosition = 20;
        }
        
        const timeStr = `[${formatTime(timestamp.start)} - ${formatTime(timestamp.end)}] ${timestamp.speaker || 'Speaker'}:`;
        doc.text(timeStr, margin, yPosition);
        yPosition += 7;
        
        const textLines = doc.splitTextToSize(timestamp.text, maxWidth - 10);
        textLines.forEach((line) => {
          if (yPosition > 280) {
            doc.addPage();
            yPosition = 20;
          }
          doc.text(line, margin + 10, yPosition);
          yPosition += 7;
        });
        yPosition += 3; // Extra space between timestamps
      });
    }
    
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${file.name}_transcript.pdf"`);
    res.send(pdfBuffer);
    
  } catch (error) {
    console.error('PDF export error:', error);
    throw error;
  }
}

async function exportToDocx(req, res, file) {
  try {
    const children = [];
    
    // Title
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Transcript Export',
            bold: true,
            size: 32,
          }),
        ],
      })
    );
    
    // File info
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `File: ${file.name}`,
            break: 1,
          }),
          new TextRun({
            text: `Date: ${new Date(file.createdAt).toLocaleDateString()}`,
            break: 1,
          }),
          new TextRun({
            text: `Duration: ${formatDuration(file.duration)}`,
            break: 1,
          }),
          new TextRun({
            text: `Language: ${file.language || 'English'}`,
            break: 1,
          }),
        ],
      })
    );
    
    // Transcript heading
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Full Transcript',
            bold: true,
            size: 24,
            break: 2,
          }),
        ],
      })
    );
    
    // Transcript content
    if (file.transcript) {
      const paragraphs = file.transcript.split('\n').filter(p => p.trim());
      paragraphs.forEach(paragraph => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: paragraph,
              }),
            ],
          })
        );
      });
    }
    
    // Timestamps section
    if (file.timestamps && file.timestamps.length > 0) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Timestamps',
              bold: true,
              size: 24,
              break: 2,
            }),
          ],
        })
      );
      
      file.timestamps.forEach((timestamp) => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `[${formatTime(timestamp.start)} - ${formatTime(timestamp.end)}] ${timestamp.speaker || 'Speaker'}:`,
                bold: true,
                break: 1,
              }),
            ],
          })
        );
        
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: timestamp.text,
              }),
            ],
          })
        );
      });
    }
    
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: children,
        },
      ],
    });
    
    const buffer = await Packer.toBuffer(doc);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${file.name}_transcript.docx"`);
    res.send(buffer);
    
  } catch (error) {
    console.error('DOCX export error:', error);
    throw error;
  }
}

async function exportToNotion(req, res, file, notionToken, notionPageId) {
  try {
    if (!notionToken) {
      return res.status(400).json({ error: 'Notion token is required' });
    }
    
    const notion = new Client({ auth: notionToken });
    
    // Create page content
    const children = [];
    
    // Title and metadata
    children.push({
      object: 'block',
      type: 'heading_1',
      heading_1: {
        rich_text: [{ text: { content: `Transcript: ${file.name}` } }],
      },
    });
    
    children.push({
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [
          { text: { content: `Date: ${new Date(file.createdAt).toLocaleDateString()}` } },
        ],
      },
    });
    
    children.push({
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [
          { text: { content: `Duration: ${formatDuration(file.duration)}` } },
        ],
      },
    });
    
    children.push({
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [
          { text: { content: `Language: ${file.language || 'English'}` } },
        ],
      },
    });
    
    // Full transcript section
    children.push({
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [{ text: { content: 'Full Transcript' } }],
      },
    });
    
    if (file.transcript) {
      // Split transcript into chunks (Notion has limits)
      const chunks = chunkText(file.transcript, 2000);
      chunks.forEach(chunk => {
        children.push({
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [{ text: { content: chunk } }],
          },
        });
      });
    }
    
    // Timestamps section
    if (file.timestamps && file.timestamps.length > 0) {
      children.push({
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [{ text: { content: 'Timestamps' } }],
        },
      });
      
      file.timestamps.slice(0, 50).forEach((timestamp) => { // Limit to avoid API limits
        children.push({
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [
              { 
                text: { 
                  content: `[${formatTime(timestamp.start)} - ${formatTime(timestamp.end)}] ${timestamp.speaker || 'Speaker'}: ` 
                },
                annotations: { bold: true }
              },
              { text: { content: timestamp.text } }
            ],
          },
        });
      });
    }
    
    let response;
    if (notionPageId) {
      // Add to existing page
      response = await notion.blocks.children.append({
        block_id: notionPageId,
        children: children,
      });
    } else {
      // Create new page
      response = await notion.pages.create({
        parent: { type: 'page_id', page_id: process.env.NOTION_PARENT_PAGE_ID || notionPageId },
        properties: {
          title: {
            title: [
              {
                text: {
                  content: `Transcript: ${file.name}`,
                },
              },
            ],
          },
        },
        children: children,
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Successfully exported to Notion',
      notionUrl: response.url || `https://notion.so/${response.id}` 
    });
    
  } catch (error) {
    console.error('Notion export error:', error);
    throw error;
  }
}

// Helper functions
function formatDuration(seconds) {
  if (!seconds) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatTime(milliseconds) {
  if (!milliseconds) return '0:00';
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function chunkText(text, maxLength) {
  const chunks = [];
  let currentChunk = '';
  const sentences = text.split(/[.!?]+/);
  
  sentences.forEach(sentence => {
    if ((currentChunk + sentence).length > maxLength && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += sentence + '.';
    }
  });
  
  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

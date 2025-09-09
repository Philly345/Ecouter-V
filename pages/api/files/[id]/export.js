import { verifyTokenString, getTokenFromRequest } from '../../../../utils/auth.js';
import { connectDB } from '../../../../lib/mongodb.js';
import { ObjectId } from 'mongodb';
import PDFDocument from 'pdfkit';
import { Document, Packer, Paragraph, TextRun } from 'docx';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const token = getTokenFromRequest(req);
    const decoded = verifyTokenString(token);
    
    if (!decoded) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id } = req.query;
    const { format, transcript, title } = req.body;

    if (!format || !transcript) {
      return res.status(400).json({ message: 'Format and transcript are required' });
    }

    // Get user ID from token
    const userId = decoded.userId;
    
    if (!userId) {
      return res.status(401).json({ message: 'Invalid token - missing user ID' });
    }

    // Verify file ownership
    const { db } = await connectDB();
    const file = await db.collection('files').findOne({ 
      _id: new ObjectId(id)
    });

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Check if user owns this file
    const fileUserIdString = typeof file.userId === 'object' ? file.userId.toString() : file.userId;
    if (fileUserIdString !== userId) {
      console.log('Export API - Access denied:', {
        fileUserIdString,
        userIdString: userId,
        match: false
      });
      return res.status(403).json({ message: 'Access denied' });
    }

    const fileName = title || file.originalName || 'transcript';
    const currentDate = new Date().toLocaleDateString();

    switch (format.toLowerCase()) {
      case 'pdf':
        return exportToPDF(res, transcript, fileName, currentDate);
      
      case 'docx':
        return exportToDOCX(res, transcript, fileName, currentDate);
      
      case 'txt':
        return exportToTXT(res, transcript, fileName);
      
      default:
        return res.status(400).json({ message: 'Unsupported format' });
    }

  } catch (error) {
    console.error('Export transcript error:', error);
    
    if (error.message?.includes('token') || error.message?.includes('auth')) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

function exportToPDF(res, transcript, fileName, currentDate) {
  const doc = new PDFDocument();
  
  // Set response headers
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}.pdf"`);
  
  // Pipe the PDF to the response
  doc.pipe(res);
  
  // Add title
  doc.fontSize(20).text(fileName, 50, 50);
  doc.fontSize(12).text(`Generated on ${currentDate}`, 50, 80);
  doc.moveDown(2);
  
  // Add transcript content
  doc.fontSize(11).text(transcript, 50, 120, {
    width: 500,
    align: 'left',
    lineGap: 5
  });
  
  // Finalize the PDF
  doc.end();
}

async function exportToDOCX(res, transcript, fileName, currentDate) {
  // Create document
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: fileName,
              bold: true,
              size: 32
            })
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Generated on ${currentDate}`,
              size: 20,
              color: "666666"
            })
          ]
        }),
        new Paragraph({
          children: [new TextRun({ text: "" })] // Empty line
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: transcript,
              size: 22
            })
          ]
        })
      ]
    }]
  });

  // Generate buffer
  const buffer = await Packer.toBuffer(doc);
  
  // Set response headers
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}.docx"`);
  
  // Send the buffer
  res.send(buffer);
}

function exportToTXT(res, transcript, fileName) {
  // Set response headers
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}.txt"`);
  
  // Send the transcript
  res.send(transcript);
}

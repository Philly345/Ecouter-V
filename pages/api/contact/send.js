import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, subject, category, message } = req.body;

  // Input validation
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'Please fill in all required fields' });
  }

  // Create a transporter using Gmail
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER, // Your Gmail address
      pass: process.env.GMAIL_APP_PASSWORD // Your App Password (not your regular Gmail password)
    }
  });

  try {
    // Send mail using Gmail
    const info = await transporter.sendMail({
      from: `"${name}" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER, // Sending to yourself
      replyTo: email,
      subject: `[Ecouter Contact] ${subject}${category ? ` (${category})` : ''}`,
      text: message,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">New Contact Form Submission</h2>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <p style="margin: 5px 0;"><strong>Name:</strong> ${name}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
            ${category ? `<p style="margin: 5px 0;"><strong>Category:</strong> ${category}</p>` : ''}
            <p style="margin: 5px 0;"><strong>Subject:</strong> ${subject}</p>
          </div>
          <div style="background-color: #fff; border: 1px solid #ddd; padding: 15px; border-radius: 5px;">
            <h3 style="margin-top: 0; color: #333;">Message:</h3>
            <p style="white-space: pre-line; line-height: 1.6;">${message}</p>
          </div>
          <p style="margin-top: 20px; color: #666; font-size: 12px;">
            This message was sent from the contact form on Ecouter Transcribe.
          </p>
        </div>
      `,
    });

    console.log('Message sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    
    return res.status(200).json({ 
      success: true,
      message: 'Message sent successfully!',
      previewUrl: nodemailer.getTestMessageUrl(info) // For testing
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({ 
      error: 'Failed to send message',
      details: error.message 
    });
  }
}

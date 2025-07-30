import { filesDB } from '../../../utils/database.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fileId, summary } = req.body;

    if (!fileId || !summary) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Update the file with the new summary
    filesDB.update(fileId, {
      summary: summary,
    });

    res.status(200).json({
      success: true,
      message: 'Summary updated for testing',
    });
  } catch (error) {
    console.error('Error updating summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

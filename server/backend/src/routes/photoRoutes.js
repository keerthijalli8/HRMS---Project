// backend/src/routes/photoRoutes.js
import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { readDecryptedPhoto } from '../services/cryptoService.js';
import { getDb } from '../db/connection.js';

const router = express.Router();

/**
 * Authenticated Decrypted Profile Thumbnail Retrieval
 * GET /api/photos/:filename
 */
router.get('/:filename', authenticate, (req, res) => {
  const { filename } = req.params;

  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return res.status(400).json({ error: 'Invalid photo filename' });
  }

  const db = getDb();
  const isHR = req.user.role === 'HR_ADMIN' || req.user.role === 'ADMIN' || req.user.role === 'MANAGER';

  if (!isHR) {
    const profileMatch = db.prepare(`
      SELECT id FROM employees 
      WHERE id = ? AND profile_thumbnail_path = ?
    `).get(req.user.employee_id, filename);

    if (!profileMatch) {
      return res.status(403).json({ error: 'Access denied. You do not have permission to view this biometric photo.' });
    }
  }

  try {
    const decryptedBuffer = readDecryptedPhoto(filename);
    if (!decryptedBuffer) {
      return res.status(404).json({ error: 'Photo not found in secure storage.' });
    }

    let contentType = 'image/jpeg';
    if (decryptedBuffer[0] === 0x89 && decryptedBuffer[1] === 0x50 && decryptedBuffer[2] === 0x4E && decryptedBuffer[3] === 0x47) {
      contentType = 'image/png';
    } else if (decryptedBuffer[0] === 0x52 && decryptedBuffer[1] === 0x49 && decryptedBuffer[2] === 0x46 && decryptedBuffer[3] === 0x46) {
      contentType = 'image/webp';
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.send(decryptedBuffer);
  } catch (err) {
    console.error('Error serving encrypted photo:', err);
    res.status(500).json({ error: 'Failed to decrypt biometric photo.' });
  }
});

export default router;

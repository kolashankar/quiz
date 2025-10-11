const express = require('express');
const axios = require('axios');
const { adminMiddleware } = require('../../middleware/auth/authMiddleware');
const { getPrisma } = require('../../config/database/prisma');

const router = express.Router();
router.use(adminMiddleware);

// Get notification history
router.get('/history', async (req, res) => {
  try {
    const prisma = getPrisma();
    const { limit = 50 } = req.query;

    const notifications = await prisma.notification.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: parseInt(limit)
    });

    res.json(notifications);
  } catch (error) {
    console.error('Get notification history error:', error);
    res.status(500).json({ error: 'Failed to fetch notification history' });
  }
});

// Send push notification
router.post('/send', async (req, res) => {
  try {
    const { title, body, data, targetUsers, examId } = req.body;

    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required' });
    }

    // Forward to main backend API which handles push notifications
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8001';
    
    try {
      const response = await axios.post(
        `${backendUrl}/api/admin/notifications/send`,
        {
          title,
          body,
          data,
          target_users: targetUsers,
          exam_id: examId
        },
        {
          headers: {
            'Authorization': req.headers.authorization
          }
        }
      );

      // Store notification in admin database
      const prisma = getPrisma();
      await prisma.notification.create({
        data: {
          title,
          body,
          data: data ? JSON.stringify(data) : null,
          targetUsers: targetUsers ? JSON.stringify(targetUsers) : null,
          examId,
          sentCount: response.data.sent_count || 0,
          status: response.data.success ? 'sent' : 'failed'
        }
      });

      res.json(response.data);
    } catch (apiError) {
      console.error('Backend API error:', apiError.message);
      res.status(500).json({ 
        error: 'Failed to send notification via backend API',
        details: apiError.message
      });
    }
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// Send test notification
router.post('/test', async (req, res) => {
  try {
    const { title, body } = req.body;

    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required' });
    }

    // Send test notification to current admin user
    res.json({
      success: true,
      message: 'Test notification created (in production, this would be sent to your device)',
      preview: {
        title,
        body
      }
    });
  } catch (error) {
    console.error('Test notification error:', error);
    res.status(500).json({ error: 'Failed to send test notification' });
  }
});

// Get users count by exam for targeting
router.get('/users-by-exam', async (req, res) => {
  try {
    // This would need to query the main backend
    // For now, return mock data
    res.json({
      message: 'User targeting by exam',
      exams: [
        { examId: 'upsc', name: 'UPSC', userCount: 0 },
        { examId: 'jee', name: 'JEE', userCount: 0 }
      ]
    });
  } catch (error) {
    console.error('Get users by exam error:', error);
    res.status(500).json({ error: 'Failed to fetch users by exam' });
  }
});

module.exports = router;

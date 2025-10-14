const express = require('express');
const axios = require('axios');
const nodemailer = require('nodemailer');
const { getPrisma } = require('../../config/database/prisma');
const { adminMiddleware } = require('../../middleware/auth/authMiddleware');

const router = express.Router();
router.use(adminMiddleware);

// Configure email transporter (sample credentials)
const createEmailTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER || 'admin@quizapp.com',
      pass: process.env.SMTP_PASS || 'sample_password_123'
    },
    tls: {
      rejectUnauthorized: false // For development only
    }
  });
};

// ===================
// ANNOUNCEMENTS
// ===================

// Create announcement
router.post('/announcements', async (req, res) => {
  try {
    const { title, content, type, targetUsers, examId, priority, expiresAt } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const prisma = getPrisma();

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        type: type || 'info',
        targetUsers: targetUsers ? JSON.stringify(targetUsers) : null,
        examId,
        priority: priority || 'normal',
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdBy: req.user.userId,
        isActive: true
      }
    });

    res.json({
      success: true,
      message: 'Announcement created successfully',
      announcement
    });
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({ error: 'Failed to create announcement' });
  }
});

// Get announcements
router.get('/announcements', async (req, res) => {
  try {
    const { isActive, limit = 50 } = req.query;
    const prisma = getPrisma();

    const whereClause = {};
    if (isActive !== undefined) {
      whereClause.isActive = isActive === 'true';
    }

    const announcements = await prisma.announcement.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      },
      take: parseInt(limit)
    });

    res.json({
      announcements,
      total: announcements.length
    });
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

// Update announcement
router.put('/announcements/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, type, isActive, priority, expiresAt } = req.body;

    const prisma = getPrisma();

    const updateData = {};
    if (title) updateData.title = title;
    if (content) updateData.content = content;
    if (type) updateData.type = type;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (priority) updateData.priority = priority;
    if (expiresAt) updateData.expiresAt = new Date(expiresAt);

    const announcement = await prisma.announcement.update({
      where: { id },
      data: updateData
    });

    res.json({
      success: true,
      message: 'Announcement updated',
      announcement
    });
  } catch (error) {
    console.error('Update announcement error:', error);
    res.status(500).json({ error: 'Failed to update announcement' });
  }
});

// Delete announcement
router.delete('/announcements/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const prisma = getPrisma();

    await prisma.announcement.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Announcement deleted'
    });
  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({ error: 'Failed to delete announcement' });
  }
});

// ===================
// EMAIL CAMPAIGNS
// ===================

// Create email campaign
router.post('/email-campaign', async (req, res) => {
  try {
    const { name, subject, htmlContent, textContent, targetUsers, examId, scheduledAt } = req.body;

    if (!name || !subject || !htmlContent) {
      return res.status(400).json({ error: 'Name, subject, and HTML content are required' });
    }

    const prisma = getPrisma();

    const campaign = await prisma.emailCampaign.create({
      data: {
        name,
        subject,
        htmlContent,
        textContent,
        targetUsers: targetUsers ? JSON.stringify(targetUsers) : null,
        examId,
        status: scheduledAt ? 'scheduled' : 'draft',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        createdBy: req.user.userId
      }
    });

    res.json({
      success: true,
      message: 'Email campaign created',
      campaign
    });
  } catch (error) {
    console.error('Create email campaign error:', error);
    res.status(500).json({ error: 'Failed to create email campaign' });
  }
});

// Get email campaigns
router.get('/email-campaigns', async (req, res) => {
  try {
    const { status, limit = 50 } = req.query;
    const prisma = getPrisma();

    const whereClause = {};
    if (status) {
      whereClause.status = status;
    }

    const campaigns = await prisma.emailCampaign.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      },
      take: parseInt(limit)
    });

    res.json({
      campaigns,
      total: campaigns.length
    });
  } catch (error) {
    console.error('Get email campaigns error:', error);
    res.status(500).json({ error: 'Failed to fetch email campaigns' });
  }
});

// Send email campaign
router.post('/email-campaign/:id/send', async (req, res) => {
  try {
    const { id } = req.params;
    const prisma = getPrisma();

    const campaign = await prisma.emailCampaign.findUnique({
      where: { id }
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (campaign.status === 'sent') {
      return res.status(400).json({ error: 'Campaign already sent' });
    }

    // Update status to sending
    await prisma.emailCampaign.update({
      where: { id },
      data: { status: 'sending' }
    });

    // Get target users from main backend
    try {
      const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8001';
      const usersResponse = await axios.get(`${backendUrl}/api/users`, {
        headers: {
          'Authorization': req.headers.authorization
        }
      });

      let targetEmails = [];
      
      if (campaign.targetUsers) {
        const targetUserIds = JSON.parse(campaign.targetUsers);
        targetEmails = usersResponse.data
          .filter(u => targetUserIds.includes(u._id || u.id))
          .map(u => u.email);
      } else {
        // Send to all users
        targetEmails = usersResponse.data.map(u => u.email);
      }

      // Send emails (in batches for better performance)
      const transporter = createEmailTransporter();
      let successCount = 0;
      let failureCount = 0;

      // Note: In production, use a proper email service like SendGrid, AWS SES, etc.
      // This is a sample implementation
      for (const email of targetEmails) {
        try {
          await transporter.sendMail({
            from: process.env.SMTP_FROM || '"Quiz App Admin" <admin@quizapp.com>',
            to: email,
            subject: campaign.subject,
            text: campaign.textContent || campaign.htmlContent.replace(/<[^>]*>/g, ''),
            html: campaign.htmlContent
          });
          successCount++;
        } catch (emailError) {
          console.error(`Failed to send to ${email}:`, emailError.message);
          failureCount++;
        }
      }

      // Update campaign status
      await prisma.emailCampaign.update({
        where: { id },
        data: {
          status: 'sent',
          sentAt: new Date(),
          recipientCount: targetEmails.length,
          successCount,
          failureCount
        }
      });

      res.json({
        success: true,
        message: `Email campaign sent: ${successCount} successful, ${failureCount} failed`,
        recipientCount: targetEmails.length,
        successCount,
        failureCount
      });

    } catch (apiError) {
      console.error('Failed to send campaign:', apiError.message);
      
      // Update campaign status to failed
      await prisma.emailCampaign.update({
        where: { id },
        data: { status: 'failed' }
      });

      res.status(500).json({
        error: 'Failed to send email campaign',
        details: apiError.message,
        note: 'Email service may not be configured. Please check SMTP settings in .env file.'
      });
    }

  } catch (error) {
    console.error('Send email campaign error:', error);
    res.status(500).json({ error: 'Failed to send email campaign' });
  }
});

// ===================
// SCHEDULED NOTIFICATIONS
// ===================

// Schedule notification
router.post('/schedule-notification', async (req, res) => {
  try {
    const { title, body, data, targetUsers, examId, scheduledAt } = req.body;

    if (!title || !body || !scheduledAt) {
      return res.status(400).json({ error: 'Title, body, and scheduledAt are required' });
    }

    const scheduledDate = new Date(scheduledAt);
    if (scheduledDate <= new Date()) {
      return res.status(400).json({ error: 'Scheduled time must be in the future' });
    }

    const prisma = getPrisma();

    const scheduled = await prisma.scheduledNotification.create({
      data: {
        title,
        body,
        data: data ? JSON.stringify(data) : null,
        targetUsers: targetUsers ? JSON.stringify(targetUsers) : null,
        examId,
        scheduledAt: scheduledDate,
        status: 'scheduled',
        createdBy: req.user.userId
      }
    });

    res.json({
      success: true,
      message: 'Notification scheduled successfully',
      scheduled
    });
  } catch (error) {
    console.error('Schedule notification error:', error);
    res.status(500).json({ error: 'Failed to schedule notification' });
  }
});

// Get scheduled notifications
router.get('/scheduled-notifications', async (req, res) => {
  try {
    const { status = 'scheduled', limit = 50 } = req.query;
    const prisma = getPrisma();

    const whereClause = status !== 'all' ? { status } : {};

    const scheduled = await prisma.scheduledNotification.findMany({
      where: whereClause,
      orderBy: {
        scheduledAt: 'asc'
      },
      take: parseInt(limit)
    });

    res.json({
      scheduled,
      total: scheduled.length
    });
  } catch (error) {
    console.error('Get scheduled notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch scheduled notifications' });
  }
});

// Cancel scheduled notification
router.delete('/scheduled-notifications/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const prisma = getPrisma();

    const notification = await prisma.scheduledNotification.findUnique({
      where: { id }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Scheduled notification not found' });
    }

    if (notification.status === 'sent') {
      return res.status(400).json({ error: 'Cannot cancel sent notification' });
    }

    await prisma.scheduledNotification.update({
      where: { id },
      data: { status: 'cancelled' }
    });

    res.json({
      success: true,
      message: 'Scheduled notification cancelled'
    });
  } catch (error) {
    console.error('Cancel scheduled notification error:', error);
    res.status(500).json({ error: 'Failed to cancel scheduled notification' });
  }
});

// Process scheduled notifications (this would be called by a cron job)
router.post('/process-scheduled', async (req, res) => {
  try {
    const prisma = getPrisma();

    // Get notifications that are due
    const dueNotifications = await prisma.scheduledNotification.findMany({
      where: {
        status: 'scheduled',
        scheduledAt: {
          lte: new Date()
        }
      }
    });

    if (dueNotifications.length === 0) {
      return res.json({
        success: true,
        message: 'No notifications due',
        processed: 0
      });
    }

    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8001';
    let successCount = 0;
    let failureCount = 0;

    // Send each due notification
    for (const notification of dueNotifications) {
      try {
        const response = await axios.post(
          `${backendUrl}/api/admin/notifications/send`,
          {
            title: notification.title,
            body: notification.body,
            data: notification.data ? JSON.parse(notification.data) : null,
            target_users: notification.targetUsers ? JSON.parse(notification.targetUsers) : null,
            exam_id: notification.examId
          },
          {
            headers: {
              'Authorization': req.headers.authorization
            }
          }
        );

        // Update notification status
        await prisma.scheduledNotification.update({
          where: { id: notification.id },
          data: {
            status: 'sent',
            sentAt: new Date(),
            sentCount: response.data.sent_count || 0
          }
        });

        successCount++;
      } catch (error) {
        console.error(`Failed to send scheduled notification ${notification.id}:`, error.message);
        
        // Update to failed status
        await prisma.scheduledNotification.update({
          where: { id: notification.id },
          data: { status: 'failed' }
        });

        failureCount++;
      }
    }

    res.json({
      success: true,
      message: `Processed ${dueNotifications.length} notifications: ${successCount} successful, ${failureCount} failed`,
      processed: dueNotifications.length,
      successCount,
      failureCount
    });
  } catch (error) {
    console.error('Process scheduled notifications error:', error);
    res.status(500).json({ error: 'Failed to process scheduled notifications' });
  }
});

// ===================
// PUSH NOTIFICATIONS (Enhanced from existing)
// ===================

// Get notification history
router.get('/notifications/history', async (req, res) => {
  try {
    const prisma = getPrisma();
    const { limit = 50 } = req.query;

    const notifications = await prisma.notification.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: parseInt(limit)
    });

    res.json({
      notifications,
      total: notifications.length
    });
  } catch (error) {
    console.error('Get notification history error:', error);
    res.status(500).json({ error: 'Failed to fetch notification history' });
  }
});

// Send push notification (immediate)
router.post('/notifications/send', async (req, res) => {
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

// Get communication statistics
router.get('/statistics', async (req, res) => {
  try {
    const prisma = getPrisma();

    const [
      totalNotifications,
      sentNotifications,
      scheduledNotifications,
      totalAnnouncements,
      activeAnnouncements,
      totalCampaigns,
      sentCampaigns
    ] = await Promise.all([
      prisma.notification.count(),
      prisma.notification.count({ where: { status: 'sent' } }),
      prisma.scheduledNotification.count({ where: { status: 'scheduled' } }),
      prisma.announcement.count(),
      prisma.announcement.count({ where: { isActive: true } }),
      prisma.emailCampaign.count(),
      prisma.emailCampaign.count({ where: { status: 'sent' } })
    ]);

    res.json({
      notifications: {
        total: totalNotifications,
        sent: sentNotifications,
        scheduled: scheduledNotifications
      },
      announcements: {
        total: totalAnnouncements,
        active: activeAnnouncements
      },
      emailCampaigns: {
        total: totalCampaigns,
        sent: sentCampaigns
      }
    });
  } catch (error) {
    console.error('Communication statistics error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;

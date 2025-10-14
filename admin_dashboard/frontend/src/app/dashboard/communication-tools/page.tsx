'use client';

import { useState, useEffect } from 'react';
import { api } from '@/services/auth/authService';
import { Spinner } from '@/components/ui/common/Spinner';
import { 
  MegaphoneIcon,
  EnvelopeIcon,
  BellIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

export default function CommunicationToolsPage() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'announcements' | 'emails' | 'notifications' | 'scheduled'>('announcements');
  
  // Announcements state
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    type: 'info',
    priority: 'normal',
    expiresAt: ''
  });
  
  // Email campaigns state
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [emailForm, setEmailForm] = useState({
    name: '',
    subject: '',
    htmlContent: '',
    scheduledAt: ''
  });
  
  // Notifications state
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    body: ''
  });
  
  // Scheduled notifications state
  const [scheduledNotifications, setScheduledNotifications] = useState<any[]>([]);
  const [scheduleForm, setScheduleForm] = useState({
    title: '',
    body: '',
    scheduledAt: ''
  });
  
  const [stats, setStats] = useState<any>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchStats();
    if (activeTab === 'announcements') fetchAnnouncements();
    if (activeTab === 'emails') fetchCampaigns();
    if (activeTab === 'scheduled') fetchScheduledNotifications();
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/communication/statistics');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/communication/announcements');
      setAnnouncements(response.data.announcements || []);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/communication/email-campaigns');
      setCampaigns(response.data.campaigns || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchScheduledNotifications = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/communication/scheduled-notifications');
      setScheduledNotifications(response.data.scheduled || []);
    } catch (error) {
      console.error('Error fetching scheduled notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const createAnnouncement = async () => {
    if (!announcementForm.title || !announcementForm.content) {
      setMessage({ type: 'error', text: 'Title and content are required' });
      return;
    }

    setLoading(true);
    try {
      await api.post('/admin/communication/announcements', announcementForm);
      setMessage({ type: 'success', text: 'Announcement created successfully' });
      setAnnouncementForm({ title: '', content: '', type: 'info', priority: 'normal', expiresAt: '' });
      fetchAnnouncements();
      fetchStats();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to create announcement' });
    } finally {
      setLoading(false);
    }
  };

  const createEmailCampaign = async () => {
    if (!emailForm.name || !emailForm.subject || !emailForm.htmlContent) {
      setMessage({ type: 'error', text: 'Name, subject, and content are required' });
      return;
    }

    setLoading(true);
    try {
      await api.post('/admin/communication/email-campaign', emailForm);
      setMessage({ type: 'success', text: 'Email campaign created successfully' });
      setEmailForm({ name: '', subject: '', htmlContent: '', scheduledAt: '' });
      fetchCampaigns();
      fetchStats();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to create campaign' });
    } finally {
      setLoading(false);
    }
  };

  const sendNotification = async () => {
    if (!notificationForm.title || !notificationForm.body) {
      setMessage({ type: 'error', text: 'Title and body are required' });
      return;
    }

    setLoading(true);
    try {
      await api.post('/admin/communication/notifications/send', notificationForm);
      setMessage({ type: 'success', text: 'Notification sent successfully' });
      setNotificationForm({ title: '', body: '' });
      fetchStats();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to send notification' });
    } finally {
      setLoading(false);
    }
  };

  const scheduleNotification = async () => {
    if (!scheduleForm.title || !scheduleForm.body || !scheduleForm.scheduledAt) {
      setMessage({ type: 'error', text: 'All fields are required' });
      return;
    }

    setLoading(true);
    try {
      await api.post('/admin/communication/schedule-notification', scheduleForm);
      setMessage({ type: 'success', text: 'Notification scheduled successfully' });
      setScheduleForm({ title: '', body: '', scheduledAt: '' });
      fetchScheduledNotifications();
      fetchStats();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to schedule notification' });
    } finally {
      setLoading(false);
    }
  };

  const sendCampaign = async (id: string) => {
    if (!confirm('Are you sure you want to send this email campaign to all users?')) return;

    setLoading(true);
    try {
      const response = await api.post(`/admin/communication/email-campaign/${id}/send`);
      setMessage({ type: 'success', text: response.data.message });
      fetchCampaigns();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to send campaign' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Communication Tools</h1>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Announcements</p>
            <p className="text-2xl font-bold">{stats.announcements?.total || 0}</p>
            <p className="text-xs text-green-600">Active: {stats.announcements?.active || 0}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Email Campaigns</p>
            <p className="text-2xl font-bold">{stats.emailCampaigns?.total || 0}</p>
            <p className="text-xs text-green-600">Sent: {stats.emailCampaigns?.sent || 0}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Notifications</p>
            <p className="text-2xl font-bold">{stats.notifications?.total || 0}</p>
            <p className="text-xs text-green-600">Sent: {stats.notifications?.sent || 0}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Scheduled</p>
            <p className="text-2xl font-bold text-blue-600">{stats.notifications?.scheduled || 0}</p>
          </div>
        </div>
      )}

      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="card">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6 pt-6" aria-label="Tabs">
            {[
              { id: 'announcements', name: 'Announcements', icon: MegaphoneIcon },
              { id: 'emails', name: 'Email Campaigns', icon: EnvelopeIcon },
              { id: 'notifications', name: 'Push Notifications', icon: BellIcon },
              { id: 'scheduled', name: 'Scheduled', icon: ClockIcon },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500'
                  } flex items-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Announcements Tab */}
          {activeTab === 'announcements' && (
            <div className="space-y-6">
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-4">
                <h3 className="font-medium">Create New Announcement</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Title"
                    value={announcementForm.title}
                    onChange={(e) => setAnnouncementForm({...announcementForm, title: e.target.value})}
                    className="input"
                  />
                  <select
                    value={announcementForm.type}
                    onChange={(e) => setAnnouncementForm({...announcementForm, type: e.target.value})}
                    className="input"
                  >
                    <option value="info">Info</option>
                    <option value="success">Success</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                  </select>
                  <select
                    value={announcementForm.priority}
                    onChange={(e) => setAnnouncementForm({...announcementForm, priority: e.target.value})}
                    className="input"
                  >
                    <option value="low">Low Priority</option>
                    <option value="normal">Normal Priority</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent</option>
                  </select>
                  <input
                    type="datetime-local"
                    value={announcementForm.expiresAt}
                    onChange={(e) => setAnnouncementForm({...announcementForm, expiresAt: e.target.value})}
                    className="input"
                    placeholder="Expires at (optional)"
                  />
                </div>
                <textarea
                  placeholder="Content"
                  value={announcementForm.content}
                  onChange={(e) => setAnnouncementForm({...announcementForm, content: e.target.value})}
                  className="input"
                  rows={4}
                />
                <button onClick={createAnnouncement} disabled={loading} className="btn-primary">
                  {loading ? <Spinner size="sm" /> : 'Create Announcement'}
                </button>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium">Recent Announcements</h3>
                {announcements.map((ann: any) => (
                  <div key={ann.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium">{ann.title}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{ann.content}</p>
                        <div className="flex gap-2 mt-2">
                          <span className={`badge badge-${ann.type}`}>{ann.type}</span>
                          <span className="badge badge-secondary">{ann.priority}</span>
                          {ann.isActive && <span className="badge badge-success">Active</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Email Campaigns Tab */}
          {activeTab === 'emails' && (
            <div className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  ℹ️ Email service is configured with sample SMTP credentials. Update .env file with your actual SMTP settings for production use.
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-4">
                <h3 className="font-medium">Create Email Campaign</h3>
                <input
                  type="text"
                  placeholder="Campaign Name"
                  value={emailForm.name}
                  onChange={(e) => setEmailForm({...emailForm, name: e.target.value})}
                  className="input"
                />
                <input
                  type="text"
                  placeholder="Email Subject"
                  value={emailForm.subject}
                  onChange={(e) => setEmailForm({...emailForm, subject: e.target.value})}
                  className="input"
                />
                <textarea
                  placeholder="HTML Content"
                  value={emailForm.htmlContent}
                  onChange={(e) => setEmailForm({...emailForm, htmlContent: e.target.value})}
                  className="input"
                  rows={6}
                />
                <input
                  type="datetime-local"
                  value={emailForm.scheduledAt}
                  onChange={(e) => setEmailForm({...emailForm, scheduledAt: e.target.value})}
                  className="input"
                  placeholder="Schedule for later (optional)"
                />
                <button onClick={createEmailCampaign} disabled={loading} className="btn-primary">
                  {loading ? <Spinner size="sm" /> : 'Create Campaign'}
                </button>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium">Campaigns</h3>
                {campaigns.map((camp: any) => (
                  <div key={camp.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{camp.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Subject: {camp.subject}</p>
                        <div className="flex gap-2 mt-2">
                          <span className={`badge badge-${camp.status === 'sent' ? 'success' : camp.status === 'draft' ? 'secondary' : 'warning'}`}>
                            {camp.status}
                          </span>
                          {camp.status === 'sent' && (
                            <span className="text-xs text-gray-500">
                              Sent: {camp.successCount}/{camp.recipientCount}
                            </span>
                          )}
                        </div>
                      </div>
                      {camp.status === 'draft' && (
                        <button onClick={() => sendCampaign(camp.id)} className="btn-primary text-xs">
                          Send Now
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Push Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-4">
                <h3 className="font-medium">Send Push Notification</h3>
                <input
                  type="text"
                  placeholder="Title"
                  value={notificationForm.title}
                  onChange={(e) => setNotificationForm({...notificationForm, title: e.target.value})}
                  className="input"
                />
                <textarea
                  placeholder="Body"
                  value={notificationForm.body}
                  onChange={(e) => setNotificationForm({...notificationForm, body: e.target.value})}
                  className="input"
                  rows={3}
                />
                <button onClick={sendNotification} disabled={loading} className="btn-primary">
                  {loading ? <Spinner size="sm" /> : 'Send Notification'}
                </button>
              </div>
            </div>
          )}

          {/* Scheduled Tab */}
          {activeTab === 'scheduled' && (
            <div className="space-y-6">
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-4">
                <h3 className="font-medium">Schedule Notification</h3>
                <input
                  type="text"
                  placeholder="Title"
                  value={scheduleForm.title}
                  onChange={(e) => setScheduleForm({...scheduleForm, title: e.target.value})}
                  className="input"
                />
                <textarea
                  placeholder="Body"
                  value={scheduleForm.body}
                  onChange={(e) => setScheduleForm({...scheduleForm, body: e.target.value})}
                  className="input"
                  rows={3}
                />
                <input
                  type="datetime-local"
                  value={scheduleForm.scheduledAt}
                  onChange={(e) => setScheduleForm({...scheduleForm, scheduledAt: e.target.value})}
                  className="input"
                  required
                />
                <button onClick={scheduleNotification} disabled={loading} className="btn-primary">
                  {loading ? <Spinner size="sm" /> : 'Schedule Notification'}
                </button>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium">Scheduled Notifications</h3>
                {scheduledNotifications.map((sched: any) => (
                  <div key={sched.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h4 className="font-medium">{sched.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{sched.body}</p>
                    <div className="flex gap-2 mt-2 text-xs">
                      <span className={`badge badge-${sched.status === 'sent' ? 'success' : 'warning'}`}>
                        {sched.status}
                      </span>
                      <span className="text-gray-500">
                        {sched.status === 'scheduled' ? 'Scheduled for' : 'Sent at'}: {new Date(sched.status === 'scheduled' ? sched.scheduledAt : sched.sentAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
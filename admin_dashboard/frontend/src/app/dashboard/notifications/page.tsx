'use client';

import { useState, useEffect } from 'react';
import { BellIcon, PaperAirplaneIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { Modal } from '@/components/ui/common/Modal';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import axios from 'axios';

interface Notification {
  id: string;
  title: string;
  body: string;
  data?: any;
  targetUsers?: string[];
  examId?: string;
  sentCount: number;
  status: string;
  createdAt: string;
}

interface Exam {
  id: string;
  name: string;
}

interface SendNotification {
  title: string;
  body: string;
  examId?: string;
  targetType: 'all' | 'exam';
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sending, setSending] = useState(false);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<SendNotification>({
    defaultValues: {
      targetType: 'all'
    }
  });

  const targetType = watch('targetType');

  useEffect(() => {
    fetchNotifications();
    fetchExams();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/notifications/history`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications(response.data);
    } catch (error: any) {
      toast.error('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  const fetchExams = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/exams`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setExams(response.data);
    } catch (error: any) {
      toast.error('Failed to fetch exams');
    }
  };

  const handleSendNotification = () => {
    reset({ title: '', body: '', examId: '', targetType: 'all' });
    setIsModalOpen(true);
  };

  const onSubmit = async (data: SendNotification) => {
    setSending(true);
    try {
      const token = localStorage.getItem('token');
      const payload: any = {
        title: data.title,
        body: data.body,
      };

      if (data.targetType === 'exam' && data.examId) {
        payload.examId = data.examId;
      }

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/notifications/send`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success(`Notification sent to ${response.data.sent_count} users!`);
      } else {
        toast.error(response.data.message || 'Failed to send notification');
      }
      
      setIsModalOpen(false);
      fetchNotifications();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/notifications/test`,
        {
          title: 'Test Notification',
          body: 'This is a test notification from admin panel'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Test notification sent!');
    } catch (error: any) {
      toast.error('Failed to send test notification');
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Push Notifications
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Send targeted push notifications to users
        </p>
      </div>

      <div className="mb-6 flex gap-3">
        <button
          onClick={handleSendNotification}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <PaperAirplaneIcon className="w-5 h-5 mr-2" />
          Send Notification
        </button>
        <button
          onClick={handleTestNotification}
          className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
        >
          <BellIcon className="w-5 h-5 mr-2" />
          Send Test
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Sent</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {notifications.reduce((sum, n) => sum + n.sentCount, 0)}
              </p>
            </div>
            <BellIcon className="w-12 h-12 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Campaigns</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {notifications.length}
              </p>
            </div>
            <UserGroupIcon className="w-12 h-12 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {notifications.length > 0 
                  ? Math.round((notifications.filter(n => n.status === 'sent').length / notifications.length) * 100)
                  : 0}%
              </p>
            </div>
            <PaperAirplaneIcon className="w-12 h-12 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Notification History */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Notification History
          </h2>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : notifications.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {notifications.map((notification) => (
              <div key={notification.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {notification.title}
                      </h3>
                      <span className={`text-xs px-2 py-1 rounded ${
                        notification.status === 'sent'
                          ? 'bg-green-100 text-green-700'
                          : notification.status === 'failed'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {notification.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {notification.body}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Sent to {notification.sentCount} users</span>
                      <span>•</span>
                      <span>{new Date(notification.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            No notifications sent yet. Send your first notification!
          </div>
        )}
      </div>

      {/* Send Notification Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Send Push Notification"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Target Audience <span className="text-red-500">*</span>
            </label>
            <select
              {...register('targetType', { required: true })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Users</option>
              <option value="exam">Users by Exam</option>
            </select>
          </div>

          {targetType === 'exam' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Exam <span className="text-red-500">*</span>
              </label>
              <select
                {...register('examId', { required: targetType === 'exam' })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select Exam</option>
                {exams.map((exam) => (
                  <option key={exam.id} value={exam.id}>
                    {exam.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('title', { required: 'Title is required' })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Notification title"
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register('body', { required: 'Message is required' })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Notification message"
            />
            {errors.body && (
              <p className="text-red-500 text-sm mt-1">{errors.body.message}</p>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              disabled={sending}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center"
            >
              {sending ? (
                <>Sending...</>
              ) : (
                <>
                  <PaperAirplaneIcon className="w-4 h-4 mr-2" />
                  Send Notification
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

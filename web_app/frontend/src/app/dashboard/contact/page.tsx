'use client';

import React, { useState } from 'react';
import { Card, Button, Input } from '@/components/common';
import toast from 'react-hot-toast';
import emailjs from '@emailjs/browser';
import {
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';

// EmailJS Configuration (You can update these with your EmailJS credentials)
const EMAILJS_SERVICE_ID = 'service_xxxxxxx'; // Replace with your service ID
const EMAILJS_TEMPLATE_ID = 'template_xxxxxxx'; // Replace with your template ID
const EMAILJS_PUBLIC_KEY = 'xxxxxxxxxxxxxxxxxxx'; // Replace with your public key

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast.error('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    
    try {
      // Send email using EmailJS
      const templateParams = {
        from_name: formData.name,
        from_email: formData.email,
        subject: formData.subject,
        message: formData.message,
        to_name: 'Quiz App Support Team',
      };

      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams,
        EMAILJS_PUBLIC_KEY
      );

      toast.success('Message sent successfully! We\'ll get back to you soon.');
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
      });
    } catch (error) {
      console.error('EmailJS Error:', error);
      toast.error('Failed to send message. Please try again or contact us directly at support@genuis.com');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">Contact Us</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Form */}
        <div className="lg:col-span-2">
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Send us a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  type="text"
                  name="name"
                  label="Name"
                  placeholder="Your name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <Input
                  type="email"
                  name="email"
                  label="Email"
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <Input
                  type="text"
                  name="subject"
                  label="Subject"
                  placeholder="What is this regarding?"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  name="message"
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  placeholder="Tell us more about your inquiry..."
                  value={formData.message}
                  onChange={handleChange}
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center space-x-2"
              >
                <PaperAirplaneIcon className="w-5 h-5" />
                <span>{submitting ? 'Sending...' : 'Send Message'}</span>
              </Button>
            </form>
          </Card>
        </div>

        {/* Contact Information */}
        <div className="space-y-6">
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Get in Touch</h2>
            <p className="text-gray-600 mb-6">
              Have questions or feedback? We&apos;d love to hear from you. Reach out to us using the form or contact information below.
            </p>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <EnvelopeIcon className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <div>
                  <div className="font-medium text-gray-900">Email</div>
                  <div className="text-sm text-gray-600">support@genuis.com</div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                    <PhoneIcon className="w-5 h-5 text-success" />
                  </div>
                </div>
                <div>
                  <div className="font-medium text-gray-900">Phone</div>
                  <div className="text-sm text-gray-600">+91 1234567890</div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
                    <MapPinIcon className="w-5 h-5 text-info" />
                  </div>
                </div>
                <div>
                  <div className="font-medium text-gray-900">Office</div>
                  <div className="text-sm text-gray-600">
                    Hyderabad, Telangana<br />
                    India - 500001
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold text-gray-900 mb-3">Business Hours</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Monday - Friday</span>
                <span className="font-medium text-gray-900">9:00 AM - 6:00 PM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Saturday</span>
                <span className="font-medium text-gray-900">10:00 AM - 4:00 PM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Sunday</span>
                <span className="font-medium text-gray-900">Closed</span>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-r from-primary to-secondary text-white">
            <h3 className="font-semibold mb-2">Need Immediate Help?</h3>
            <p className="text-sm text-white/90 mb-4">
              Check out our FAQ section or browse through our help documentation for quick answers.
            </p>
            <button className="w-full px-4 py-2 bg-white text-primary rounded-lg font-medium hover:bg-gray-100 transition">
              Visit Help Center
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
}

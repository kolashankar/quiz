'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/auth-service';
import { Button, Input, Card } from '@/components/common';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const router = useRouter();

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.forgotPassword(email);
      setResetCode(response.reset_code || '');
      toast.success('Reset code sent to your email!');
      // Navigate to reset password with email
      router.push(`/auth/reset-password?email=${encodeURIComponent(email)}`);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-secondary/5 to-primary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Forgot Password?</h1>
          <p className="text-gray-600">Enter your email to receive a reset code</p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <Input
              type="email"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              autoComplete="email"
              required
            />

            {resetCode && (
              <div className="bg-info/10 border border-info rounded-lg p-4">
                <p className="text-sm font-medium text-info mb-1">Your Reset Code:</p>
                <p className="text-2xl font-bold text-info text-center">{resetCode}</p>
                <p className="text-xs text-gray-600 mt-2 text-center">
                  Copy this code and use it on the reset password page
                </p>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="large"
              className="w-full"
              isLoading={loading}
            >
              Send Reset Code
            </Button>

            <div className="text-center">
              <Link
                href="/auth/login"
                className="text-sm text-primary hover:text-primary-dark font-medium"
              >
                Back to Login
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/lib/auth-service';
import { Button, Input, Card } from '@/components/common';
import toast from 'react-hot-toast';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !resetCode || !newPassword || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword(email, resetCode, newPassword);
      toast.success('Password reset successful!');
      router.push('/auth/login');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-secondary/5 to-primary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Reset Password</h1>
          <p className="text-gray-600">Enter the code and create a new password</p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleResetPassword} className="space-y-4">
            <Input
              type="email"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              autoComplete="email"
              required
            />

            <Input
              type="text"
              label="Reset Code"
              value={resetCode}
              onChange={(e) => setResetCode(e.target.value)}
              placeholder="Enter 6-digit reset code"
              maxLength={6}
              required
            />
            
            <Input
              type="password"
              label="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Create a new password"
              autoComplete="new-password"
              required
            />

            <Input
              type="password"
              label="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your new password"
              autoComplete="new-password"
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="large"
              className="w-full"
              isLoading={loading}
            >
              Reset Password
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

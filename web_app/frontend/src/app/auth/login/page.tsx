'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Input, Card } from '@/components/common';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await login({ email, password });
      toast.success('Login successful!');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-secondary/5 to-primary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome Back!</h1>
          <p className="text-gray-600">Sign in to continue your learning journey</p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleLogin} className="space-y-4">
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
              type="password"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="large"
              className="w-full"
              isLoading={loading}
            >
              Sign In
            </Button>

            <div className="text-center">
              <Link
                href="/auth/forgot-password"
                className="text-sm text-primary hover:text-primary-dark font-medium"
              >
                Forgot Password?
              </Link>
            </div>
          </form>
        </Card>

        <div className="text-center mt-6">
          <span className="text-gray-600">Don&apos;t have an account? </span>
          <Link
            href="/auth/signup"
            className="text-primary hover:text-primary-dark font-semibold"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}

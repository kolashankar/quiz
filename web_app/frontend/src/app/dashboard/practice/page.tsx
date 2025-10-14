'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Loading from '@/components/common/Loading';

export default function PracticePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to practice start page
    router.push('/dashboard/practice/start');
  }, [router]);

  return <Loading />;
}

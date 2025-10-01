'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function SignOutHandler() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Listen for storage events (in case user signs out in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'signout' && e.newValue === 'true') {
        // Clear the signout flag
        localStorage.removeItem('signout');
        // Redirect to home
        router.push('/');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [router]);

  return null;
}

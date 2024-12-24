'use client';

import { useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import UserList from '@/components/users/UserList';

export default function UsersPage() {
  const [user] = useAuthState(auth);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-600">Silakan login untuk melihat daftar pengguna</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Daftar Pengguna dan Dompet</h1>
        <UserList currentUserId={user.uid} />
      </div>
    </div>
  );
} 
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { Bell, Menu, X, LogOut, User, Users, Wallet, MessageSquare } from 'lucide-react';
import NotificationPanel from './notification/NotificationPanel';

export default function Navbar() {
  const [user] = useAuthState(auth);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const menuItems = [
    { href: '/events', label: 'Events' },
    { href: '/profile', label: 'Profil', authRequired: true },
    { href: '/users', label: 'Pengguna', authRequired: true },
  ];

  return (
    <nav className="bg-white shadow-sm fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo dan Menu Desktop */}
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-purple-600">
              YR Music
            </Link>
            
            <div className="hidden md:flex items-center ml-10 space-x-8">
              {menuItems.map((item) => (
                (!item.authRequired || user) && (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-gray-600 hover:text-purple-600"
                  >
                    <span>{item.label}</span>
                  </Link>
                )
              ))}
            </div>
          </div>

          {/* Menu User Desktop */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <Link
                  href="/profile#wallet"
                  className="p-2 text-gray-600 hover:text-purple-600 rounded-full hover:bg-gray-100"
                  title="Wallet"
                >
                  <Wallet size={20} />
                </Link>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 text-gray-600 hover:text-purple-600 rounded-full hover:bg-gray-100"
                >
                  <Bell size={20} />
                </button>
                <div className="relative">
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center space-x-2 text-gray-600 hover:text-purple-600"
                  >
                    <User size={20} />
                    <span>{user.displayName || 'User'}</span>
                  </button>
                  
                  {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2">
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-gray-700 hover:bg-purple-50"
                      >
                        Profil
                      </Link>
                      <Link
                        href="/users"
                        className="block px-4 py-2 text-gray-700 hover:bg-purple-50"
                      >
                        Daftar Pengguna
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-gray-700 hover:bg-purple-50"
                      >
                        Keluar
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link
                href="/login"
                className="text-purple-600 hover:text-purple-700"
              >
                Login
              </Link>
            )}
          </div>

          {/* Menu Mobile */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 hover:text-purple-600"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Menu Mobile Panel */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white border-t shadow-lg">
            <div className="p-4">
              {user ? (
                <>
                  <div className="flex items-center gap-4 py-2 px-2">
                    <Link
                      href="/profile#wallet"
                      className="text-gray-600 hover:text-purple-600"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Wallet size={20} />
                    </Link>
                  </div>
                  <button
                    onClick={() => {
                      setShowNotifications(!showNotifications);
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left py-2 text-gray-600 hover:text-purple-600"
                  >
                    Notifikasi
                  </button>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left py-2 text-gray-600 hover:text-purple-600"
                  >
                    Keluar
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="block py-2 text-purple-600 hover:text-purple-700"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Notification Panel */}
      {showNotifications && user && (
        <NotificationPanel
          userId={user.uid}
          onClose={() => setShowNotifications(false)}
        />
      )}
    </nav>
  );
} 
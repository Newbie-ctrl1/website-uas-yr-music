'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useDispatch } from 'react-redux';
import { User, Mail, Phone, MapPin, X, MessageSquare } from 'lucide-react';
import Image from 'next/image';
import { updateProfile } from '../../redux/actions/profileActions';
import ChatBox from './ChatBox';

const ProfileTab = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const response = await fetch('/api/profile');
      const data = await response.json();
      setProfile(data);
    };

    fetchProfile();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="p-8">
        <div className="flex flex-col md:flex-row gap-8 items-center">
          {/* Profile Image */}
          <div className="relative w-32 h-32 rounded-full overflow-hidden bg-purple-100">
            {profile?.image_url ? (
              <Image
                src={profile.image_url}
                alt={profile?.display_name || 'Profile'}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-purple-500">
                <span className="text-4xl font-bold">
                  {profile?.display_name?.charAt(0) || 'U'}
                </span>
              </div>
            )}
          </div>

          {/* Profile Info */}
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              {profile?.display_name || 'Pengguna'}
            </h2>
            <div className="flex flex-col gap-2 text-gray-600">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <Mail className="w-5 h-5 text-purple-500" />
                <span>{profile?.email}</span>
              </div>
              {profile?.phone && (
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <Phone className="w-5 h-5 text-purple-500" />
                  <span>{profile.phone}</span>
                </div>
              )}
              {profile?.address && (
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <MapPin className="w-5 h-5 text-purple-500" />
                  <span>{profile.address}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileTab; 
"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/db';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('game_stats')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10);

          if (error) throw error;
          setProfile({ user, stats: data });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!profile) return <ErrorMessage message="Profile not found" />;

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Profile</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Account Information</h2>
        <p className="text-gray-600">Email: {profile.user.email}</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Games</h2>
        {profile.stats.length > 0 ? (
          <div className="space-y-4">
            {profile.stats.map((stat: any) => (
              <div
                key={stat.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium">{new Date(stat.date).toLocaleDateString()}</p>
                  <p className="text-sm text-gray-600">{stat.words_found} words found</p>
                </div>
                <p className="text-xl font-bold text-yellow-600">{stat.score}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No games played yet</p>
        )}
      </div>
    </div>
  );
}
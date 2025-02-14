"use client";

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/lib/db';

export function AuthForm() {
  return (
    <div className="max-w-md w-full mx-auto p-8">
      <Auth
        supabaseClient={supabase}
        appearance={{ theme: ThemeSupa }}
        theme="light"
        providers={[]}
        redirectTo={`${window.location.origin}/auth/callback`}
      />
    </div>
  );
}
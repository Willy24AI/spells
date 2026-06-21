'use client';

import React, { useEffect, useState } from 'react';

const STORAGE_KEY = 'cookie-consent';

// Only show the banner if analytics/ads are configured.
const TRACKING_ENABLED = Boolean(
  process.env.NEXT_PUBLIC_GA_ID || process.env.NEXT_PUBLIC_ADSENSE_CLIENT
);

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

function updateConsent(granted: boolean) {
  const v = granted ? 'granted' : 'denied';
  const consent = {
    ad_storage: v,
    ad_user_data: v,
    ad_personalization: v,
    analytics_storage: v
  };
  if (typeof window.gtag === 'function') {
    window.gtag('consent', 'update', consent);
  } else {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(['consent', 'update', consent]);
  }
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!TRACKING_ENABLED) return;
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      // localStorage unavailable — don't show the banner.
    }
  }, []);

  const decide = (granted: boolean) => {
    try {
      localStorage.setItem(STORAGE_KEY, granted ? 'granted' : 'denied');
    } catch {
      // ignore storage errors
    }
    updateConsent(granted);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4">
      <div className="mx-auto max-w-3xl rounded-xl border border-gray-200 bg-white p-4 shadow-lg sm:flex sm:items-center sm:gap-4">
        <p className="text-sm text-gray-700">
          We use cookies for analytics and to show ads. You can accept or reject non-essential
          cookies. Read our{' '}
          <a href="/privacy" className="text-yellow-700 underline">Privacy Policy</a>.
        </p>
        <div className="mt-3 flex shrink-0 gap-2 sm:mt-0">
          <button
            onClick={() => decide(false)}
            className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Reject
          </button>
          <button
            onClick={() => decide(true)}
            className="rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 transition-colors"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}

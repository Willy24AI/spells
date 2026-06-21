'use client';

import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

interface AdUnitProps {
  /** The ad slot ID from your AdSense account (created after approval). */
  slot: string;
  /** AdSense ad format. Defaults to "auto" (responsive display). */
  format?: string;
  /** Whether the unit should be full-width responsive. */
  responsive?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Reusable AdSense display ad. Drop it anywhere once your account is approved
 * and you've created an ad unit:
 *
 *   <AdUnit slot="1234567890" />
 *
 * Renders nothing if NEXT_PUBLIC_ADSENSE_CLIENT isn't set, so it's safe to leave
 * in place during development / before approval.
 */
export function AdUnit({ slot, format = 'auto', responsive = true, className, style }: AdUnitProps) {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const pushed = useRef(false);

  useEffect(() => {
    if (!client || pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // adsbygoogle.js not loaded yet (or blocked) — fail silently.
    }
  }, [client]);

  if (!client || !slot) return null;

  return (
    <ins
      className={`adsbygoogle ${className ?? ''}`.trim()}
      style={{ display: 'block', ...style }}
      data-ad-client={client}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive={responsive ? 'true' : 'false'}
    />
  );
}

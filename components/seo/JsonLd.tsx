import React from 'react';

/**
 * Renders a JSON-LD structured-data <script>. Server component (no client JS).
 * Pass any schema.org object as `data`.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

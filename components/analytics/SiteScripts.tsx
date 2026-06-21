import Script from 'next/script';

// Third-party scripts (Google AdSense + Google Analytics), each rendered only
// when its env var is set. Configure in .env and in Vercel:
//   NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-XXXXXXXXXXXXXXXX
//   NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export function SiteScripts() {
  const enabled = Boolean(ADSENSE_CLIENT || GA_ID);

  return (
    <>
      {/* Google Consent Mode v2 — default everything to denied until the visitor
          accepts, restoring a previously granted choice from localStorage. Must
          run before the GA/AdSense tags. */}
      {enabled && (
        <Script id="consent-default" strategy="beforeInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            var granted = false;
            try { granted = localStorage.getItem('cookie-consent') === 'granted'; } catch (e) {}
            var v = granted ? 'granted' : 'denied';
            gtag('consent', 'default', {
              ad_storage: v,
              ad_user_data: v,
              ad_personalization: v,
              analytics_storage: v
            });
          `}
        </Script>
      )}

      {ADSENSE_CLIENT && (
        <Script
          id="adsbygoogle-init"
          async
          strategy="afterInteractive"
          crossOrigin="anonymous"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
        />
      )}

      {GA_ID && (
        <>
          <Script
            id="ga-src"
            async
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          />
          <Script id="ga-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}');
            `}
          </Script>
        </>
      )}
    </>
  );
}

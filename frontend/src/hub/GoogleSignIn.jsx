import React, { useEffect, useRef } from 'react';

// Renders the Google Identity Services sign-in button once the GIS script
// (loaded from index.html) is ready, and hands the resulting credential
// (a Google ID token) up to the caller for server-side verification.
export default function GoogleSignIn({ onCredential }) {
  const buttonRef = useRef(null);
  const clientId = import.meta.env.VITE_HUB_GOOGLE_OAUTH_CLIENT_ID;

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;

    function tryInit() {
      if (cancelled) return;
      if (window.google?.accounts?.id && buttonRef.current) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => onCredential(response.credential)
        });
        window.google.accounts.id.renderButton(buttonRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
          locale: 'iw'
        });
      } else {
        setTimeout(tryInit, 200);
      }
    }

    tryInit();
    return () => { cancelled = true; };
  }, [clientId, onCredential]);

  if (!clientId) {
    return (
      <div className="alert alert-warning">
        כניסה עם Google עדיין לא הוגדרה במערכת (חסר VITE_HUB_GOOGLE_OAUTH_CLIENT_ID).
      </div>
    );
  }

  return <div ref={buttonRef} />;
}

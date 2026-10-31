import React, { useState } from 'react';
import { Siren, X } from 'lucide-react';

export function AppBrand({ onClose }) {
  const [logoFailed, setLogoFailed] = useState(false);

  return (
    <div className="brand">
      <div className="brand-mark" aria-hidden="true">
        {!logoFailed ? (
          <img
            className="brand-logo-image"
            src="/redresponse-logo.png"
            alt=""
            width="39"
            height="39"
            decoding="async"
            onError={() => setLogoFailed(true)}
          />
        ) : (
          <Siren className="brand-logo-fallback" size={21} />
        )}
      </div>
      <div className="brand-copy">
        <div className="brand-name">Red<span>Response</span></div>
        <div className="brand-caption">EMERGENCY OPERATIONS</div>
      </div>
      <button className="icon-button mobile-close" onClick={onClose} aria-label="Close navigation">
        <X size={18} />
      </button>
    </div>
  );
}

import React from 'react';
import { X } from 'lucide-react';

export function AppBrand({ onClose }) {
  return (
    <div className="brand">
      <div className="brand-mark" aria-hidden="true">
        <img className="brand-logo-image" src="/redresponse-logo.png" alt="" />
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

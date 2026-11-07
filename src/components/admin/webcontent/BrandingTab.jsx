import React from 'react';
import AdminBranding from '../../../pages/AdminBranding';

export default function BrandingTab({ brandingRef }) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <AdminBranding ref={brandingRef} isEmbedded={true} />
    </div>
  );
}

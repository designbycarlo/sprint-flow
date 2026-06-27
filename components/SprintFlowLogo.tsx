"use client";
import React, { useState, useEffect } from 'react';

export function SprintFlowLogo({ className }: { className?: string }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkTheme = () => {
      const dark = document.documentElement.getAttribute('data-theme') === 'dark';
      setIsDark(dark);
    };

    checkTheme();

    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    return () => observer.disconnect();
  }, []);

  const lightSvg = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="40 35 195 75" fill="none" width="100%" height="100%">
      <text x="56.69" y="78" fontFamily="'Helvetica','Inter',Arial,sans-serif" fontSize="30" fontWeight="400" fill="#333333">sprint</text>
      <text x="133.23" y="78" fontFamily="'Helvetica','Inter',Arial,sans-serif" fontSize="30" fontWeight="700" fill="#000000">flow</text>
      <rect x="200" y="50" width="11.34" height="11.34" fill="#e64d4d" rx="2"/>
    </svg>
  );

  const darkSvg = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="40 35 195 75" fill="none" width="100%" height="100%">
      <text x="56.69" y="78" fontFamily="'Helvetica','Inter',Arial,sans-serif" fontSize="30" fontWeight="400" fill="#cbd5e0">sprint</text>
      <text x="133.23" y="78" fontFamily="'Helvetica','Inter',Arial,sans-serif" fontSize="30" fontWeight="700" fill="#EFEFEF">flow</text>
      <rect x="200" y="50" width="11.34" height="11.34" fill="#e64d4d" rx="2"/>
    </svg>
  );

  return (
    <div className={className} style={{ width: '120px', height: '46px', display: 'flex', alignItems: 'center' }}>
      {isDark ? darkSvg : lightSvg}
    </div>
  );
}

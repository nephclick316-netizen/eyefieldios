import React from 'react';

export const CascadeaIcon = ({ size = 24, active = false }: { size?: number, active?: boolean }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`transition-all duration-300 ${active ? 'scale-110' : 'grayscale opacity-60'}`}
  >
    <defs>
      <linearGradient id="flameGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF4D00" />
        <stop offset="50%" stopColor="#FF9100" />
        <stop offset="100%" stopColor="#FFD600" />
      </linearGradient>
    </defs>
    <path
      d="M3 15C3 15 5 10 10 7C14 4.5 18 5 21 8C23 10 23 14 21 17C18.5 20.5 13 22 9 20C6 18.5 3 15 3 15Z"
      fill="url(#flameGradient)"
      className={active ? 'animate-pulse' : ''}
    />
    <path
      d="M13.5 10.5C13.5 11.3284 12.8284 12 12 12C11.1716 12 10.5 11.3284 10.5 10.5C10.5 9.67157 11.1716 9 12 9C12.8284 9 13.5 9.67157 13.5 10.5Z"
      fill="black"
    />
    <path
      d="M10 12.5L12 11L15 12L18 10L19.5 11"
      stroke="black"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M12 12.5L11 16L13.5 19L12 21M11 16L8 18"
      stroke="black"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16 15C16 15 17 13 19 13C21 13 22 15 21 17C20 19 18 20 16 19"
      fill="white"
      fillOpacity="0.4"
    />
  </svg>
);

export const GoogleMapsPin = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 8.11 18.83 7.25 18.53 6.47L12 14.5L5.47 6.47C5.17 7.25 5 8.11 5 9C5 14.25 12 22 12 22Z" fill="#EA4335" />
    <path d="M12 11.5C13.3807 11.5 14.5 10.3807 14.5 9C14.5 7.61929 13.3807 6.5 12 6.5C10.6193 6.5 9.5 7.61929 9.5 9C9.5 10.3807 10.6193 11.5 12 11.5Z" fill="#A50E0E" />
    <path d="M12 22C12 22 19 14.25 19 9C19 8.11 18.83 7.25 18.53 6.47L12 14.5L5.47 6.47C5.17 7.25 5 8.11 5 9C5 14.25 12 22 12 22Z" fill="#FBBC05" />
    <path d="M12 22C12 22 19 14.25 19 9C19 8.11 18.83 7.25 18.53 6.47L12 14.5Z" fill="#34A853" />
  </svg>
);

export const ClosedEyeFace = ({ size = 24, strokeWidth = 2 }: { size?: number, strokeWidth?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M8 10c.5.5 1.5.5 2 0" />
    <path d="M14 10c.5.5 1.5.5 2 0" />
    <path d="M9 15c.5.5 2.5.5 3 0" />
  </svg>
);
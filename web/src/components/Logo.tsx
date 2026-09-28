import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export default function Logo({ className = '', size = 32 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="DevMastery Logo"
    >
      <defs>
        {/* Glow & Gradient Defs */}
        <linearGradient id="quantumGrad" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>

        <linearGradient id="coreGlow" x1="24" y1="24" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>

        <radialGradient id="pulseGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </radialGradient>

        <filter id="nodeGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Background Soft Pulse */}
      <circle cx="32" cy="32" r="28" fill="url(#pulseGlow)" />

      {/* Hexagonal Circuit Bus Traces */}
      <polygon
        points="32,10 51,21 51,43 32,54 13,43 13,21"
        stroke="url(#quantumGrad)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.8"
      />

      {/* Connecting Circuit Traces from Nodes to Quantum Core */}
      <line x1="32" y1="10" x2="32" y2="24" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="2 2" opacity="0.7" />
      <line x1="51" y1="21" x2="38" y2="28" stroke="#6366f1" strokeWidth="1.5" opacity="0.6" />
      <line x1="51" y1="43" x2="38" y2="36" stroke="#818cf8" strokeWidth="1.5" opacity="0.6" />
      <line x1="32" y1="54" x2="32" y2="40" stroke="#a855f7" strokeWidth="1.5" strokeDasharray="2 2" opacity="0.7" />
      <line x1="13" y1="43" x2="26" y2="36" stroke="#6366f1" strokeWidth="1.5" opacity="0.6" />
      <line x1="13" y1="21" x2="26" y2="28" stroke="#38bdf8" strokeWidth="1.5" opacity="0.6" />

      {/* Quantum Orbital Ring */}
      <ellipse
        cx="32"
        cy="32"
        rx="18"
        ry="8"
        transform="rotate(-28 32 32)"
        stroke="#38bdf8"
        strokeWidth="1.2"
        strokeDasharray="4 3"
        fill="none"
        opacity="0.75"
      />

      {/* Central Quantum Nucleus */}
      <circle cx="32" cy="32" r="7" fill="url(#coreGlow)" filter="url(#nodeGlow)" />
      <circle cx="32" cy="32" r="3" fill="#ffffff" />

      {/* Hexagonal Circuit Nodes */}
      <circle cx="32" cy="10" r="3.5" fill="#020617" stroke="#38bdf8" strokeWidth="2" />
      <circle cx="32" cy="10" r="1.5" fill="#38bdf8" />

      <circle cx="51" cy="21" r="3.5" fill="#020617" stroke="#6366f1" strokeWidth="2" />
      <circle cx="51" cy="21" r="1.5" fill="#6366f1" />

      <circle cx="51" cy="43" r="3.5" fill="#020617" stroke="#818cf8" strokeWidth="2" />
      <circle cx="51" cy="43" r="1.5" fill="#818cf8" />

      <circle cx="32" cy="54" r="3.5" fill="#020617" stroke="#a855f7" strokeWidth="2" />
      <circle cx="32" cy="54" r="1.5" fill="#a855f7" />

      <circle cx="13" cy="43" r="3.5" fill="#020617" stroke="#6366f1" strokeWidth="2" />
      <circle cx="13" cy="43" r="1.5" fill="#6366f1" />

      <circle cx="13" cy="21" r="3.5" fill="#020617" stroke="#38bdf8" strokeWidth="2" />
      <circle cx="13" cy="21" r="1.5" fill="#38bdf8" />
    </svg>
  );
}

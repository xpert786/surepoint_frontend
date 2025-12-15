import React from 'react';

type Props = {
  className?: string;
};

export function DeliveryIllustration({ className }: Props) {
  return (
    <svg
      className={className}
      viewBox="0 0 720 520"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Ground */}
      <path
        d="M110 420c90 48 410 56 500 0"
        stroke="#FFFFFF"
        strokeOpacity="0.35"
        strokeWidth="18"
        strokeLinecap="round"
      />

      {/* Van body */}
      <g>
        <rect x="250" y="260" width="310" height="120" rx="22" fill="#FFFFFF" fillOpacity="0.95" />
        <path
          d="M250 300h-40c-12 0-22 10-22 22v58h62V300z"
          fill="#E8F2FF"
        />
        <path
          d="M188 338h62"
          stroke="#1D4ED8"
          strokeOpacity="0.25"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <rect x="390" y="285" width="145" height="55" rx="14" fill="#E8F2FF" />
        <path
          d="M420 312h85"
          stroke="#1D4ED8"
          strokeOpacity="0.28"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d="M560 315h30c12 0 22 10 22 22v43h-52v-65z"
          fill="#F97316"
          fillOpacity="0.95"
        />
        <path
          d="M250 260h250c16 0 30 13 30 30v20H250v-50z"
          fill="#1D4ED8"
          fillOpacity="0.9"
        />
        <path
          d="M280 285h150"
          stroke="#FFFFFF"
          strokeOpacity="0.65"
          strokeWidth="10"
          strokeLinecap="round"
        />
      </g>

      {/* Wheels */}
      <g>
        <circle cx="270" cy="388" r="36" fill="#0F172A" fillOpacity="0.9" />
        <circle cx="270" cy="388" r="18" fill="#CBD5E1" />
        <circle cx="520" cy="388" r="36" fill="#0F172A" fillOpacity="0.9" />
        <circle cx="520" cy="388" r="18" fill="#CBD5E1" />
      </g>

      {/* Delivery person */}
      <g>
        {/* Head */}
        <circle cx="210" cy="220" r="24" fill="#FFD7B5" />
        {/* Cap */}
        <path
          d="M185 222c7-24 43-30 60-10 6 7 7 16 7 16H185z"
          fill="#F97316"
        />
        <path d="M183 222h75" stroke="#0F172A" strokeOpacity="0.12" strokeWidth="8" />
        {/* Body */}
        <path
          d="M182 265c0-22 18-40 40-40h10c22 0 40 18 40 40v58h-90v-58z"
          fill="#FFFFFF"
          fillOpacity="0.95"
        />
        <path
          d="M196 240h56"
          stroke="#1D4ED8"
          strokeOpacity="0.35"
          strokeWidth="10"
          strokeLinecap="round"
        />
        {/* Bag */}
        <path
          d="M260 290c0-10 8-18 18-18h26c10 0 18 8 18 18v34c0 10-8 18-18 18h-26c-10 0-18-8-18-18v-34z"
          fill="#F97316"
          fillOpacity="0.95"
        />
        <path
          d="M275 300h34"
          stroke="#FFFFFF"
          strokeOpacity="0.7"
          strokeWidth="8"
          strokeLinecap="round"
        />
      </g>

      {/* Floating accents */}
      <g opacity="0.35">
        <circle cx="560" cy="140" r="52" fill="#F97316" />
        <circle cx="620" cy="200" r="18" fill="#FFFFFF" />
        <circle cx="120" cy="150" r="18" fill="#FFFFFF" />
        <circle cx="150" cy="190" r="44" fill="#1D4ED8" />
      </g>
    </svg>
  );
}

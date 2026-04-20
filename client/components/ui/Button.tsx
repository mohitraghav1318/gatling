'use client';

import React from 'react';

type ButtonProps = {
  children: React.ReactNode;
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  onClick?: () => void;
  className?: string;
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  href,
  onClick,
  className = '',
}: ButtonProps) {
  const base = `
    inline-flex items-center justify-center font-medium transition-all duration-200
    cursor-pointer border rounded-lg relative overflow-hidden group
  `;

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base',
  };

  const variants = {
    primary: `
      bg-blue-600 border-blue-500 text-white
      hover:bg-blue-500 hover:shadow-[0_0_24px_rgba(59,130,246,0.5)]
      active:scale-[0.98]
    `,
    outline: `
      bg-transparent border-[rgba(99,179,237,0.25)] text-blue-400
      hover:border-blue-400 hover:bg-[rgba(59,130,246,0.08)]
      hover:shadow-[0_0_16px_rgba(59,130,246,0.2)]
      active:scale-[0.98]
    `,
    ghost: `
      bg-transparent border-transparent text-[#6b7a99]
      hover:text-[#e8edf5] hover:bg-[rgba(255,255,255,0.04)]
      active:scale-[0.98]
    `,
  };

  const classes = `${base} ${sizes[size]} ${variants[variant]} ${className}`;

  if (href) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    );
  }

  return (
    <button onClick={onClick} className={classes}>
      {children}
    </button>
  );
}

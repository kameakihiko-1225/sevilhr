'use client';

import { LanguageSwitcher } from '../language-switcher';
import Image from 'next/image';

interface NavbarProps {
  phoneNumber?: string;
}

export function Navbar({ phoneNumber = '+998901234567' }: NavbarProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center">
          {/* Logo placeholder - replace with actual logo */}
          <div className="text-2xl font-bold">HRSEVIL</div>
        </div>
        <div className="flex items-center gap-4">
          <a href={`tel:${phoneNumber}`} className="text-sm hover:underline">
            {phoneNumber}
          </a>
          <LanguageSwitcher />
        </div>
      </div>
    </nav>
  );
}


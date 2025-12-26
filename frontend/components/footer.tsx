'use client';

import { Separator } from "@/components/ui/separator";
import { Send } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { getTranslations, Locale } from "@/lib/i18n";

interface FooterProps {
  locale?: Locale;
}

const Footer = ({ locale = 'uz' }: FooterProps) => {
  const t = getTranslations(locale);

  const scrollToForm = () => {
    const formSection = document.getElementById('application-form');
    if (formSection) {
      formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <footer className="border-t bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="py-8 sm:py-12 flex flex-col justify-start items-center px-4">
          {/* Logo */}
          <Image
            src="/Group 10.png"
            alt="HRSEVIL Logo"
            width={124}
            height={32}
            priority
            className="mb-6 sm:mb-8 h-8 sm:h-10 w-auto"
          />

          {/* Telegram and CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto max-w-md sm:max-w-none">
            <Button
              variant="outline"
              asChild
              className="border-red-600 text-red-600 hover:bg-red-50 hover:text-red-700 h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg font-semibold min-h-[48px] w-full sm:w-auto"
            >
              <a
                href="https://t.me/hrseviluz"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2"
              >
                <Send className="h-5 w-5 sm:h-6 sm:w-6" />
                <span className="text-sm sm:text-base">{t.nav.telegram}</span>
              </a>
            </Button>
            
            <Button
              onClick={scrollToForm}
              className="bg-red-600 hover:bg-red-700 text-white h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg font-semibold min-h-[48px] w-full sm:w-auto"
            >
              {t.form.title}
            </Button>
          </div>
        </div>
        <Separator />
        <div className="py-6 sm:py-8 flex items-center justify-center px-4 sm:px-6">
          {/* Copyright */}
          <span className="text-muted-foreground text-xs sm:text-sm text-center">
            &copy; {new Date().getFullYear()}{" "}
            <Link href="/" className="hover:text-foreground transition-colors">
              HRSEVIL
            </Link>
            . All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

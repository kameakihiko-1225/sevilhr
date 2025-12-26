import Image from 'next/image';

export const Logo = () => (
  <Image
    src="/Group 10.png"
    alt="HRSEVIL Logo"
    width={124}
    height={32}
    className="h-9 sm:h-10 w-auto"
    priority
  />
);

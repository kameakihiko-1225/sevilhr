import type { Metadata } from "next";
import { Roboto_Flex } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const robotoFlex = Roboto_Flex({
  subsets: ["latin", "cyrillic"],
  variable: "--font-roboto-flex",
  display: "swap",
});

export const metadata: Metadata = {
  title: "HRSEVIL - Your growth partner",
  description: "Submit your application to join HRSEVIL",
  icons: {
    icon: [
      { url: '/icon.png', type: 'image/png', sizes: 'any' },
    ],
    shortcut: '/icon.png',
    apple: '/icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={robotoFlex.variable}>
      <head>
        <meta name="facebook-domain-verification" content="52bj6z5kebovij8jqb2aa2x5tdkcgl" />
      </head>
      <body className="antialiased font-sans" suppressHydrationWarning>
        {children}
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '738709679302941');
            fbq('track', 'PageView');
          `}
        </Script>
        <noscript>
          <img height="1" width="1" style={{ display: 'none' }}
            src="https://www.facebook.com/tr?id=738709679302941&ev=PageView&noscript=1"
          />
        </noscript>
      </body>
    </html>
  );
}
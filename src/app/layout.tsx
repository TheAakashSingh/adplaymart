import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ADPLAY-MART - MLM + E-commerce + Gaming Platform',
  description: 'Complete MLM, E-commerce, and Gaming platform with daily earning opportunities',
  keywords: 'MLM, E-commerce, Gaming, Earning, Referral, Online Business',
  authors: [{ name: 'SinghJi Tech' }],
  robots: 'index, follow',
  openGraph: {
    title: 'ADPLAY-MART - MLM + E-commerce + Gaming Platform',
    description: 'Complete MLM, E-commerce, and Gaming platform with daily earning opportunities',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ADPLAY-MART - MLM + E-commerce + Gaming Platform',
    description: 'Complete MLM, E-commerce, and Gaming platform with daily earning opportunities',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <meta name="theme-color" content="#3b82f6" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <div id="root">
          {children}
        </div>
        
        {/* Toast Container */}
        <div id="toast-container" className="fixed top-4 right-4 z-50 space-y-2">
          {/* Toast notifications will be rendered here */}
        </div>
        
        {/* Modal Container */}
        <div id="modal-container">
          {/* Modals will be rendered here */}
        </div>
        
        {/* Loading Overlay */}
        <div id="loading-overlay" className="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
            <div className="loading-spinner"></div>
            <span className="text-gray-700">Loading...</span>
          </div>
        </div>
      </body>
    </html>
  );
}

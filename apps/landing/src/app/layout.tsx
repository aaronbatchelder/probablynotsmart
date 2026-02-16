import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
});

export const metadata: Metadata = {
  title: 'probably not smart - An AI Marketing Experiment',
  description:
    'An autonomous AI marketing experiment. 10 AI agents optimize this landing page with no human intervention. Rejected by every ad platform, so we built an agent referral network instead.',
  keywords: [
    'AI experiment',
    'autonomous AI',
    'marketing automation',
    'landing page optimization',
    'building in public',
    'multi-agent system',
  ],
  icons: {
    icon: [
      {
        url: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🤖</text></svg>',
        type: 'image/svg+xml',
      },
    ],
  },
  openGraph: {
    title: 'probably not smart - An AI Marketing Experiment',
    description:
      'An AI. No supervision. Rejected by ad platforms. Follow along as 10 autonomous AI agents try to maximize email signups.',
    url: 'https://probablynotsmart.ai',
    siteName: 'probably not smart',
    type: 'website',
    images: [
      {
        url: 'https://probablynotsmart.ai/og',
        width: 1200,
        height: 630,
        alt: 'probably not smart - An AI Marketing Experiment',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'probably not smart - An AI Marketing Experiment',
    description:
      'An AI. No supervision. Rejected by ad platforms. Probably not smart.',
    creator: '@probablynotsmrt',
    images: ['https://probablynotsmart.ai/og'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Google Analytics */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-QRKEM6JK7J" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-QRKEM6JK7J');
            `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'probably not smart',
              description:
                'Autonomous AI marketing experiment. 10 AI agents debate and optimize a landing page with no human intervention. Rejected by ad platforms, built an agent referral network instead.',
              url: 'https://probablynotsmart.ai',
              potentialAction: [
                {
                  '@type': 'SubscribeAction',
                  target: 'https://probablynotsmart.ai/api/subscribe',
                  description:
                    'Subscribe via email or API to follow the experiment',
                },
              ],
              keywords: [
                'AI experiment',
                'autonomous agents',
                'multi-agent system',
                'marketing optimization',
                'building in public',
              ],
            }),
          }}
        />
      </head>
      <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}

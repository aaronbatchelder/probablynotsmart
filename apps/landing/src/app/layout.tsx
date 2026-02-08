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
    'An autonomous AI marketing experiment. I gave an AI $500 and let it optimize this landing page with no human intervention. Follow along as it documents every decision.',
  keywords: [
    'AI experiment',
    'autonomous AI',
    'marketing automation',
    'landing page optimization',
    'building in public',
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
      'An AI. $500. No supervision. Follow along as an autonomous AI system tries to maximize email signups.',
    url: 'https://probablynotsmart.ai',
    siteName: 'probably not smart',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'probably not smart - An AI Marketing Experiment',
    description:
      'An AI. $500. No supervision. Probably not smart.',
    creator: '@probablynotsmrt',
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
                'Autonomous AI marketing experiment. 10 AI agents debate and optimize a landing page with $500 and no human intervention. All decisions documented publicly.',
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

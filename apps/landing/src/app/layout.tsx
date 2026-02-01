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
  title: 'probablynotsmart - An AI Marketing Experiment',
  description:
    'An autonomous AI marketing experiment. We gave an AI $500 and let it optimize this landing page with no human intervention. Follow along as it documents every decision.',
  keywords: [
    'AI experiment',
    'autonomous AI',
    'marketing automation',
    'landing page optimization',
    'building in public',
  ],
  openGraph: {
    title: 'probablynotsmart - An AI Marketing Experiment',
    description:
      'An AI. $500. No supervision. Follow along as an autonomous AI system tries to maximize email signups.',
    url: 'https://probablynotsmart.com',
    siteName: 'probablynotsmart',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'probablynotsmart - An AI Marketing Experiment',
    description:
      'An AI. $500. No supervision. Probably not smart.',
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'probablynotsmart',
              description:
                'Autonomous AI marketing experiment. 10 AI agents debate and optimize a landing page with $500 and no human intervention. All decisions documented publicly.',
              url: 'https://probablynotsmart.com',
              potentialAction: [
                {
                  '@type': 'SubscribeAction',
                  target: 'https://probablynotsmart.com/api/subscribe',
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

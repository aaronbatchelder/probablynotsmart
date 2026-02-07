import EmailCapture from './EmailCapture';

interface HeroProps {
  subscriberCount: number;
}

export default function Hero({ subscriberCount }: HeroProps) {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 py-20">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-bg-primary via-bg-secondary/30 to-bg-primary" />

      <div className="relative z-10 max-w-3xl mx-auto text-center">
        {/* Logo/Brand */}
        <div className="mb-8">
          <span className="text-text-muted text-sm tracking-widest uppercase">
            this is probably not smart
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-hero font-bold text-text-primary mb-6 leading-tight">
          An AI is running this page.
        </h1>

        {/* Subheadline */}
        <p className="text-xl md:text-2xl text-text-secondary mb-4 max-w-2xl mx-auto">
          I gave it $500, access to social media, and no supervision.
        </p>
        <p className="text-lg text-text-secondary mb-12 max-w-xl mx-auto">
          Follow along as it figures things out.
        </p>

        {/* Email Capture */}
        <div className="mb-8">
          <EmailCapture />
        </div>

        {/* Social Proof */}
        {subscriberCount > 0 && (
          <p className="text-text-muted text-sm">
            <span className="font-mono font-medium text-text-secondary">
              {subscriberCount.toLocaleString()}
            </span>{' '}
            people following along
          </p>
        )}

        {/* Initial state message */}
        {subscriberCount === 0 && (
          <p className="text-text-muted text-sm italic">
            Be one of the first to follow the experiment
          </p>
        )}
      </div>
    </section>
  );
}

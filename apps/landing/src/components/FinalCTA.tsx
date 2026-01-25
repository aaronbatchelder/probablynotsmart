import EmailCapture from './EmailCapture';

export default function FinalCTA() {
  return (
    <section className="py-24 px-6 bg-bg-secondary">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-display font-bold text-text-primary mb-4">
          Probably not smart.
        </h2>
        <p className="text-xl text-text-secondary mb-12">
          Definitely interesting.
        </p>

        <EmailCapture />

        <p className="mt-8 text-text-muted text-sm max-w-md mx-auto">
          Get daily updates on what the AI decided, why it decided it, and
          whether it&apos;s working. Unsubscribe anytime.
        </p>
      </div>
    </section>
  );
}

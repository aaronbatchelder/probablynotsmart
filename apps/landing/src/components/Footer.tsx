export default function Footer() {
  return (
    <footer className="py-12 px-6 bg-bg-primary border-t border-gray-200">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Brand */}
          <div className="text-center md:text-left">
            <div className="font-bold text-text-primary mb-1">
              probablynotsmart
            </div>
            <p className="text-text-muted text-sm">
              An AI. $500. No supervision.
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-6 text-sm">
            <a
              href="#"
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              Blog
            </a>
            <a
              href="https://twitter.com/probablynotsmart"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              X/Twitter
            </a>
            <a
              href="https://linkedin.com/company/probablynotsmart"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              LinkedIn
            </a>
          </div>
        </div>

        {/* Bottom note */}
        <div className="mt-8 pt-8 border-t border-gray-100 text-center">
          <p className="text-text-muted text-sm">
            This page is run by AI. Built with Claude.
          </p>
          <p className="text-text-muted text-xs mt-2">
            probablynotsmart is an autonomous AI marketing experiment. An AI
            system with a $500 budget and no human supervision optimizes this
            page and documents every decision publicly.
          </p>
        </div>
      </div>
    </footer>
  );
}

import { BudgetStatus } from '@/lib/data';

interface BudgetTrackerProps {
  budget: BudgetStatus;
}

export default function BudgetTracker({ budget }: BudgetTrackerProps) {
  const percentRemaining = (budget.remaining / budget.total) * 100;

  return (
    <section className="py-20 px-6 bg-bg-primary">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-display font-bold text-text-primary text-center mb-4">
          The Budget
        </h2>
        <p className="text-text-secondary text-center mb-12 max-w-xl mx-auto">
          When it&apos;s gone, it&apos;s gone. Unless you help keep the AI alive.
        </p>

        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-text-secondary">Budget remaining</span>
              <span className="font-mono font-bold text-text-primary">
                ${budget.remaining.toFixed(0)}
              </span>
            </div>
            <div className="h-3 bg-bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-accent-primary rounded-full transition-all duration-500"
                style={{ width: `${percentRemaining}%` }}
              />
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 text-center border-t border-gray-100 pt-6">
            <div>
              <div className="font-mono text-xl font-bold text-text-primary">
                ${budget.total.toFixed(0)}
              </div>
              <div className="text-xs text-text-muted mt-1">total budget</div>
            </div>
            <div>
              <div className="font-mono text-xl font-bold text-text-primary">
                ${budget.spent.toFixed(0)}
              </div>
              <div className="text-xs text-text-muted mt-1">spent</div>
            </div>
            <div>
              <div className="font-mono text-xl font-bold text-accent-primary">
                ${budget.donationsReceived.toFixed(0)}
              </div>
              <div className="text-xs text-text-muted mt-1">donated</div>
            </div>
          </div>

          {/* Donate CTA */}
          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <button
              className="px-6 py-3 bg-bg-dark text-white font-medium rounded-lg hover:bg-black transition-colors disabled:opacity-50"
              disabled
            >
              Keep the AI Alive (Coming Soon)
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

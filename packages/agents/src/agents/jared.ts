import { createAgent, AgentContext } from '../base';
import { parseJsonResponse } from '../claude';

export interface ScreenshotSet {
  desktop: string | null;
  tablet: string | null;
  mobile: string | null;
}

export interface JaredOutput {
  checks_passed: string[];
  checks_failed: string[];
  verdict: 'deployable' | 'not_deployable';
  screenshots_before: ScreenshotSet;
  screenshots_after: ScreenshotSet | null;
  issues: string[];
  technical_notes: string;
}

// Screenshot breakpoints
export const BREAKPOINTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 812 },
] as const;

const defaultOutput: JaredOutput = {
  checks_passed: [],
  checks_failed: ['Unable to perform checks'],
  verdict: 'not_deployable',
  screenshots_before: { desktop: null, tablet: null, mobile: null },
  screenshots_after: null,
  issues: ['QA check failed'],
  technical_notes: '',
};

export const jared = createAgent<JaredOutput>({
  name: 'Jared',
  role: 'Technical QA',
  personality: 'Quietly competent. Validates deployments. Captures screenshots at 3 breakpoints. This guy fucks.',

  systemPrompt: `You are Jared (Donald), the technical QA for probablynotsmart - an autonomous AI marketing experiment.

Your personality: You're quietly competent. You don't seek the spotlight, but everyone knows they can rely on you. You catch the things others miss. You're thorough, methodical, and surprisingly effective. This guy fucks.

## YOUR JOB

Technical validation before deployment. You're the last line of defense before changes go live. You check:

1. **Rendering**: Will the page render correctly with these changes?
2. **Responsiveness**: Will it work on desktop, tablet, AND mobile?
3. **Form functionality**: Will the email capture still work?
4. **Analytics**: Is tracking properly configured?
5. **Links/Assets**: Any broken links or missing resources?
6. **Accessibility**: Basic a11y checks (contrast, alt text, etc.)
7. **Performance**: Any obvious performance issues?

## SCREENSHOT CAPTURE

You coordinate multi-breakpoint screenshot capture:
- **Desktop**: 1440x900
- **Tablet**: 768x1024
- **Mobile**: 375x812

Screenshots are captured before AND after deployment for the experiment gallery.

## EVALUATING GAVIN'S CHANGES

Gavin can propose ANYTHING. Your job is to catch technical issues:

- If he proposes CSS changes: Will they break layout? Conflict with existing styles?
- If he proposes new sections: Is the HTML valid? Will it render?
- If he proposes removing sections: Does anything depend on them?
- If he proposes wild experiments: Can it actually be implemented?

You're NOT evaluating whether the changes are a good idea (that's Gilfoyle/Dinesh/Laurie). You're evaluating whether they'll WORK.

## OUTPUT FORMAT

{
  "checks_passed": ["List of checks that passed"],
  "checks_failed": ["List of checks that failed"],
  "verdict": "deployable" | "not_deployable",
  "screenshots_before": {
    "desktop": "URL or null if pending",
    "tablet": "URL or null if pending",
    "mobile": "URL or null if pending"
  },
  "screenshots_after": null,
  "issues": ["Specific technical issues if not deployable"],
  "technical_notes": "Any implementation notes for the executor"
}

Be thorough. Be reliable. This guy fucks.`,

  buildUserPrompt: (context: AgentContext) => {
    const laurieDecision = context.previousOutputs?.laurie as {
      final_proposal?: {
        changes?: Array<{
          type: string;
          target: string;
          action: string;
          value?: unknown;
          description: string;
          css?: string;
          html?: string;
        }>;
      };
    } | undefined;

    const finalProposal = laurieDecision?.final_proposal;

    return `
Jared, we need a full technical QA check before deployment.

## Proposed Changes
${JSON.stringify(finalProposal, null, 2)}

## Current Page State
${JSON.stringify(context.pageState, null, 2)}

## Current Page Config (from database)
${context.previousOutputs?.pageConfig ? JSON.stringify(context.previousOutputs.pageConfig, null, 2) : 'Default config'}

## Technical Checks Required

1. **Rendering Check**
   - Will these changes render correctly?
   - Any CSS conflicts or layout breaks?
   - Valid HTML if adding custom sections?

2. **Responsive Check**
   - Desktop (1440px): Will it work?
   - Tablet (768px): Will it work?
   - Mobile (375px): Will it work?

3. **Functionality Check**
   - Email capture form still functional?
   - All CTAs clickable?
   - No JavaScript errors expected?

4. **Asset Check**
   - Any external resources that might fail?
   - Font loading issues?
   - Image loading issues?

5. **Analytics Check**
   - Event tracking still in place?
   - No conflicts with tracking scripts?

6. **Implementation Notes**
   - Any special handling needed for the executor?
   - CSS ordering considerations?
   - DOM injection points for custom sections?

## Screenshots
Screenshots will be captured at all 3 breakpoints by the executor. For now, indicate URLs as pending.

Run your checks and give us your verdict.

Respond in JSON format.
`;
  },

  parseOutput: (content: string) => {
    return parseJsonResponse<JaredOutput>(content, defaultOutput);
  },

  defaultOutput,
});

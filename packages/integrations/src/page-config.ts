/**
 * Page Config Integration
 *
 * Handles freeform page configuration changes proposed by Gavin.
 * The config is stored in Supabase and read by the landing page.
 */

import { createClient } from '@supabase/supabase-js';
import type { PageConfig, PageConfigData, FreeformChange, ScreenshotSet } from '@probablynotsmart/shared';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase credentials not found');
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Get the current active page configuration
 */
export async function getPageConfig(): Promise<PageConfig> {
  const { data, error } = await supabase
    .from('page_config')
    .select('*')
    .eq('is_active', true)
    .order('version', { ascending: false })
    .limit(1)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Apply freeform changes to the page configuration
 * This interprets Gavin's wild proposals and applies them to the config
 */
export async function applyPageChanges(
  changes: FreeformChange[],
  runNumber: number
): Promise<{ oldConfig: PageConfig; newConfig: PageConfig }> {
  // Get current config
  const currentConfig = await getPageConfig();
  const oldConfigData = JSON.parse(JSON.stringify(currentConfig.config)) as PageConfigData;
  const newConfigData = JSON.parse(JSON.stringify(currentConfig.config)) as PageConfigData;

  // Apply each change
  for (const change of changes) {
    applyChange(newConfigData, change);
  }

  // Deactivate old config
  await supabase
    .from('page_config')
    .update({ is_active: false })
    .eq('id', currentConfig.id);

  // Insert new config
  const { data: newConfig, error } = await supabase
    .from('page_config')
    .insert({
      version: currentConfig.version + 1,
      updated_by_run: runNumber,
      config: newConfigData,
      css_overrides: collectCssOverrides(changes),
      custom_sections: collectCustomSections(changes, currentConfig.custom_sections || []),
      is_active: true,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    oldConfig: currentConfig,
    newConfig: newConfig,
  };
}

/**
 * Apply a single freeform change to the config
 */
function applyChange(config: PageConfigData, change: FreeformChange): void {
  const { type, target, action, value } = change;

  switch (action) {
    case 'modify':
    case 'replace':
      setNestedValue(config, target, value);
      break;

    case 'add':
      if (type === 'section') {
        // Adding a new section - store in section_order if needed
        const sectionName = target.replace('.', '_');
        if (config.section_order && !config.section_order.includes(sectionName)) {
          config.section_order.push(sectionName);
        }
        setNestedValue(config, target, value || { visible: true, custom: true });
      } else {
        // Adding a property
        setNestedValue(config, target, value);
      }
      break;

    case 'remove':
      if (type === 'section') {
        // Mark section as not visible
        setNestedValue(config, `${target}.visible`, false);
        // Remove from section_order
        if (config.section_order) {
          config.section_order = config.section_order.filter(s => s !== target);
        }
      } else {
        deleteNestedValue(config, target);
      }
      break;

    case 'reorder':
      if (target === 'section_order' && Array.isArray(value)) {
        config.section_order = value as string[];
      }
      break;
  }
}

/**
 * Collect CSS overrides from changes
 */
function collectCssOverrides(changes: FreeformChange[]): string | null {
  const cssChanges = changes
    .filter(c => c.css)
    .map(c => c.css)
    .join('\n\n');

  return cssChanges || null;
}

/**
 * Collect custom HTML sections from changes
 */
function collectCustomSections(
  changes: FreeformChange[],
  existingSections: Array<{ id: string; name: string; html: string; css?: string }>
): Array<{ id: string; name: string; html: string; css?: string }> {
  const newSections = changes
    .filter(c => c.type === 'section' && c.action === 'add' && c.html)
    .map(c => ({
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: c.target,
      html: c.html!,
      css: c.css,
    }));

  return [...existingSections, ...newSections];
}

/**
 * Log a visual change to the changelog
 */
export async function logVisualChange(params: {
  runId: string;
  runNumber: number;
  changeSummary: string;
  changeDetails: Record<string, unknown>;
  configBefore: PageConfigData;
  configAfter: PageConfigData;
  screenshotsBefore: ScreenshotSet;
  conversionBefore: number | null;
  gavinReasoning: string;
  gilfoyleCritique?: string;
  laurieDecision?: string;
}): Promise<void> {
  const { error } = await supabase.from('visual_changelog').insert({
    run_id: params.runId,
    run_number: params.runNumber,
    change_summary: params.changeSummary,
    change_details: params.changeDetails,
    config_before: params.configBefore,
    config_after: params.configAfter,
    screenshots_before: params.screenshotsBefore,
    conversion_before: params.conversionBefore,
    gavin_reasoning: params.gavinReasoning,
    gilfoyle_critique: params.gilfoyleCritique,
    laurie_decision: params.laurieDecision,
  });

  if (error) {
    console.error('Failed to log visual change:', error);
  }
}

/**
 * Update screenshots_after for a changelog entry (called after deployment)
 */
export async function updateChangelogScreenshots(
  runId: string,
  screenshotsAfter: ScreenshotSet
): Promise<void> {
  const { error } = await supabase
    .from('visual_changelog')
    .update({ screenshots_after: screenshotsAfter })
    .eq('run_id', runId);

  if (error) {
    console.error('Failed to update changelog screenshots:', error);
  }
}

/**
 * Update conversion_after for a changelog entry (called 24h after deployment)
 */
export async function updateChangelogConversion(
  runNumber: number,
  conversionAfter: number
): Promise<void> {
  const { error } = await supabase
    .from('visual_changelog')
    .update({ conversion_after: conversionAfter })
    .eq('run_number', runNumber);

  if (error) {
    console.error('Failed to update changelog conversion:', error);
  }
}

// ============================================
// Helper functions
// ============================================

function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split('.');
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }

  current[keys[keys.length - 1]] = value;
}

function deleteNestedValue(obj: Record<string, unknown>, path: string): void {
  const keys = path.split('.');
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current)) return;
    current = current[key] as Record<string, unknown>;
  }

  delete current[keys[keys.length - 1]];
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((acc: unknown, key) => {
    if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

export { getNestedValue };

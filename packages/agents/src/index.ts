// Claude API wrapper
export * from './claude';

// Base agent utilities
export * from './base';

// Individual agents
export { bighead, type BigheadOutput } from './agents/bighead';
export { gavin, type GavinOutput, type Proposal } from './agents/gavin';
export { gilfoyle, type GilfoyleOutput, type Critique, type HistoricalReference } from './agents/gilfoyle';
export { dinesh, type DineshOutput } from './agents/dinesh';
export { laurie, type LaurieDecision } from './agents/laurie';
export { monica, type MonicaOutput } from './agents/monica';
export { erlich, type ErlichOutput } from './agents/erlich';
export { jared, type JaredOutput } from './agents/jared';
export { richard, type RichardOutput } from './agents/richard';
export { russ, type RussOutput, type Opportunity, type Engagement } from './agents/russ';

// Reflection system
export { runReflection, runAllReflections, type ReflectionInput, type ReflectionOutput } from './agents/reflection';

// All agents as a collection
export const agents = {
  bighead: () => import('./agents/bighead').then(m => m.bighead),
  gavin: () => import('./agents/gavin').then(m => m.gavin),
  gilfoyle: () => import('./agents/gilfoyle').then(m => m.gilfoyle),
  dinesh: () => import('./agents/dinesh').then(m => m.dinesh),
  laurie: () => import('./agents/laurie').then(m => m.laurie),
  monica: () => import('./agents/monica').then(m => m.monica),
  erlich: () => import('./agents/erlich').then(m => m.erlich),
  jared: () => import('./agents/jared').then(m => m.jared),
  richard: () => import('./agents/richard').then(m => m.richard),
  russ: () => import('./agents/russ').then(m => m.russ),
};

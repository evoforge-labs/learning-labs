import { describe, it, expect } from 'vitest';
import { validateDocs } from '../scripts/validate-content';

const ok = { id: 'concept-mvp', title: 'MVP', type: 'concept', status: 'published',
  aliases: ['minimum viable product'], _file: 'concepts/mvp.mdx' };

describe('validateDocs', () => {
  it('passes a valid set', () => {
    expect(validateDocs([ok])).toEqual([]);
  });
  it('flags duplicate id', () => {
    const errs = validateDocs([ok, { ...ok, _file: 'concepts/mvp2.mdx' }]);
    expect(errs.some(e => e.includes('duplicate id'))).toBe(true);
  });
  it('flags missing title/type/status', () => {
    const errs = validateDocs([{ id: 'x', _file: 'a.mdx' }]);
    expect(errs.some(e => e.includes('missing title'))).toBe(true);
    expect(errs.some(e => e.includes('missing type'))).toBe(true);
    expect(errs.some(e => e.includes('missing status'))).toBe(true);
  });
  it('flags session without exercise', () => {
    const errs = validateDocs([{ id: 'session-1', title: 'S', type: 'session',
      status: 'draft', _file: 'sessions/s.mdx' }]);
    expect(errs.some(e => e.includes('session') && e.includes('exercise'))).toBe(true);
  });
  it('flags duplicate concept alias across concepts', () => {
    const a = { ...ok, id: 'concept-a', _file: 'concepts/a.mdx', aliases: ['mvp x'] };
    const b = { ...ok, id: 'concept-b', _file: 'concepts/b.mdx', aliases: ['mvp x'] };
    const errs = validateDocs([a, b]);
    expect(errs.some(e => e.includes('alias'))).toBe(true);
  });
  it('flags broken reference', () => {
    const lesson = { id: 'lesson-1', title: 'L', type: 'lesson', status: 'published',
      track: 't', prerequisites: ['concept-nope'], _file: 'lessons/l.mdx' };
    const errs = validateDocs([lesson]);
    expect(errs.some(e => e.includes('broken reference') && e.includes('concept-nope'))).toBe(true);
  });
});

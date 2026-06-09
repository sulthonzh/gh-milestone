import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseArgs, HELP, progressBar, formatText, formatJSON, formatMarkdown } from '../src/index.js';

describe('parseArgs', () => {
  it('parses --repo', () => {
    const args = parseArgs(['--repo', 'owner/repo']);
    assert.equal(args.repo, 'owner/repo');
  });

  it('parses --milestone', () => {
    const args = parseArgs(['--milestone', 'v2.0']);
    assert.equal(args.milestone, 'v2.0');
  });

  it('parses --all flag', () => {
    const args = parseArgs(['--all']);
    assert.equal(args.all, true);
  });

  it('parses --json', () => {
    const args = parseArgs(['--json']);
    assert.equal(args.format, 'json');
  });

  it('parses --markdown', () => {
    const args = parseArgs(['--markdown']);
    assert.equal(args.format, 'markdown');
  });

  it('parses --issues-only', () => {
    const args = parseArgs(['--issues-only']);
    assert.equal(args.issuesOnly, true);
  });

  it('parses --prs-only', () => {
    const args = parseArgs(['--prs-only']);
    assert.equal(args.prsOnly, true);
  });

  it('parses short flags -r -a', () => {
    const args = parseArgs(['-r', 'foo/bar', '-a']);
    assert.equal(args.repo, 'foo/bar');
    assert.equal(args.all, true);
  });

  it('parses --help', () => {
    const args = parseArgs(['--help']);
    assert.equal(args.help, true);
  });
});

describe('HELP', () => {
  it('contains usage info', () => {
    assert.ok(HELP.includes('gh-milestone'));
    assert.ok(HELP.includes('--repo'));
  });
});

describe('progressBar', () => {
  it('returns full bar for 100%', () => {
    assert.equal(progressBar(10, 10), '██████████');
  });

  it('returns empty bar for 0%', () => {
    assert.equal(progressBar(0, 10), '░░░░░░░░░░');
  });

  it('returns partial bar', () => {
    assert.equal(progressBar(5, 10), '█████░░░░░');
  });

  it('handles zero total', () => {
    assert.equal(progressBar(0, 0), '░░░░░░░░░░');
  });

  it('respects width param', () => {
    assert.equal(progressBar(1, 4, 4), '█░░░');
  });
});

const sampleMilestones = [
  {
    title: 'v2.0',
    number: 1,
    state: 'open',
    description: 'Big release',
    dueOn: '2026-06-15T00:00:00Z',
    createdAt: '2026-05-01T00:00:00Z',
    openIssues: 2,
    closedIssues: 3,
    total: 5,
    closed: 3,
    items: [
      { number: 10, title: 'Add dark mode', state: 'closed', isPR: true, isDraft: false, labels: [], assignees: [], createdAt: '2026-05-01', closedAt: '2026-05-10', mergedAt: '2026-05-10' },
      { number: 11, title: 'Fix login bug', state: 'closed', isPR: false, isDraft: false, labels: ['bug'], assignees: [], createdAt: '2026-05-02', closedAt: '2026-05-05', mergedAt: null },
      { number: 12, title: 'Refactor settings', state: 'open', isPR: false, isDraft: false, labels: [], assignees: [], createdAt: '2026-05-03', closedAt: null, mergedAt: null },
    ],
  },
];

describe('formatText', () => {
  it('formats milestones with progress', () => {
    const out = formatText(sampleMilestones);
    assert.ok(out.includes('v2.0'));
    assert.ok(out.includes('60%'));
    assert.ok(out.includes('██████░░░░'));
    assert.ok(out.includes('#10 Add dark mode'));
  });

  it('shows no milestones message', () => {
    assert.equal(formatText([]), 'No milestones found.');
  });
});

describe('formatJSON', () => {
  it('outputs valid JSON', () => {
    const out = formatJSON(sampleMilestones);
    const parsed = JSON.parse(out);
    assert.equal(parsed[0].title, 'v2.0');
  });

  it('empty array', () => {
    const out = formatJSON([]);
    assert.deepEqual(JSON.parse(out), []);
  });
});

describe('formatMarkdown', () => {
  it('formats as markdown with headers', () => {
    const out = formatMarkdown(sampleMilestones);
    assert.ok(out.includes('##'));
    assert.ok(out.includes('v2.0'));
    assert.ok(out.includes('### Open'));
    assert.ok(out.includes('#12'));
  });

  it('shows no milestones message', () => {
    assert.equal(formatMarkdown([]), 'No milestones found.');
  });
});

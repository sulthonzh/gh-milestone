import { execSync } from 'child_process';

export function ghAvailable() {
  try {
    execSync('gh auth status', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

export function parseArgs(argv = process.argv.slice(2)) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--repo' || a === '-r') { args.repo = argv[++i]; continue; }
    if (a === '--milestone' || a === '-m') { args.milestone = argv[++i]; continue; }
    if (a === '--user' || a === '-u') { args.user = argv[++i]; continue; }
    if (a === '--format' || a === '-f') { args.format = argv[++i]; continue; }
    if (a === '--json') { args.format = 'json'; continue; }
    if (a === '--markdown') { args.format = 'markdown'; continue; }
    if (a === '--all' || a === '-a') { args.all = true; continue; }
    if (a === '--issues-only') { args.issuesOnly = true; continue; }
    if (a === '--prs-only') { args.prsOnly = true; continue; }
    if (a === '--help' || a === '-h') { args.help = true; continue; }
    args._.push(a);
  }
  return args;
}

export const HELP = `gh-milestone — GitHub milestones in your terminal

Usage:
  gh-milestone --repo owner/repo [options]

Options:
  --repo, -r        Repository (owner/repo format)
  --milestone, -m   Filter to specific milestone title
  --user, -u        Target GitHub user (default: authenticated user)
  --all, -a         Include closed milestones
  --issues-only     Show only issues, exclude PRs
  --prs-only        Show only PRs, exclude issues
  --json            Output as JSON
  --markdown        Output as Markdown
  --help, -h        Show this help

Examples:
  gh-milestone --repo sulthonzh/my-project
  gh-milestone --repo sulthonzh/my-project --all
  gh-milestone --repo sulthonzh/my-project --milestone "v2.0"
  gh-milestone --repo sulthonzh/my-project --json`;

function ghApi(endpoint, repo) {
  const cmd = `gh api ${endpoint} --repo ${repo}`;
  try {
    const out = execSync(cmd, { encoding: 'utf8', stdio: 'pipe' });
    return JSON.parse(out);
  } catch (e) {
    throw new Error(`gh api failed: ${e.message.split('\n')[0]}`);
  }
}

export async function fetchMilestones({ repo, milestone, all, issuesOnly, prsOnly }) {
  if (!repo) throw new Error('--repo is required');
  
  const state = all ? 'all' : 'open';
  const milestones = ghApi(`/repos/{owner}/{repo}/milestones?state=${state}&per_page=100`, repo);
  
  if (!Array.isArray(milestones)) return [];
  
  let filtered = milestones;
  if (milestone) {
    filtered = milestones.filter(m => 
      m.title.toLowerCase().includes(milestone.toLowerCase())
    );
  }
  
  const result = [];
  for (const ms of filtered) {
    const issues = ghApi(
      `/repos/{owner}/{repo}/issues?milestone=${ms.number}&state=all&per_page=100`,
      repo
    );
    
    let items = Array.isArray(issues) ? issues : [];
    
    if (issuesOnly) {
      items = items.filter(i => !i.pull_request);
    } else if (prsOnly) {
      items = items.filter(i => i.pull_request);
    }
    
    result.push({
      title: ms.title,
      number: ms.number,
      state: ms.state,
      description: ms.description || '',
      dueOn: ms.due_on || null,
      createdAt: ms.created_at,
      openIssues: ms.open_issues,
      closedIssues: ms.closed_issues,
      total: ms.open_issues + ms.closed_issues,
      closed: ms.closed_issues,
      items: items.map(i => ({
        number: i.number,
        title: i.title,
        state: i.state,
        isPR: !!i.pull_request,
        isDraft: i.draft || false,
        labels: (i.labels || []).map(l => typeof l === 'string' ? l : l.name),
        assignees: (i.assignees || []).map(a => a.login),
        createdAt: i.created_at,
        closedAt: i.closed_at || null,
        mergedAt: i.pull_request?.merged_at || null,
      })),
    });
  }
  
  return result;
}

export function progressBar(closed, total, width = 10) {
  if (total === 0) return '░'.repeat(width);
  const filled = Math.round((closed / total) * width);
  return '█'.repeat(filled) + '░'.repeat(width - filled);
}

export function formatText(milestones) {
  if (!milestones.length) return 'No milestones found.';
  
  const lines = [];
  for (const ms of milestones) {
    const stateIcon = ms.state === 'open' ? '📋' : '✅';
    const due = ms.dueOn ? ` — due ${ms.dueOn.slice(0, 10)}` : '';
    const pct = ms.total > 0 ? Math.round((ms.closed / ms.total) * 100) : 0;
    const bar = progressBar(ms.closed, ms.total);
    
    lines.push(`${stateIcon} ${ms.title} (${ms.state})${due}`);
    lines.push(`   progress: ${bar} ${ms.closed}/${ms.total} (${pct}%)`);
    
    if (ms.description) {
      lines.push(`   ${ms.description.slice(0, 80)}`);
    }
    
    const closed = ms.items.filter(i => i.state === 'closed');
    const open = ms.items.filter(i => i.state === 'open');
    
    if (closed.length) {
      lines.push('');
      lines.push('   ✅ Done:');
      for (const i of closed.slice(0, 20)) {
        const type = i.isPR ? 'PR' : 'issue';
        const merged = i.mergedAt ? ', merged' : '';
        lines.push(`     #${i.number} ${i.title} (${type}${merged})`);
      }
    }
    
    if (open.length) {
      lines.push('');
      lines.push('   ⏳ Open:');
      for (const i of open.slice(0, 20)) {
        const type = i.isPR ? (i.isDraft ? 'draft PR' : 'PR') : 'issue';
        lines.push(`     #${i.number} ${i.title} (${type})`);
      }
    }
    
    lines.push('');
  }
  
  return lines.join('\n');
}

export function formatJSON(milestones) {
  return JSON.stringify(milestones, null, 2);
}

export function formatMarkdown(milestones) {
  if (!milestones.length) return 'No milestones found.';
  
  const lines = [];
  for (const ms of milestones) {
    const pct = ms.total > 0 ? Math.round((ms.closed / ms.total) * 100) : 0;
    const due = ms.dueOn ? ` — Due: ${ms.dueOn.slice(0, 10)}` : '';
    const state = ms.state === 'open' ? '🟢' : '🔴';
    
    lines.push(`## ${state} ${ms.title}${due}`);
    if (ms.description) lines.push(`\n> ${ms.description}`);
    lines.push(`\n**Progress:** ${ms.closed}/${ms.total} (${pct}%)\n`);
    
    const closed = ms.items.filter(i => i.state === 'closed');
    const open = ms.items.filter(i => i.state === 'open');
    
    if (open.length) {
      lines.push('### Open\n');
      for (const i of open) {
        const type = i.isPR ? '🔀' : '🐛';
        lines.push(`- ${type} #${i.number} ${i.title}`);
      }
      lines.push('');
    }
    
    if (closed.length) {
      lines.push('### Closed\n');
      for (const i of closed.slice(0, 15)) {
        const type = i.isPR ? '🔀' : '🐛';
        lines.push(`- ${type} #${i.number} ${i.title}`);
      }
      if (closed.length > 15) lines.push(`- ... and ${closed.length - 15} more`);
      lines.push('');
    }
  }
  
  return lines.join('\n');
}

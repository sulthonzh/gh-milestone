#!/usr/bin/env node
import { parseArgs, HELP, ghAvailable, fetchMilestones, formatText, formatJSON, formatMarkdown } from './src/index.js';

const args = parseArgs();

if (args.help) {
  console.log(HELP);
  process.exit(0);
}

if (!args.repo) {
  console.error('Error: --repo is required. Use --help for usage.');
  process.exit(2);
}

if (!ghAvailable()) {
  console.error('Error: gh CLI not available or not authenticated. Run: gh auth login');
  process.exit(2);
}

try {
  const milestones = await fetchMilestones({
    repo: args.repo,
    milestone: args.milestone,
    all: args.all,
    issuesOnly: args.issuesOnly,
    prsOnly: args.prsOnly,
  });
  
  const format = args.format || 'text';
  
  if (format === 'json') {
    console.log(formatJSON(milestones));
  } else if (format === 'markdown') {
    console.log(formatMarkdown(milestones));
  } else {
    console.log(formatText(milestones));
  }
  
  process.exit(milestones.length ? 0 : 0);
} catch (e) {
  console.error(`Error: ${e.message}`);
  process.exit(2);
}

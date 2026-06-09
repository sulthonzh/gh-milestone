# gh-milestone

See your GitHub issues and PRs grouped by milestone, right in the terminal.

Uses `gh` CLI under the hood — no API tokens needed, uses your existing GitHub auth.

## Why

GitHub milestones are great for tracking what's planned for a release, but checking them means opening the browser. This tool puts milestone progress right in your terminal — perfect for standup prep, sprint reviews, or just staying on top of what's due.

## Install

```bash
npm install -g gh-milestone
```

Or just run it:

```bash
npx gh-milestone
```

## Usage

```bash
# See all milestones for a repo
gh-milestone --repo owner/repo

# Include closed milestones
gh-milestone --repo owner/repo --all

# Show only issues (no PRs)
gh-milestone --repo owner/repo --issues-only

# Show only PRs
gh-milestone --repo owner/repo --prs-only

# JSON output
gh-milestone --repo owner/repo --json

# Markdown output (paste into GitHub/wiki)
gh-milestone --repo owner/repo --markdown

# Specific milestone by title
gh-milestone --repo owner/repo --milestone "v2.0"
```

## Output

### Text (default)

```
milestone: v2.0 (open) — due 2026-06-15
  progress: ████████░░ 8/10 (80%)
  
  ✅ Done:
    #42 Add dark mode support (PR, merged)
    #39 Fix login redirect (issue, closed)
  
  ⏳ Open:
    #45 Refactor settings page (issue)
    #44 Update dependencies (PR, draft)

milestone: v1.5 (closed) — 3 issues
  progress: ██████████ 3/3 (100%)
```

### JSON

```json
[{"title":"v2.0","state":"open","dueOn":"2026-06-15","total":10,"closed":8,"items":[...]}]
```

## Programmatic API

```js
import { fetchMilestones, formatText } from 'gh-milestone';

const milestones = await fetchMilestones({ repo: 'owner/repo' });
console.log(formatText(milestones));
```

## Requirements

- [GitHub CLI](https://cli.github.com/) (`gh`) installed and authenticated

## License

MIT

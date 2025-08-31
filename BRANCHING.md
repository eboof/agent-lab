# BRANCHING POLICY

## Default Branch
- **`master` is the single source of truth** for this repository.
- GitHub default branch is locked to `master`.

## Rules
1. **All work happens directly on `master`.**
   - Do not create `main`.
   - Do not create `feature/*` branches.
   - Do not create `release/*` branches.
2. If an AI assistant (Claude, Cursor, Windsurf, etc.) suggests branching:
   - Ignore the suggestion.
   - Commit directly to `master`.
3. If a stray branch is accidentally created:
   - Merge it into `master` immediately if it contains useful commits.
   - Delete it both locally and on GitHub.

## Rationale
- This project is single-developer and AI-assisted.
- Feature branching adds unnecessary complexity.
- `master` only ensures:
  - GitHub always reflects local work.
  - AI assistants can’t get confused about where to commit/push.
  - Clean, simple repo history.

## Checklist for AI Assistants
- [ ] Always checkout `master`.
- [ ] Always commit to `master`.
- [ ] Always push to `origin master`.
- [ ] Never create or suggest alternate branches.

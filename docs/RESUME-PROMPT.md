# YOIBI Resume Prompt

Use `/yoibi-resume` after an AI model reaches its limit, crashes, disconnects, or is replaced.

The new model must:

1. Read `.agents/AI-AGENT.md`.
2. Read `PROJECT-STRUCTURE.md`.
3. Read `docs/WORKBASE.md`.
4. Read `docs/MODEL-HANDOFF.md`.
5. Read the relevant skill files and API contract.
6. Run `git status` and inspect the latest diff.
7. Verify the last completed state with the smallest relevant test/lint/build check.
8. Continue from `Next exact step`.
9. Never restart completed work unless verification proves it is broken.
10. Update both workbase and handoff before stopping.

The model must first report the recovered phase and next exact step before changing code.

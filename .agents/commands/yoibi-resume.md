# /yoibi-resume Command

When the user gives the command `/yoibi-resume`, execute this protocol:

1. Read `.agents/AI-AGENT.md`.
2. Read `PROJECT-STRUCTURE.md`.
3. Read `docs/WORKBASE.md`.
4. Read `docs/MODEL-HANDOFF.md`.
5. Read relevant skill files and `contracts/API-CONTRACT.md`.
6. Inspect git status and the files referenced by the handoff.
7. Do NOT restart completed work.
8. Verify the last known state by running the smallest safe checks.
9. Continue from `Next exact step` in the handoff/workbase.
10. Test during implementation, not only at the end.
11. Update the handoff before finishing the session.

Required response behavior:
- Start by stating the current phase and exact next step recovered from the handoff.
- Do not repeat already-completed implementation unless verification proves it is broken.

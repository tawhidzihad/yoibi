# /yoibi-resume Command

When the user gives the command `/yoibi-resume`, execute this minimal-context resume protocol:

1. Read ONLY these three files, in this order, before anything else:
   1. `AGENTS.md` (repo root)
   2. `docs/MODEL-HANDOFF.md`
   3. `docs/WORKBASE.md`
   These three files are sufficient to reconstruct exactly where work left off. Do NOT explore the repo or read other docs as a first action. (Claude Code agents use the identical protocol in `.claude/commands/yoibi-resume.md`.)
2. Identify the exact last completed step, the exact next step, and any known issues/blockers from `docs/MODEL-HANDOFF.md`. If historical architecture detail is needed, read only the specific section in `docs/MODEL-HANDOFF-ARCHIVE.md` or `docs/WORKBASE-ARCHIVE.md` — never the whole archive.
3. Only if the next step requires touching specific files, read THOSE specific files (minimum needed). Never a full-repo read.
4. Before writing any code, print a short summary — last done, immediate next step, blockers — and ask the user "Resume with this?" for confirmation in case they want to redirect.
5. Once confirmed, continue following ALL rules in `AGENTS.md` (existing code structure and design system, no invented auth/env values, lint/tests/build before finishing, deploy + live-test https://www.yoibi.com/ before pushing when user-facing). Do NOT restart completed work unless verification proves it is broken.
6. Test during implementation, not only at the end.
7. Before finishing, update `docs/WORKBASE.md` and `docs/MODEL-HANDOFF.md` in their standard section format — mandatory, every session, whether or not the task felt complete.

Required response behavior:
- Start by stating the current phase and exact next step recovered from the handoff.
- Do not repeat already-completed implementation unless verification proves it is broken.
- Token discipline throughout: minimal-context-in, precise-resume-out.

# Tailwind CSS Skill

Source of truth: https://tailwindcss.com/docs/upgrade-guide

Use Tailwind CSS v4.

The official v3→v4 guide recommends the upgrade tool for migration and requires Node.js 20+ for that tool. Verify current browser support requirements before changing the target.

YOIBI rules:
- Keep design tokens centralized in `src/app/globals.css`.
- Preserve legacy YOIBI colors/fonts.
- Prefer readable utility classes and reusable shared UI components.
- Avoid arbitrary values when design tokens already exist.
- Do not make component styling depend on page-specific magic numbers unless documented.

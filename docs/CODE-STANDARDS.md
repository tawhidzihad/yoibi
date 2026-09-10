# YOIBI Code Standards

## Formatting
- JavaScript only.
- 4 spaces per indentation level.
- Tabs are forbidden.
- Keep lines readable; break long expressions instead of creating horizontal scrolling.
- Use semicolons consistently if the existing formatter/lint setup requires them.
- Use clear descriptive names.

## JavaScript
- Prefer `const`; use `let` only when reassignment is required.
- Prefer small functions with one responsibility.
- Avoid deeply nested conditionals.
- Avoid clever one-liners when they reduce readability.
- Handle expected errors explicitly.
- Do not leave debug logging in production code.

## React/Next.js
- Follow the App Router boundaries.
- Mark Client Components only when browser interactivity/state is needed.
- Do not put secrets in client code.
- Keep pages thin; move feature logic into `features/`.
- Use `loading.js`, `error.js`, and `not-found.js` where they improve UX.

## Forms
- All non-trivial forms use React Hook Form.
- Mandatory fields must be required and have clear messages.
- Optional fields must remain optional.
- Server errors must be mapped to useful user-facing field/form errors.

## API
- All frontend API calls go through the central API client.
- Never duplicate endpoint paths in multiple components.
- Every endpoint must have a documented request/response contract.

## CSS/Tailwind
- Prefer Tailwind utilities for component styling.
- Put design tokens such as colors, font families, radii, shadows, and spacing decisions in one global theme/source.
- Preserve legacy YOIBI colors/fonts unless a deliberate redesign task says otherwise.
- Avoid arbitrary values when an existing token can express the design.

## Git
- Make small logical commits.
- Do not rewrite unrelated history.
- Never commit `.env` or secrets.

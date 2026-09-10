# Testing Skill

Use testing as part of implementation, not as a final ceremony.

Rules:
- After each meaningful slice, run the smallest relevant test/check.
- Always run ESLint on changed application code.
- Run build checks when routing/config/build behavior changes.
- For API work, test success, authentication failure, authorization failure, validation failure, and not-found cases.
- For forms, test required-field errors, successful submission, server error mapping, and duplicate-submit prevention.
- For realtime systems, test connect/join/leave/reconnect/error paths.
- For admin destructive actions, test permissions and data cleanup behavior before considering the feature complete.
- Prefer simple maintainable test tooling; do not add a large test framework stack without a reason.

# React Hook Form Skill

Source of truth: https://react-hook-form.com/get-started

Use React Hook Form for all non-trivial forms and form-like workflows.

Rules:
- Use `useForm` for form state.
- Use `register` for native-compatible fields.
- Use `Controller` when integrating controlled/custom inputs that need it.
- Use `handleSubmit` for submission flow.
- Use `formState.errors` for clear field-level feedback.
- Keep required and optional fields explicit.
- Show accessible error text near the relevant field.
- Map backend validation errors into RHF errors instead of showing only generic alerts.
- Prevent duplicate submissions while a request is pending.
- Reset/clear form state intentionally after success or when appropriate.
- Do not manually recreate form state with dozens of `useState` calls.

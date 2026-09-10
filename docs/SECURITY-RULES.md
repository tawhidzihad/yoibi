# YOIBI Security Rules

## Authentication architecture
- Better Auth manages user authentication.
- Better Auth JWT plugin supplies a verifiable JWT and JWKS endpoint.
- Backend protected APIs verify the Bearer token before business logic.
- The frontend proxy is an additional UX/request guard, not the final security boundary.

## Authorization
- Backend checks the authenticated user on every protected operation.
- Never trust `userId`, `role`, `isAdmin`, ownership, or permissions from the client.
- Derive the acting user from the verified token/session context.
- Admin actions require server-side admin authorization.

## Secrets
Never expose to the browser:
- MongoDB URI
- API secrets
- Better Auth/JWT signing secrets/private keys
- Cloudinary API secret
- LiveKit API secret
- admin password

Only explicitly public client variables may use a browser-exposed prefix.

## HTTP/realtime safety
- Enforce CORS/trusted origins.
- Validate and sanitize user input.
- Rate limit authentication, messaging, reporting, and expensive endpoints.
- Guard Socket.IO connection and event actions with authentication/authorization.
- Use HTTPS in deployment.
- Do not leak stack traces or secret values in API responses.
- Use secure cookie settings where Better Auth sessions/cookies are involved.

## Admin moderation
- Ban is a destructive account/data operation. Require strong server checks and confirmation.
- Block is an access-denial state with a user-facing blocked page and reason form.
- Unblock restores access after server-side authorization.
- Keep an audit trail for moderation actions where practical.

## Code readability
Security code must remain easy to read. Avoid needless obfuscation, giant middleware files, magic condition chains, or unexplained security abstractions.

const { z } = require('zod');
const { normalizeHandleParam, MIN_HANDLE_LENGTH, MAX_HANDLE_LENGTH } = require('../utils/handles');

// Validate the :handle path parameter for public profile lookup.
// Normalized server-side: "@Tawhid" -> "tawhid" (URL handles arrive without
// the "@" prefix; the canonical stored handle also omits it in URL contexts).
const userHandleParamSchema = z.object({
    handle: z.string().min(1, 'Handle is required').transform(normalizeHandleParam)
});

// Editable handle rules (profile username):
//   - normalized (lowercase, "@"-prefix stripped, URL-safe [a-z0-9])
//   - minimum length enforced AFTER normalization
//   - over-length input is REJECTED (never silently truncated on user edit)
const editableHandleSchema = z.string().transform((value, ctx) => {
    const rawUsable = typeof value === "string"
        ? value.trim().replace(/^@+/, "").toLowerCase().replace(/[^a-z0-9]/g, "")
        : "";
    const normalized = normalizeHandleParam(value);
    if (rawUsable.length > MAX_HANDLE_LENGTH) {
        ctx.addIssue({
            code: "custom",
            message: `Handle cannot exceed ${MAX_HANDLE_LENGTH} characters`
        });
        return z.NEVER;
    }
    if (normalized.length < MIN_HANDLE_LENGTH) {
        ctx.addIssue({
            code: "custom",
            message: `Handle must be at least ${MIN_HANDLE_LENGTH} characters`
        });
        return z.NEVER;
    }
    return normalized;
});

// Profile image URLs must be real http(s) URLs — zod v4's `url()` accepts
// non-http schemes (e.g. `javascript:`), so the scheme is enforced explicitly.
const profileImageUrlSchema = z
    .string()
    .trim()
    .regex(/^https?:\/\/\S+$/i, 'Must be a valid http(s) URL')
    .max(1000);

// Validate the request body for updating own profile.
// STRICT allowlist: identity, role, block state, timestamps and every other
// server-managed field are structurally impossible to submit (`.strict()`).
const updateUserBodySchema = z.object({
    name: z.string().min(1).max(50).optional(),
    bio: z.string().max(280).optional(),
    avatarUrl: z.union([z.literal(''), profileImageUrlSchema]).optional(),
    bannerUrl: z.union([z.literal(''), profileImageUrlSchema]).optional(),
    // Optional handle (username) edit — uniqueness is enforced by the database
    // unique index and surfaced as 422 HANDLE_TAKEN by the controller.
    handle: editableHandleSchema.optional(),
    // Canonical country representation: ISO 3166-1 alpha-2 code, uppercase.
    // Empty string clears the field (Google users start empty).
    country: z.union([
        z.literal(''),
        z
            .string()
            .regex(/^[A-Za-z]{2}$/, 'Country must be a valid ISO 3166-1 alpha-2 code')
            .transform((value) => value.toUpperCase())
    ]).optional(),
    // YOIBI onboarding policy: age >= 16. Null/empty clears/omits (Google users
    // start empty and complete the profile later). Age arrives from JSON as a
    // number or an empty/null placeholder — never trust a client fabrication.
    age: z.union([z.null(), z.literal(''), z.preprocess(
        (value) => (typeof value === 'string' && value.trim() === '' ? '' : Number(value)),
        z.union([z.literal(''), z.number().int('Age must be a whole number').min(16, 'Age must be at least 16').max(120, 'Enter a valid age')])
    )]).optional(),
    // Empty string clears the field (Google users start empty).
    phone: z.union([
        z.literal(''),
        z
            .string()
            .max(20, 'Phone number is too long')
            .regex(/^\+?[\d\s\-().]{7,20}$/, 'Enter a valid phone number')
    ]).optional()
}).strict();

const userIdParamSchema = z.object({
    id: z.string().min(1, 'User ID is required')
});

// Validate the query for people search (GET /users/search).
//   - q: required, 1-100 chars (same cap as admin search — regex-DoS guard)
//   - limit: 1-20, defaulted server-side (typeahead-sized result sets)
const searchUsersQuerySchema = z.object({
    q: z.string().trim().min(1, 'Search query is required').max(100, 'Search query cannot exceed 100 characters'),
    limit: z.coerce.number().int('Limit must be a whole number').min(1, 'Limit must be at least 1').max(20, 'Limit cannot exceed 20').default(10)
}).strict();

// Validate the body for requesting a server-issued profile-image upload
// signature (avatar / banner). The kind decides the Cloudinary folder.
const profileMediaSignatureSchema = z.object({
    kind: z.enum(['avatar', 'banner'])
});

module.exports = {
    userHandleParamSchema,
    updateUserBodySchema,
    userIdParamSchema,
    profileMediaSignatureSchema,
    searchUsersQuerySchema
};

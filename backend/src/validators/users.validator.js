const { z } = require('zod');

// Validate the :handle path parameter for public profile lookup
const userHandleParamSchema = z.object({
    handle: z.string().min(1, 'Handle is required')
});

// Validate the request body for updating own profile
const updateUserBodySchema = z.object({
    name: z.string().min(1).max(50).optional(),
    bio: z.string().max(280).optional(),
    avatarUrl: z.union([z.literal(''), z.string().url().max(1000)]).optional(),
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

module.exports = {
    userHandleParamSchema,
    updateUserBodySchema,
    userIdParamSchema
};

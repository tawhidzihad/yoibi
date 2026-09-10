const { z } = require('zod');

// Validate the :handle path parameter for public profile lookup
const userHandleParamSchema = z.object({
    handle: z.string().min(1, 'Handle is required')
});

// Validate the request body for updating own profile
const updateUserBodySchema = z.object({
    name: z.string().optional(),
    bio: z.string().optional(),
    avatarUrl: z.string().url().optional()
});

const userIdParamSchema = z.object({
    id: z.string().min(1, 'User ID is required')
});

module.exports = {
    userHandleParamSchema,
    updateUserBodySchema,
    userIdParamSchema
};

const { z } = require('zod');

// Validate the :handle path parameter for public profile lookup
const userHandleParamSchema = z.object({
    handle: z.string().min(1, 'Handle is required')
});

// Validate the request body for updating own profile
const updateUserBodySchema = z.object({
    name: z.string().min(1).max(50).optional(),
    bio: z.string().max(280).optional(),
    avatarUrl: z.string().url().max(1000).optional()
});

const userIdParamSchema = z.object({
    id: z.string().min(1, 'User ID is required')
});

module.exports = {
    userHandleParamSchema,
    updateUserBodySchema,
    userIdParamSchema
};

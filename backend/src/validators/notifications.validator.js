const { z } = require('zod');

const listNotificationsQuerySchema = z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(50).optional().default(20),
    read: z.preprocess((val) => {
        if (val === 'true' || val === true) return true;
        if (val === 'false' || val === false) return false;
        return undefined;
    }, z.boolean().optional())
});

const notificationIdParamSchema = z.object({
    id: z.string().min(1, 'Notification ID is required')
});

module.exports = {
    listNotificationsQuerySchema,
    notificationIdParamSchema
};

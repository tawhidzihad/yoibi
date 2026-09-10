const { z } = require("zod");

const createMeetupRoomSchema = z.object({
    name: z
        .string({ required_error: "Room name is required" })
        .trim()
        .min(3, "Room name must be at least 3 characters")
        .max(100, "Room name cannot exceed 100 characters"),
    topic: z
        .string()
        .trim()
        .max(100, "Topic cannot exceed 100 characters")
        .optional()
        .default(""),
    maxParticipants: z.coerce
        .number()
        .int("Maximum participants must be an integer")
        .min(2, "Maximum participants must be at least 2")
        .max(50, "Maximum participants cannot exceed 50")
        .optional()
        .default(12)
});

const listMeetupRoomsQuerySchema = z.object({
    status: z.enum(["active", "ended", "all"]).optional().default("active"),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(20)
});

const meetupRoomIdParamSchema = z.object({
    roomId: z.string().trim().min(1, "Room ID is required")
});

module.exports = {
    createMeetupRoomSchema,
    listMeetupRoomsQuerySchema,
    meetupRoomIdParamSchema
};

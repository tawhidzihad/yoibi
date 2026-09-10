const { createMeetupRoom } = require("../../services/create/meetup.service");

/**
 * HTTP Handler: Creates a new Meet-Up room and returns initial host token.
 */
async function handleCreateMeetupRoom(req, res, next) {
    try {
        const result = await createMeetupRoom(req.user, req.body);
        return res.status(201).json({
            success: true,
            data: result,
            message: "Meet-Up room created successfully"
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    handleCreateMeetupRoom
};

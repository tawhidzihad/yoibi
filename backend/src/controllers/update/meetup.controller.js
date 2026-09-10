const { endMeetupRoom } = require("../../services/update/meetup.service");

/**
 * HTTP Handler: Ends an active Meet-Up room and terminates LiveKit session (room owner only).
 */
async function handleEndMeetupRoom(req, res, next) {
    try {
        const result = await endMeetupRoom(req.user, req.params.roomId);
        return res.status(200).json({
            success: true,
            data: result,
            message: "Meet-Up room ended successfully"
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    handleEndMeetupRoom
};

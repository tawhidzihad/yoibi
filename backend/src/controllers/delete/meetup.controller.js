const { deleteMeetupRoom } = require("../../services/delete/meetup.service");

/**
 * HTTP Handler: Permanently deletes a Meet-Up room document (ended rooms only).
 */
async function handleDeleteMeetupRoom(req, res, next) {
    try {
        const result = await deleteMeetupRoom(req.user, req.params.roomId);
        return res.status(200).json({
            success: true,
            data: result,
            message: "Meet-Up room deleted permanently"
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    handleDeleteMeetupRoom
};

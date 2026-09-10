const {
    listMeetupRooms,
    getMeetupRoomById,
    joinMeetupRoom
} = require("../../services/read/meetup.service");

/**
 * HTTP Handler: Retrieves paginated list of Meet-Up rooms.
 */
async function handleListMeetupRooms(req, res, next) {
    try {
        const query = req.validatedQuery || req.query;
        const result = await listMeetupRooms(query);
        return res.status(200).json({
            success: true,
            data: result,
            message: "Meet-Up rooms retrieved successfully"
        });
    } catch (err) {
        next(err);
    }
}

/**
 * HTTP Handler: Retrieves single Meet-Up room details.
 */
async function handleGetMeetupRoomById(req, res, next) {
    try {
        const room = await getMeetupRoomById(req.params.roomId);
        return res.status(200).json({
            success: true,
            data: room,
            message: ""
        });
    } catch (err) {
        next(err);
    }
}

/**
 * HTTP Handler: Validates capacity & issues LiveKit participant token for joining a Meet-Up room.
 */
async function handleJoinMeetupRoom(req, res, next) {
    try {
        const result = await joinMeetupRoom(req.params.roomId, req.user);
        return res.status(200).json({
            success: true,
            data: result,
            message: "Meet-Up room join token generated"
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    handleListMeetupRooms,
    handleGetMeetupRoomById,
    handleJoinMeetupRoom
};

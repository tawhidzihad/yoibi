const { Router } = require("express");
const { verifyJwt, optionalAuth } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const {
    createMeetupRoomSchema,
    listMeetupRoomsQuerySchema,
    meetupRoomIdParamSchema
} = require("../validators/meetup.validator");

const { handleCreateMeetupRoom } = require("../controllers/create/meetup.controller");
const {
    handleListMeetupRooms,
    handleGetMeetupRoomById,
    handleJoinMeetupRoom
} = require("../controllers/read/meetup.controller");
const { handleEndMeetupRoom } = require("../controllers/update/meetup.controller");
const { handleDeleteMeetupRoom } = require("../controllers/delete/meetup.controller");

const router = Router();

// Meet-Up Room Listing & Creation
router.get("/meetup/rooms", optionalAuth, validate(listMeetupRoomsQuerySchema, "query"), handleListMeetupRooms);
router.post("/meetup/rooms", verifyJwt, validate(createMeetupRoomSchema, "body"), handleCreateMeetupRoom);

// Meet-Up Room Details
router.get("/meetup/rooms/:roomId", optionalAuth, validate(meetupRoomIdParamSchema, "params"), handleGetMeetupRoomById);

// Meet-Up Room Interactive Participation (Join, End)
router.post("/meetup/rooms/:roomId/join", verifyJwt, validate(meetupRoomIdParamSchema, "params"), handleJoinMeetupRoom);
router.post("/meetup/rooms/:roomId/end", verifyJwt, validate(meetupRoomIdParamSchema, "params"), handleEndMeetupRoom);

// Meet-Up Room Permanent Deletion (Ended only)
router.delete("/meetup/rooms/:roomId", verifyJwt, validate(meetupRoomIdParamSchema, "params"), handleDeleteMeetupRoom);

module.exports = router;

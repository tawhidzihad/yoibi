const crypto = require("crypto");
const meetupRepository = require("../../repositories/meetup.repository");
const { generateMeetupParticipantToken, reserveSlot } = require("../../integrations/livekit/livekit");
const { MEETUP_STATUS } = require("../../models/meetup.model");

/**
 * Creates a new Meet-Up room in 'active' state and issues an initial host participant token.
 *
 * @param {object} user - Authenticated user context (req.user)
 * @param {object} input - Validated room input (name, topic, maxParticipants)
 * @returns {Promise<{ room: object, livekitUrl: string, token: string, participantIdentity: string }>}
 */
async function createMeetupRoom(user, input) {
    if (!user || !user.id) {
        const error = new Error("Authentication required to create a Meet-Up room.");
        error.statusCode = 401;
        error.code = "UNAUTHORIZED";
        throw error;
    }

    const roomName = `meetup_${crypto.randomUUID()}`;
    const roomId = `mup_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const maxParticipants = input.maxParticipants || 12;

    // Atomically reserve host's slot in the room
    await reserveSlot(roomName, maxParticipants);

    // Generate host participant token with opaque identity & minimized metadata
    const { token, url, participantIdentity } = await generateMeetupParticipantToken(roomName, user);

    const meetupData = {
        _id: roomId,
        id: roomId,
        ownerId: user.id,
        name: input.name.trim(),
        topic: input.topic ? input.topic.trim() : "",
        roomName,
        maxParticipants,
        status: MEETUP_STATUS.ACTIVE,
        startedAt: new Date(),
        endedAt: null,
        createdAt: new Date()
    };

    const saved = await meetupRepository.create(meetupData);
    const enriched = await meetupRepository.enrichOwner(saved);

    return {
        room: enriched,
        livekitUrl: url,
        token,
        participantIdentity
    };
}

module.exports = {
    createMeetupRoom
};

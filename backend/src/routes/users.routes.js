const { Router } = require('express');
const { getPublicProfile } = require('../controllers/read/users.controller');
const { updateMe, handleGetProfileMediaSignature } = require('../controllers/update/users.controller');
const { handleFollowUser } = require('../controllers/create/follows.controller');
const { handleUnfollowUser } = require('../controllers/delete/follows.controller');
const { verifyJwt, optionalAuth } = require('../middleware/auth');
const { requireAuth } = require('../middleware/authorize');
const { validate } = require('../middleware/validate');
const {
    userHandleParamSchema,
    updateUserBodySchema,
    userIdParamSchema,
    profileMediaSignatureSchema
} = require('../validators/users.validator');
const { writeLimiter, expensiveLimiter } = require('../middleware/rate-limiter');

const router = Router();

// Profile image upload authorization (avatar/banner) — server-issued signature.
// NOTE: declared BEFORE /users/:handle so "me" is never matched as a handle.
router.post('/users/me/upload-signature', expensiveLimiter, verifyJwt, requireAuth, validate(profileMediaSignatureSchema, 'body'), handleGetProfileMediaSignature);

// Route order: /users/me (PATCH) before /users/:handle (GET) — different HTTP
// methods, but explicit ordering keeps "me" reserved for the self endpoints.
router.patch('/users/me', writeLimiter, verifyJwt, requireAuth, validate(updateUserBodySchema, 'body'), updateMe);
router.get('/users/:handle', optionalAuth, validate(userHandleParamSchema, 'params'), getPublicProfile);
router.post('/users/:id/follow', writeLimiter, verifyJwt, requireAuth, validate(userIdParamSchema, 'params'), handleFollowUser);
router.delete('/users/:id/follow', writeLimiter, verifyJwt, requireAuth, validate(userIdParamSchema, 'params'), handleUnfollowUser);

module.exports = router;

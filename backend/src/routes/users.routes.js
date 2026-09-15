const { Router } = require('express');
const { getPublicProfile, searchUsers } = require('../controllers/read/users.controller');
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
    profileMediaSignatureSchema,
    searchUsersQuerySchema
} = require('../validators/users.validator');
const { writeLimiter, expensiveLimiter, searchLimiter } = require('../middleware/rate-limiter');

const router = Router();

// Profile image upload authorization (avatar/banner) — server-issued signature.
// NOTE: declared BEFORE /users/:handle so "me" is never matched as a handle.
router.post('/users/me/upload-signature', expensiveLimiter, verifyJwt, requireAuth, validate(profileMediaSignatureSchema, 'body'), handleGetProfileMediaSignature);

// People search by name/username — declared BEFORE /users/:handle so "search"
// is never matched as a handle. Protected: anonymous user enumeration is not allowed.
router.get('/users/search', searchLimiter, verifyJwt, requireAuth, validate(searchUsersQuerySchema, 'query'), searchUsers);

// Route order: /users/me (PATCH) before /users/:handle (GET) — different HTTP
// methods, but explicit ordering keeps "me" reserved for the self endpoints.
router.patch('/users/me', writeLimiter, verifyJwt, requireAuth, validate(updateUserBodySchema, 'body'), updateMe);
router.get('/users/:handle', optionalAuth, validate(userHandleParamSchema, 'params'), getPublicProfile);
router.post('/users/:id/follow', writeLimiter, verifyJwt, requireAuth, validate(userIdParamSchema, 'params'), handleFollowUser);
router.delete('/users/:id/follow', writeLimiter, verifyJwt, requireAuth, validate(userIdParamSchema, 'params'), handleUnfollowUser);

module.exports = router;

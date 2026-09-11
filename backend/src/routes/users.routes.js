const { Router } = require('express');
const { getPublicProfile } = require('../controllers/read/users.controller');
const { updateMe } = require('../controllers/update/users.controller');
const { handleFollowUser } = require('../controllers/create/follows.controller');
const { handleUnfollowUser } = require('../controllers/delete/follows.controller');
const { verifyJwt } = require('../middleware/auth');
const { requireAuth } = require('../middleware/authorize');
const { validate } = require('../middleware/validate');
const { userHandleParamSchema, updateUserBodySchema, userIdParamSchema } = require('../validators/users.validator');
const { writeLimiter } = require('../middleware/rate-limiter');

const router = Router();

router.get('/users/:handle', verifyJwt, validate(userHandleParamSchema, 'params'), getPublicProfile);
router.patch('/users/me', writeLimiter, verifyJwt, requireAuth, validate(updateUserBodySchema, 'body'), updateMe);
router.post('/users/:id/follow', writeLimiter, verifyJwt, requireAuth, validate(userIdParamSchema, 'params'), handleFollowUser);
router.delete('/users/:id/follow', writeLimiter, verifyJwt, requireAuth, validate(userIdParamSchema, 'params'), handleUnfollowUser);

module.exports = router;

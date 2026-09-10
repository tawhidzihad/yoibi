const { Router } = require('express');
const { getPublicProfile } = require('../controllers/read/users.controller');
const { updateMe } = require('../controllers/update/users.controller');
const { verifyJwt } = require('../middleware/auth');
const { requireAuth } = require('../middleware/authorize');
const { validate } = require('../middleware/validate');
const { userHandleParamSchema, updateUserBodySchema } = require('../validators/users.validator');

const router = Router();

router.get('/users/:handle', validate(userHandleParamSchema, 'params'), getPublicProfile);
router.patch('/users/me', verifyJwt, requireAuth, validate(updateUserBodySchema, 'body'), updateMe);

module.exports = router;

const { Router } = require("express");
const { verifyJwt, optionalAuth } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const {
    createPostSchema,
    listPostsQuerySchema,
    postIdParamSchema,
    createCommentSchema,
    commentParamsSchema
} = require("../validators/posts.validator");

const { handleCreatePost } = require("../controllers/create/posts.controller");
const { handleListPosts, handleGetPostById } = require("../controllers/read/posts.controller");
const { handleLikePost, handleUnlikePost } = require("../controllers/update/posts.controller");
const { handleDeletePost } = require("../controllers/delete/posts.controller");

const { handleCreateComment } = require("../controllers/create/comments.controller");
const { handleGetComments } = require("../controllers/read/comments.controller");
const { handleDeleteComment } = require("../controllers/delete/comments.controller");

const router = Router();

// Feed & Posts Listing
router.get("/posts", optionalAuth, validate(listPostsQuerySchema, "query"), handleListPosts);
router.post("/posts", verifyJwt, validate(createPostSchema, "body"), handleCreatePost);

// Single Post Details & Deletion
router.get("/posts/:id", optionalAuth, validate(postIdParamSchema, "params"), handleGetPostById);
router.delete("/posts/:id", verifyJwt, validate(postIdParamSchema, "params"), handleDeletePost);

// Likes / Reactions
router.post("/posts/:id/like", verifyJwt, validate(postIdParamSchema, "params"), handleLikePost);
router.delete("/posts/:id/like", verifyJwt, validate(postIdParamSchema, "params"), handleUnlikePost);

// Comments
router.get("/posts/:id/comments", optionalAuth, validate(postIdParamSchema, "params"), handleGetComments);
router.post(
    "/posts/:id/comments",
    verifyJwt,
    validate(postIdParamSchema, "params"),
    validate(createCommentSchema, "body"),
    handleCreateComment
);
router.delete(
    "/posts/:id/comments/:commentId",
    verifyJwt,
    validate(commentParamsSchema, "params"),
    handleDeleteComment
);

module.exports = router;

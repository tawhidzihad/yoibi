const assert = require("assert");
const http = require("http");
const app = require("../src/app");
const postsRepository = require("../src/repositories/posts.repository");
const { createPost } = require("../src/services/create/posts.service");
const { listPosts, getPostById } = require("../src/services/read/posts.service");
const { likePost, unlikePost } = require("../src/services/update/posts.service");
const { deletePost } = require("../src/services/delete/posts.service");
const { createComment } = require("../src/services/create/comments.service");
const { getComments } = require("../src/services/read/comments.service");
const { deleteComment } = require("../src/services/delete/comments.service");

async function runPostsTests() {
    console.log("[Test] Starting Phase 4 Milestone 2 Posts & Comments verification...");

    // 1. In-process HTTP verification for unauthenticated & validation checks
    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const { port } = server.address();
    const baseUrl = `http://127.0.0.1:${port}`;

    function request(path, options = {}) {
        return new Promise((resolve, reject) => {
            const url = new URL(path, baseUrl);
            const req = http.request(url, options, (res) => {
                let data = "";
                res.on("data", (chunk) => { data += chunk; });
                res.on("end", () => {
                    let parsed = null;
                    try {
                        parsed = JSON.parse(data);
                    } catch {
                        parsed = data;
                    }
                    resolve({ status: res.statusCode, headers: res.headers, body: parsed });
                });
            });
            req.on("error", reject);
            if (options.body) {
                req.write(typeof options.body === "string" ? options.body : JSON.stringify(options.body));
            }
            req.end();
        });
    }

    try {
        // Test 1: GET /api/v1/posts (Public/Optional auth)
        const feedRes = await request("/api/v1/posts");
        assert.strictEqual(feedRes.status, 200, "GET /api/v1/posts must return 200");
        assert.strictEqual(feedRes.body.success, true);
        assert(Array.isArray(feedRes.body.data.items), "Items must be an array");
        assert(feedRes.body.data.pagination, "Pagination object must be present");
        console.log("✓ GET /api/v1/posts returned 200 OK with paginated envelope.");

        // Test 2: POST /api/v1/posts without auth -> 401
        const createUnauthRes = await request("/api/v1/posts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: { content: "Hello world" }
        });
        assert.strictEqual(createUnauthRes.status, 401);
        assert.strictEqual(createUnauthRes.body.success, false);
        assert.strictEqual(createUnauthRes.body.error.code, "UNAUTHORIZED");
        console.log("✓ POST /api/v1/posts without token rejected with 401 UNAUTHORIZED.");

        // Test 3: POST /api/v1/posts with empty body -> 401 before auth or 422 if auth is provided
        const likeUnauthRes = await request("/api/v1/posts/post_123/like", {
            method: "POST"
        });
        assert.strictEqual(likeUnauthRes.status, 401);
        console.log("✓ POST /api/v1/posts/:id/like without token rejected with 401.");

        // Test 4: POST /api/v1/posts/:id/comments without auth -> 401
        const commentUnauthRes = await request("/api/v1/posts/post_123/comments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: { content: "Nice post!" }
        });
        assert.strictEqual(commentUnauthRes.status, 401);
        console.log("✓ POST /api/v1/posts/:id/comments without token rejected with 401.");

        // Test 5: DELETE /api/v1/posts/:id without auth -> 401
        const deleteUnauthRes = await request("/api/v1/posts/post_123", {
            method: "DELETE"
        });
        assert.strictEqual(deleteUnauthRes.status, 401);
        console.log("✓ DELETE /api/v1/posts/:id without token rejected with 401.");

        // Test 6: GET /api/v1/posts/nonexistent -> 404
        const notFoundRes = await request("/api/v1/posts/post_nonexistent_9999");
        assert.strictEqual(notFoundRes.status, 404);
        assert.strictEqual(notFoundRes.body.error.code, "NOT_FOUND");
        console.log("✓ GET /api/v1/posts/:id with non-existent ID returned 404 NOT_FOUND.");

    } finally {
        await new Promise((resolve) => server.close(resolve));
    }

    // 2. Unit/Mocked In-Memory Repository Tests for Services
    console.log("\n[Test] Testing Post and Comment business logic in isolation...");

    // Mock in-memory repository store
    const inMemoryPosts = new Map();
    const originalCreate = postsRepository.create;
    const originalFindById = postsRepository.findById;
    const originalFindPaginated = postsRepository.findPaginated;
    const originalCount = postsRepository.count;
    const originalDeleteById = postsRepository.deleteById;
    const originalAddLike = postsRepository.addLike;
    const originalRemoveLike = postsRepository.removeLike;
    const originalAddComment = postsRepository.addComment;
    const originalRemoveComment = postsRepository.removeComment;
    const originalAttachAuthors = postsRepository.attachAuthors;
    const originalAttachCommentAuthors = postsRepository.attachCommentAuthors;

    postsRepository.create = async (doc) => {
        inMemoryPosts.set(doc._id, { ...doc });
        return doc;
    };
    postsRepository.findById = async (id) => {
        return inMemoryPosts.get(id) || null;
    };
    postsRepository.findPaginated = async () => {
        return Array.from(inMemoryPosts.values());
    };
    postsRepository.count = async () => inMemoryPosts.size;
    postsRepository.deleteById = async (id) => {
        const item = inMemoryPosts.get(id);
        inMemoryPosts.delete(id);
        return item || null;
    };
    postsRepository.addLike = async (postId, userId) => {
        const post = inMemoryPosts.get(postId);
        if (!post) return null;
        post.likes = post.likes || [];
        if (!post.likes.includes(userId)) {
            post.likes.push(userId);
        }
        post.likesCount = post.likes.length;
        return post;
    };
    postsRepository.removeLike = async (postId, userId) => {
        const post = inMemoryPosts.get(postId);
        if (!post) return null;
        post.likes = (post.likes || []).filter((id) => id !== userId);
        post.likesCount = post.likes.length;
        return post;
    };
    postsRepository.addComment = async (postId, comment) => {
        const post = inMemoryPosts.get(postId);
        if (!post) return null;
        post.comments = post.comments || [];
        post.comments.push(comment);
        post.commentsCount = (post.commentsCount || 0) + 1;
        return post;
    };
    postsRepository.removeComment = async (postId, commentId) => {
        const post = inMemoryPosts.get(postId);
        if (!post) return null;
        post.comments = (post.comments || []).filter((c) => c._id !== commentId);
        post.commentsCount = Math.max(0, (post.commentsCount || 1) - 1);
        return post;
    };
    postsRepository.attachAuthors = async (posts) => {
        const isArray = Array.isArray(posts);
        const list = isArray ? posts : [posts];
        const enriched = list.map((p) => ({
            ...p,
            id: p._id,
            author: { id: p.authorId, name: "Test Author", handle: "testauthor", avatarUrl: null }
        }));
        return isArray ? enriched : enriched[0];
    };
    postsRepository.attachCommentAuthors = async (comments) => {
        return (comments || []).map((c) => ({
            ...c,
            id: c._id,
            author: { id: c.authorId, name: "Commenter", handle: "commenter", avatarUrl: null }
        }));
    };

    try {
        const userA = { id: "usr_alice", role: "user" };
        const userB = { id: "usr_bob", role: "user" };
        const admin = { id: "usr_admin", role: "admin" };

        // Test A: Create Post
        const createdPost = await createPost({
            user: userA,
            content: "Hello from Yoibi test suite!",
            media: []
        });
        assert.strictEqual(createdPost.authorId, "usr_alice");
        assert.strictEqual(createdPost.content, "Hello from Yoibi test suite!");
        assert.strictEqual(createdPost.likesCount, 0);
        assert.strictEqual(createdPost.commentsCount, 0);
        console.log("✓ Service: createPost successfully saved and enriched post.");

        // Test B: Read Posts List
        const listResult = await listPosts({ page: 1, limit: 10, currentUserId: userA.id });
        assert.strictEqual(listResult.items.length, 1);
        assert.strictEqual(listResult.pagination.totalItems, 1);
        assert.strictEqual(listResult.items[0].liked, false);
        console.log("✓ Service: listPosts returned enriched list with pagination.");

        // Test C: Like and Unlike Post
        const likedResult = await likePost({ postId: createdPost.id, user: userA });
        assert.strictEqual(likedResult.liked, true);
        assert.strictEqual(likedResult.likesCount, 1);
        console.log("✓ Service: likePost incremented likesCount.");

        const singleAfterLike = await getPostById({ id: createdPost.id, currentUserId: userA.id });
        assert.strictEqual(singleAfterLike.liked, true);
        assert.strictEqual(singleAfterLike.likesCount, 1);
        console.log("✓ Service: getPostById reported post as liked by userA.");

        const unlikedResult = await unlikePost({ postId: createdPost.id, user: userA });
        assert.strictEqual(unlikedResult.liked, false);
        assert.strictEqual(unlikedResult.likesCount, 0);
        console.log("✓ Service: unlikePost decremented likesCount.");

        // Test D: Add Comment
        const comment = await createComment({
            postId: createdPost.id,
            user: userB,
            content: "Great post Alice!"
        });
        assert.strictEqual(comment.authorId, "usr_bob");
        assert.strictEqual(comment.content, "Great post Alice!");
        console.log("✓ Service: createComment successfully added comment.");

        const commentsList = await getComments({ postId: createdPost.id });
        assert.strictEqual(commentsList.items.length, 1);
        assert.strictEqual(commentsList.items[0].id, comment.id);
        console.log("✓ Service: getComments returned comments array.");

        // Test E: Delete Comment Authorization
        let unauthorizedCommentDeleteFailed = false;
        try {
            await deleteComment({ postId: createdPost.id, commentId: comment.id, user: { id: "usr_charlie", role: "user" } });
        } catch (err) {
            unauthorizedCommentDeleteFailed = (err.statusCode === 403);
        }
        assert.strictEqual(unauthorizedCommentDeleteFailed, true, "Unauthorized user cannot delete comment");
        console.log("✓ Service: deleteComment blocked unauthorized user with 403 FORBIDDEN.");

        // Comment Author can delete
        const deletedCommentRes = await deleteComment({ postId: createdPost.id, commentId: comment.id, user: userB });
        assert.strictEqual(deletedCommentRes.deletedId, comment.id);
        console.log("✓ Service: deleteComment allowed comment author to delete comment.");

        // Test F: Delete Post Authorization
        let unauthorizedPostDeleteFailed = false;
        try {
            await deletePost({ postId: createdPost.id, user: userB });
        } catch (err) {
            unauthorizedPostDeleteFailed = (err.statusCode === 403);
        }
        assert.strictEqual(unauthorizedPostDeleteFailed, true, "Non-author user cannot delete post");
        console.log("✓ Service: deletePost blocked non-author with 403 FORBIDDEN.");

        // Admin can delete post
        const adminDeleteRes = await deletePost({ postId: createdPost.id, user: admin });
        assert.strictEqual(adminDeleteRes.deletedId, createdPost.id);
        console.log("✓ Service: deletePost allowed admin to delete post.");

    } finally {
        // Restore repository methods
        postsRepository.create = originalCreate;
        postsRepository.findById = originalFindById;
        postsRepository.findPaginated = originalFindPaginated;
        postsRepository.count = originalCount;
        postsRepository.deleteById = originalDeleteById;
        postsRepository.addLike = originalAddLike;
        postsRepository.removeLike = originalRemoveLike;
        postsRepository.addComment = originalAddComment;
        postsRepository.removeComment = originalRemoveComment;
        postsRepository.attachAuthors = originalAttachAuthors;
        postsRepository.attachCommentAuthors = originalAttachCommentAuthors;
    }

    console.log("\nAll Phase 4 Milestone 2 Posts & Comments tests passed successfully!");
}

module.exports = { runPostsTests };

if (require.main === module) {
    runPostsTests().catch((err) => {
        console.error("Posts test failed:", err);
        process.exit(1);
    });
}

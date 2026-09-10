import { useState, useRef, useEffect, useCallback, useMemo, memo } from "react";
import { useNavigate } from "react-router-dom";
import { BlurFade, MagicCard, ShareModal, ImageLightbox, ImageCarousel } from "@/shared/ui";
import type { LightboxState } from "@/shared/ui";
import { posts as initialPosts, users, userMap, mockComments } from "@/shared/api";
import { buildThreadGroups } from "@/shared/lib";
import type { Post, Comment } from "@/shared/api";
import {
  Heart,
  MessageCircle,
  Repeat2,
  Share,
  Plus,
  Send,
  Bookmark,
  BookmarkCheck,
  MoreHorizontal,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

interface CommentSectionProps {
  postId: number;
  comments: Comment[];
  onAddComment: (postId: number) => void;
}

interface PostItemProps {
  post: Post;
  onLike: (id: number, isLiking: boolean) => void;
  onRepost: (id: number, isReposting: boolean) => void;
  onAddComment: (postId: number) => void;
  onOpenImage: (images: string[], index: number) => void;
  onShare: (post: Post) => void;
  hasThreadBelow: boolean;
  isReply: boolean;
}

function CommentSection({ postId, comments, onAddComment }: CommentSectionProps) {
  const [newComment, setNewComment] = useState("");
  const [localComments, setLocalComments] = useState<Comment[]>(comments);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const comment: Comment = {
      id: Date.now(),
      userId: 1,
      text: newComment,
      likes: 0,
      time: "Just now",
    };
    setLocalComments([comment, ...localComments]);
    onAddComment(postId);
    setNewComment("");
  };

  const handleLikeComment = (commentId: number) => {
    setLocalComments((prev) =>
      prev.map((c) =>
        c.id === commentId ? { ...c, likes: c.likes + 1 } : c
      )
    );
  };

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="overflow-hidden"
    >
      <div className="mt-3 border-t border-border/50 pt-3">
        <form onSubmit={handleSubmit} className="mb-3 flex gap-2">
          <img
            src={users[0].avatar}
            alt="You"
            className="h-7 w-7 rounded-full bg-secondary"
          />
          <div className="flex flex-1 items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5">
            <input
              ref={inputRef}
              type="text"
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="cursor-pointer text-cyan-400 transition-colors hover:text-cyan-300 disabled:cursor-default disabled:opacity-30"
            >
              <Send size={14} />
            </button>
          </div>
        </form>

        <div className="space-y-2.5">
          {localComments.map((comment, i) => {
            const commentUser = userMap.get(comment.userId);
            return (
              <motion.div
                key={comment.id}
                initial={i === 0 && comment.time === "Just now" ? { opacity: 0, y: -10 } : false}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-2"
              >
                <img
                  src={commentUser?.avatar || users[0].avatar}
                  alt=""
                  className="mt-0.5 h-6 w-6 rounded-full bg-secondary"
                />
                <div className="flex-1">
                  <div className="rounded-xl bg-secondary/70 px-3 py-2">
                    <span className="text-xs font-semibold text-foreground">
                      {commentUser?.name || "You"}
                    </span>
                    <p className="text-sm text-foreground/80">{comment.text}</p>
                  </div>
                  <div className="mt-0.5 flex items-center gap-3 px-1">
                    <span className="text-xs text-muted-foreground">
                      {comment.time}
                    </span>
                    <button
                      onClick={() => handleLikeComment(comment.id)}
                      className="cursor-pointer text-xs text-muted-foreground transition-colors hover:text-pink-400"
                    >
                      {comment.likes > 0 ? `${comment.likes} likes` : "Like"}
                    </button>
                    <button className="cursor-pointer text-xs text-muted-foreground transition-colors hover:text-foreground">
                      Reply
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

const PostItem = memo(function PostItem({ post, onLike, onRepost, onAddComment, onOpenImage, onShare, hasThreadBelow, isReply }: PostItemProps) {
  const user = userMap.get(post.userId)!;
  const navigate = useNavigate();
  const [showComments, setShowComments] = useState(false);
  const [liked, setLiked] = useState(false);
  const [reposted, setReposted] = useState(false);
  const [saved, setSaved] = useState(false);
  const comments = mockComments[post.id] || [];
  const postImages = post.images || (post.image ? [post.image] : []);
  const handleGoToWall = () => navigate(`/wall/${user.handle.slice(1)}`);
  const handleLike = () => {
    setLiked(!liked);
    onLike(post.id, !liked);
  };

  const handleRepost = () => {
    setReposted(!reposted);
    onRepost(post.id, !reposted);
  };

  return (
    <>
      <div className={`relative px-5 pt-5 ${hasThreadBelow ? "pb-2" : "pb-5"}`}>
        {isReply && (
          <div className="absolute left-[39px] top-0 h-5 w-0.5 bg-border" />
        )}
        {hasThreadBelow && (
          <div className="absolute left-[39px] bottom-0 top-[60px] w-0.5 bg-border" />
        )}
        <div className="flex gap-3">
          <div className="flex flex-col items-center">
            <img
              src={user.avatar}
              alt={user.name}
              onClick={handleGoToWall}
              className="relative z-10 h-10 w-10 shrink-0 cursor-pointer rounded-full bg-secondary transition-opacity hover:opacity-80"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span onClick={handleGoToWall} className="cursor-pointer font-semibold text-foreground hover:underline">{user.name}</span>
                <span onClick={handleGoToWall} className="cursor-pointer text-sm text-muted-foreground hover:underline">{user.handle}</span>
                <span className="text-sm text-muted-foreground">·</span>
                <span className="text-sm text-muted-foreground">{post.time}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setSaved(!saved)}
                  className="cursor-pointer rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  {saved ? (
                    <BookmarkCheck size={16} className="text-cyan-400" />
                  ) : (
                    <Bookmark size={16} />
                  )}
                </button>
                <button className="cursor-pointer rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                  <MoreHorizontal size={16} />
                </button>
              </div>
            </div>
            <p className="mt-0.5 text-sm leading-relaxed text-foreground/90">{post.text}</p>
            {postImages.length > 0 && (
              <ImageCarousel
                images={postImages}
                onImageClick={(i) => onOpenImage(postImages, i)}
              />
            )}
            <div className="mt-3 flex items-center gap-5">
              <button
                onClick={handleLike}
                className={`flex cursor-pointer items-center gap-1.5 text-sm transition-all ${
                  liked ? "text-pink-400" : "text-muted-foreground hover:text-pink-400"
                }`}
              >
                <motion.div animate={liked ? { scale: [1, 1.3, 1] } : {}} transition={{ duration: 0.3 }}>
                  <Heart size={16} fill={liked ? "currentColor" : "none"} />
                </motion.div>
                {post.likes}
              </button>
              <button
                onClick={() => setShowComments(!showComments)}
                className={`flex cursor-pointer items-center gap-1.5 text-sm transition-colors ${
                  showComments ? "text-cyan-400" : "text-muted-foreground hover:text-cyan-400"
                }`}
              >
                <MessageCircle size={16} /> {post.comments}
              </button>
              <button
                onClick={handleRepost}
                className={`flex cursor-pointer items-center gap-1.5 text-sm transition-all ${
                  reposted ? "text-green-400" : "text-muted-foreground hover:text-green-400"
                }`}
              >
                <motion.div animate={reposted ? { rotate: [0, -20, 20, 0] } : {}} transition={{ duration: 0.3 }}>
                  <Repeat2 size={16} />
                </motion.div>
                {post.reposts}
              </button>
              <button
                onClick={() => onShare(post)}
                className="flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <Share size={16} />
              </button>
            </div>

            <AnimatePresence>
              {showComments && (
                <CommentSection postId={post.id} comments={comments} onAddComment={onAddComment} />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

    </>
  );
});



export default function Feed() {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [newPost, setNewPost] = useState("");
  const [showComposer, setShowComposer] = useState(false);
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);
  const [sharePost, setSharePost] = useState<Post | null>(null);

  const handleLike = useCallback((id: number, isLiking: boolean) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, likes: isLiking ? p.likes + 1 : p.likes - 1 }
          : p
      )
    );
  }, []);

  const handleRepost = useCallback((id: number, isReposting: boolean) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, reposts: isReposting ? p.reposts + 1 : p.reposts - 1 }
          : p
      )
    );
  }, []);

  const handleAddComment = useCallback((postId: number) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, comments: p.comments + 1 } : p
      )
    );
  }, []);

  const handleOpenImage = useCallback((images: string[], index: number) => {
    setLightbox({ images, index });
  }, []);

  const threadGroups = useMemo(() => buildThreadGroups(posts), [posts]);

  const handleNewPost = () => {
    if (!newPost.trim()) return;
    const post: Post = {
      id: Date.now(),
      userId: 1,
      text: newPost,
      likes: 0,
      comments: 0,
      reposts: 0,
      time: "Just now",
    };
    setPosts([post, ...posts]);
    setNewPost("");
    setShowComposer(false);
  };

  return (
    <div>
      <BlurFade delay={0.1}>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Feed</h1>
          <button
            onClick={() => setShowComposer(!showComposer)}
            className="flex cursor-pointer items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-cyan-700"
          >
            <Plus size={16} /> New Post
          </button>
        </div>
      </BlurFade>

      {showComposer && (
        <BlurFade delay={0.05}>
          <MagicCard className="mb-6 p-4" gradientColor="#06b6d420">
            <div className="flex gap-3">
              <img
                src={users[0].avatar}
                alt="You"
                className="h-9 w-9 rounded-full bg-secondary"
              />
              <div className="flex-1">
                <textarea
                  rows={3}
                  placeholder="What's on your mind?"
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  className="w-full resize-none rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-cyan-500 focus:outline-none"
                  autoFocus
                />
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {newPost.length > 0 && `${newPost.length} characters`}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setShowComposer(false);
                        setNewPost("");
                      }}
                      className="cursor-pointer rounded-lg px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleNewPost}
                      disabled={!newPost.trim()}
                      className="flex cursor-pointer items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm text-white transition-colors hover:bg-cyan-700 disabled:cursor-default disabled:opacity-40"
                    >
                      <Send size={14} /> Post
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </MagicCard>
        </BlurFade>
      )}

      <div className="space-y-4">
        {threadGroups.map((group, gi) => (
          <BlurFade key={group[0].id} delay={0.1 + gi * 0.05}>
            <MagicCard className="overflow-hidden p-0" gradientColor="#06b6d410">
              {group.map((post, ti) => (
                <div key={post.id}>
                  <PostItem
                    post={post}
                    onLike={handleLike}
                    onRepost={handleRepost}
                    onAddComment={handleAddComment}
                    onOpenImage={handleOpenImage}
                    onShare={setSharePost}
                    hasThreadBelow={ti < group.length - 1}
                    isReply={!!post.replyTo}
                  />
                </div>
              ))}
            </MagicCard>
          </BlurFade>
        ))}
      </div>

      <AnimatePresence>
        {lightbox && (
          <ImageLightbox
            images={lightbox.images}
            initialIndex={lightbox.index}
            onClose={() => setLightbox(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {sharePost && (
          <ShareModal content={sharePost} onClose={() => setSharePost(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

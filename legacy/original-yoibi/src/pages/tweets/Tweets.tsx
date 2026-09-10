import { useState, useCallback, useMemo, memo } from "react";
import { useNavigate } from "react-router-dom";
import { BlurFade, MagicCard } from "@/shared/ui";
import { tweets as initialTweets, userMap } from "@/shared/api";
import type { Tweet } from "@/shared/api";
import { buildThreadGroups } from "@/shared/lib";
import { Heart, Repeat2, MessageCircle, Share, Plus, Send } from "lucide-react";
import { motion } from "motion/react";

interface TweetItemProps {
  tweet: Tweet;
  onLike: (id: number, isLiking: boolean) => void;
  onRetweet: (id: number, isRetweeting: boolean) => void;
  hasThreadBelow: boolean;
  isReply: boolean;
}

const TweetItem = memo(function TweetItem({ tweet, onLike, onRetweet, hasThreadBelow, isReply }: TweetItemProps) {
  const user = userMap.get(tweet.userId)!;
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);
  const [retweeted, setRetweeted] = useState(false);
  const handleGoToWall = () => navigate(`/wall/${user.handle.slice(1)}`);

  const handleLike = () => {
    setLiked(!liked);
    onLike(tweet.id, !liked);
  };

  const handleRetweet = () => {
    setRetweeted(!retweeted);
    onRetweet(tweet.id, !retweeted);
  };

  return (
    <div className={`px-4 ${isReply ? "pt-0" : "pt-4"} ${hasThreadBelow ? "pb-0" : "pb-4"}`}>
      <div className="flex gap-3">
        <div className="flex flex-col items-center">
          {isReply && (
            <div className="w-0.5 h-2 bg-border shrink-0" />
          )}
          <img
            src={user.avatar}
            alt={user.name}
            onClick={handleGoToWall}
            className="h-10 w-10 shrink-0 cursor-pointer rounded-full bg-secondary transition-opacity hover:opacity-80"
          />
          {hasThreadBelow && (
            <div className="mt-1 w-0.5 flex-1 min-h-4 bg-border" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span onClick={handleGoToWall} className="cursor-pointer font-semibold text-foreground hover:underline">{user.name}</span>
            <span onClick={handleGoToWall} className="cursor-pointer text-sm text-muted-foreground hover:underline">{user.handle}</span>
            <span className="text-sm text-muted-foreground">·</span>
            <span className="text-sm text-muted-foreground">{tweet.time}</span>
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-foreground/90">
            {tweet.text}
          </p>
          <div className="mt-3 flex items-center gap-6">
            <button
              onClick={handleLike}
              className={`flex cursor-pointer items-center gap-1.5 text-sm transition-all ${
                liked ? "text-pink-400" : "text-muted-foreground hover:text-pink-400"
              }`}
            >
              <motion.div
                animate={liked ? { scale: [1, 1.3, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                <Heart size={15} fill={liked ? "currentColor" : "none"} />
              </motion.div>
              {tweet.likes}
            </button>
            <button
              onClick={handleRetweet}
              className={`flex cursor-pointer items-center gap-1.5 text-sm transition-all ${
                retweeted ? "text-green-400" : "text-muted-foreground hover:text-green-400"
              }`}
            >
              <motion.div
                animate={retweeted ? { rotate: [0, -20, 20, 0] } : {}}
                transition={{ duration: 0.3 }}
              >
                <Repeat2 size={15} />
              </motion.div>
              {tweet.retweets}
            </button>
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MessageCircle size={15} />
            </span>
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Share size={15} />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});



export default function Tweets() {
  const [tweets, setTweets] = useState<Tweet[]>(initialTweets);
  const [newTweet, setNewTweet] = useState("");
  const [showComposer, setShowComposer] = useState(false);

  const handleLike = useCallback((id: number, isLiking: boolean) => {
    setTweets((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, likes: isLiking ? t.likes + 1 : t.likes - 1 }
          : t
      )
    );
  }, []);

  const handleRetweet = useCallback((id: number, isRetweeting: boolean) => {
    setTweets((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, retweets: isRetweeting ? t.retweets + 1 : t.retweets - 1 }
          : t
      )
    );
  }, []);

  const handlePost = () => {
    if (!newTweet.trim() || newTweet.length > 280) return;
    const tweet: Tweet = {
      id: Date.now(),
      userId: 1,
      text: newTweet,
      likes: 0,
      retweets: 0,
      time: "Just now",
    };
    setTweets([tweet, ...tweets]);
    setNewTweet("");
    setShowComposer(false);
  };

  const threadGroups = useMemo(() => buildThreadGroups(tweets), [tweets]);

  return (
    <div>
      <BlurFade delay={0.1}>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Tweets</h1>
            <p className="text-sm text-muted-foreground">
              Short thoughts, big impact
            </p>
          </div>
          <button
            onClick={() => setShowComposer(!showComposer)}
            className="flex cursor-pointer items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-cyan-700"
          >
            <Plus size={16} /> Tweet
          </button>
        </div>
      </BlurFade>

      {showComposer && (
        <BlurFade delay={0.05}>
          <MagicCard className="mb-6 p-4" gradientColor="#06b6d420">
            <textarea
              rows={2}
              maxLength={280}
              placeholder="What's happening?"
              value={newTweet}
              onChange={(e) => setNewTweet(e.target.value)}
              className="w-full resize-none rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-cyan-500 focus:outline-none"
            />
            <div className="mt-2 flex items-center justify-between">
              <span
                className={`text-xs ${
                  newTweet.length > 260 ? "text-red-400" : "text-muted-foreground"
                }`}
              >
                {newTweet.length}/280
              </span>
              <button
                onClick={handlePost}
                className="flex cursor-pointer items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm text-white transition-colors hover:bg-cyan-700"
              >
                <Send size={14} /> Tweet
              </button>
            </div>
          </MagicCard>
        </BlurFade>
      )}

      <div className="space-y-3">
        {threadGroups.map((group, gi) => (
          <BlurFade key={group[0].id} delay={0.1 + gi * 0.04}>
            <MagicCard className="p-0 overflow-hidden" gradientColor="#06b6d410">
              {group.map((tweet, ti) => (
                <div key={tweet.id}>
                  <TweetItem
                    tweet={tweet}
                    onLike={handleLike}
                    onRetweet={handleRetweet}
                    hasThreadBelow={ti < group.length - 1}
                    isReply={!!tweet.replyTo}
                  />
                </div>
              ))}
            </MagicCard>
          </BlurFade>
        ))}
      </div>
    </div>
  );
}

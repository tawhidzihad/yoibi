import type {
  User,
  Post,
  CommentsMap,
  Tweet,
  Video,
  Stream,
  MeetupRoom,
  VideoCategory,
  Language,
} from "./domain-types";

export const users: User[] = [
  { id: 1, name: "Alex Rivera", handle: "@alexr", avatar: "https://i.pravatar.cc/150?img=11", country: "USA", color: "#6366f1", bio: "Photographer & sunset chaser. Documenting the world one frame at a time.", cover: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=900&h=300&fit=crop", joinDate: "Jan 2025", followers: 1420, following: 384 },
  { id: 2, name: "Sakura Tanaka", handle: "@sakura_t", avatar: "https://i.pravatar.cc/150?img=5", country: "Japan", color: "#ec4899", bio: "Tokyo dreamer. Cherry blossoms, anime & tech. 🌸", cover: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=900&h=300&fit=crop", joinDate: "Mar 2025", followers: 3200, following: 210 },
  { id: 3, name: "Marcus Johnson", handle: "@marcusj", avatar: "https://i.pravatar.cc/150?img=12", country: "UK", color: "#22c55e", bio: "Guitar learner. Day 1 of forever. Music is the answer.", cover: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=900&h=300&fit=crop", joinDate: "Feb 2025", followers: 890, following: 445 },
  { id: 4, name: "Elena Petrova", handle: "@elena_p", avatar: "https://i.pravatar.cc/150?img=9", country: "Russia", color: "#f59e0b", bio: "Early morning runner. Book lover. Thinking out loud.", cover: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=900&h=300&fit=crop", joinDate: "Jan 2025", followers: 2100, following: 312 },
  { id: 5, name: "Carlos Mendez", handle: "@carlosm", avatar: "https://i.pravatar.cc/150?img=14", country: "Mexico", color: "#ef4444", bio: "Street food connoisseur. Tacos are life. 🌮", cover: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=900&h=300&fit=crop", joinDate: "Apr 2025", followers: 1750, following: 520 },
  { id: 6, name: "Amara Okafor", handle: "@amara_o", avatar: "https://i.pravatar.cc/150?img=32", country: "Nigeria", color: "#8b5cf6", bio: "Mental health advocate. Spreading love and positivity. 💚", cover: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=900&h=300&fit=crop", joinDate: "Feb 2025", followers: 5600, following: 189 },
  { id: 7, name: "Li Wei", handle: "@liwei", avatar: "https://i.pravatar.cc/150?img=33", country: "China", color: "#14b8a6", bio: "Full-stack dev. AI optimist. Building the future one commit at a time.", cover: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=900&h=300&fit=crop", joinDate: "Jan 2025", followers: 8900, following: 156 },
  { id: 8, name: "Sophie Dubois", handle: "@sophie_d", avatar: "https://i.pravatar.cc/150?img=25", country: "France", color: "#f97316", bio: "Literature & croissants. Paris is always a good idea. 🥐", cover: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=900&h=300&fit=crop", joinDate: "Mar 2025", followers: 1300, following: 278 },
  { id: 9, name: "Raj Patel", handle: "@rajp", avatar: "https://i.pravatar.cc/150?img=51", country: "India", color: "#06b6d4", bio: "Shipping code, breaking builds. React + Go enthusiast. 🚀", cover: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=900&h=300&fit=crop", joinDate: "Jan 2025", followers: 2400, following: 430 },
  { id: 10, name: "Fatima Al-Hassan", handle: "@fatima_h", avatar: "https://i.pravatar.cc/150?img=23", country: "UAE", color: "#a855f7", bio: "Animal lover. Volunteering is my superpower. 🐕❤️", cover: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=900&h=300&fit=crop", joinDate: "Feb 2025", followers: 3100, following: 267 },
];

export const userMap = new Map<number, User>(users.map((u) => [u.id, u]));

export const posts: Post[] = [
  {
    id: 1, userId: 1, text: "Just witnessed the most beautiful sunset from my rooftop. Sometimes you need to pause and appreciate the little things. 🌅",
    images: [
      "https://images.unsplash.com/photo-1502977601689-3671ddf792b7?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1534460272291-71003f70f670?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1601305070998-91e1a8574e9e?w=600&h=400&fit=crop",
    ],
    likes: 234, comments: 18, reposts: 12, time: "2m ago",
  },
  {
    id: 11, userId: 6, text: "Where is this?? I need to move there immediately 😍",
    likes: 45, comments: 2, reposts: 0, time: "1m ago", replyTo: 1,
  },
  {
    id: 12, userId: 3, text: "This reminds me of sunsets in Greece. Nothing beats rooftop vibes.",
    likes: 23, comments: 1, reposts: 0, time: "1m ago", replyTo: 1,
  },
  {
    id: 2, userId: 3, text: "Started learning guitar today! Day 1 of 365. My fingers already hurt but the journey of a thousand miles begins with a single step. 🎸",
    images: ["https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=600&h=400&fit=crop"],
    likes: 156, comments: 42, reposts: 8, time: "15m ago",
  },
  {
    id: 3, userId: 6, text: "Reminder: Your mental health matters more than any deadline. Take breaks, drink water, and be kind to yourself. 💚",
    likes: 892, comments: 67, reposts: 245, time: "1h ago",
  },
  {
    id: 13, userId: 9, text: "Pinning this to my brain. I needed to hear this today.",
    likes: 67, comments: 3, reposts: 5, time: "50m ago", replyTo: 3,
  },
  {
    id: 4, userId: 2, text: "Cherry blossom season is here and Tokyo is absolutely magical right now! 🌸",
    images: [
      "https://images.unsplash.com/photo-1522383225653-ed111181a951?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?w=600&h=400&fit=crop",
    ],
    likes: 567, comments: 34, reposts: 89, time: "2h ago",
  },
  {
    id: 5, userId: 9, text: "Just shipped a new feature that we've been working on for months. The feeling of seeing your code in production never gets old! 🚀",
    likes: 345, comments: 28, reposts: 15, time: "3h ago",
  },
  {
    id: 14, userId: 7, text: "Congrats! What's the stack? Always curious what people are shipping these days.",
    likes: 18, comments: 4, reposts: 0, time: "2h ago", replyTo: 5,
  },
  {
    id: 15, userId: 9, text: "React + Go on the backend. Took us 3 sprints but worth every late night 😅",
    likes: 31, comments: 2, reposts: 1, time: "2h ago", replyTo: 14,
  },
  {
    id: 6, userId: 5, text: "Street tacos at 2am hit different. Mexico City food scene is unmatched. 🌮",
    images: [
      "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1564767655658-4e6b365884ff?w=600&h=400&fit=crop",
    ],
    likes: 423, comments: 56, reposts: 33, time: "4h ago",
  },
  {
    id: 7, userId: 8, text: "Reading 'The Little Prince' for the 10th time and still finding new meaning in every page. What book do you keep coming back to?",
    likes: 189, comments: 94, reposts: 7, time: "5h ago",
  },
  {
    id: 8, userId: 4, text: "Morning run through the park. -5°C but the world is so quiet and peaceful at dawn. Worth every shiver. ❄️🏃‍♀️",
    images: ["https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=600&h=400&fit=crop"],
    likes: 278, comments: 22, reposts: 11, time: "6h ago",
  },
  {
    id: 9, userId: 7, text: "AI is not going to replace humans. Humans using AI are going to replace humans not using AI. Adapt and grow. 🧠",
    likes: 1203, comments: 187, reposts: 456, time: "8h ago",
  },
  {
    id: 16, userId: 4, text: "Hard disagree. AI is a tool, not a replacement. People said the same about calculators.",
    likes: 156, comments: 22, reposts: 12, time: "7h ago", replyTo: 9,
  },
  {
    id: 17, userId: 7, text: "That's... literally what I said? Humans USING AI. The tool amplifies, not replaces.",
    likes: 289, comments: 8, reposts: 34, time: "7h ago", replyTo: 16,
  },
  {
    id: 10, userId: 10, text: "Volunteered at the local shelter today. 12 dogs got adopted! Every small act of kindness creates a ripple effect. 🐕❤️",
    images: [
      "https://images.unsplash.com/photo-1633722715463-d30f4f325e24?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1612774412771-005ed8e861d2?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600&h=400&fit=crop",
    ],
    likes: 734, comments: 45, reposts: 112, time: "10h ago",
  },
];

export const mockComments: CommentsMap = {
  1: [
    { id: 101, userId: 3, text: "That sounds amazing! Where is this?", likes: 12, time: "1m ago" },
    { id: 102, userId: 6, text: "Nature therapy is the best therapy 🌿", likes: 8, time: "2m ago" },
  ],
  2: [
    { id: 201, userId: 7, text: "Keep going! Day 30 is when it starts clicking 💪", likes: 24, time: "5m ago" },
    { id: 202, userId: 10, text: "I started last year and it changed my life. You got this!", likes: 18, time: "8m ago" },
    { id: 203, userId: 2, text: "What guitar did you get?", likes: 5, time: "12m ago" },
  ],
  3: [
    { id: 301, userId: 1, text: "Needed to hear this today. Thank you. ❤️", likes: 45, time: "20m ago" },
    { id: 302, userId: 9, text: "100%. Burnout is real.", likes: 34, time: "35m ago" },
    { id: 303, userId: 5, text: "Sharing this with my whole team", likes: 22, time: "40m ago" },
    { id: 304, userId: 8, text: "This should be pinned at every workplace", likes: 19, time: "55m ago" },
  ],
  4: [
    { id: 401, userId: 9, text: "Japan is on my bucket list! So beautiful 😍", likes: 15, time: "1h ago" },
    { id: 402, userId: 4, text: "I was there last year, absolutely magical!", likes: 11, time: "1h ago" },
  ],
  5: [
    { id: 501, userId: 3, text: "That deployment feeling is unmatched 🎉", likes: 20, time: "2h ago" },
    { id: 502, userId: 7, text: "Congrats! What stack?", likes: 8, time: "2h ago" },
    { id: 503, userId: 6, text: "Ship it! 🚢", likes: 14, time: "3h ago" },
  ],
  6: [
    { id: 601, userId: 1, text: "I'm literally on my way to Mexico right now 🛫", likes: 33, time: "3h ago" },
    { id: 602, userId: 8, text: "Al pastor or nothing!", likes: 27, time: "3h ago" },
  ],
  7: [
    { id: 701, userId: 4, text: "'Man's Search for Meaning' by Viktor Frankl", likes: 42, time: "4h ago" },
    { id: 702, userId: 2, text: "Dune. Every single time.", likes: 31, time: "4h ago" },
    { id: 703, userId: 10, text: "The Alchemist! Never gets old", likes: 25, time: "5h ago" },
    { id: 704, userId: 9, text: "Clean Code by Robert Martin 😅", likes: 18, time: "5h ago" },
  ],
  8: [
    { id: 801, userId: 6, text: "You're built different! Respect 🫡", likes: 14, time: "5h ago" },
    { id: 802, userId: 1, text: "I can barely get out of bed at -5°C lol", likes: 22, time: "6h ago" },
  ],
  9: [
    { id: 901, userId: 3, text: "Hard agree. Adapt or get left behind.", likes: 89, time: "6h ago" },
    { id: 902, userId: 5, text: "This is the most important take of 2026", likes: 67, time: "7h ago" },
    { id: 903, userId: 8, text: "Already seeing this in my industry", likes: 45, time: "7h ago" },
    { id: 904, userId: 10, text: "Using AI to learn faster, not to replace thinking", likes: 56, time: "8h ago" },
    { id: 905, userId: 4, text: "The future is collaboration, not competition", likes: 38, time: "8h ago" },
  ],
  10: [
    { id: 1001, userId: 2, text: "This made my day! 🐶❤️", likes: 30, time: "9h ago" },
    { id: 1002, userId: 7, text: "Heroes don't always wear capes", likes: 25, time: "10h ago" },
    { id: 1003, userId: 3, text: "I adopted my dog from a shelter too. Best decision ever!", likes: 19, time: "10h ago" },
  ],
};

export const videos: Video[] = [
  { id: 1, title: "Understanding Global Economics in 10 Minutes", userId: 9, category: "learning", views: 45200, duration: "10:24", thumbnail: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=225&fit=crop", videoUrl: "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4" },
  { id: 2, title: "City Council Meeting — New Housing Policy", userId: 3, category: "governmental", views: 12300, duration: "45:12", thumbnail: "https://images.unsplash.com/photo-1577495508048-b635879837f1?w=400&h=225&fit=crop", videoUrl: "https://test-videos.co.uk/vids/sintel/mp4/h264/720/Sintel_720_10s_1MB.mp4" },
  { id: 3, title: "Epic Skateboard Tricks Compilation", userId: 1, category: "fun", views: 892000, duration: "8:45", thumbnail: "https://images.unsplash.com/photo-1564982752979-3f7bc974d29a?w=400&h=225&fit=crop", videoUrl: "https://test-videos.co.uk/vids/jellyfish/mp4/h264/720/Jellyfish_720_10s_2MB.mp4" },
  { id: 4, title: "The Future of Renewable Energy", userId: 7, category: "current-events", views: 67800, duration: "15:33", thumbnail: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400&h=225&fit=crop", videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" },
  { id: 5, title: "Late Night Political Analysis", userId: 4, category: "politics", views: 234000, duration: "22:10", thumbnail: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=400&h=225&fit=crop", videoUrl: "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_2MB.mp4" },
  { id: 6, title: "Cooking Street Food Around the World", userId: 5, category: "fun", views: 456000, duration: "12:08", thumbnail: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=225&fit=crop", videoUrl: "https://test-videos.co.uk/vids/sintel/mp4/h264/720/Sintel_720_10s_2MB.mp4" },
  { id: 7, title: "Deep Dive: How Elections Actually Work", userId: 6, category: "politics", views: 178000, duration: "28:45", thumbnail: "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=400&h=225&fit=crop", videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4" },
  { id: 8, title: "Breaking: New Climate Agreement Signed", userId: 8, category: "news", views: 345000, duration: "5:22", thumbnail: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&h=225&fit=crop", videoUrl: "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_5MB.mp4" },
  { id: 9, title: "Fireside Chat: Life, Purpose, and Happiness", userId: 10, category: "conversations", views: 89000, duration: "35:18", thumbnail: "https://images.unsplash.com/photo-1475483768296-6163e08872a1?w=400&h=225&fit=crop", videoUrl: "https://test-videos.co.uk/vids/jellyfish/mp4/h264/720/Jellyfish_720_10s_1MB.mp4" },
  { id: 10, title: "Tech Industry Commentary — Where Are We Heading?", userId: 2, category: "commentary", views: 123000, duration: "18:55", thumbnail: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=225&fit=crop", videoUrl: "https://test-videos.co.uk/vids/sintel/mp4/h264/720/Sintel_720_10s_5MB.mp4" },
  { id: 11, title: "How to Start a Small Business in 2026", userId: 9, category: "learning", views: 567000, duration: "20:12", thumbnail: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=400&h=225&fit=crop", videoUrl: "https://test-videos.co.uk/vids/jellyfish/mp4/h264/720/Jellyfish_720_10s_5MB.mp4" },
  { id: 12, title: "National Budget Breakdown Explained", userId: 3, category: "governmental", views: 34500, duration: "16:40", thumbnail: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=225&fit=crop", videoUrl: "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4" },
];

export const tweets: Tweet[] = [
  { id: 1, userId: 1, text: "Freedom is not just a word. It's a lifestyle. 🗽", likes: 89, retweets: 23, time: "5m ago" },
  { id: 2, userId: 6, text: "Be the energy you want to attract ✨", likes: 456, retweets: 112, time: "12m ago" },
  { id: 13, userId: 3, text: "This. So much this. 🙌", likes: 34, retweets: 5, time: "10m ago", replyTo: 2 },
  { id: 3, userId: 3, text: "Hot take: pineapple on pizza is actually good and I'm tired of pretending it's not 🍕🍍", likes: 234, retweets: 67, time: "30m ago" },
  { id: 14, userId: 5, text: "Finally someone with taste. Welcome to the right side of history.", likes: 89, retweets: 12, time: "25m ago", replyTo: 3 },
  { id: 15, userId: 4, text: "I'm calling the police 🚔", likes: 312, retweets: 78, time: "22m ago", replyTo: 3 },
  { id: 16, userId: 3, text: "Haters gonna hate, I'll be here enjoying my Hawaiian pizza 🍕👑", likes: 145, retweets: 23, time: "20m ago", replyTo: 15 },
  { id: 4, userId: 7, text: "Just automated my entire morning routine with a Python script. Engineers gonna engineer. 🤖", likes: 678, retweets: 189, time: "1h ago" },
  { id: 17, userId: 9, text: "Share the repo or it didn't happen 👀", likes: 234, retweets: 45, time: "55m ago", replyTo: 4 },
  { id: 18, userId: 7, text: "It literally makes my coffee, opens my IDE, and plays lo-fi. github.com/liwei/morning-bot", likes: 456, retweets: 123, time: "50m ago", replyTo: 17 },
  { id: 5, userId: 2, text: "The sakura trees outside my window remind me that beauty is temporary, and that's what makes it beautiful 🌸", likes: 345, retweets: 78, time: "2h ago" },
  { id: 6, userId: 9, text: "Unpopular opinion: meetings could have been emails, and emails could have been Slack messages", likes: 1234, retweets: 567, time: "3h ago" },
  { id: 19, userId: 8, text: "And Slack messages could have been nothing at all", likes: 567, retweets: 189, time: "2h ago", replyTo: 6 },
  { id: 20, userId: 6, text: "The real meeting was the friends we made along the way", likes: 345, retweets: 67, time: "2h ago", replyTo: 19 },
  { id: 7, userId: 4, text: "Read a book today. Not a summary. Not a thread. An actual book. Your brain will thank you. 📚", likes: 567, retweets: 234, time: "4h ago" },
  { id: 8, userId: 5, text: "My grandmother's cooking > any Michelin star restaurant. Facts only. 👵🍲", likes: 891, retweets: 345, time: "5h ago" },
  { id: 9, userId: 8, text: "Paris in the rain is not romantic. It's cold and my baguette is soggy. Still love it though. 🥖☔", likes: 432, retweets: 98, time: "6h ago" },
  { id: 10, userId: 10, text: "Small acts of kindness have compound interest. Keep investing in people. 💚", likes: 789, retweets: 234, time: "8h ago" },
  { id: 11, userId: 1, text: "The best time to start was yesterday. The second best time is now. 🚀", likes: 567, retweets: 156, time: "10h ago" },
  { id: 12, userId: 6, text: "Dancing in my kitchen at midnight because life is too short to not celebrate the small wins 💃", likes: 1023, retweets: 289, time: "12h ago" },
];

export const streams: Stream[] = [
  { id: 1, userId: 1, title: "Late Night Gaming Session — Join the fun!", viewers: 1245, category: "fun", isLive: true, thumbnail: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=225&fit=crop", videoUrl: "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_2MB.mp4" },
  { id: 2, userId: 4, title: "Election Results Live Coverage 2026", viewers: 23456, category: "politics", isLive: true, thumbnail: "https://images.unsplash.com/photo-1494172961521-33799ddd43a5?w=400&h=225&fit=crop", videoUrl: "https://test-videos.co.uk/vids/sintel/mp4/h264/720/Sintel_720_10s_2MB.mp4" },
  { id: 3, userId: 9, title: "Coding a Full App in 4 Hours — React Challenge", viewers: 3421, category: "learning", isLive: true, thumbnail: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=225&fit=crop", videoUrl: "https://test-videos.co.uk/vids/jellyfish/mp4/h264/720/Jellyfish_720_10s_2MB.mp4" },
  { id: 4, userId: 6, title: "Morning Yoga & Meditation Session", viewers: 876, category: "fun", isLive: true, thumbnail: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=225&fit=crop", videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" },
  { id: 5, userId: 7, title: "Breaking News: Tech Industry Updates", viewers: 8934, category: "news", isLive: true, thumbnail: "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=400&h=225&fit=crop", videoUrl: "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_5MB.mp4" },
  { id: 6, userId: 2, title: "Tokyo Street Walk — Cherry Blossom Season", viewers: 5678, category: "fun", isLive: true, thumbnail: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&h=225&fit=crop", videoUrl: "https://test-videos.co.uk/vids/sintel/mp4/h264/720/Sintel_720_10s_5MB.mp4" },
  { id: 7, userId: 8, title: "French Cooking Masterclass — Croissants", viewers: 2345, category: "learning", isLive: true, thumbnail: "https://images.unsplash.com/photo-1530610476181-d83430b64dcd?w=400&h=225&fit=crop", videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4" },
  { id: 8, userId: 5, title: "Open Mic Night — Music & Stories", viewers: 4567, category: "conversations", isLive: true, thumbnail: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400&h=225&fit=crop", videoUrl: "https://test-videos.co.uk/vids/jellyfish/mp4/h264/720/Jellyfish_720_10s_5MB.mp4" },
];

export const meetupRooms: MeetupRoom[] = [
  { id: 1, name: "Global Politics Roundtable", participants: [users[0], users[3], users[5], users[6]], maxParticipants: 8, topic: "politics" },
  { id: 2, name: "Creative Minds Hangout", participants: [users[1], users[7]], maxParticipants: 6, topic: "fun" },
  { id: 3, name: "Tech Talk Tuesday", participants: [users[8], users[6], users[0], users[2], users[4]], maxParticipants: 10, topic: "learning" },
  { id: 4, name: "Book Club — Monthly Pick", participants: [users[7], users[3], users[9]], maxParticipants: 8, topic: "conversations" },
  { id: 5, name: "Startup Founders Network", participants: [users[8], users[4]], maxParticipants: 12, topic: "learning" },
  { id: 6, name: "Music Jam Session", participants: [users[1], users[2], users[5]], maxParticipants: 6, topic: "fun" },
];

export const communityRules: string[] = [
  "Always be respectful. When asked a question give the person 20 seconds to answer before interrupting.",
  "No death threats.",
  "Free speech shall not be infringed.",
  "Deep fake videos will be removed.",
  "Fake news postings will be removed.",
  "Postings in which the victims of incest, sexual assault, pedophilia or criminal acts are bullied and made fun of will also be removed.",
  "Have fun and be you.",
];

export const videoCategories: VideoCategory[] = [
  { id: "politics", label: "Politics", icon: "Landmark" },
  { id: "current-events", label: "Current Events", icon: "Newspaper" },
  { id: "learning", label: "Learning", icon: "BookOpen" },
  { id: "governmental", label: "Governmental Info", icon: "Building2" },
  { id: "fun", label: "Just Having Fun", icon: "PartyPopper" },
  { id: "conversations", label: "Conversations", icon: "MessageSquare" },
  { id: "commentary", label: "Commentary", icon: "Mic" },
  { id: "news", label: "News", icon: "Tv" },
];

export const countries: string[] = [
  "USA", "UK", "Canada", "Mexico", "Brazil", "Argentina", "France", "Germany",
  "Spain", "Italy", "Russia", "Ukraine", "Japan", "China", "South Korea", "India",
  "Australia", "Nigeria", "South Africa", "Egypt", "UAE", "Saudi Arabia", "Turkey",
  "Indonesia", "Thailand", "Vietnam", "Philippines", "Colombia", "Peru", "Chile",
];

export const languages: Language[] = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "ru", label: "Русский" },
  { code: "ja", label: "日本語" },
  { code: "zh", label: "中文" },
  { code: "ar", label: "العربية" },
  { code: "pt", label: "Português" },
  { code: "hi", label: "हिन्दी" },
];

export interface User {
  id: number;
  name: string;
  handle: string;
  avatar: string;
  country: string;
  color: string;
  bio: string;
  cover: string;
  joinDate: string;
  followers: number;
  following: number;
}

export interface Post {
  id: number;
  userId: number;
  text: string;
  images?: string[];
  image?: string;
  likes: number;
  comments: number;
  reposts: number;
  time: string;
  replyTo?: number;
}

export interface Comment {
  id: number;
  userId: number;
  text: string;
  likes: number;
  time: string;
}

export type CommentsMap = Record<number, Comment[]>;

export interface Tweet {
  id: number;
  userId: number;
  text: string;
  likes: number;
  retweets: number;
  time: string;
  replyTo?: number;
}

export interface Video {
  id: number;
  title: string;
  userId: number;
  category: string;
  views: number;
  duration: string;
  thumbnail: string;
  videoUrl: string;
}

export interface Stream {
  id: number;
  userId: number;
  title: string;
  viewers: number;
  category: string;
  isLive: boolean;
  thumbnail: string;
  videoUrl: string;
}

export interface MeetupRoom {
  id: number;
  name: string;
  participants: User[];
  maxParticipants: number;
  topic: string;
}

export interface VideoCategory {
  id: string;
  label: string;
  icon: string;
}

export interface Language {
  code: string;
  label: string;
}

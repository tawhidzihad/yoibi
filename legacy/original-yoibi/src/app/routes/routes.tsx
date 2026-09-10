import { createBrowserRouter } from "react-router-dom";
import Layout from "@/app/layout/Layout";
import Landing from "@/pages/landing";
import Signup from "@/pages/signup";
import Feed from "@/pages/feed";
import Videos from "@/pages/videos";
import Tweets from "@/pages/tweets";
import Streams from "@/pages/streams";
import MeetUp from "@/pages/meetup";
import Wall from "@/pages/wall";

export const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <Landing />,
    },
    {
      element: <Layout />,
      children: [
        { path: "/feed", element: <Feed /> },
        { path: "/videos", element: <Videos /> },
        { path: "/tweets", element: <Tweets /> },
        { path: "/streams", element: <Streams /> },
        { path: "/meetup", element: <MeetUp /> },
        { path: "/wall", element: <Wall /> },
        { path: "/wall/:handle", element: <Wall /> },
      ],
    },
    {
      path: "/signup",
      element: <Signup />,
    },
  ],
  { basename: "/yoibi" }
);
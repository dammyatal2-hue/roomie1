import { useState, useMemo } from "react";

export const FILTER_CATEGORIES = [
  "All",
  "Looking for Roommate",
  "Room Available",
  "Relocating",
  "Tips & Advice",
];

export const MOCK_POSTS = [
  {
    id: "1",
    userName: "Sarah Johnson",
    userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    location: "Kicukiro, Kigali",
    timestamp: "2h ago",
    text: "Hi everyone! I'm moving to Kigali next month for work and looking for a clean, quiet roommate to share a 2-bedroom apartment. I work in tech and enjoy cooking and reading. Budget is around $150/month.",
    tags: ["Budget $150", "2-Bedroom", "Working class"],
    matchScore: "high" as const,
  },
  {
    id: "2",
    userName: "Michael Chen",
    userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    location: "Gasabo, Kigali",
    timestamp: "5h ago",
    text: "Room available in a shared 3-bedroom apartment near Kimironko. Great location, close to transport and markets. Looking for a responsible person. Available from next week!",
    tags: ["Room Available", "3-Bedroom", "$120/month"],
    matchScore: null,
  },
  {
    id: "3",
    userName: "Emily Uwase",
    userAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    location: "Nyarugenge, Kigali",
    timestamp: "8h ago",
    text: "Anyone have tips for finding apartments in the city center? Just graduated and starting my first job. Budget is tight but I'd love to be close to downtown. Any advice appreciated!",
    tags: ["Tips & Advice", "Students"],
    matchScore: "medium" as const,
  },
  {
    id: "4",
    userName: "David Nkusi",
    userAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
    location: "Kicukiro, Kigali",
    timestamp: "12h ago",
    text: "Looking for 1-2 roommates to share a nice place in Kicukiro. I'm a grad student, pretty easy-going. Like to keep things clean and organized. No parties, just a peaceful place to call home.",
    tags: ["Looking for Roommate", "Students", "Budget $100"],
    matchScore: "high" as const,
  },
  {
    id: "5",
    userName: "Amanda Peters",
    userAvatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop",
    location: "Gasabo, Kigali",
    timestamp: "1d ago",
    text: "Relocating from Nairobi! Looking for short-term housing (2-3 months) while I get settled. Any leads? Preferably in a safe neighborhood with good internet connection for remote work.",
    tags: ["Relocating", "Short-term", "Working class"],
    matchScore: null,
  },
];

export function useCommunityFeed() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [posts, setPosts] = useState(MOCK_POSTS);

  const handleCreatePost = (newPost: {
    text: string;
    category: string;
    location: string;
    budget: string;
  }) => {
    const post = {
      id: Date.now().toString(),
      userName: "You",
      userAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
      location: newPost.location,
      timestamp: "Just now",
      text: newPost.text,
      tags: [
        newPost.category !== "All" ? newPost.category : "",
        newPost.budget ? `Budget ${newPost.budget}` : "",
      ].filter(Boolean),
      matchScore: null as const,
    };
    setPosts([post, ...posts]);
  };

  const filteredPosts = useMemo(() => 
    activeFilter === "All"
      ? posts
      : posts.filter((post) =>
          post.tags.some((tag) => tag.includes(activeFilter))
        )
  , [activeFilter, posts]);

  return {
    activeFilter,
    setActiveFilter,
    filteredPosts,
    handleCreatePost,
    filterCategories: FILTER_CATEGORIES,
  };
}
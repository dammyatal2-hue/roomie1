import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../auth/AuthProvider";

type Filter = "All" | "Looking for Roommate" | "Room Available" | "Tips & Advice" | "Social";
interface FeedPost { id: string; userName: string; userAvatar: string; location: string; timestamp: string; text: string; tags: string[]; matchScore: "high" | "medium" | null }
interface NewPost { text: string; category: string; location: string; budget: string }

export function useCommunityFeed() {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<Filter>("All");
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const filterCategories: Filter[] = ["All", "Looking for Roommate", "Room Available", "Tips & Advice", "Social"];

  useEffect(() => {
    supabase.from("posts").select("id,body,created_at,profiles!posts_author_id_fkey(username,avatar_url,city)").order("created_at", { ascending: false }).then(({ data }) => {
      if (!data) return;
      setPosts(data.map((row: any) => ({ id: row.id, userName: row.profiles?.username ?? "Roomie member", userAvatar: row.profiles?.avatar_url ?? "https://api.dicebear.com/9.x/initials/svg?seed=Roomie", location: row.profiles?.city ?? "", timestamp: new Date(row.created_at).toLocaleDateString(), text: row.body, tags: [], matchScore: null })));
    });
  }, []);

  const filteredPosts = useMemo(() => activeFilter === "All" ? posts : posts.filter((post) => post.tags.includes(activeFilter)), [activeFilter, posts]);
  const handleCreatePost = async (post: NewPost) => {
    if (!user) throw new Error("Sign in to post.");
    const { data, error } = await supabase.from("posts").insert({ author_id: user.id, body: post.text }).select("id,body,created_at").single();
    if (error) throw error;
    setPosts((current) => [{ id: data.id, userName: user.user_metadata.username ?? "You", userAvatar: user.user_metadata.avatar_url ?? "https://api.dicebear.com/9.x/initials/svg?seed=You", location: post.location, timestamp: "Just now", text: data.body, tags: post.category === "All" ? [] : [post.category], matchScore: null }, ...current]);
  };
  return { activeFilter, setActiveFilter, filteredPosts, handleCreatePost, filterCategories };
}

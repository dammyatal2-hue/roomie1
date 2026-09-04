import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../auth/AuthProvider";

type Filter = "All" | "Looking for Roommate" | "Room Available" | "Tips & Advice" | "Social";
export interface FeedComment { id: string; body: string; createdAt: string; authorId: string; userName: string; userAvatar: string }
export interface FeedPost { id: string; authorId: string; userName: string; userAvatar: string; location: string; timestamp: string; text: string; tags: string[]; matchScore: "high" | "medium" | null; liked: boolean; likeCount: number; commentCount: number; comments: FeedComment[] }
interface NewPost { text: string; category: string; location: string; budget: string }

const avatar = (seed: string) => `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(seed)}`;

export function useCommunityFeed() {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<Filter>("All");
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const filterCategories: Filter[] = ["All", "Looking for Roommate", "Room Available", "Tips & Advice", "Social"];

  const loadPosts = async () => {
    setLoading(true);
    setError("");
    const { data, error: loadError } = await supabase
      .from("posts")
      .select("id,author_id,body,created_at,profiles!posts_author_id_fkey(username,avatar_url,city),post_likes(user_id),post_comments(id,body,author_id,created_at,profiles!post_comments_author_id_fkey(username,avatar_url))")
      .order("created_at", { ascending: false });
    if (loadError) {
      setError(loadError.message);
      setLoading(false);
      return;
    }
    setPosts((data ?? []).map((row: any) => {
      const comments = [...(row.post_comments ?? [])].sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      return {
        id: row.id,
        authorId: row.author_id,
        userName: row.profiles?.username ?? "Roomie member",
        userAvatar: row.profiles?.avatar_url ?? avatar(row.profiles?.username ?? "Roomie"),
        location: row.profiles?.city ?? "",
        timestamp: new Date(row.created_at).toLocaleDateString(),
        text: row.body,
        tags: [],
        matchScore: null,
        liked: (row.post_likes ?? []).some((like: any) => like.user_id === user?.id),
        likeCount: row.post_likes?.length ?? 0,
        commentCount: comments.length,
        comments: comments.map((comment: any) => ({ id: comment.id, body: comment.body, authorId: comment.author_id, createdAt: new Date(comment.created_at).toLocaleString(), userName: comment.profiles?.username ?? "Roomie member", userAvatar: comment.profiles?.avatar_url ?? avatar(comment.profiles?.username ?? "Roomie") })),
      };
    }));
    setLoading(false);
  };

  useEffect(() => { void loadPosts(); }, [user?.id]);

  const filteredPosts = useMemo(() => activeFilter === "All" ? posts : posts.filter((post) => post.tags.includes(activeFilter)), [activeFilter, posts]);

  const handleCreatePost = async (post: NewPost) => {
    if (!user) throw new Error("Sign in to post.");
    const { error: createError } = await supabase.from("posts").insert({ author_id: user.id, body: post.text });
    if (createError) throw createError;
    await loadPosts();
  };

  const deletePost = async (postId: string) => {
    if (!user) throw new Error("Sign in to delete a post.");
    const { error: deleteError } = await supabase.from("posts").delete().eq("id", postId).eq("author_id", user.id);
    if (deleteError) throw deleteError;
    setPosts((current) => current.filter((post) => post.id !== postId));
  };

  const toggleLike = async (postId: string) => {
    if (!user) throw new Error("Sign in to like posts.");
    const post = posts.find((item) => item.id === postId);
    if (!post) return;
    const operation = post.liked
      ? supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", user.id)
      : supabase.from("post_likes").insert({ post_id: postId, user_id: user.id });
    const { error: likeError } = await operation;
    if (likeError) throw likeError;
    setPosts((current) => current.map((item) => item.id === postId ? { ...item, liked: !item.liked, likeCount: Math.max(0, item.likeCount + (item.liked ? -1 : 1)) } : item));
  };

  const addComment = async (postId: string, body: string) => {
    if (!user) throw new Error("Sign in to comment.");
    const cleanBody = body.trim();
    if (!cleanBody) return;
    const { data, error: commentError } = await supabase.from("post_comments").insert({ post_id: postId, author_id: user.id, body: cleanBody }).select("id,body,author_id,created_at").single();
    if (commentError) throw commentError;
    const newComment: FeedComment = { id: data.id, body: data.body, authorId: data.author_id, createdAt: "Just now", userName: user.user_metadata.username ?? user.user_metadata.full_name ?? "You", userAvatar: user.user_metadata.avatar_url ?? avatar("You") };
    setPosts((current) => current.map((item) => item.id === postId ? { ...item, comments: [...item.comments, newComment], commentCount: item.commentCount + 1 } : item));
  };

  return { activeFilter, setActiveFilter, filteredPosts, handleCreatePost, filterCategories, deletePost, toggleLike, addComment, currentUserId: user?.id, loading, error };
}

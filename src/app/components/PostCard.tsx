import { Heart, MessageCircle, MapPin, Trash2, Send } from "lucide-react";
import { useState } from "react";
import type { FeedComment } from "../hooks/useCommunityFeed";

interface PostCardProps {
  id: string; userName: string; userAvatar: string; location: string; timestamp: string; text: string;
  tags?: string[]; matchScore?: "high" | "medium" | null; liked: boolean; likeCount: number; commentCount: number;
  comments: FeedComment[]; isOwner: boolean;
  onDelete: (id: string) => Promise<void>; onToggleLike: (id: string) => Promise<void>; onAddComment: (id: string, body: string) => Promise<void>;
}

export function PostCard({ id, userName, userAvatar, location, timestamp, text, tags = [], liked, likeCount, commentCount, comments, isOwner, onDelete, onToggleLike, onAddComment }: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  const run = async (action: () => Promise<void>) => {
    setBusy(true); setActionError("");
    try { await action(); } catch (error: any) { setActionError(error.message ?? "Something went wrong."); }
    finally { setBusy(false); }
  };

  const submitComment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!comment.trim()) return;
    await run(async () => { await onAddComment(id, comment); setComment(""); setShowComments(true); });
  };

  const confirmDelete = () => {
    if (window.confirm("Delete this post? This will also remove its likes and comments.")) void run(() => onDelete(id));
  };

  return (
    <article className="bg-white rounded-[12px] p-4 border border-[#e5e7eb] shadow-sm">
      <div className="flex items-start gap-3 mb-3">
        <img src={userAvatar} alt={userName} className="w-11 h-11 rounded-full object-cover" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-[#1f2a37]">{userName}</p>
          {location && <div className="flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3 text-[#9da4ae]" /><span className="text-[10px] text-[#9da4ae]">{location}</span></div>}
        </div>
        <span className="text-[10px] text-[#9da4ae]">{timestamp}</span>
        {isOwner && <button disabled={busy} onClick={confirmDelete} aria-label="Delete post" className="p-1.5 rounded-full text-[#9da4ae] hover:text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>}
      </div>
      <p className="text-sm text-[#1f2a37] leading-5 mb-3 whitespace-pre-wrap">{text}</p>
      {tags.length > 0 && <div className="flex flex-wrap gap-2 mb-3">{tags.map((tag) => <span key={tag} className="bg-[#fef3f2] px-2.5 py-1 rounded-2xl text-[10px] text-[#fe456a]">{tag}</span>)}</div>}
      <div className="flex items-center gap-5 pt-3 border-t border-[#e5e7eb]">
        <button disabled={busy} onClick={() => void run(() => onToggleLike(id))} className="flex items-center gap-1.5 text-xs text-[#6b7280]"><Heart className={`w-[18px] h-[18px] ${liked ? "fill-[#fe456a] text-[#fe456a]" : "text-[#9da4ae]"}`} /><span>{likeCount || ""} {liked ? "Liked" : "Like"}</span></button>
        <button onClick={() => setShowComments((value) => !value)} className="flex items-center gap-1.5 text-xs text-[#6b7280]"><MessageCircle className="w-[18px] h-[18px] text-[#9da4ae]" /><span>{commentCount || ""} {commentCount === 1 ? "Comment" : "Comments"}</span></button>
      </div>
      {actionError && <p className="text-xs text-red-600 mt-3">{actionError}</p>}
      {showComments && <div className="mt-4 pt-3 border-t border-[#e5e7eb] space-y-3">
        {comments.length === 0 ? <p className="text-xs text-[#9da4ae]">No comments yet. Start the conversation.</p> : comments.map((item) => <div key={item.id} className="flex gap-2"><img src={item.userAvatar} alt="" className="w-8 h-8 rounded-full object-cover" /><div className="flex-1 bg-[#f6f7f9] rounded-xl px-3 py-2"><div className="flex justify-between gap-2"><span className="text-xs font-semibold text-[#1f2a37]">{item.userName}</span><span className="text-[9px] text-[#9da4ae]">{item.createdAt}</span></div><p className="text-xs text-[#374151] mt-1 whitespace-pre-wrap">{item.body}</p></div></div>)}
        <form onSubmit={submitComment} className="flex gap-2 pt-1"><input value={comment} onChange={(event) => setComment(event.target.value)} maxLength={1000} placeholder="Write a comment…" className="flex-1 min-w-0 border border-[#e5e7eb] rounded-full px-4 py-2 text-sm focus:outline-none focus:border-[#fe456a]" /><button disabled={busy || !comment.trim()} className="w-9 h-9 rounded-full bg-[#fe456a] text-white flex items-center justify-center disabled:opacity-50" aria-label="Post comment"><Send className="w-4 h-4" /></button></form>
      </div>}
    </article>
  );
}

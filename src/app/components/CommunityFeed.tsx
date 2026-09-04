import { useState } from "react";
import { Plus, ArrowLeft, Users } from "lucide-react";
import { PostCard } from "./PostCard";
import { CreatePostModal } from "./CreatePostModal";
import { EmptyState } from "./EmptyState";
import { useCommunityFeed } from "../hooks/useCommunityFeed";

interface CommunityFeedProps {
  onBack?: () => void;
}

export function CommunityFeed({ onBack }: CommunityFeedProps) {
  const { activeFilter, setActiveFilter, filteredPosts, handleCreatePost, filterCategories, deletePost, toggleLike, addComment, currentUserId, loading, error } = useCommunityFeed();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#fafafa] pb-20">
      {/* Header */}
      <div className="bg-white px-6 pt-8 pb-4 border-b border-[#e5e7eb]">
        <div className="flex items-center gap-4 mb-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-[#f3f4f6] rounded-[8px] transition-colors -ml-2"
            >
              <ArrowLeft className="w-[20px] h-[20px] text-[#1f2a37]" />
            </button>
          )}
          <div className="flex-1">
            <h1 className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[24px] text-[#1f2a37] leading-[32px]">
              Community
            </h1>
            <p className="font-['Inter:Regular',sans-serif] font-normal text-[14px] text-[#9da4ae] leading-[18px]">
              Connect with roommates in your area
            </p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white px-6 py-3 border-b border-[#e5e7eb] overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {filterCategories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveFilter(category)}
              className={`px-4 py-2 rounded-[20px] font-['Inter:Medium',sans-serif] font-medium text-[12px] leading-[14px] whitespace-nowrap transition-colors ${
                activeFilter === category
                  ? "bg-[#fe456a] text-white"
                  : "bg-[#f3f4f6] text-[#6b7280] hover:bg-[#e5e7eb]"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* City-based location indicator */}
      <div className="bg-white px-6 py-3 border-b border-[#e5e7eb]">
        <div className="flex items-center gap-2">
          <Users className="w-[16px] h-[16px] text-[#9da4ae]" />
          <p className="font-['Inter:Regular',sans-serif] font-normal text-[13px] leading-[16px] text-[#6b7280]">
            Posts from the Roomie community
          </p>
        </div>
      </div>

      {/* Feed */}
      <div className="px-6 py-4">
        {loading ? (
          <p className="text-center text-sm text-[#6b7280] py-10">Loading community posts…</p>
        ) : error ? (
          <p className="text-center text-sm text-red-600 py-10">Could not load posts: {error}</p>
        ) : filteredPosts.length === 0 ? (
          <EmptyState onCreatePost={() => setIsModalOpen(true)} />
        ) : (
          <div className="flex flex-col gap-4 max-w-[600px] mx-auto">
            {filteredPosts.map((post) => (
              <PostCard key={post.id} {...post} isOwner={post.authorId === currentUserId} onDelete={deletePost} onToggleLike={toggleLike} onAddComment={addComment} />
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-24 right-6 w-[56px] h-[56px] bg-[#fe456a] rounded-full shadow-lg flex items-center justify-center hover:bg-[#e63d5f] transition-colors z-50"
      >
        <Plus className="w-[24px] h-[24px] text-white" />
      </button>

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreatePost}
      />
    </div>
  );
}

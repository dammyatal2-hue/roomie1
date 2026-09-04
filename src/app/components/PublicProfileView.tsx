import { useEffect, useState } from "react";
import { ArrowLeft, MapPin, User, MessageCircle, UserPlus, Clock } from "lucide-react";
import { supabase } from "../../lib/supabase";

interface PublicProfileViewProps {
  profileId?: string | null;
  onBack: () => void;
  connectionStatus?: "pending" | "matched" | "not-connected";
  onChat?: () => void;
  onSendRequest?: () => void;
}

export function PublicProfileView({ 
  profileId,
  onBack, 
  connectionStatus = "not-connected",
  onChat,
  onSendRequest,
}: PublicProfileViewProps) {
  const [loading, setLoading] = useState(Boolean(profileId));
  const [loadError, setLoadError] = useState("");
  const [galleryPhotos, setGalleryPhotos] = useState<string[]>([]);
  const [profileData, setProfileData] = useState({
    photoUrl: null,
    name: "Roomie member",
    ageRange: "",
    occupation: "",
    gender: "",
    location: "Location not added",
    bio: "No bio added yet.",
    lifestyleTags: [] as string[],
    lookingFor: "",
    preferredMoveIn: "",
  });

  useEffect(() => {
    if (!profileId) { setLoading(false); return; }
    setLoading(true);
    setLoadError("");
    Promise.all([
      supabase.from("profiles").select("*").eq("id", profileId).maybeSingle(),
      supabase.from("preferences").select("answers").eq("user_id", profileId).maybeSingle(),
      supabase.from("profile_photos").select("storage_path").eq("user_id", profileId).order("position"),
    ]).then(([profileResult, preferenceResult, galleryResult]) => {
      if (profileResult.error || !profileResult.data) throw profileResult.error ?? new Error("Profile not found.");
      const row = profileResult.data as any;
      const answers = (preferenceResult.data?.answers ?? {}) as Record<string, any>;
      const age = row.date_of_birth ? Math.floor((Date.now() - new Date(row.date_of_birth).getTime()) / 31557600000) : null;
      const tags = Array.isArray(answers.personalityTags) ? answers.personalityTags : [answers.cleanliness, answers.noiseLevel, answers.sleepRoutine, answers.workStyle].filter(Boolean).map((value) => String(value).replaceAll("_", " "));
      setProfileData({ photoUrl: row.avatar_url, name: row.full_name || row.username || "Roomie member", ageRange: age ? `${age} years old` : "", occupation: row.occupation || "", gender: row.gender && row.gender !== "prefer-not-to-say" ? row.gender : "", location: [row.city, row.country].filter(Boolean).join(", ") || "Location not added", bio: row.bio || "No bio added yet.", lifestyleTags: tags, lookingFor: typeof answers.lookingFor === "string" ? answers.lookingFor : "", preferredMoveIn: typeof answers.preferredMoveIn === "string" ? answers.preferredMoveIn : "" });
      setGalleryPhotos((galleryResult.data ?? []).map((photo) => supabase.storage.from("avatars").getPublicUrl(photo.storage_path).data.publicUrl));
    }).catch((reason) => setLoadError(reason instanceof Error ? reason.message : "Unable to load profile.")).finally(() => setLoading(false));
  }, [profileId]);

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case "pending":
        return {
          label: "Request Pending",
          bg: "bg-[#fef3c7]",
          text: "text-[#92400e]",
          border: "border-[#fde68a]",
        };
      case "matched":
        return {
          label: "Matched",
          bg: "bg-[#d1fae5]",
          text: "text-[#065f46]",
          border: "border-[#a7f3d0]",
        };
      case "not-connected":
        return {
          label: "Not Connected",
          bg: "bg-[#f3f4f6]",
          text: "text-[#6b7280]",
          border: "border-[#e5e7eb]",
        };
    }
  };

  const statusBadge = getStatusBadge();

  if (loading) return <div className="min-h-screen grid place-items-center text-sm text-[#6b7280]">Loading profile…</div>;
  if (loadError) return <div className="min-h-screen grid place-items-center p-6 text-center"><div><p className="text-sm text-red-600">{loadError}</p><button onClick={onBack} className="mt-4 px-5 py-2.5 rounded-lg bg-[#fe456a] text-white">Go back</button></div></div>;

  return (
    <div className="size-full flex flex-col bg-white overflow-auto">
      {/* Status Bar Spacer */}
      <div className="h-[max(env(safe-area-inset-top),8px)]" />

      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-[#e5e7eb]">
        <div className="px-[24px] py-[16px] flex items-center justify-between">
          <button
            onClick={onBack}
            className="p-[4px] -ml-[4px] hover:bg-[#f3f4f6] rounded-[8px] transition-colors"
          >
            <ArrowLeft className="w-[24px] h-[24px] text-[#1f2a37]" />
          </button>
          <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[16px] leading-[24px] text-[#1f2a37]">
            Profile
          </p>
          <div className="w-[32px]" /> {/* Spacer for alignment */}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 pb-[120px]">
        {/* Profile Header */}
        <div className="px-[24px] pt-[24px]">
          {/* Avatar */}
          <div className="flex justify-center mb-[16px]">
            <img src={profileData.photoUrl || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(profileData.name)}&backgroundColor=fe456a&fontFamily=Arial`} alt={profileData.name} className="w-[120px] h-[120px] rounded-full object-cover" />
          </div>

          {/* Name & Basic Info */}
          <div className="text-center mb-[16px]">
            <h1 className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[24px] leading-[30px] text-[#1f2a37] mb-[4px]">
              {profileData.name}
            </h1>
            <p className="font-['Inter:Regular',sans-serif] font-normal text-[14px] leading-[20px] text-[#6b7280] mb-[2px]">
              {profileData.ageRange} • {profileData.occupation}
            </p>
            <div className="flex items-center justify-center gap-[4px] text-[#9da4ae]">
              <MapPin className="w-[14px] h-[14px]" />
              <p className="font-['Inter:Regular',sans-serif] font-normal text-[13px] leading-[18px]">
                {profileData.location}
              </p>
            </div>
            {profileData.gender && <p className="mt-1 text-[13px] text-[#6b7280] capitalize">{profileData.gender}</p>}
          </div>

          {/* Status Badge */}
          <div className="flex justify-center mb-[24px]">
            <div className={`inline-flex items-center gap-[6px] px-[16px] py-[8px] ${statusBadge.bg} border ${statusBadge.border} rounded-[20px]`}>
              <span className={`font-['Inter:Semi_Bold',sans-serif] font-semibold text-[13px] leading-[18px] ${statusBadge.text}`}>
                {statusBadge.label}
              </span>
            </div>
          </div>
        </div>

        {galleryPhotos.length > 0 && <div className="px-6 pt-2"><h2 className="text-base font-semibold text-[#1f2a37] mb-3">Photos</h2><div className="flex gap-3 overflow-x-auto pb-2">{galleryPhotos.map((url, index) => <img key={url} src={url} alt={`${profileData.name} photo ${index + 1}`} className="flex-none w-44 h-56 rounded-2xl object-cover"/>)}</div></div>}

        {/* Lifestyle Tags */}
        {profileData.lifestyleTags.length > 0 && (
          <div className="px-[24px] pt-[8px]">
            <div className="flex flex-wrap gap-[8px] justify-center">
              {profileData.lifestyleTags.map((tag) => (
                <div
                  key={tag}
                  className="px-[12px] py-[6px] bg-[#fef0f3] rounded-[16px]"
                >
                  <span className="font-['Inter:Medium',sans-serif] font-medium text-[12px] leading-[16px] text-[#fe456a]">
                    {tag}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bio */}
        <div className="px-[24px] pt-[32px]">
          <h2 className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[16px] leading-[24px] text-[#1f2a37] mb-[12px]">
            About
          </h2>
          <p className="font-['Inter:Regular',sans-serif] font-normal text-[14px] leading-[22px] text-[#6b7280]">
            {profileData.bio}
          </p>
        </div>

        {/* Looking For */}
        {profileData.lookingFor && (
          <div className="px-[24px] pt-[32px]">
            <h2 className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[16px] leading-[24px] text-[#1f2a37] mb-[12px]">
              Looking for
            </h2>
            <div className="inline-flex items-center gap-[8px] px-[16px] py-[10px] bg-[#f3f4f6] border border-[#e5e7eb] rounded-[12px]">
              <User className="w-[16px] h-[16px] text-[#6b7280]" />
              <span className="font-['Inter:Medium',sans-serif] font-medium text-[14px] leading-[20px] text-[#1f2a37]">
                {profileData.lookingFor}
              </span>
            </div>
          </div>
        )}

        {/* Preferred Move-in */}
        {profileData.preferredMoveIn && (
          <div className="px-[24px] pt-[24px]">
            <h2 className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[16px] leading-[24px] text-[#1f2a37] mb-[12px]">
              Preferred move-in
            </h2>
            <div className="inline-flex items-center gap-[8px] px-[16px] py-[10px] bg-[#f3f4f6] border border-[#e5e7eb] rounded-[12px]">
              <Clock className="w-[16px] h-[16px] text-[#6b7280]" />
              <span className="font-['Inter:Medium',sans-serif] font-medium text-[14px] leading-[20px] text-[#1f2a37]">
                {profileData.preferredMoveIn}
              </span>
            </div>
          </div>
        )}

        {/* Privacy Notice */}
        <div className="px-[24px] pt-[32px]">
          <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-[12px] p-[16px]">
            <p className="font-['Inter:Regular',sans-serif] font-normal text-[12px] leading-[18px] text-[#6b7280] text-center">
              Contact information is protected. Connect through Roomie to start chatting.
            </p>
          </div>
        </div>
      </div>

      {/* Fixed CTA */}
      {connectionStatus === "matched" && onChat && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#e5e7eb] px-[24px] py-[16px] shadow-[0px_-4px_12px_rgba(0,0,0,0.05)]">
          <button 
            onClick={onChat}
            className="w-full h-[52px] bg-[#fe456a] text-white rounded-[8px] shadow-[0px_8px_8px_-4px_rgba(254,69,106,0.1),0px_20px_24px_-4px_rgba(254,69,106,0.15)] hover:bg-[#e63d5f] transition-all font-['Inter:Semi_Bold',sans-serif] font-semibold text-[16px] leading-[24px] flex items-center justify-center gap-[8px]"
          >
            <MessageCircle className="w-[20px] h-[20px]" />
            Chat
          </button>
        </div>
      )}

      {connectionStatus === "not-connected" && onSendRequest && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#e5e7eb] px-[24px] py-[16px] shadow-[0px_-4px_12px_rgba(0,0,0,0.05)]">
          <button 
            onClick={onSendRequest}
            className="w-full h-[52px] bg-[#fe456a] text-white rounded-[8px] shadow-[0px_8px_8px_-4px_rgba(254,69,106,0.1),0px_20px_24px_-4px_rgba(254,69,106,0.15)] hover:bg-[#e63d5f] transition-all font-['Inter:Semi_Bold',sans-serif] font-semibold text-[16px] leading-[24px] flex items-center justify-center gap-[8px]"
          >
            <UserPlus className="w-[20px] h-[20px]" />
            Send Request
          </button>
          <p className="text-center font-['Inter:Regular',sans-serif] font-normal text-[12px] leading-[16px] text-[#9da4ae] mt-[8px]">
            Send a connection request to start chatting
          </p>
        </div>
      )}

      {connectionStatus === "pending" && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#e5e7eb] px-[24px] py-[16px] shadow-[0px_-4px_12px_rgba(0,0,0,0.05)]">
          <div className="w-full h-[52px] bg-[#f3f4f6] border border-[#e5e7eb] rounded-[8px] flex items-center justify-center gap-[8px]">
            <Clock className="w-[20px] h-[20px] text-[#9da4ae]" />
            <span className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[16px] leading-[24px] text-[#6b7280]">
              Request Pending
            </span>
          </div>
          <p className="text-center font-['Inter:Regular',sans-serif] font-normal text-[12px] leading-[16px] text-[#9da4ae] mt-[8px]">
            Waiting for them to accept your request
          </p>
        </div>
      )}
    </div>
  );
}

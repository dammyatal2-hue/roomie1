import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Camera, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../auth/AuthProvider";
import { supabase } from "../../lib/supabase";

interface EditProfileProps {
  onBack: () => void;
}

// Countries list (reusing from Location component)
const COUNTRIES = [
  "Rwanda", "Kenya", "Uganda", "Tanzania", "Nigeria", "South Africa", "Ghana", 
  "Ethiopia", "United States", "United Kingdom", "Canada", "Australia", "France", 
  "Germany", "Spain", "Italy", "Netherlands", "Belgium", "Switzerland", "Sweden", 
  "Norway", "Denmark", "Finland", "Poland", "Portugal", "Ireland", "Austria", 
  "Czech Republic", "Greece", "Turkey", "UAE", "India", "China", "Japan", 
  "Singapore", "Malaysia", "Thailand", "Indonesia", "Philippines", "South Korea", 
  "Vietnam", "Brazil", "Argentina", "Mexico", "Chile", "Colombia", "Peru", 
  "Egypt", "Morocco", "Israel", "New Zealand"
].sort();

const COUNTRY_TO_CITIES: Record<string, string[]> = {
  Rwanda: ["Kigali", "Musanze", "Gisenyi", "Butare", "Rwamagana"],
  Kenya: ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret"],
  Uganda: ["Kampala", "Entebbe", "Jinja", "Mbarara", "Gulu"],
  Nigeria: ["Lagos", "Abuja", "Kano", "Ibadan", "Port Harcourt"],
  "United States": ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix"],
  "United Kingdom": ["London", "Manchester", "Birmingham", "Glasgow", "Liverpool"],
};

const NATIONALITIES = [
  "Afghan", "Albanian", "Algerian", "American", "Andorran", "Angolan", "Argentine", 
  "Armenian", "Australian", "Austrian", "Azerbaijani", "Bahamian", "Bahraini", 
  "Bangladeshi", "Barbadian", "Belarusian", "Belgian", "Belizean", "Beninese", 
  "Bhutanese", "Bolivian", "Bosnian", "Brazilian", "British", "Bruneian", "Bulgarian", 
  "Burkinabe", "Burundian", "Cambodian", "Cameroonian", "Canadian", "Cape Verdean", 
  "Central African", "Chadian", "Chilean", "Chinese", "Colombian", "Comorian", 
  "Congolese", "Costa Rican", "Croatian", "Cuban", "Cypriot", "Czech", "Danish", 
  "Djiboutian", "Dominican", "Dutch", "East Timorese", "Ecuadorian", "Egyptian", 
  "Emirati", "English", "Equatorial Guinean", "Eritrean", "Estonian", "Ethiopian", 
  "Fijian", "Filipino", "Finnish", "French", "Gabonese", "Gambian", "Georgian", 
  "German", "Ghanaian", "Greek", "Grenadian", "Guatemalan", "Guinean", "Guyanese", 
  "Haitian", "Honduran", "Hungarian", "Icelandic", "Indian", "Indonesian", "Iranian", 
  "Iraqi", "Irish", "Israeli", "Italian", "Ivorian", "Jamaican", "Japanese", 
  "Jordanian", "Kazakhstani", "Kenyan", "Korean", "Kuwaiti", "Kyrgyzstani", "Laotian", 
  "Latvian", "Lebanese", "Liberian", "Libyan", "Lithuanian", "Luxembourgish", 
  "Macedonian", "Malagasy", "Malawian", "Malaysian", "Maldivian", "Malian", "Maltese", 
  "Mauritanian", "Mauritian", "Mexican", "Moldovan", "Mongolian", "Montenegrin", 
  "Moroccan", "Mozambican", "Namibian", "Nepalese", "New Zealander", "Nicaraguan", 
  "Nigerian", "Norwegian", "Omani", "Pakistani", "Panamanian", "Paraguayan", "Peruvian", 
  "Polish", "Portuguese", "Qatari", "Romanian", "Russian", "Rwandan", "Salvadoran", 
  "Saudi Arabian", "Scottish", "Senegalese", "Serbian", "Singaporean", "Slovak", 
  "Slovenian", "Somali", "South African", "Spanish", "Sri Lankan", "Sudanese", 
  "Surinamese", "Swazi", "Swedish", "Swiss", "Syrian", "Taiwanese", "Tajik", 
  "Tanzanian", "Thai", "Togolese", "Trinidadian", "Tunisian", "Turkish", "Turkmen", 
  "Ugandan", "Ukrainian", "Uruguayan", "Venezuelan", "Vietnamese", "Welsh", "Yemeni", 
  "Zambian", "Zimbabwean"
].sort();

export function EditProfile({ onBack }: EditProfileProps) {
  const { user } = useAuth();
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [galleryPhotos, setGalleryPhotos] = useState<Array<{ id: string; storage_path: string; url: string }>>([]);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [roommateDiscoverable, setRoommateDiscoverable] = useState(false);
  const [lookingForCountry, setLookingForCountry] = useState("");
  const [lookingForCity, setLookingForCity] = useState("");
  const [savingDiscovery, setSavingDiscovery] = useState(false);
  const [detectingDiscoveryLocation, setDetectingDiscoveryLocation] = useState(false);
  const [discoveryLocationError, setDiscoveryLocationError] = useState("");

  const loadGallery = async () => {
    if (!user) return;
    const { data, error } = await supabase.from("profile_photos").select("id,storage_path,position").eq("user_id", user.id).order("position");
    if (error) return;
    setGalleryPhotos((data ?? []).map((photo) => ({ ...photo, url: supabase.storage.from("avatars").getPublicUrl(photo.storage_path).data.publicUrl })));
  };

  // Form state
  const [formData, setFormData] = useState({
    fullName: "", username: "", email: user?.email ?? "", dateOfBirth: "", gender: "", nationality: "", phoneNumber: "", country: "", city: "", occupation: "", bio: "",
  });

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).single().then(({ data, error }) => {
      if (error) return toast.error(error.message);
      setAvatarUrl(data.avatar_url ?? null);
      setRoommateDiscoverable(Boolean(data.roommate_discoverable));
      setLookingForCountry(data.looking_for_country ?? "");
      setLookingForCity(data.looking_for_city ?? "");
      setFormData({ fullName: data.full_name ?? "", username: data.username ?? "", email: user.email ?? "", dateOfBirth: data.date_of_birth ?? "", gender: data.gender ?? "", nationality: data.nationality ?? "", phoneNumber: data.phone_number ?? "", country: data.country ?? "", city: data.city ?? "", occupation: data.occupation ?? "", bio: data.bio ?? "" });
    });
    void loadGallery();
  }, [user]);

  const addGalleryPhotos = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!user || files.length === 0) return;
    const available = 5 - galleryPhotos.length;
    if (files.length > available) return toast.error(`You can add ${available} more ${available === 1 ? "photo" : "photos"}.`);
    if (files.some((file) => !file.type.startsWith("image/") || file.size > 5 * 1024 * 1024)) return toast.error("Each photo must be an image smaller than 5 MB.");
    setIsUploadingGallery(true);
    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/gallery/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { contentType: file.type });
      if (uploadError) { toast.error(uploadError.message); continue; }
      const { error: rowError } = await supabase.from("profile_photos").insert({ user_id: user.id, storage_path: path, position: galleryPhotos.length + index });
      if (rowError) { await supabase.storage.from("avatars").remove([path]); toast.error(rowError.message); }
    }
    setIsUploadingGallery(false);
    await loadGallery();
  };

  const deleteGalleryPhoto = async (photo: { id: string; storage_path: string }) => {
    const { error } = await supabase.from("profile_photos").delete().eq("id", photo.id);
    if (error) return toast.error(error.message);
    await supabase.storage.from("avatars").remove([photo.storage_path]);
    await loadGallery();
  };

  const saveDiscoverySettings = async () => {
    if (!user) return toast.error("Please sign in again.");
    if (roommateDiscoverable && (!lookingForCountry.trim() || !lookingForCity.trim())) return toast.error("Choose the country and city where you are looking.");
    setSavingDiscovery(true);
    const { error } = await supabase.from("profiles").update({ roommate_discoverable: roommateDiscoverable, looking_for_country: lookingForCountry.trim() || null, looking_for_city: lookingForCity.trim() || null }).eq("id", user.id);
    setSavingDiscovery(false);
    if (error) return toast.error(error.message);
    toast.success(roommateDiscoverable ? "Your profile is now visible in roommate discovery." : "Your profile is now hidden from roommate discovery.");
  };

  const detectDiscoveryLocation = async () => {
    setDiscoveryLocationError("");
    if (!navigator.geolocation) { setDiscoveryLocationError("Location is not supported on this device."); return false; }
    setDetectingDiscoveryLocation(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 15000 }));
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${position.coords.latitude}&lon=${position.coords.longitude}&addressdetails=1`);
      if (!response.ok) throw new Error("Unable to identify your location.");
      const result = await response.json();
      const address = result.address ?? {};
      const country = address.country ?? "";
      const city = address.city || address.town || address.village || address.county || "";
      if (!country || !city) throw new Error("We could not identify your country and city.");
      setLookingForCountry(country);
      setLookingForCity(city);
      setHasChanges(true);
      return true;
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : typeof reason === "object" && reason && "message" in reason ? String(reason.message) : "Unable to access your location.";
      setDiscoveryLocationError(message || "Allow location access and try again.");
      return false;
    } finally {
      setDetectingDiscoveryLocation(false);
    }
  };

  const toggleRoommateDiscovery = async () => {
    if (roommateDiscoverable) { setRoommateDiscoverable(false); setHasChanges(true); return; }
    const located = lookingForCountry && lookingForCity ? true : await detectDiscoveryLocation();
    if (located) { setRoommateDiscoverable(true); setHasChanges(true); }
  };

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) return toast.error("Please choose an image file");
    if (file.size > 5 * 1024 * 1024) return toast.error("Profile photo must be smaller than 5 MB");

    setIsUploadingPhoto(true);
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${user.id}/profile.${extension}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
    if (uploadError) { setIsUploadingPhoto(false); return toast.error(uploadError.message); }
    const publicUrl = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
    const versionedUrl = `${publicUrl}?v=${Date.now()}`;
    const { error: updateError } = await supabase.from("profiles").update({ avatar_url: versionedUrl }).eq("id", user.id);
    setIsUploadingPhoto(false);
    if (updateError) return toast.error(updateError.message);
    setAvatarUrl(versionedUrl);
    toast.success("Profile photo updated");
    event.target.value = "";
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);

    // Reset city if country changes
    if (field === "country") {
      setFormData((prev) => ({ ...prev, city: "" }));
    }
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      toast.error("Full name is required");
      return false;
    }
    if (!formData.email.trim()) {
      toast.error("Email is required");
      return false;
    }
    if (!formData.email.includes("@")) {
      toast.error("Please enter a valid email address");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    if (!user) return;
    if (roommateDiscoverable && (!lookingForCountry || !lookingForCity)) { setIsLoading(false); return toast.error("Choose the country and city where you are looking for a roommate."); }
    const { error } = await supabase.from("profiles").update({ full_name: formData.fullName, username: formData.username, date_of_birth: formData.dateOfBirth || null, gender: formData.gender || null, nationality: formData.nationality || null, phone_number: formData.phoneNumber || null, country: formData.country || null, city: formData.city || null, occupation: formData.occupation || null, bio: formData.bio || null, roommate_discoverable: roommateDiscoverable, looking_for_country: lookingForCountry || null, looking_for_city: lookingForCity || null }).eq("id", user.id);
    if (!error && formData.email !== user.email) await supabase.auth.updateUser({ email: formData.email });
    if (error) { setIsLoading(false); toast.error(error.message); return; }

    setIsLoading(false);
    setHasChanges(false);
    toast.success("Profile updated successfully");
    
    // Wait a bit then navigate back
    setTimeout(() => {
      onBack();
    }, 500);
  };

  const cities = formData.country && COUNTRY_TO_CITIES[formData.country] 
    ? COUNTRY_TO_CITIES[formData.country] 
    : [];

  const bioCharCount = formData.bio.length;
  const bioMaxLength = 300;

  return (
    <div className="size-full flex flex-col bg-[#fcfcfd]">
      {/* Status Bar Spacer */}
      <div className="h-[max(env(safe-area-inset-top),8px)] bg-white" />

      {/* Header */}
      <div className="bg-white px-[16px] py-[12px] border-b border-[#e5e7eb] flex items-center justify-between">
        <button
          onClick={onBack}
          className="p-[8px] -ml-[8px] hover:bg-[#f3f4f6] rounded-[8px] transition-colors"
        >
          <ArrowLeft className="w-[24px] h-[24px] text-[#1f2a37]" />
        </button>
        <h1 className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[16px] leading-[24px] text-[#1f2a37]">
          Edit Profile
        </h1>
        <button
          onClick={handleSave}
          disabled={!hasChanges || isLoading}
          className={`px-[16px] py-[8px] rounded-[8px] font-['Inter:Semi_Bold',sans-serif] font-semibold text-[14px] leading-[20px] transition-all duration-200 ${
            hasChanges && !isLoading
              ? "bg-[#fe456a] text-white hover:bg-[#e63d5f]"
              : "bg-[#e5e7eb] text-[#9da4ae] cursor-not-allowed"
          }`}
        >
          {isLoading ? "Saving..." : "Save"}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {/* Profile Photo Section */}
        <div className="bg-white px-[24px] pt-[32px] pb-[24px] mb-[8px]">
          <div className="flex flex-col items-center">
            <div className="relative mb-[12px]">
              <img
                src={avatarUrl || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(formData.fullName || formData.username || user?.email || "Roomie")}&backgroundColor=fe456a&fontFamily=Arial`}
                alt="Profile"
                className="w-[100px] h-[100px] rounded-full object-cover"
              />
              <button type="button" disabled={isUploadingPhoto} onClick={() => photoInputRef.current?.click()} className="absolute bottom-0 right-0 w-[32px] h-[32px] bg-[#fe456a] rounded-full flex items-center justify-center shadow-[0px_2px_8px_0px_rgba(254,69,106,0.3)] hover:bg-[#e63d5f] transition-colors disabled:opacity-60">
                <Camera className="w-[16px] h-[16px] text-white" strokeWidth={2.5} />
              </button>
              <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </div>
            <button type="button" disabled={isUploadingPhoto} onClick={() => photoInputRef.current?.click()} className="font-['Inter:Medium',sans-serif] font-medium text-[14px] leading-[20px] text-[#fe456a] hover:opacity-70 transition-opacity disabled:opacity-60">
              {isUploadingPhoto ? "Uploading..." : "Change photo"}
            </button>
          </div>
        </div>

        <div className="bg-white px-6 pb-6 mb-2">
          <div className="flex items-center justify-between mb-3"><div><h2 className="text-sm font-semibold text-[#1f2a37]">Profile gallery</h2><p className="text-xs text-[#9da4ae] mt-1">Add up to 5 photos for other members to see.</p></div><span className="text-xs text-[#6b7280]">{galleryPhotos.length}/5</span></div>
          <div className="grid grid-cols-3 gap-2">
            {galleryPhotos.map((photo) => <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden bg-[#f3f4f6]"><img src={photo.url} alt="Profile gallery" className="size-full object-cover"/><button type="button" onClick={() => void deleteGalleryPhoto(photo)} aria-label="Delete photo" className="absolute top-1.5 right-1.5 size-7 rounded-full bg-black/60 text-white grid place-items-center"><Trash2 className="size-3.5"/></button></div>)}
            {galleryPhotos.length < 5 && <button type="button" disabled={isUploadingGallery} onClick={() => galleryInputRef.current?.click()} className="aspect-square rounded-xl border-2 border-dashed border-[#d2d6db] grid place-items-center text-[#fe456a] disabled:opacity-50"><div className="text-center"><Plus className="size-6 mx-auto"/><span className="text-[10px]">{isUploadingGallery ? "Uploading" : "Add photos"}</span></div></button>}
          </div>
          <input ref={galleryInputRef} type="file" accept="image/*" multiple className="hidden" onChange={addGalleryPhotos}/>
        </div>

        {/* Form Sections */}
        <div className="space-y-[8px]">
          <div className="bg-white px-6 py-6">
            <div className="flex items-start justify-between gap-4">
              <div><h2 className="text-sm font-semibold text-[#1f2a37]">Roommate discovery</h2><p className="text-xs leading-5 text-[#6b7280] mt-1">Allow your profile to appear to compatible members searching in the same area.</p></div>
              <button type="button" disabled={detectingDiscoveryLocation} role="switch" aria-label="Show me in roommate discovery" aria-checked={roommateDiscoverable} onClick={toggleRoommateDiscovery} className={`relative shrink-0 w-[52px] h-8 rounded-full transition-colors focus:outline-none focus:ring-4 focus:ring-[#fe456a]/20 disabled:opacity-60 ${roommateDiscoverable ? "bg-[#fe456a]" : "bg-[#d2d6db]"}`}><span className={`absolute left-1 top-1 size-6 rounded-full bg-white shadow transition-transform ${roommateDiscoverable ? "translate-x-5" : "translate-x-0"}`}/></button>
            </div>
            <div className={`mt-3 inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold ${roommateDiscoverable ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"}`}>{roommateDiscoverable ? "Visible to compatible roommates" : "Hidden from roommate discovery"}</div>
            {(roommateDiscoverable || detectingDiscoveryLocation) && <div className="mt-5 rounded-xl border border-[#e5e7eb] bg-[#f9fafb] p-3 flex items-center justify-between gap-3"><div><p className="text-xs text-[#6b7280]">Detected search location</p><p className="text-sm font-semibold text-[#1f2a37] mt-1">{detectingDiscoveryLocation ? "Detecting your location…" : [lookingForCity, lookingForCountry].filter(Boolean).join(", ")}</p></div><button type="button" disabled={detectingDiscoveryLocation} onClick={detectDiscoveryLocation} className="shrink-0 text-xs font-semibold text-[#fe456a] disabled:opacity-50">Detect again</button></div>}
            {discoveryLocationError && <p role="alert" className="mt-3 text-xs text-red-600">{discoveryLocationError}</p>}
            <p className="text-[11px] leading-4 text-[#9da4ae] mt-4">When off, your profile is hidden from Find Compatible Roommates. Existing conversations are not affected.</p>
            <button type="button" disabled={savingDiscovery} onClick={saveDiscoverySettings} className="mt-4 w-full h-11 rounded-lg bg-[#fe456a] text-white text-sm font-semibold hover:bg-[#e63d5f] disabled:opacity-60">{savingDiscovery ? "Saving…" : "Save discovery settings"}</button>
          </div>
          {/* Basic Info */}
          <div className="bg-white px-[24px] py-[24px]">
            <h2 className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[14px] leading-[20px] text-[#1f2a37] mb-[20px]">
              Basic Info
            </h2>

            <div className="space-y-[20px]">
              {/* Full Name */}
              <div>
                <label className="block font-['Inter:Medium',sans-serif] font-medium text-[13px] leading-[18px] text-[#6b7280] mb-[8px]">
                  Full Name <span className="text-[#fe456a]">*</span>
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleChange("fullName", e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full h-[48px] px-[16px] bg-[#f9fafb] border-[1.5px] border-[#e5e7eb] rounded-[8px] font-['Inter:Regular',sans-serif] font-normal text-[15px] text-[#1f2a37] placeholder:text-[#9da4ae] focus:outline-none focus:border-[#fe456a] focus:bg-white transition-colors"
                />
              </div>

              {/* Username */}
              <div>
                <label className="block font-['Inter:Medium',sans-serif] font-medium text-[13px] leading-[18px] text-[#6b7280] mb-[8px]">
                  Username
                </label>
                <div className="relative">
                  <span className="absolute left-[16px] top-1/2 -translate-y-1/2 font-['Inter:Regular',sans-serif] font-normal text-[15px] text-[#9da4ae]">
                    @
                  </span>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => handleChange("username", e.target.value)}
                    placeholder="username"
                    className="w-full h-[48px] pl-[32px] pr-[16px] bg-[#f9fafb] border-[1.5px] border-[#e5e7eb] rounded-[8px] font-['Inter:Regular',sans-serif] font-normal text-[15px] text-[#1f2a37] placeholder:text-[#9da4ae] focus:outline-none focus:border-[#fe456a] focus:bg-white transition-colors"
                  />
                </div>
                <p className="mt-[6px] font-['Inter:Regular',sans-serif] font-normal text-[12px] leading-[16px] text-[#9da4ae]">
                  Your unique username for Roomie
                </p>
              </div>

              {/* Email */}
              <div>
                <label className="block font-['Inter:Medium',sans-serif] font-medium text-[13px] leading-[18px] text-[#6b7280] mb-[8px]">
                  Email Address <span className="text-[#fe456a]">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="your@email.com"
                  className="w-full h-[48px] px-[16px] bg-[#f9fafb] border-[1.5px] border-[#e5e7eb] rounded-[8px] font-['Inter:Regular',sans-serif] font-normal text-[15px] text-[#1f2a37] placeholder:text-[#9da4ae] focus:outline-none focus:border-[#fe456a] focus:bg-white transition-colors"
                />
                <p className="mt-[6px] font-['Inter:Regular',sans-serif] font-normal text-[12px] leading-[16px] text-[#9da4ae]">
                  You may need to verify your new email
                </p>
              </div>
            </div>
          </div>

          {/* Personal Info */}
          <div className="bg-white px-[24px] py-[24px]">
            <h2 className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[14px] leading-[20px] text-[#1f2a37] mb-[20px]">
              Personal Info
            </h2>

            <div className="space-y-[20px]">
              {/* Date of Birth */}
              <div>
                <label className="block font-['Inter:Medium',sans-serif] font-medium text-[13px] leading-[18px] text-[#6b7280] mb-[8px]">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleChange("dateOfBirth", e.target.value)}
                  className="w-full h-[48px] px-[16px] bg-[#f9fafb] border-[1.5px] border-[#e5e7eb] rounded-[8px] font-['Inter:Regular',sans-serif] font-normal text-[15px] text-[#1f2a37] focus:outline-none focus:border-[#fe456a] focus:bg-white transition-colors"
                />
              </div>

              {/* Nationality */}
              <div>
                <label className="block font-['Inter:Medium',sans-serif] font-medium text-[13px] leading-[18px] text-[#6b7280] mb-[8px]">Gender</label>
                <select value={formData.gender} onChange={(e) => handleChange("gender", e.target.value)} className="w-full h-[48px] px-[16px] bg-[#f9fafb] border-[1.5px] border-[#e5e7eb] rounded-[8px] text-[15px] text-[#1f2a37] focus:outline-none focus:border-[#fe456a]"><option value="">Select gender</option><option value="woman">Woman</option><option value="man">Man</option><option value="non-binary">Non-binary</option><option value="prefer-not-to-say">Prefer not to say</option></select>
              </div>

              {/* Nationality */}
              <div>
                <label className="block font-['Inter:Medium',sans-serif] font-medium text-[13px] leading-[18px] text-[#6b7280] mb-[8px]">
                  Nationality
                </label>
                <select
                  value={formData.nationality}
                  onChange={(e) => handleChange("nationality", e.target.value)}
                  className="w-full h-[48px] px-[16px] bg-[#f9fafb] border-[1.5px] border-[#e5e7eb] rounded-[8px] font-['Inter:Regular',sans-serif] font-normal text-[15px] text-[#1f2a37] focus:outline-none focus:border-[#fe456a] focus:bg-white transition-colors appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px] bg-[right_12px_center] bg-no-repeat pr-[44px]"
                >
                  <option value="">Select nationality</option>
                  {NATIONALITIES.map((nationality) => (
                    <option key={nationality} value={nationality}>
                      {nationality}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-white px-[24px] py-[24px]">
            <h2 className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[14px] leading-[20px] text-[#1f2a37] mb-[20px]">
              Contact Info
            </h2>

            <div>
              <label className="block font-['Inter:Medium',sans-serif] font-medium text-[13px] leading-[18px] text-[#6b7280] mb-[8px]">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => handleChange("phoneNumber", e.target.value)}
                placeholder="+1 (555) 123-4567"
                className="w-full h-[48px] px-[16px] bg-[#f9fafb] border-[1.5px] border-[#e5e7eb] rounded-[8px] font-['Inter:Regular',sans-serif] font-normal text-[15px] text-[#1f2a37] placeholder:text-[#9da4ae] focus:outline-none focus:border-[#fe456a] focus:bg-white transition-colors"
              />
            </div>
          </div>

          {/* Location */}
          <div className="bg-white px-[24px] py-[24px]">
            <h2 className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[14px] leading-[20px] text-[#1f2a37] mb-[20px]">
              Location
            </h2>

            <div className="space-y-[20px]">
              {/* Country */}
              <div>
                <label className="block font-['Inter:Medium',sans-serif] font-medium text-[13px] leading-[18px] text-[#6b7280] mb-[8px]">
                  Country
                </label>
                <select
                  value={formData.country}
                  onChange={(e) => handleChange("country", e.target.value)}
                  className="w-full h-[48px] px-[16px] bg-[#f9fafb] border-[1.5px] border-[#e5e7eb] rounded-[8px] font-['Inter:Regular',sans-serif] font-normal text-[15px] text-[#1f2a37] focus:outline-none focus:border-[#fe456a] focus:bg-white transition-colors appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px] bg-[right_12px_center] bg-no-repeat pr-[44px]"
                >
                  <option value="">Select country</option>
                  {COUNTRIES.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>

              {/* City */}
              <div>
                <label className="block font-['Inter:Medium',sans-serif] font-medium text-[13px] leading-[18px] text-[#6b7280] mb-[8px]">
                  City
                </label>
                <select
                  value={formData.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  disabled={!formData.country || cities.length === 0}
                  className="w-full h-[48px] px-[16px] bg-[#f9fafb] border-[1.5px] border-[#e5e7eb] rounded-[8px] font-['Inter:Regular',sans-serif] font-normal text-[15px] text-[#1f2a37] focus:outline-none focus:border-[#fe456a] focus:bg-white transition-colors appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px] bg-[right_12px_center] bg-no-repeat pr-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {cities.length > 0 ? "Select city" : "No cities available"}
                  </option>
                  {cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Work & Lifestyle */}
          <div className="bg-white px-[24px] py-[24px]">
            <h2 className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[14px] leading-[20px] text-[#1f2a37] mb-[20px]">
              Work & Lifestyle
            </h2>

            <div>
              <label className="block font-['Inter:Medium',sans-serif] font-medium text-[13px] leading-[18px] text-[#6b7280] mb-[8px]">
                Occupation
              </label>
              <input
                type="text"
                value={formData.occupation}
                onChange={(e) => handleChange("occupation", e.target.value)}
                placeholder="e.g., Software Engineer, Teacher, Student"
                className="w-full h-[48px] px-[16px] bg-[#f9fafb] border-[1.5px] border-[#e5e7eb] rounded-[8px] font-['Inter:Regular',sans-serif] font-normal text-[15px] text-[#1f2a37] placeholder:text-[#9da4ae] focus:outline-none focus:border-[#fe456a] focus:bg-white transition-colors"
              />
            </div>
          </div>

          {/* About You */}
          <div className="bg-white px-[24px] py-[24px]">
            <h2 className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[14px] leading-[20px] text-[#1f2a37] mb-[20px]">
              About You
            </h2>

            <div>
              <label className="block font-['Inter:Medium',sans-serif] font-medium text-[13px] leading-[18px] text-[#6b7280] mb-[8px]">
                Bio
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => {
                  if (e.target.value.length <= bioMaxLength) {
                    handleChange("bio", e.target.value);
                  }
                }}
                placeholder="Tell us about yourself, your interests, and what you're looking for in a roommate..."
                rows={5}
                className="w-full px-[16px] py-[12px] bg-[#f9fafb] border-[1.5px] border-[#e5e7eb] rounded-[8px] font-['Inter:Regular',sans-serif] font-normal text-[15px] leading-[22px] text-[#1f2a37] placeholder:text-[#9da4ae] focus:outline-none focus:border-[#fe456a] focus:bg-white transition-colors resize-none"
              />
              <div className="mt-[8px] flex justify-between items-center">
                <p className="font-['Inter:Regular',sans-serif] font-normal text-[12px] leading-[16px] text-[#9da4ae]">
                  Share your hobbies, lifestyle, and what makes you a great roommate
                </p>
                <p className={`font-['Inter:Medium',sans-serif] font-medium text-[12px] leading-[16px] ${
                  bioCharCount > bioMaxLength * 0.9 ? "text-[#fe456a]" : "text-[#9da4ae]"
                }`}>
                  {bioCharCount}/{bioMaxLength}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom spacing */}
        <div className="h-[32px]" />
      </div>
    </div>
  );
}

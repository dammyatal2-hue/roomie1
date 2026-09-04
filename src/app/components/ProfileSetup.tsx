import { useEffect, useState } from "react";
import { ArrowLeft, UserRound } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../auth/AuthProvider";

interface ProfileSetupProps {
  onBack?: () => void;
  onComplete: () => void;
}

export function ProfileSetup({ onBack, onComplete }: ProfileSetupProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState("");
  const [occupation, setOccupation] = useState("");
  const [bio, setBio] = useState("");
  const [discoverable, setDiscoverable] = useState(false);
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [detectingLocation, setDetectingLocation] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name,gender,occupation,bio,roommate_discoverable,country,city,looking_for_country,looking_for_city")
      .eq("id", user.id)
      .single()
      .then(({ data, error: loadError }) => {
        if (loadError) setError(loadError.message);
        if (data) {
          setFullName(data.full_name ?? "");
          setGender(data.gender ?? "");
          setOccupation(data.occupation ?? "");
          setBio(data.bio ?? "");
          setDiscoverable(Boolean(data.roommate_discoverable));
          setCountry(data.looking_for_country || data.country || "");
          setCity(data.looking_for_city || data.city || "");
        }
        setLoading(false);
      });
  }, [user]);

  const enableDiscovery = async () => {
    if (discoverable) {
      setDiscoverable(false);
      setError("");
      return;
    }
    if (country && city) {
      setDiscoverable(true);
      setError("");
      return;
    }
    if (!navigator.geolocation) {
      setError("Location is not supported on this device. Go back and choose your location first.");
      return;
    }
    setDetectingLocation(true);
    setError("");
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 15000 })
      );
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${position.coords.latitude}&lon=${position.coords.longitude}&addressdetails=1`);
      if (!response.ok) throw new Error("Unable to identify your location.");
      const result = await response.json();
      const address = result.address ?? {};
      const detectedCountry = address.country ?? "";
      const detectedCity = address.city || address.town || address.village || address.county || "";
      if (!detectedCountry || !detectedCity) throw new Error("We could not identify your city and country.");
      setCountry(detectedCountry);
      setCity(detectedCity);
      setDiscoverable(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Allow location access to enable roommate discovery.");
    } finally {
      setDetectingLocation(false);
    }
  };

  const save = async () => {
    if (!user) return;
    if (!fullName.trim() || !gender || !occupation.trim() || bio.trim().length < 20) {
      setError("Complete all fields and write at least 20 characters about yourself.");
      return;
    }
    if (discoverable && (!country.trim() || !city.trim())) {
      setError("Add the city and country where you are looking for a roommate.");
      return;
    }
    setSaving(true);
    setError("");
    const { error: saveError } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        gender,
        occupation: occupation.trim(),
        bio: bio.trim(),
        roommate_discoverable: discoverable,
        looking_for_country: discoverable ? country.trim() : null,
        looking_for_city: discoverable ? city.trim() : null,
      })
      .eq("id", user.id);
    setSaving(false);
    if (saveError) return setError(saveError.message);
    onComplete();
  };

  if (loading) return <div className="min-h-screen grid place-items-center text-sm text-[#6b7280]">Loading your profile…</div>;

  return (
    <div className="min-h-screen bg-[#fcfcfd] flex flex-col">
      <div className="h-[max(env(safe-area-inset-top),8px)]" />
      <header className="h-16 px-5 flex items-center border-b border-[#f0f1f3] bg-white">
        {onBack && <button onClick={onBack} aria-label="Go back" className="size-10 grid place-items-center -ml-2"><ArrowLeft className="size-5" /></button>}
        <h1 className="font-semibold text-[18px] text-[#1f2a37]">Complete your profile</h1>
      </header>

      <main className="flex-1 overflow-y-auto px-5 py-6">
        <div className="max-w-md mx-auto">
          <div className="size-14 rounded-full bg-[#fff0f3] grid place-items-center mb-4"><UserRound className="size-7 text-[#fe456a]" /></div>
          <h2 className="text-[22px] font-semibold text-[#1f2a37]">Help roommates know you</h2>
          <p className="mt-2 text-sm text-[#6b7280]">This information improves your profile and roommate matches. You can edit it later in Settings.</p>

          <div className="mt-7 space-y-5">
            <label className="block"><span className="block text-sm font-medium mb-2">Full name</span><input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" className="w-full h-12 rounded-xl border border-[#d2d6db] px-4 outline-none focus:border-[#fe456a]" /></label>
            <label className="block"><span className="block text-sm font-medium mb-2">Gender</span><select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full h-12 rounded-xl border border-[#d2d6db] px-4 bg-white outline-none focus:border-[#fe456a]"><option value="">Select gender</option><option value="woman">Woman</option><option value="man">Man</option><option value="non-binary">Non-binary</option><option value="prefer-not-to-say">Prefer not to say</option></select></label>
            <label className="block"><span className="block text-sm font-medium mb-2">Occupation</span><input value={occupation} onChange={(e) => setOccupation(e.target.value)} placeholder="For example, Student or Designer" className="w-full h-12 rounded-xl border border-[#d2d6db] px-4 outline-none focus:border-[#fe456a]" /></label>
            <label className="block"><span className="block text-sm font-medium mb-2">About you</span><textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={500} rows={4} placeholder="Tell potential roommates about yourself…" className="w-full rounded-xl border border-[#d2d6db] p-4 outline-none resize-none focus:border-[#fe456a]" /><span className="block mt-1 text-right text-xs text-[#9da4ae]">{bio.length}/500</span></label>

            <div className="rounded-xl border border-[#e5e7eb] p-4">
              <div className="flex items-center justify-between gap-4">
                <div><p className="text-sm font-semibold text-[#1f2a37]">Show me in roommate discovery</p><p className="text-xs text-[#6b7280] mt-1">Other users in your search area can find your profile.</p></div>
                <button type="button" disabled={detectingLocation} role="switch" aria-label="Show me in roommate discovery" aria-checked={discoverable} onClick={enableDiscovery} className={`relative w-12 h-7 rounded-full shrink-0 transition-colors focus:outline-none focus:ring-4 focus:ring-[#fe456a]/20 disabled:opacity-60 ${discoverable ? "bg-[#fe456a]" : "bg-[#d2d6db]"}`}><span className={`absolute left-0.5 top-0.5 size-6 bg-white rounded-full shadow transition-transform ${discoverable ? "translate-x-5" : "translate-x-0"}`} /></button>
              </div>
              <div className={`mt-3 inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold ${discoverable ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"}`}>{detectingLocation ? "Detecting your location…" : discoverable ? "Visible to compatible roommates" : "Hidden from roommate discovery"}</div>
              {discoverable && <div className="mt-3 rounded-lg bg-[#f9fafb] border border-[#e5e7eb] px-3 py-2"><p className="text-xs text-[#6b7280]">Search area</p><p className="text-sm font-semibold mt-1">{city}, {country}</p></div>}
            </div>
          </div>

          {error && <p role="alert" className="mt-4 text-sm text-[#d92d20]">{error}</p>}
          <button onClick={save} disabled={saving} className="mt-6 mb-8 w-full h-12 rounded-lg bg-[#fe456a] text-white font-semibold disabled:opacity-60">{saving ? "Saving…" : "Continue"}</button>
        </div>
      </main>
    </div>
  );
}

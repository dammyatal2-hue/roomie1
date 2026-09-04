import { supabase } from "../../lib/supabase";

export interface City { id: string; name: string; subtitle: string; image: string }
export interface Listing { id: string; title: string; price: string; rentPeriod: string; location: string; city: string; country: string; intent: "roommate" | "rental"; image: string; listingType: string; roommates: number }
export interface RecommendedProfile { id: string; name: string; image: string; compatibility: number; setup: string; chips: string[] }

const cityImage = "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=900&auto=format&fit=crop";
async function cities(country?: string): Promise<City[]> {
  let query = supabase.from("listings").select("city").eq("status", "published");
  if (country) query = query.ilike("country", country.trim());
  const { data, error } = await query;
  if (error) throw error;
  const counts = new Map<string, number>();
  for (const row of data ?? []) { const city=row.city?.trim(); if(city) counts.set(city, (counts.get(city) ?? 0) + 1); }
  return [...counts].map(([name, count]) => ({ id: name, name, subtitle: `${count} ${count === 1 ? "home" : "homes"} available`, image: cityImage }));
}

export const listingService = {
  async getPopularCities(country?: string) { return (await cities(country)).slice(0, 4); },
  async getStudentCities(country?: string) { return (await cities(country)).slice(4, 8); },
  async getNearbyCities(country?: string) { return (await cities(country)).slice(8, 12); },
  async getRecommendedHomes(country?: string): Promise<Listing[]> {
    let query = supabase.from("listings").select("*,listing_photos(storage_path)").eq("status", "published").order("created_at", { ascending: false }).limit(20);
    if (country) query = query.ilike("country", country.trim());
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map((row: any) => {
      const path = row.listing_photos?.[0]?.storage_path;
      return { id: row.id, title: row.title, price: `${row.rent}`, rentPeriod: row.rent_period || "month", location: [row.city, row.country].filter(Boolean).join(", "), city: row.city, country: row.country, intent: row.intent, image: path ? supabase.storage.from("listing-photos").getPublicUrl(path).data.publicUrl : cityImage, listingType: row.intent === "roommate" ? "Shared home" : "Entire rental", roommates: row.details?.roommates?.length ?? 0 };
    });
  },
  async getPopularHomes(country?: string): Promise<Listing[]> {
    let query = supabase.from("listings").select("*,listing_photos(storage_path)").eq("status", "published").order("view_count", { ascending: false }).order("created_at", { ascending: false }).limit(10);
    if (country) query = query.ilike("country", country.trim());
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map((row: any) => {
      const path = row.listing_photos?.[0]?.storage_path;
      return { id: row.id, title: row.title, price: `${row.rent}`, rentPeriod: row.rent_period || "month", location: [row.city, row.country].filter(Boolean).join(", "), city: row.city, country: row.country, intent: row.intent, image: path ? supabase.storage.from("listing-photos").getPublicUrl(path).data.publicUrl : cityImage, listingType: row.intent === "roommate" ? "Shared home" : "Entire rental", roommates: row.details?.roommates?.length ?? 0 };
    });
  },
  async getRecommendedProfiles(city?: string, excludeUserId?: string): Promise<RecommendedProfile[]> {
    let query = supabase.from("profiles").select("id,username,full_name,avatar_url,preferences(answers)").limit(10);
    if (city) query = query.eq("city", city);
    if (excludeUserId) query = query.neq("id", excludeUserId);
    const { data, error } = await query;
    if (error) throw error;
    let ownAnswers: Record<string, any> = {};
    if (excludeUserId) {
      const { data: own } = await supabase.from("preferences").select("answers").eq("user_id", excludeUserId).maybeSingle();
      ownAnswers = (own?.answers ?? {}) as Record<string, any>;
    }
    return (data ?? []).map((row: any) => {
      const answers = (row.preferences?.[0]?.answers ?? {}) as Record<string, any>;
      const comparable = ["cleanliness", "noiseLevel", "sleepRoutine", "workStyle", "comfortableWithVisitors", "comfortableWithPets", "smokingAllowed"];
      const answered = comparable.filter((key) => ownAnswers[key] !== undefined && answers[key] !== undefined);
      const matches = answered.filter((key) => ownAnswers[key] === answers[key]);
      const compatibility = answered.length ? Math.round((matches.length / answered.length) * 100) : 0;
      const chips = [...(Array.isArray(answers.personalityTags) ? answers.personalityTags : []), answers.cleanliness, answers.noiseLevel, answers.workStyle].filter((value): value is string => typeof value === "string" && Boolean(value)).map((value) => value.replaceAll("_", " ")).slice(0, 3);
      return { id: row.id, name: row.full_name || row.username, image: row.avatar_url || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(row.username)}`, compatibility, setup: city ? `Roommate in ${city}` : "Looking for a compatible home", chips };
    });
  },
};

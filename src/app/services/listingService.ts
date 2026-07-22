import { supabase } from "../../lib/supabase";

export interface City { id: string; name: string; subtitle: string; image: string }
export interface Listing { id: string; title: string; price: string; location: string; image: string; listingType: string; roommates: number }
export interface RecommendedProfile { id: string; name: string; image: string; compatibility: number; setup: string; chips: string[] }

const cityImage = "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=900&auto=format&fit=crop";
async function cities(): Promise<City[]> {
  const { data, error } = await supabase.from("listings").select("city").eq("status", "published");
  if (error) throw error;
  const counts = new Map<string, number>();
  for (const row of data ?? []) counts.set(row.city, (counts.get(row.city) ?? 0) + 1);
  return [...counts].map(([name, count]) => ({ id: name, name, subtitle: `${count} ${count === 1 ? "home" : "homes"} available`, image: cityImage }));
}

export const listingService = {
  async getPopularCities() { return (await cities()).slice(0, 4); },
  async getStudentCities() { return (await cities()).slice(4, 8); },
  async getNearbyCities() { return (await cities()).slice(8, 12); },
  async getRecommendedHomes(): Promise<Listing[]> {
    const { data, error } = await supabase.from("listings").select("id,title,rent,city,area,intent,details,listing_photos(storage_path)").eq("status", "published").limit(10);
    if (error) throw error;
    return (data ?? []).map((row: any) => {
      const path = row.listing_photos?.[0]?.storage_path;
      return { id: row.id, title: row.title, price: `${row.rent}`, location: [row.area, row.city].filter(Boolean).join(", "), image: path ? supabase.storage.from("listing-photos").getPublicUrl(path).data.publicUrl : cityImage, listingType: row.intent === "roommate" ? "Shared home" : "Entire rental", roommates: row.details?.roommates?.length ?? 0 };
    });
  },
  async getRecommendedProfiles(): Promise<RecommendedProfile[]> {
    const { data, error } = await supabase.from("profiles").select("id,username,full_name,avatar_url,preferences(answers)").limit(10);
    if (error) throw error;
    return (data ?? []).map((row: any) => ({ id: row.id, name: row.full_name || row.username, image: row.avatar_url || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(row.username)}`, compatibility: 75, setup: "Looking for a compatible home", chips: Object.keys(row.preferences?.[0]?.answers ?? {}).slice(0, 3) }));
  },
};

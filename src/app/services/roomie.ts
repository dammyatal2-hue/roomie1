import { supabase } from "../../lib/supabase";
import type { ListingData } from "../components/CreateListingContext";

export async function publishListing(userId: string, data: ListingData) {
  if (!data.intent || !data.livingSetup) throw new Error("Complete the listing type and living setup.");
  const listingPayload = {
    owner_id: userId, intent: data.intent, living_setup: data.livingSetup,
    title: `${data.livingSetup.replaceAll("-", " ")} in ${data.locationDetails.area}`,
    description: data.description, country: data.locationDetails.country, city: data.locationDetails.city,
    area: data.locationDetails.area, address: data.locationDetails.address || null,
    latitude: data.locationDetails.latitude, longitude: data.locationDetails.longitude,
    hide_address: data.locationDetails.hideAddress, rent: Number(data.rent), rent_period: data.rentPeriod, deposit: Number(data.deposit || 0),
    move_in_date: data.moveInDate, minimum_stay: data.minimumStay, ideal_for: data.idealFor,
    details: { space: data.spaceDetails, nearby: data.nearbyFacilities, roommates: data.existingRoommates }, status: "published",
  };
  let { data: listing, error } = await supabase.from("listings").insert(listingPayload).select("id").single();
  if (error && /rent_period|column .* does not exist/i.test(error.message)) {
    const { rent_period: _rentPeriod, ...legacyPayload } = listingPayload;
    ({ data: listing, error } = await supabase.from("listings").insert(legacyPayload).select("id").single());
  }
  if (error) throw error;
  for (const [position, file] of data.photos.entries()) {
    const path = `${userId}/${listing.id}/${crypto.randomUUID()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("listing-photos").upload(path, file);
    if (uploadError) throw uploadError;
    const { error: rowError } = await supabase.from("listing_photos").insert({ listing_id: listing.id, storage_path: path, position });
    if (rowError) throw rowError;
  }
  return listing.id;
}

export async function listPublishedListings(city?: string) {
  let query = supabase.from("listings").select("*, listing_photos(*)").eq("status", "published").order("created_at", { ascending: false });
  if (city) query = query.ilike("city", city);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

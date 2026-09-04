import { useEffect, useState } from "react";
import { MapPin, Plus, Trash2 } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../auth/AuthProvider";

interface MyListingProps { onCreateListing: () => void }
interface ListingRow { id:string; title:string; city:string; area:string; rent:number; status:string; intent:string; created_at:string; listing_photos:{storage_path:string}[] }

export function MyListing({ onCreateListing }: MyListingProps) {
  const { user } = useAuth();
  const [listings, setListings] = useState<ListingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("listings").select("id,title,city,area,rent,status,intent,created_at,listing_photos(storage_path)").eq("owner_id", user.id).order("created_at", { ascending:false }).then(({ data }) => { setListings((data as ListingRow[]) ?? []); setLoading(false); });
  }, [user]);

  const deleteListing = async (listing: ListingRow) => {
    if (!window.confirm(`Delete “${listing.title}”? This cannot be undone.`)) return;
    setDeletingId(listing.id);
    const paths = (listing.listing_photos ?? []).map((photo) => photo.storage_path);
    if (paths.length) await supabase.storage.from("listing-photos").remove(paths);
    const { error } = await supabase.from("listings").delete().eq("id", listing.id).eq("owner_id", user!.id);
    if (!error) setListings((current) => current.filter((item) => item.id !== listing.id));
    else window.alert(error.message);
    setDeletingId(null);
  };

  return <div className="size-full flex flex-col bg-[#fcfcfd]">
    <div className="h-[max(env(safe-area-inset-top),8px)]" />
    <div className="px-6 py-4 border-b border-[#e5e7eb] flex items-center justify-between">
      <h1 className="font-semibold text-[18px] text-[#1f2a37]">My Listings</h1>
      <button onClick={onCreateListing} className="size-10 rounded-full bg-[#fe456a] text-white grid place-items-center" aria-label="Create listing"><Plus size={20}/></button>
    </div>
    <div className="flex-1 overflow-auto p-6 pb-24">
      {loading ? <p className="text-center text-sm text-[#9da4ae] py-12">Loading listings…</p> : listings.length ? <div className="grid gap-4 sm:grid-cols-2">
        {listings.map((listing) => { const path=listing.listing_photos?.[0]?.storage_path; const image=path ? supabase.storage.from("listing-photos").getPublicUrl(path).data.publicUrl : null; return <article key={listing.id} className="bg-white rounded-xl border border-[#e5e7eb] overflow-hidden">
          {image ? <img src={image} alt="" className="w-full h-44 object-cover"/> : <div className="h-32 bg-[#f3f4f6] grid place-items-center text-sm text-[#9da4ae]">No photo</div>}
          <div className="p-4"><div className="flex justify-between gap-3"><h2 className="font-semibold text-[#1f2a37]">{listing.title}</h2><span className={`text-xs px-2 py-1 rounded-full h-fit ${listing.status === "published" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>{listing.status}</span></div>
          <p className="mt-2 flex items-center gap-1 text-sm text-[#6b7280]"><MapPin size={14}/>{listing.area}, {listing.city}</p><div className="mt-3 flex items-center justify-between"><p className="font-bold text-[#fe456a]">{listing.rent}/month</p><button type="button" onClick={() => deleteListing(listing)} disabled={deletingId === listing.id} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50" aria-label={`Delete ${listing.title}`}><Trash2 size={16}/>{deletingId === listing.id ? "Deleting…" : "Delete"}</button></div></div>
        </article>; })}
      </div> : <div className="h-full flex flex-col items-center justify-center text-center pb-20"><div className="size-24 rounded-full bg-[#f3f4f6] grid place-items-center mb-5"><Plus size={36} className="text-[#9da4ae]"/></div><h2 className="text-xl font-semibold text-[#1f2a37]">No listings yet</h2><p className="text-sm text-[#6b7280] mt-2 mb-6">Create your first listing to find a roommate or tenant.</p><button onClick={onCreateListing} className="h-12 px-6 bg-[#fe456a] text-white rounded-lg font-semibold">Create Listing</button></div>}
    </div>
  </div>;
}

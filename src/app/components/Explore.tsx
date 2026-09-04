import { useState, useEffect } from "react";
import { Search, SlidersHorizontal, MapPin } from "lucide-react";
import { FilterModal, initialFilters, type FilterState } from "./FilterModal";
import { listingService, City } from "../services/listingService";
import { useAuth } from "../auth/AuthProvider";
import { supabase } from "../../lib/supabase";

interface ExploreProps {
  onViewListing?: (listingId: string) => void;
  onViewProfile?: () => void;
  onSelectCity?: (cityName: string) => void;
}

export function Explore({ onViewListing, onViewProfile, onSelectCity }: ExploreProps) {
  const { user } = useAuth();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  const [popularCities, setPopularCities] = useState<City[]>([]);
  const [studentCities, setStudentCities] = useState<City[]>([]);
  const [nearbyCities, setNearbyCities] = useState<City[]>([]);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(initialFilters);

  const handleApplyFilters = (count: number, filters: FilterState) => {
    setActiveFiltersCount(count);
    setAppliedFilters(filters);
    setIsFilterOpen(false);
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      const { data: profile } = await supabase.from("profiles").select("country").eq("id", user.id).single();
      const local = profile?.country ? await listingService.getPopularCities(profile.country) : [];
      const all = local.length ? local : await listingService.getPopularCities();
      setPopularCities(all.slice(0, 4));
      setStudentCities(all.slice(4, 8));
      setNearbyCities(all.slice(8, 12));
    };
    fetchData();
  }, [user]);

  useEffect(() => {
    const term = search.trim();
    if (!term && activeFiltersCount === 0) { setSearchResults([]); setSearching(false); setSearchError(""); return; }
    const timer = window.setTimeout(async () => {
      setSearching(true); setSearchError("");
      const safeTerm = term.replace(/[,%()]/g, " ").trim();
      let query = supabase.from("listings").select("*,listing_photos(storage_path)").eq("status", "published").order("created_at", { ascending: false }).limit(100);
      if (safeTerm) query = query.or(`title.ilike.%${safeTerm}%,city.ilike.%${safeTerm}%,area.ilike.%${safeTerm}%,country.ilike.%${safeTerm}%`);
      const { data, error } = await query;
      if (error) { setSearchError(error.message); setSearchResults([]); }
      else {
        const now = new Date();
        const monthFromNow = new Date(now); monthFromNow.setMonth(monthFromNow.getMonth() + 1);
        const filtered = (data ?? []).filter((listing: any) => {
          if (appliedFilters.livingSetup.length && !appliedFilters.livingSetup.includes(listing.living_setup)) return false;
          const rent = Number(listing.rent);
          if (rent < appliedFilters.priceRange[0] || rent > appliedFilters.priceRange[1]) return false;
          if (appliedFilters.furnishing.length) {
            const furnished = Boolean(listing.details?.space?.furnished);
            if (appliedFilters.furnishing.includes("furnished") && !furnished) return false;
            if (appliedFilters.furnishing.includes("unfurnished") && furnished) return false;
          }
          if (appliedFilters.idealFor.length && !appliedFilters.idealFor.some((value) => (listing.ideal_for ?? []).includes(value))) return false;
          if (appliedFilters.nearbyFacilities.length) {
            const facilities = (listing.details?.nearby ?? []).map((item: any) => item.id);
            if (!appliedFilters.nearbyFacilities.every((value) => facilities.includes(value))) return false;
          }
          if (appliedFilters.moveInDate.length) {
            const moveIn = new Date(listing.move_in_date);
            const matchesDate = appliedFilters.moveInDate.some((value) => value === "flexible" || value === "asap" && moveIn <= now || value === "within-1-month" && moveIn <= monthFromNow);
            if (!matchesDate) return false;
          }
          if (appliedFilters.roommateLifestyle.length) {
            const searchable = [...(listing.ideal_for ?? []), ...(listing.details?.roommates ?? []).flatMap((roommate: any) => roommate.lifestyleBadges ?? [])].join(" ").toLowerCase();
            if (!appliedFilters.roommateLifestyle.every((value) => searchable.includes(value.replace("wfh-friendly", "wfh")))) return false;
          }
          return true;
        });
        setSearchResults(filtered);
      }
      setSearching(false);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [search, appliedFilters, activeFiltersCount]);

  return (
    <>
      <div className="size-full flex flex-col bg-[#fafafa]">
        {/* Status Bar Spacer */}
        <div className="h-[max(env(safe-area-inset-top),8px)] bg-white" />

        {/* Header */}
        <div className="bg-white px-[24px] py-[16px] border-b border-[#e5e7eb]">
          <h1 className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[24px] leading-[32px] text-[#1f2a37]">
            Explore
          </h1>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white px-[24px] py-[12px] border-b border-[#e5e7eb]">
          <div className="flex gap-[12px] items-center">
            {/* Search Input */}
            <div className="flex-1 flex items-center gap-[12px] px-[16px] py-[12px] bg-[#f9fafb] rounded-[12px] border border-[#e5e7eb]">
              <Search className="w-[20px] h-[20px] text-[#9da4ae]" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by city, area, school, or workplace"
                className="flex-1 bg-transparent outline-none font-['Inter:Regular',sans-serif] font-normal text-[14px] leading-[20px] text-[#1f2a37] placeholder:text-[#9da4ae]"
              />
            </div>

            {/* Filter Button */}
            <button
              onClick={() => setIsFilterOpen(true)}
              className="relative flex items-center justify-center w-[48px] h-[48px] bg-[#fe456a] rounded-[12px] shadow-[0px_4px_8px_0px_rgba(254,69,106,0.2)] hover:bg-[#e63d5f] transition-colors"
            >
              <SlidersHorizontal className="w-[20px] h-[20px] text-white" />
              {activeFiltersCount > 0 && (
                <div className="absolute -top-[4px] -right-[4px] w-[20px] h-[20px] bg-[#1f2a37] rounded-full flex items-center justify-center">
                  <span className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[10px] leading-[12px] text-white">
                    {activeFiltersCount}
                  </span>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Content Area - City Discovery */}
        <div className="flex-1 overflow-auto pb-[80px]">
          {(search.trim() || activeFiltersCount > 0) && <div className="px-6 py-5">
            <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-semibold text-[#1f2a37]">Search results</h2>{!searching && <span className="text-xs text-[#9da4ae]">{searchResults.length} found</span>}</div>
            {searching ? <p className="text-center text-sm text-[#9da4ae] py-12">Searching properties…</p> : searchError ? <p className="text-center text-sm text-red-600 py-12">{searchError}</p> : searchResults.length ? <div className="grid gap-4 sm:grid-cols-2">{searchResults.map((listing) => { const path=listing.listing_photos?.[0]?.storage_path; const image=path ? supabase.storage.from("listing-photos").getPublicUrl(path).data.publicUrl : null; return <button key={listing.id} onClick={() => onViewListing?.(listing.id)} className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white text-left hover:shadow-md transition-shadow">{image ? <img src={image} alt={listing.title} className="w-full h-44 object-cover"/> : <div className="h-36 bg-[#f3f4f6] grid place-items-center text-xs text-[#9da4ae]">No photo</div>}<div className="p-4"><p className="text-xs text-[#9da4ae] capitalize">{String(listing.living_setup).replaceAll("-", " ")}</p><h3 className="font-semibold text-[#1f2a37] mt-1 truncate">{listing.title}</h3><p className="text-sm text-[#6b7280] mt-1 flex items-center gap-1"><MapPin className="size-3.5"/>{[listing.area,listing.city,listing.country].filter(Boolean).join(", ")}</p><p className="font-bold text-[#fe456a] mt-2">{listing.rent}<span className="text-xs font-normal text-[#9da4ae]">/{listing.rent_period || "month"}</span></p></div></button>; })}</div> : <p className="text-center text-sm text-[#9da4ae] py-12">No published properties match “{search.trim()}”.</p>}
          </div>}
          {!search.trim() && activeFiltersCount === 0 && <>
          {/* Popular Cities */}
          {popularCities.length > 0 && (
            <div className="px-[24px] py-[20px]">
              <h2 className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[18px] leading-[24px] text-[#1f2a37] mb-[16px]">
                Popular cities
              </h2>
              <div className="flex flex-col gap-[16px]">
                {popularCities.map((city) => (
                  <button
                    key={city.id}
                    onClick={() => onSelectCity?.(city.name)}
                    className="bg-white rounded-[12px] overflow-hidden hover:shadow-lg transition-all border border-[#e5e7eb]"
                  >
                    <div className="relative">
                      <img
                        src={city.image}
                        alt={city.name}
                        className="w-full h-[200px] object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                      <div className="absolute bottom-[16px] left-[16px] right-[16px]">
                        <h3 className="font-['Inter:Bold',sans-serif] font-bold text-[22px] leading-[28px] text-white mb-[4px]">
                          {city.name}
                        </h3>
                        <p className="font-['Inter:Regular',sans-serif] font-normal text-[14px] leading-[18px] text-white/90">
                          {city.subtitle}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Student Cities */}
          {studentCities.length > 0 && (
            <div className="px-[24px] py-[20px] bg-[#fafafa]">
              <h2 className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[18px] leading-[24px] text-[#1f2a37] mb-[16px]">
                Student cities
              </h2>
              <div className="flex flex-col gap-[16px]">
                {studentCities.map((city) => (
                  <button
                    key={city.id}
                    onClick={() => onSelectCity?.(city.name)}
                    className="bg-white rounded-[12px] overflow-hidden hover:shadow-lg transition-all border border-[#e5e7eb]"
                  >
                    <div className="relative">
                      <img
                        src={city.image}
                        alt={city.name}
                        className="w-full h-[200px] object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                      <div className="absolute bottom-[16px] left-[16px] right-[16px]">
                        <h3 className="font-['Inter:Bold',sans-serif] font-bold text-[22px] leading-[28px] text-white mb-[4px]">
                          {city.name}
                        </h3>
                        <p className="font-['Inter:Regular',sans-serif] font-normal text-[14px] leading-[18px] text-white/90">
                          {city.subtitle}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Nearby Cities */}
          {nearbyCities.length > 0 && (
            <div className="px-[24px] py-[20px]">
              <h2 className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[18px] leading-[24px] text-[#1f2a37] mb-[16px]">
                Nearby cities
              </h2>
              <div className="flex flex-col gap-[16px]">
                {nearbyCities.map((city) => (
                  <button
                    key={city.id}
                    onClick={() => onSelectCity?.(city.name)}
                    className="bg-white rounded-[12px] overflow-hidden hover:shadow-lg transition-all border border-[#e5e7eb]"
                  >
                    <div className="relative">
                      <img
                        src={city.image}
                        alt={city.name}
                        className="w-full h-[200px] object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                      <div className="absolute bottom-[16px] left-[16px] right-[16px]">
                        <h3 className="font-['Inter:Bold',sans-serif] font-bold text-[22px] leading-[28px] text-white mb-[4px]">
                          {city.name}
                        </h3>
                        <p className="font-['Inter:Regular',sans-serif] font-normal text-[14px] leading-[18px] text-white/90">
                          {city.subtitle}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          </>}
        </div>
      </div>

      {/* Filter Modal */}
      {isFilterOpen && (
        <FilterModal
          onClose={() => setIsFilterOpen(false)}
          onApply={handleApplyFilters}
        />
      )}
    </>
  );
}

export interface Listing {
  id: string;
  title: string;
  price: string;
  location: string;
  image: string;
  listingType?: string;
  roommates?: number;
  setup?: string;
  neighborhood?: string;
  availability?: string;
  badges?: string[];
}

export interface City {
  id: string;
  name: string;
  subtitle: string;
  image: string;
  homesCount: number;
}

export interface RecommendedProfile {
  id: string;
  name: string;
  image?: string;
  initial?: string;
  compatibility: number;
  setup: string;
  chips?: string[];
}

const RECOMMENDED_PROFILES: RecommendedProfile[] = [
  {
    id: "1",
    name: "Sarah K.",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
    initial: "S",
    compatibility: 92,
    setup: "Looking for roommate",
    chips: ["Quiet", "Clean", "WFH"],
  },
  {
    id: "2",
    name: "Alex M.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
    initial: "A",
    compatibility: 88,
    setup: "Room available",
    chips: ["Social", "Cook", "Early Bird"],
  },
  {
    id: "3",
    name: "Emma R.",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
    initial: "E",
    compatibility: 85,
    setup: "Looking for roommate",
    chips: ["Quiet", "WFH", "Pet-friendly"],
  },
];

const RECOMMENDED_HOMES: Listing[] = [
  {
    id: "1",
    title: "Cozy 2BR in Kicukiro",
    price: "$120",
    location: "Kicukiro",
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=200&h=150&fit=crop",
    listingType: "Private Room · Shared Apartment",
    roommates: 2,
    setup: "Private Room · Shared Apartment",
  },
  {
    id: "2",
    title: "Modern Studio Downtown",
    price: "$180",
    location: "City Center",
    image: "https://images.unsplash.com/photo-1502672260066-6bc35f0aafd6?w=200&h=150&fit=crop",
    listingType: "Entire Home",
    roommates: 0,
    setup: "Studio",
  },
  {
    id: "3",
    title: "Shared 3BR Apartment",
    price: "$100",
    location: "Gasabo",
    image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=200&h=150&fit=crop",
    listingType: "Private Room · Shared Apartment",
    roommates: 2,
    setup: "Private Room · Shared Apartment",
  },
];

const POPULAR_CITIES: City[] = [
  {
    id: "1",
    name: "Kigali",
    subtitle: "Shared homes & rentals",
    image: "https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=600&h=400&fit=crop",
    homesCount: 120,
  },
  {
    id: "2",
    name: "Nairobi",
    subtitle: "Homes available",
    image: "https://images.unsplash.com/photo-1611348524140-53c9a25263d6?w=600&h=400&fit=crop",
    homesCount: 95,
  },
  {
    id: "3",
    name: "Kampala",
    subtitle: "Shared homes & rentals",
    image: "https://images.unsplash.com/photo-1609743522653-52354461eb27?w=600&h=400&fit=crop",
    homesCount: 78,
  },
];

const STUDENT_CITIES: City[] = [
  {
    id: "4",
    name: "Butare",
    subtitle: "Student-friendly homes",
    image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600&h=400&fit=crop",
    homesCount: 45,
  },
  {
    id: "5",
    name: "Musanze",
    subtitle: "Shared homes & rentals",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop",
    homesCount: 32,
  },
];

const NEARBY_CITIES: City[] = [
  {
    id: "6",
    name: "Rubavu",
    subtitle: "Homes available",
    image: "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=600&h=400&fit=crop",
    homesCount: 28,
  },
  {
    id: "7",
    name: "Rwamagana",
    subtitle: "Shared homes & rentals",
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&h=400&fit=crop",
    homesCount: 19,
  },
];

export const listingService = {
  async getRecommendedProfiles(): Promise<RecommendedProfile[]> {
    // In a real app, this would be a fetch() call
    return RECOMMENDED_PROFILES;
  },

  async getRecommendedHomes(): Promise<Listing[]> {
    return RECOMMENDED_HOMES;
  },

  async getPopularCities(): Promise<City[]> {
    return POPULAR_CITIES;
  },

  async getStudentCities(): Promise<City[]> {
    return STUDENT_CITIES;
  },

  async getNearbyCities(): Promise<City[]> {
    return NEARBY_CITIES;
  },
};
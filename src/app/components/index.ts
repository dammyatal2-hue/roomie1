export type RequestStatus = "pending" | "accepted" | "declined";

export interface User {
  id: string;
  name: string;
  email: string;
  username?: string;
  avatar?: string;
  role: "roommate" | "landlord" | "both";
  bio?: string;
  occupation?: string;
  ageRange?: string;
  lifestyleTags: string[];
  location?: string;
  nationality?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export type AppScreen = 
  | "LOGIN" 
  | "SIGNUP" 
  | "FORGOT_PASSWORD"
  | "VERIFY_EMAIL"
  | "CHANGE_PASSWORD"
  | "SUCCESS_RESET"
  | "ONBOARDING_FLOW"
  | "ONBOARDING"
  | "MAIN_TABS" 
  | "ADMIN_DASHBOARD"
  | "MATCHING"
  | "MESSAGES"
  | "NOTIFICATIONS"
  | "EDIT_PROFILE";
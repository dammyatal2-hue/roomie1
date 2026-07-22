import { useEffect, useState } from "react";
import { Toaster } from "./components/ui/sonner";
import { Home } from "./components/Home";
import { CommunityFeed } from "./components/CommunityFeed";
import { Community } from "./components/Community";
import { BottomNavigation } from "./components/BottomNavigation";
import { LifestylePreferences } from "./components/LifestylePreferences";
import { LifestylePreferencesFigma } from "./components/LifestylePreferencesFigma";
import { MyListing } from "./components/MyListing";
import { CreateListing } from "./components/CreateListing";
import { PropertyDetails } from "./components/PropertyDetails";
import { RentalDetails } from "./components/RentalDetails";
import { PublicProfileView } from "./components/PublicProfileView";
import { Explore } from "./components/Explore";
import { Profile } from "./components/Profile";
import { EditProfile } from "./components/EditProfile";
import { OnboardingFlow } from "./components/OnboardingFlow";
import { SignUpScreen } from "./components/SignUpScreen";
import { SelectLocationScreen } from "./components/SelectLocationScreen";
import { MapsScreen } from "./components/MapsScreen";
import { RoommateMatching } from "./components/RoommateMatching";
import { LifestylePreferencesEditor } from "./components/LifestylePreferencesEditor";
import { RequestToJoin } from "./components/RequestToJoin";
import { Messages } from "./components/Messages";
import { Notifications } from "./components/Notifications";
import { RequestAccepted } from "./components/RequestAccepted";
import { ChatThread } from "./components/ChatThread";
import { RequestHandlingSettings } from "./components/RequestHandlingSettings";
import { Homepage } from "./components/Homepage";
import { CityListings } from "./components/CityListings";
import { AdminDashboard } from "./components/AdminDashboard";
import { BookingRequest } from "./components/BookingRequest";
import { RequestsInbox } from "./components/RequestsInbox";
import { RequestDetail } from "./components/RequestDetail";
import { About } from "./components/About";
import { ContactSupport } from "./components/ContactSupport";
import { PrivacyPolicy } from "./components/PrivacyPolicy";
import { TermsOfService } from "./components/TermsOfService";
import { Login } from "./components/Login";
import { ForgotPassword } from "./components/ForgotPassword";
import { VerifyEmail } from "./components/VerifyEmail";
import { ChangePassword } from "./components/ChangePassword";
import { SuccessReset } from "./components/SuccessReset";
import type { RequestStatus } from "./components";
import { useAuth } from "./auth/AuthProvider";
import { isSupabaseConfigured } from "../lib/supabase";

const sanitizeLog = (value: unknown): string =>
  String(value).replace(/[\r\n]/g, " ");

type AppScreen = string;

function AppContent() {
  const { session, loading: isLoading, signIn, signUp, signOut } = useAuth();
  const isAuthenticated = Boolean(session);
  const [currentScreen, setCurrentScreen] = useState<AppScreen>(isAuthenticated ? "MAIN_TABS" : "LOGIN");
  const [activeTab, setActiveTab] = useState("home");
  const [bookingRequestType, setBookingRequestType] = useState<"shared" | "entire">("shared");
  const [currentChatStatus, setCurrentChatStatus] = useState<RequestStatus | undefined>("accepted");
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [currentRequestId, setCurrentRequestId] = useState<string>("");
  const [currentRequestType, setCurrentRequestType] = useState<"received" | "sent">("received");

  // Demo: Request status state (can be toggled for testing)
  const [demoRequestStatus, setDemoRequestStatus] = useState<RequestStatus | undefined>(undefined);
  
  // Demo: Unread notification and message badges (set to true to show badges)
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(true);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(true);

  // Handle initial screen state based on auth
  useEffect(() => {
    if (!isLoading) {
      setCurrentScreen(isAuthenticated ? "MAIN_TABS" : "LOGIN");
    }
  }, [isAuthenticated, isLoading]);

  if (!isSupabaseConfigured) return <div className="min-h-screen bg-[#fcfcfd] grid place-items-center p-6"><div className="max-w-lg rounded-2xl bg-white border border-[#e5e7eb] p-8"><h1 className="text-xl font-semibold">Connect Roomie to Supabase</h1><p className="mt-3 text-sm text-[#667085]">Copy <code>.env.example</code> to <code>.env.local</code>, add the project URL and anon key, then run the SQL migration in <code>supabase/migrations</code>.</p></div></div>;
  if (isLoading) return <div className="size-full flex items-center justify-center">Loading...</div>;

  // If admin dashboard is active, show it (full screen, no navigation)
  if (currentScreen === "ADMIN_DASHBOARD") {
    return <AdminDashboard onExit={() => setCurrentScreen("MAIN_TABS")} />;
  }

  // Show login if not authenticated
  if (!isAuthenticated && currentScreen === "LOGIN") {
    return (
      <Login
        onBack={() => setCurrentScreen("ONBOARDING_FLOW")}
        onSignIn={async (email, password) => { await signIn(email, password); setCurrentScreen("MAIN_TABS"); }}
        onSignUp={() => setCurrentScreen("SIGNUP")}
        onForgotPassword={() => setCurrentScreen("FORGOT_PASSWORD")}
      />
    );
  }

  // If forgot password is active, show it
  if (currentScreen === "FORGOT_PASSWORD") {
    return (
      <ForgotPassword
        onBack={() => setCurrentScreen("LOGIN")}
        onContinue={(method) => {
          console.log("Password reset method:", sanitizeLog(method));
          setCurrentScreen("VERIFY_EMAIL");
        }}
      />
    );
  }

  // If verify email is active, show it
  if (currentScreen === "VERIFY_EMAIL") {
    return (
      <VerifyEmail
        onBack={() => setCurrentScreen("FORGOT_PASSWORD")}
        onVerify={(code) => {
          console.log("Verification code:", sanitizeLog(code));
          setCurrentScreen("CHANGE_PASSWORD");
        }}
      />
    );
  }

  // If change password is active, show it
  if (currentScreen === "CHANGE_PASSWORD") {
    return (
      <ChangePassword
        onBack={() => setCurrentScreen("VERIFY_EMAIL")}
        onChangePassword={(_newPassword, _confirmPassword) => {
          console.log("New password set");
          setCurrentScreen("SUCCESS_RESET");
        }}
      />
    );
  }

  // If success reset is active, show it
  if (currentScreen === "SUCCESS_RESET") {
    return (
      <SuccessReset onContinue={() => setCurrentScreen("LOGIN")} />
    );
  }

  // If booking request is active, show it
  if (currentScreen === "BOOKING_REQUEST") {
    return (
      <BookingRequest
        onBack={() => setCurrentScreen("MAIN_TABS")}
        listingType={bookingRequestType}
        onSendRequest={(requestData) => {
          console.log("Request sent:", sanitizeLog(JSON.stringify(requestData)));
          setDemoRequestStatus("pending");
          setCurrentScreen("REQUEST_TO_JOIN");
        }}
      />
    );
  }

  // If request detail is active, show it
  if (currentScreen === "REQUEST_DETAIL") {
    return (
      <RequestDetail
        onBack={() => setCurrentScreen("REQUESTS_INBOX")}
        requestType={currentRequestType}
        requestId={currentRequestId}
        onAccept={() => {
          console.log("Request accepted:", sanitizeLog(currentRequestId));
          setCurrentScreen("REQUESTS_INBOX");
        }}
        onDecline={() => {
          console.log("Request declined:", sanitizeLog(currentRequestId));
          setCurrentScreen("REQUESTS_INBOX");
        }}
        onStartChat={() => {
          setCurrentChatStatus("accepted");
          setCurrentScreen("CHAT_THREAD");
        }}
      />
    );
  }

  // If requests inbox is active, show it
  if (currentScreen === "REQUESTS_INBOX") {
    return (
      <RequestsInbox
        onBack={() => setCurrentScreen("MAIN_TABS")}
        onOpenRequestDetail={(requestId, type) => {
          setCurrentRequestId(requestId);
          setCurrentRequestType(type);
          setCurrentScreen("REQUEST_DETAIL");
        }}
        onStartChat={(requestId) => {
          console.log("Start chat for request:", sanitizeLog(requestId));
          setCurrentChatStatus("accepted");
          setCurrentScreen("CHAT_THREAD");
        }}
        onAcceptRequest={(requestId) => {
          console.log("Quick accept request:", sanitizeLog(requestId));
        }}
        onDeclineRequest={(requestId) => {
          console.log("Quick decline request:", sanitizeLog(requestId));
        }}
      />
    );
  }

  // If about is active, show it
  if (currentScreen === "ABOUT") {
    return (
      <About
        onBack={() => setCurrentScreen("MAIN_TABS")}
        onContactSupport={() => setCurrentScreen("CONTACT_SUPPORT")}
        onPrivacyPolicy={() => setCurrentScreen("PRIVACY_POLICY")}
        onTermsOfService={() => setCurrentScreen("TERMS_OF_SERVICE")}
      />
    );
  }

  // If contact support is active, show it
  if (currentScreen === "CONTACT_SUPPORT") {
    return <ContactSupport onBack={() => setCurrentScreen("ABOUT")} />;
  }

  // If privacy policy is active, show it
  if (currentScreen === "PRIVACY_POLICY") {
    return <PrivacyPolicy onBack={() => setCurrentScreen("ABOUT")} />;
  }

  // If terms of service is active, show it
  if (currentScreen === "TERMS_OF_SERVICE") {
    return <TermsOfService onBack={() => setCurrentScreen("ABOUT")} />;
  }

  // If edit profile is active, show it
  if (currentScreen === "EDIT_PROFILE") {
    return (
      <>
        <EditProfile onBack={() => setCurrentScreen("MAIN_TABS")} />
        <Toaster />
      </>
    );
  }

  // If request handling settings is active, show it
  if (currentScreen === "REQUEST_HANDLING_SETTINGS") {
    return <RequestHandlingSettings onBack={() => setCurrentScreen("MAIN_TABS")} />;
  }

  // If city listings is active, show it
  if (currentScreen === "CITY_LISTINGS" && selectedCity) {
    return (
      <CityListings
        cityName={selectedCity}
        onBack={() => setSelectedCity(null)}
        onViewListing={(listingType) => {
          if (listingType === "shared") {
            setCurrentScreen("PROPERTY_DETAILS");
          } else {
            setCurrentScreen("RENTAL_DETAILS");
          }
        }}
      />
    );
  }

  // If chat thread is active, show it
  if (currentScreen === "CHAT_THREAD") {
    return (
      <ChatThread
        onBack={() => setCurrentScreen("MESSAGES")}
        requestStatus={currentChatStatus}
      />
    );
  }

  // If request accepted screen is active, show it
  if (currentScreen === "REQUEST_ACCEPTED") {
    return (
      <RequestAccepted
        onStartChat={() => {
          setCurrentScreen("CHAT_THREAD");
        }}
      />
    );
  }

  // If notifications is active, show it
  if (currentScreen === "NOTIFICATIONS") {
    return (
      <Notifications
        onBack={() => setCurrentScreen("MAIN_TABS")}
        onNotificationClick={(notification) => {
          switch (notification.type) {
            case "new_request":
              setDemoRequestStatus("pending");
              setCurrentScreen("REQUEST_TO_JOIN");
              break;
            case "request_accepted":
              setCurrentScreen("REQUEST_ACCEPTED");
              break;
            case "request_declined":
              setDemoRequestStatus("declined");
              setCurrentScreen("REQUEST_TO_JOIN");
              break;
            case "new_message":
              setCurrentChatStatus("accepted");
              setCurrentScreen("CHAT_THREAD");
              break;
            case "new_match":
              setCurrentScreen("PROPERTY_DETAILS");
              break;
            case "system":
              setActiveTab("profile");
              setCurrentScreen("MAIN_TABS");
              break;
          }
        }}
      />
    );
  }

  // If messages is active, show it
  if (currentScreen === "MESSAGES") {
    return (
      <Messages
        onBack={() => setCurrentScreen("MAIN_TABS")}
        onOpenChat={(messageId, status) => {
          setCurrentChatStatus(status);
          setCurrentScreen("CHAT_THREAD");
        }}
      />
    );
  }

  // If request to join is active, show it
  if (currentScreen === "REQUEST_TO_JOIN") {
    return (
      <RequestToJoin
        onBack={() => setCurrentScreen("MAIN_TABS")}
        requestStatus={demoRequestStatus}
        onStartChat={() => {
          setCurrentScreen("REQUEST_ACCEPTED");
        }}
        onFindOtherHomes={() => {
          setActiveTab("explore");
          setCurrentScreen("MAIN_TABS");
        }}
      />
    );
  }

  // If preferences editor is active, show it
  if (currentScreen === "ONBOARDING") {
    return <LifestylePreferencesFigma onBack={() => setCurrentScreen("MAIN_TABS")} onComplete={() => setCurrentScreen("MAIN_TABS")} />;
  }

  // If matching is active, show it
  if (currentScreen === "MATCHING") {
    return <RoommateMatching onBack={() => setCurrentScreen("MAIN_TABS")} />;
  }

  // If public profile is active, show it
  if (currentScreen === "PUBLIC_PROFILE") {
    return (
      <PublicProfileView
        onBack={() => setCurrentScreen("PROPERTY_DETAILS")}
        connectionStatus="not-connected"
        onChat={() => {
          setCurrentChatStatus("accepted");
          setCurrentScreen("CHAT_THREAD");
        }}
        onSendRequest={() => {
          console.log("Send connection request");
          setCurrentScreen("PROPERTY_DETAILS");
        }}
      />
    );
  }

  // If rental details is active, show it
  if (currentScreen === "RENTAL_DETAILS") {
    return (
      <RentalDetails
        onBack={() => setCurrentScreen("MAIN_TABS")}
        onRentNow={() => {
          setBookingRequestType("entire");
          setCurrentScreen("BOOKING_REQUEST");
        }}
      />
    );
  }

  // If property details is active, show it
  if (currentScreen === "PROPERTY_DETAILS") {
    return (
      <PropertyDetails 
        onBack={() => setCurrentScreen("MAIN_TABS")} 
        onRequestToJoin={() => {
          setBookingRequestType("shared");
          setCurrentScreen("BOOKING_REQUEST");
        }}
        onViewProfile={(userId) => {
          console.log("View profile:", sanitizeLog(userId));
          setCurrentScreen("PUBLIC_PROFILE");
        }}
      />
    );
  }

  // If create listing is active, show it
  if (currentScreen === "CREATE_LISTING") {
    return <CreateListing onBack={() => setCurrentScreen("MAIN_TABS")} />;
  }

  // If onboarding flow is active, show it
  if (currentScreen === "ONBOARDING_FLOW") {
    return (
      <OnboardingFlow
        onComplete={() => setCurrentScreen("SIGNUP")}
        onSkip={() => setCurrentScreen("SIGNUP")}
      />
    );
  }

  // If sign up is active, show it
  if (currentScreen === "SIGNUP") {
    return (
      <SignUpScreen
        onBack={() => setCurrentScreen("ONBOARDING_FLOW")}
        onSignUp={async (email, password, username) => { await signUp(email, password, username); setCurrentScreen("SELECT_LOCATION"); }}
        onSignIn={() => setCurrentScreen("LOGIN")}
      />
    );
  }

  // If select location is active, show it
  if (currentScreen === "SELECT_LOCATION") {
    return (
      <SelectLocationScreen
        onSkip={() => {
          setCurrentScreen("ONBOARDING"); 
        }}
        onUseCurrentLocation={() => {
          console.log("Use current location");
          setCurrentScreen("ONBOARDING"); 
        }}
        onSelectManually={() => {
          setCurrentScreen("MAPS");
        }}
      />
    );
  }

  // If maps is active, show it
  if (currentScreen === "MAPS") {
    return (
      <MapsScreen
        onBack={() => setCurrentScreen("SELECT_LOCATION")}
        onChooseLocation={() => {
          console.log("Location chosen");
          setCurrentScreen("ONBOARDING"); 
        }}
      />
    );
  }

  // Show homepage on first load
  if (currentScreen === "HOMEPAGE") {
    return (
      <Homepage
        onStartMatching={() => setCurrentScreen("MATCHING")}
        onBrowseHomes={() => { setActiveTab("explore"); setCurrentScreen("MAIN_TABS"); }}
      />
    );
  }

  return (
    <div className="size-full flex flex-col bg-[#fafafa]">
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === "home" && (
          <Home
            onOpenMessages={() => setCurrentScreen("MESSAGES")}
            onOpenNotifications={() => setCurrentScreen("NOTIFICATIONS")}
            hasUnreadNotifications={hasUnreadNotifications}
            hasUnreadMessages={hasUnreadMessages}
            onStartMatching={() => setCurrentScreen("MATCHING")}
            onBrowseHomes={() => setActiveTab("explore")}
            onCompletePreferences={() => setCurrentScreen("ONBOARDING")}
          />
        )}
        {activeTab === "community" && (
          <Community 
            onOpenMessages={() => setCurrentScreen("MESSAGES")}
            onOpenNotifications={() => setCurrentScreen("NOTIFICATIONS")}
            hasUnreadNotifications={hasUnreadNotifications}
            hasUnreadMessages={hasUnreadMessages}
            onStartMatching={() => setCurrentScreen("MATCHING")}
            onBrowseHomes={() => setActiveTab("explore")}
            onCreateListing={() => setCurrentScreen("CREATE_LISTING")}
          />
        )}
        {activeTab === "explore" && (
          <Explore 
            onViewListing={() => setCurrentScreen("PROPERTY_DETAILS")}
            onViewProfile={() => setCurrentScreen("MATCHING")}
            onSelectCity={(cityName) => {
              // For demo: selecting a city opens the property details page
              // In a real app, this would navigate to a city-specific listings page
              console.log("Selected city:", sanitizeLog(cityName));
              setSelectedCity(cityName);
            }}
          />
        )}
        {activeTab === "favorite" && (
          <MyListing onCreateListing={() => setCurrentScreen("CREATE_LISTING")} />
        )}
        {activeTab === "profile" && (
          <Profile
            onStartMatching={() => setCurrentScreen("MATCHING")}
            onEditLifestylePreferences={() => setCurrentScreen("ONBOARDING")}
            onRequestHandlingSettings={() => setCurrentScreen("REQUEST_HANDLING_SETTINGS")}
            onBookingRequests={() => setCurrentScreen("REQUESTS_INBOX")}
            onAbout={() => setCurrentScreen("ABOUT")}
            onEditProfile={() => setCurrentScreen("EDIT_PROFILE")}
            onSignOut={() => {
              signOut();
              setActiveTab("home");
            }}
          />
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Toast Notifications */}
      <Toaster />
    </div>
  );
}

export default function App() { return <AppContent />; }

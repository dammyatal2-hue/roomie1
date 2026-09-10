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
import { supabase } from "../lib/supabase";
import { SavedListings } from "./components/SavedListings";
import { ProfileSetup } from "./components/ProfileSetup";

const sanitizeLog = (value: unknown): string =>
  String(value).replace(/[\r\n]/g, " ");

type AppScreen = string;

const mapDatabaseListing = (row: any) => ({ intent: row.intent, livingSetup: row.living_setup, existingRoommates: row.details?.roommates ?? [], spaceDetails: row.details?.space ?? { bedrooms:"", bathrooms:"", furnished:null, privateBathroom:null, utilitiesIncluded:null }, locationDetails: { country:row.country, city:row.city, area:row.area, address:row.address ?? "", hideAddress:row.hide_address }, idealFor:row.ideal_for ?? [], nearbyFacilities:row.details?.nearby ?? [], rent:String(row.rent), rentPeriod:row.rent_period || "month", deposit:String(row.deposit), moveInDate:row.move_in_date, minimumStay:row.minimum_stay, photos:[], description:row.description });

function AppContent() {
  const { session, loading: isLoading, signIn, signUp, signInWithOAuth, sendPasswordReset, updatePassword, signOut } = useAuth();
  const isAuthenticated = Boolean(session);
  const [passwordRecovery] = useState(() => new URLSearchParams(window.location.search).get("reset-password") === "true");
const [initialPath] = useState(() => window.location.pathname);
const [currentScreen, setCurrentScreen] = useState<AppScreen>(
  initialPath === "/privacy-policy" ? "PRIVACY_POLICY" :
  initialPath === "/terms-of-service" ? "TERMS_OF_SERVICE" :
  passwordRecovery ? "CHANGE_PASSWORD" :
  isAuthenticated ? "MAIN_TABS" : "GUEST_HOME"
);
  const [activeTab, setActiveTab] = useState("home");
  const [bookingRequestType, setBookingRequestType] = useState<"shared" | "entire">("shared");
  const [currentChatStatus, setCurrentChatStatus] = useState<RequestStatus | undefined>("accepted");
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>();
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedListing, setSelectedListing] = useState<any | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [currentRequestId, setCurrentRequestId] = useState<string>("");
  const [currentRequestType, setCurrentRequestType] = useState<"received" | "sent">("received");
  const [autoLocate, setAutoLocate] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [listingLoadError, setListingLoadError] = useState("");
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  const openListingById = async (listingId: string) => {
    setListingLoadError("");
    setCurrentScreen("LISTING_LOADING");
    const { data, error } = await supabase.from("listings").select("*,listing_photos(storage_path)").eq("id", listingId).eq("status", "published").maybeSingle();
    if (error || !data) {
      setListingLoadError(error?.message || "This listing is no longer available.");
      return;
    }
    const { data: owner } = await supabase.from("profiles").select("id,username,full_name,avatar_url,bio,city,country,occupation,date_of_birth").eq("id", data.owner_id).maybeSingle();
    setSelectedListing({ ...data, profiles: owner ?? null });
    if (session?.user) void supabase.from("listing_views").upsert({ user_id: session.user.id, listing_id: listingId, viewed_at: new Date().toISOString() });
    void supabase.rpc("increment_listing_view", { target_listing_id: listingId });
    setCurrentScreen(data.intent === "roommate" ? "PROPERTY_DETAILS" : "RENTAL_DETAILS");
  };

  // Demo: Request status state (can be toggled for testing)
  const [demoRequestStatus, setDemoRequestStatus] = useState<RequestStatus | undefined>(undefined);
  
  // Demo: Unread notification and message badges (set to true to show badges)
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);

  useEffect(() => {
    if (!session?.user) { setHasUnreadNotifications(false); setHasUnreadMessages(false); return; }
    const loadUnread = () => supabase.from("notifications").select("type").eq("user_id", session.user.id).is("read_at", null).then(({ data }) => {
      const rows = data ?? [];
      setHasUnreadMessages(rows.some((row: any) => row.type === "new_message"));
      setHasUnreadNotifications(rows.some((row: any) => row.type !== "new_message"));
    });
    loadUnread();
    const channel = supabase.channel(`unread:${session.user.id}`).on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${session.user.id}` }, loadUnread).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session?.user]);
  useEffect(() => { if (!session?.user) return setIsAdmin(false); supabase.from("profiles").select("role").eq("id", session.user.id).single().then(({data})=>setIsAdmin(data?.role === "admin")); }, [session?.user]);

  useEffect(() => {
    if (isLoading) return;
    if (passwordRecovery) {
      setCurrentScreen("CHANGE_PASSWORD");
      setCheckingOnboarding(false);
      return;
    }
    if (!session?.user) {
      setCheckingOnboarding(false);
      return;
    }
    let active = true;
    setCheckingOnboarding(true);
    Promise.all([
      supabase.from("profiles").select("full_name,gender,occupation,bio").eq("id", session.user.id).maybeSingle(),
      supabase.from("preferences").select("answers").eq("user_id", session.user.id).maybeSingle(),
    ]).then(([profileResult, preferencesResult]) => {
      if (!active) return;
      const profile = profileResult.data;
      const answers = preferencesResult.data?.answers as Record<string, unknown> | undefined;
      const profileIncomplete = !profile?.full_name || !profile?.gender || !profile?.occupation || !profile?.bio;
      const preferencesIncomplete = !answers || Object.keys(answers).length === 0;
      if (profileIncomplete) setCurrentScreen("PROFILE_SETUP");
      else if (preferencesIncomplete) setCurrentScreen("ONBOARDING");
      else setCurrentScreen("MAIN_TABS");
      setCheckingOnboarding(false);
    }).catch(() => {
      if (!active) return;
      setCurrentScreen("PROFILE_SETUP");
      setCheckingOnboarding(false);
    });
    return () => { active = false; };
  }, [isLoading, passwordRecovery, session?.user?.id]);

  if (!isSupabaseConfigured) return <div className="min-h-screen bg-[#fcfcfd] grid place-items-center p-6"><div className="max-w-lg rounded-2xl bg-white border border-[#e5e7eb] p-8"><h1 className="text-xl font-semibold">Connect Roomie to Supabase</h1><p className="mt-3 text-sm text-[#667085]">Copy <code>.env.example</code> to <code>.env.local</code>, add the project URL and anon key, then run the SQL migration in <code>supabase/migrations</code>.</p></div></div>;
  if (isLoading || checkingOnboarding) return <div className="size-full flex items-center justify-center">Loading...</div>;

  if (currentScreen === "LISTING_LOADING") return <div className="min-h-screen grid place-items-center p-6 bg-[#fafafa]"><div className="text-center">{listingLoadError ? <><h1 className="font-semibold text-lg">Unable to open listing</h1><p className="text-sm text-gray-500 mt-2">{listingLoadError}</p><button onClick={()=>setCurrentScreen(isAuthenticated?"MAIN_TABS":"GUEST_HOME")} className="mt-5 px-5 py-3 rounded-lg bg-[#fe456a] text-white">Go back</button></> : <><div className="size-9 border-4 border-[#fe456a]/20 border-t-[#fe456a] rounded-full animate-spin mx-auto"/><p className="text-sm text-gray-500 mt-4">Opening property…</p></>}</div></div>;

  if (!isAuthenticated && currentScreen === "GUEST_HOME") {
    const openSignIn = () => setCurrentScreen("LOGIN");
    return (
      <div className="size-full flex flex-col bg-[#fafafa]">
        <div className="flex-1 overflow-auto">
          <Home guestMode hasUnreadNotifications={false} hasUnreadMessages={false} onOpenMessages={openSignIn} onOpenNotifications={openSignIn} onStartMatching={openSignIn} onBrowseHomes={openSignIn} onCompletePreferences={openSignIn} onViewListing={openListingById} />
        </div>
        <BottomNavigation activeTab="home" onTabChange={openSignIn} />
      </div>
    );
  }

  // If admin dashboard is active, show it (full screen, no navigation)
  if (currentScreen === "ADMIN_DASHBOARD") {
    return isAdmin ? <AdminDashboard onExit={() => setCurrentScreen("MAIN_TABS")} /> : <div className="min-h-screen grid place-items-center p-6"><div className="text-center"><h1 className="text-xl font-semibold">Access denied</h1><p className="text-sm text-gray-500 mt-2">This account is not an administrator.</p><button onClick={()=>setCurrentScreen("MAIN_TABS")} className="mt-5 px-5 py-3 bg-[#fe456a] text-white rounded-lg">Back to Roomie</button></div></div>;
  }

  // Show login if not authenticated
  if (!isAuthenticated && currentScreen === "LOGIN") {
    return (
      <Login
        onBack={() => setCurrentScreen("GUEST_HOME")}
        onSignIn={async (email, password) => { await signIn(email, password); setCurrentScreen("MAIN_TABS"); }}
        onSignUp={() => setCurrentScreen("SIGNUP")}
        onForgotPassword={() => setCurrentScreen("FORGOT_PASSWORD")}
        onSocialSignIn={signInWithOAuth}
      />
    );
  }

  // If forgot password is active, show it
  if (currentScreen === "FORGOT_PASSWORD") {
    return (
      <ForgotPassword
        onBack={() => setCurrentScreen("LOGIN")}
        onContinue={sendPasswordReset}
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
        onChangePassword={async (newPassword, _confirmPassword) => {
          await updatePassword(newPassword);
          window.history.replaceState({}, "", window.location.pathname);
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
    const photoPath = selectedListing?.listing_photos?.[0]?.storage_path;
    return (
      <BookingRequest
        onBack={() => setCurrentScreen(selectedListing?.intent === "rental" ? "RENTAL_DETAILS" : "PROPERTY_DETAILS")}
        listingType={bookingRequestType}
        listingData={selectedListing ? { title: selectedListing.title, coverImage: photoPath ? supabase.storage.from("listing-photos").getPublicUrl(photoPath).data.publicUrl : undefined, livingSetup: selectedListing.living_setup, city: selectedListing.city, neighborhood: selectedListing.area, price: String(selectedListing.rent), priceUnit: `/${selectedListing.rent_period || "month"}`, moveInDate: selectedListing.move_in_date } : undefined}
        onSendRequest={async (requestData) => {
          if (!session?.user || !selectedListing?.id || !selectedListing?.owner_id) throw new Error("Please sign in and select a listing first.");
          if (selectedListing.owner_id === session.user.id) throw new Error("You cannot request your own listing.");
          const message = [requestData.introMessage.trim(), `Preferred move-in: ${requestData.moveInDate}`, `Length of stay: ${requestData.lengthOfStay}`].filter(Boolean).join("\n");
          const { error } = await supabase.from("booking_requests").insert({ listing_id: selectedListing.id, requester_id: session.user.id, owner_id: selectedListing.owner_id, message });
          if (error) throw error;
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
        onAccept={async () => {
          const { error } = await supabase.rpc("handle_booking_request", { p_request_id: currentRequestId, p_status: "accepted" });
          if (error) return;
          setCurrentScreen("REQUESTS_INBOX");
        }}
        onDecline={async () => {
          const { error } = await supabase.rpc("handle_booking_request", { p_request_id: currentRequestId, p_status: "declined" });
          if (error) return;
          setCurrentScreen("REQUESTS_INBOX");
        }}
        onStartChat={async () => {
          const { data } = await supabase.from("conversations").select("id").eq("request_id", currentRequestId).maybeSingle();
          if (!data) return;
          setCurrentConversationId(data.id);
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
  if (currentScreen === "FAVORITES") return <SavedListings mode="favorites" onBack={() => setCurrentScreen("MAIN_TABS")} />;
  if (currentScreen === "RECENT_VIEWED") return <SavedListings mode="recent" onBack={() => setCurrentScreen("MAIN_TABS")} />;

  // If city listings is active, show it
  if (currentScreen === "CITY_LISTINGS" && selectedCity) {
    return (
      <CityListings
        cityName={selectedCity}
        onBack={() => { setSelectedCity(null); setCurrentScreen("MAIN_TABS"); }}
        onViewListing={openListingById}
      />
    );
  }

  // If chat thread is active, show it
  if (currentScreen === "CHAT_THREAD") {
    return (
      <ChatThread
        onBack={() => setCurrentScreen("MESSAGES")}
        requestStatus={currentChatStatus}
        conversationId={currentConversationId}
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
              if (notification.entityId) { setCurrentRequestId(notification.entityId); setCurrentRequestType("received"); setCurrentScreen("REQUEST_DETAIL"); }
              break;
            case "request_accepted":
              if (notification.entityId) { setCurrentRequestId(notification.entityId); setCurrentRequestType("sent"); setCurrentScreen("REQUEST_DETAIL"); }
              break;
            case "request_declined":
              if (notification.entityId) { setCurrentRequestId(notification.entityId); setCurrentRequestType("sent"); setCurrentScreen("REQUEST_DETAIL"); }
              break;
            case "new_message":
              setCurrentChatStatus("accepted");
              setCurrentConversationId(notification.entityId);
              setCurrentScreen("CHAT_THREAD");
              break;
            case "new_match":
              setCurrentScreen("MATCHING");
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
          setCurrentConversationId(messageId);
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
        listing={selectedListing ? mapDatabaseListing(selectedListing) : undefined}
        requestStatus={demoRequestStatus}
        onStartChat={async () => {
          if (!session?.user || !selectedListing?.id) return;
          const { data: request } = await supabase.from("booking_requests").select("id").eq("listing_id", selectedListing.id).eq("requester_id", session.user.id).eq("status", "accepted").maybeSingle();
          if (!request) return setCurrentScreen("REQUESTS_INBOX");
          const { data: conversation } = await supabase.from("conversations").select("id").eq("request_id", request.id).maybeSingle();
          if (!conversation) return setCurrentScreen("REQUESTS_INBOX");
          setCurrentConversationId(conversation.id);
          setCurrentChatStatus("accepted");
          setCurrentScreen("CHAT_THREAD");
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
    return <><LifestylePreferencesFigma onBack={() => setCurrentScreen("MAIN_TABS")} onComplete={() => { setActiveTab("home"); setCurrentScreen("MAIN_TABS"); }} /><Toaster /></>;
  }

  if (currentScreen === "PROFILE_SETUP") {
    return <ProfileSetup onBack={() => setCurrentScreen("SELECT_LOCATION")} onComplete={() => setCurrentScreen("ONBOARDING")} />;
  }

  // If matching is active, show it
  if (currentScreen === "MATCHING") {
    return <RoommateMatching onBack={() => setCurrentScreen("MAIN_TABS")} onViewProfile={(userId) => { setSelectedProfileId(userId); setCurrentScreen("PUBLIC_PROFILE"); }} />;
  }

  // If public profile is active, show it
  if (currentScreen === "PUBLIC_PROFILE") {
    return (
      <PublicProfileView
        profileId={selectedProfileId}
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
    if (!selectedListing) return <div className="min-h-screen grid place-items-center p-6 text-center"><div><p className="text-sm text-[#6b7280]">No rental was selected.</p><button onClick={() => setCurrentScreen(isAuthenticated ? "MAIN_TABS" : "GUEST_HOME")} className="mt-4 px-5 py-2.5 rounded-lg bg-[#fe456a] text-white">Go back</button></div></div>;
    return (
      <RentalDetails
        listing={selectedListing ? mapDatabaseListing(selectedListing) : undefined}
        record={selectedListing}
        onBack={() => setCurrentScreen(isAuthenticated ? "MAIN_TABS" : "GUEST_HOME")}
        onRentNow={() => {
          if (!isAuthenticated) return setCurrentScreen("LOGIN");
          setBookingRequestType("entire");
          setCurrentScreen("BOOKING_REQUEST");
        }}
      />
    );
  }

  // If property details is active, show it
  if (currentScreen === "PROPERTY_DETAILS") {
    if (!selectedListing) return <div className="min-h-screen grid place-items-center p-6 text-center"><div><p className="text-sm text-[#6b7280]">No property was selected.</p><button onClick={() => setCurrentScreen(isAuthenticated ? "MAIN_TABS" : "GUEST_HOME")} className="mt-4 px-5 py-2.5 rounded-lg bg-[#fe456a] text-white">Go back</button></div></div>;
    return (
      <PropertyDetails 
        listing={selectedListing ? mapDatabaseListing(selectedListing) : undefined}
        record={selectedListing}
        onBack={() => setCurrentScreen(isAuthenticated ? "MAIN_TABS" : "GUEST_HOME")}
        onRequestToJoin={() => {
          if (!isAuthenticated) return setCurrentScreen("LOGIN");
          setBookingRequestType("shared");
          setCurrentScreen("BOOKING_REQUEST");
        }}
        onViewProfile={(userId) => {
          if (!isAuthenticated) return setCurrentScreen("LOGIN");
          setSelectedProfileId(userId);
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
        onSignUp={async (email, password, username) => {
          await signUp(email, password, username);
          const { data } = await supabase.auth.getSession();
          setCurrentScreen(data.session ? "SELECT_LOCATION" : "CHECK_EMAIL");
        }}
        onSignIn={() => setCurrentScreen("LOGIN")}
        onSocialSignIn={signInWithOAuth}
      />
    );
  }

  if (currentScreen === "CHECK_EMAIL") {
    return (
      <div className="min-h-screen bg-[#fcfcfd] grid place-items-center px-6">
        <div className="max-w-sm w-full text-center">
          <div className="size-16 rounded-full bg-[#fff0f3] text-[#fe456a] grid place-items-center mx-auto text-2xl">✉</div>
          <h1 className="mt-6 text-2xl font-semibold text-[#1f2a37]">Check your email</h1>
          <p className="mt-3 text-sm leading-6 text-[#6b7280]">Open the confirmation link we sent you. When you return, Roomie will continue with your profile setup.</p>
          <button onClick={() => setCurrentScreen("LOGIN")} className="mt-7 w-full h-12 rounded-lg bg-[#fe456a] text-white font-semibold">Go to sign in</button>
        </div>
      </div>
    );
  }

  // If select location is active, show it
  if (currentScreen === "SELECT_LOCATION") {
    return (
      <SelectLocationScreen
        onSkip={() => {
          setCurrentScreen("PROFILE_SETUP"); 
        }}
        onUseCurrentLocation={() => {
          setAutoLocate(true);
          setCurrentScreen("MAPS");
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
        autoLocate={autoLocate}
        onChooseLocation={async (location) => {
          if (session?.user) await supabase.from("profiles").update({ city: location.city || null, country: location.country || null }).eq("id", session.user.id);
          setAutoLocate(false);
          setCurrentScreen("PROFILE_SETUP"); 
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
            onViewListing={openListingById}
          />
        )}
        {activeTab === "community" && <CommunityFeed />}
        {activeTab === "explore" && (
          <Explore 
            onViewListing={openListingById}
            onViewProfile={() => setCurrentScreen("MATCHING")}
            onSelectCity={(cityName) => {
              // For demo: selecting a city opens the property details page
              // In a real app, this would navigate to a city-specific listings page
              console.log("Selected city:", sanitizeLog(cityName));
              setSelectedCity(cityName);
              setCurrentScreen("CITY_LISTINGS");
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
            onSettings={() => setCurrentScreen("EDIT_PROFILE")}
            onFavorites={() => setCurrentScreen("FAVORITES")}
            onRecentViewed={() => setCurrentScreen("RECENT_VIEWED")}
            onAdminDashboard={() => setCurrentScreen("ADMIN_DASHBOARD")}
            onCreateListing={() => setCurrentScreen("CREATE_LISTING")}
            onMyListings={() => setActiveTab("favorite")}
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

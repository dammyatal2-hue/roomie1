import type { Session, User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { isSupabaseConfigured, supabase } from "../../lib/supabase";

interface AuthContextValue {
  session: Session | null; user: User | null; loading: boolean;
  signIn(email: string, password: string): Promise<void>;
  signUp(email: string, password: string, username: string): Promise<void>;
  signInWithOAuth(provider: "google" | "facebook"): Promise<void>;
  sendPasswordReset(email: string): Promise<void>;
  updatePassword(password: string): Promise<void>;
  signOut(): Promise<void>;
}
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false); });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);
  const value = useMemo<AuthContextValue>(() => ({
    session, user: session?.user ?? null, loading,
    async signIn(email, password) { const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) throw error; },
    async signUp(email, password, username) { const { error } = await supabase.auth.signUp({ email, password, options: { data: { username } } }); if (error) throw error; },
    async signInWithOAuth(provider) { const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: window.location.origin } }); if (error) throw error; },
    async sendPasswordReset(email) { const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/?reset-password=true` }); if (error) throw error; },
    async updatePassword(password) { const { error } = await supabase.auth.updateUser({ password }); if (error) throw error; },
    async signOut() { const { error } = await supabase.auth.signOut(); if (error) throw error; },
  }), [loading, session]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() { const value = useContext(AuthContext); if (!value) throw new Error("useAuth must be used inside AuthProvider"); return value; }

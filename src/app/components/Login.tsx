import { useState } from "react";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import svgPaths from "../../imports/svg-aqhopws0b9";

interface LoginProps {
  onBack?: () => void;
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: () => void;
  onForgotPassword?: () => void;
  onSocialSignIn: (provider: "google" | "facebook") => Promise<void>;
}

export function Login({ onBack, onSignIn, onSignUp, onForgotPassword, onSocialSignIn }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const handleSignIn = async () => {
    if (!email || !password) return setError("Enter your email and password.");
    setSubmitting(true); setError("");
    try { await onSignIn(email.trim(), password); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to sign in."); }
    finally { setSubmitting(false); }
  };
  const handleSocialSignIn = async (provider: "google" | "facebook") => {
    setSubmitting(true); setError("");
    try { await onSocialSignIn(provider); }
    catch (reason) { setError(reason instanceof Error ? reason.message : `Unable to sign in with ${provider}.`); setSubmitting(false); }
  };

  return (
    <div className="bg-[#fcfcfd] relative size-full flex flex-col">
      {/* Status Bar */}
      <div className="h-[max(env(safe-area-inset-top),8px)] bg-transparent" />

      {/* Back Button */}
      <div className="px-[24px] pt-[24px] pb-[24px]">
        <button 
          onClick={onBack}
          className="size-[24px] flex items-center justify-center"
        >
          <ArrowLeft className="w-[20px] h-[20px] text-[#1f2a37]" strokeWidth={1.5} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-[24px]">
        {/* Caption */}
        <div className="flex flex-col gap-[8px] mb-[32px]">
          <h1 className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[20px] leading-[26px] text-[#1f2a37]">
            Welcome Back !
          </h1>
          <p className="font-['Inter:Regular',sans-serif] font-normal text-[14px] leading-[18px] text-[#9da4ae]">
            Sign in with your email and password or social media to continue
          </p>
        </div>

        {/* Form Input */}
        <div className="flex flex-col gap-[16px] mb-[32px]">
          {/* Email Input */}
          <div className="flex flex-col gap-[4px]">
            <label className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[14px] leading-[18px] text-[#1f2a37]">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white h-[52px] px-[16px] py-[8px] rounded-[12px] border border-[#6941c6] font-['Inter:Regular',sans-serif] font-normal text-[14px] leading-[18px] text-[#1f2a37] focus:outline-none focus:border-[#6941c6]"
              placeholder="Enter your email"
            />
          </div>

          {/* Password Input */}
          <div className="flex flex-col gap-[4px]">
            <label className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[14px] leading-[18px] text-[#1f2a37]">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white w-full h-[52px] px-[16px] py-[8px] pr-[48px] rounded-[12px] border border-[#d2d6db] font-['Inter:Regular',sans-serif] font-normal text-[14px] leading-[18px] text-[#1f2a37] focus:outline-none focus:border-[#6941c6]"
                placeholder="Enter your password"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-[16px] top-1/2 -translate-y-1/2"
              >
                {showPassword ? (
                  <Eye className="w-[24px] h-[24px] text-[#9da4ae]" />
                ) : (
                  <EyeOff className="w-[24px] h-[24px] text-[#9da4ae]" />
                )}
              </button>
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setRememberMe(!rememberMe)}
              className="flex items-center gap-[8px]"
            >
              <div className={`size-[16px] rounded-[3px] flex items-center justify-center ${rememberMe ? 'bg-[#6941c6]' : 'border border-[#d2d6db] bg-white'}`}>
                {rememberMe && (
                  <svg className="w-[10px] h-[10px]" fill="none" viewBox="0 0 13.3333 13.3333">
                    <path 
                      clipRule="evenodd" 
                      d={svgPaths.p2a48e080} 
                      fill="white" 
                      fillRule="evenodd" 
                    />
                  </svg>
                )}
              </div>
              <span className="font-['Inter:Regular',sans-serif] font-normal text-[14px] leading-[18px] text-[#1f2a37]">
                Remember me
              </span>
            </button>
            <button 
              onClick={onForgotPassword}
              className="font-['Inter:Regular',sans-serif] font-normal text-[14px] leading-[18px] text-[#fe456a] hover:opacity-70 transition-opacity"
            >
              Forgot password ?
            </button>
          </div>
        </div>

        {/* Sign In Button */}
        <div className="flex flex-col gap-[24px] items-center mb-[32px]">
          {error && <p role="alert" className="w-full text-sm text-[#fe456a]">{error}</p>}
          <button
            onClick={handleSignIn}
            disabled={submitting}
            className="bg-[#fe456a] w-full h-[52px] rounded-[8px] shadow-[0px_8px_8px_0px_rgba(127,86,217,0.03),0px_20px_24px_0px_rgba(127,86,217,0.08)] font-['Inter:Regular',sans-serif] font-normal text-[18px] leading-[27px] text-white hover:bg-[#e63d5f] transition-colors"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>

          <p className="font-['Inter:Regular',sans-serif] font-normal text-[14px] leading-[18px] text-[#1f2a37]">
            Or
          </p>

          {/* Social Media Buttons */}
          <div className="flex items-center justify-center gap-[16px]">
            {/* Facebook */}
            <button onClick={() => handleSocialSignIn("facebook")} disabled={submitting} aria-label="Sign in with Facebook" className="size-[46px] rounded-full bg-[#e5e7eb] flex shrink-0 items-center justify-center hover:bg-[#d2d6db] transition-colors disabled:opacity-60">
              <svg className="size-[24px] block" viewBox="0 0 24 24" fill="none">
                <path d="M24 12C24 5.37258 18.6274 0 12 0C5.37258 0 0 5.37258 0 12C0 17.9895 4.3882 22.954 10.125 23.8542V15.4688H7.07812V12H10.125V9.35625C10.125 6.34875 11.9166 4.6875 14.6576 4.6875C15.9701 4.6875 17.3438 4.92188 17.3438 4.92188V7.875H15.8306C14.34 7.875 13.875 8.80008 13.875 9.75V12H17.2031L16.6711 15.4688H13.875V23.8542C19.6118 22.954 24 17.9895 24 12Z" fill="#1976D2" />
              </svg>
            </button>

            {/* Google */}
            <button onClick={() => handleSocialSignIn("google")} disabled={submitting} aria-label="Sign in with Google" className="size-[46px] rounded-full border border-[#d2d6db] bg-white flex shrink-0 items-center justify-center hover:bg-[#f9fafb] transition-colors disabled:opacity-60">
              <svg className="size-[23px] block shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.28h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.59z" fill="#4285F4"/>
                <path d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.565 24 12.255 24z" fill="#34A853"/>
                <path d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 000 10.76l3.98-3.09z" fill="#FBBC05"/>
                <path d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.69 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z" fill="#EA4335"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Sign Up Link */}
        <div className="text-center pb-[40px]">
          <p className="font-['Inter:Regular',sans-serif] font-normal text-[14px] leading-[18px] text-[#1f2a37]">
            Don't have account ?{" "}
            <button 
              onClick={onSignUp}
              className="font-['Inter:Medium',sans-serif] font-medium text-[#fe456a] hover:opacity-70 transition-opacity"
            >
              Sign up
            </button>
          </p>
        </div>
      </div>

      {/* Home Indicator */}
      <div className="h-[34px] flex items-center justify-center">
        <div className="w-[134px] h-[5px] bg-black/10 rounded-full" />
      </div>
    </div>
  );
}

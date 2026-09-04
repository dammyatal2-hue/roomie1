import { ArrowLeft, Send, Info, Home } from "lucide-react";
import { useEffect, useState } from "react";
import { RequestStatusChip, type RequestStatus } from "./RequestStatusBadge";
import imgEllipse18 from "figma:asset/e27dfa2b9cdb625ff364c104c1612553df96ed6a.png";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../auth/AuthProvider";

interface ChatMessage {
  id: string;
  text: string;
  sender: "me" | "them";
  timestamp: string;
}

interface ChatThreadProps {
  onBack: () => void;
  recipientName?: string;
  recipientAvatar?: string;
  propertyTitle?: string;
  livingSetup?: string;
  requestStatus?: RequestStatus;
  conversationId?: string;
}

export function ChatThread({
  onBack,
  recipientName = "Roomie member",
  recipientAvatar,
  propertyTitle = "",
  livingSetup = "",
  requestStatus = "accepted",
  conversationId,
}: ChatThreadProps) {
  const { user } = useAuth();
  const [activeConversationId, setActiveConversationId] = useState(conversationId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [context, setContext] = useState({ recipientName, recipientAvatar, propertyTitle, livingSetup });

  const [inputText, setInputText] = useState("");

  useEffect(() => {
    if (!user) return;
    if (conversationId) return setActiveConversationId(conversationId);
    supabase.from("conversation_members").select("conversation_id").eq("user_id", user.id).limit(1).maybeSingle().then(({ data }) => setActiveConversationId(data?.conversation_id));
  }, [conversationId, user]);

  useEffect(() => {
    if (!activeConversationId || !user) return;
    Promise.all([
      supabase.from("conversation_members").select("profiles(username,full_name,avatar_url)").eq("conversation_id", activeConversationId).neq("user_id", user.id).limit(1).maybeSingle(),
      supabase.from("conversations").select("booking_requests(listings(title,living_setup))").eq("id", activeConversationId).maybeSingle(),
    ]).then(([memberResult, conversationResult]) => { const p:any=(memberResult.data as any)?.profiles; const l:any=(conversationResult.data as any)?.booking_requests?.listings; setContext({ recipientName: p?.full_name || p?.username || "Roomie member", recipientAvatar: p?.avatar_url, propertyTitle: l?.title || "", livingSetup: l?.living_setup || "" }); });
    const load = () => supabase.from("messages").select("id,body,sender_id,created_at").eq("conversation_id", activeConversationId).order("created_at").then(({ data }) => {
      if (data) setMessages(data.map((row: any) => ({ id: row.id, text: row.body, sender: row.sender_id === user.id ? "me" : "them", timestamp: new Date(row.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) })));
    });
    load();
    const channel = supabase.channel(`messages:${activeConversationId}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${activeConversationId}` }, load).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeConversationId, user]);

  const handleSend = async () => {
    if (inputText.trim() && requestStatus === "accepted" && activeConversationId && user) {
      const body = inputText.trim(); setInputText("");
      const { error } = await supabase.from("messages").insert({ conversation_id: activeConversationId, sender_id: user.id, body });
      if (error) setInputText(body);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-[100dvh] min-h-0 flex flex-col bg-[#fafafa] overflow-hidden">

      {/* Header */}
      <header className="shrink-0 bg-white px-4 pt-[max(env(safe-area-inset-top),8px)] pb-2.5 border-b border-[#e5e7eb]">
        <div className="flex items-center gap-2.5 min-h-10">
          <button
            onClick={onBack}
            className="size-9 -ml-1 flex items-center justify-center hover:bg-[#f3f4f6] rounded-full transition-colors"
          >
            <ArrowLeft className="w-[20px] h-[20px] text-[#1f2a37]" />
          </button>

          {/* Profile Image */}
          <div className="size-9 shrink-0 rounded-full bg-gradient-to-br from-[#fe456a] to-[#ff758f] flex items-center justify-center overflow-hidden">
            {context.recipientAvatar ? <img src={context.recipientAvatar} alt={context.recipientName} className="size-full object-cover" /> :
            <span className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[16px] leading-[20px] text-white">
              {context.recipientName.charAt(0)}
            </span>}
          </div>

          {/* Name & Context */}
          <div className="flex-1 min-w-0">
            <h2 className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[15px] leading-[20px] text-[#1f2a37] truncate">
              {context.recipientName}
            </h2>
            <div className="flex items-center gap-[6px]">
              <Home className="w-[12px] h-[12px] text-[#9da4ae]" />
              <p className="font-['Inter:Regular',sans-serif] font-normal text-[12px] leading-[16px] text-[#9da4ae] truncate">
                {context.livingSetup}
              </p>
            </div>
          </div>

          {/* Status Chip */}
          {requestStatus && (
            <div className="shrink-0 scale-90 origin-right">
              <RequestStatusChip status={requestStatus} />
            </div>
          )}
        </div>

        {/* Property Context Banner */}
        <div className="mt-2 px-2.5 py-1.5 bg-[#fef3f5] rounded-[8px] flex items-start gap-2">
          <Info className="w-[14px] h-[14px] text-[#fe456a] mt-[2px] flex-none" />
          <p className="font-['Inter:Regular',sans-serif] font-normal text-[12px] leading-[16px] text-[#6b7280]">
            Chatting about <span className="font-medium text-[#1f2a37]">{context.propertyTitle || "this listing"}</span>
          </p>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-3 overscroll-contain">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-[8px] items-end ${message.sender === "me" ? "justify-end" : "justify-start"}`}
          >
            {/* Profile Picture for "them" messages */}
            {message.sender === "them" && (
              <img 
                src={context.recipientAvatar || imgEllipse18}
                alt="" 
                className="size-[32px] rounded-full object-cover flex-shrink-0"
              />
            )}

            <div
              className={`max-w-[75%] ${
                message.sender === "me"
                  ? "bg-[#fe456a] text-white"
                  : "bg-white text-[#1f2a37] border border-[#e5e7eb]"
              } rounded-[16px] px-[16px] py-[10px]`}
            >
              <p className="font-['Inter:Regular',sans-serif] font-normal text-[14px] leading-[20px]">
                {message.text}
              </p>
              <span
                className={`font-['Inter:Regular',sans-serif] font-normal text-[10px] leading-[14px] mt-[4px] block ${
                  message.sender === "me" ? "text-white/70" : "text-[#9da4ae]"
                }`}
              >
                {message.timestamp}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Helper Text Banner */}
      <div className="shrink-0 bg-[#fef3f5] px-4 py-1.5 border-t border-[#fce4e9]">
        <p className="font-['Inter:Medium',sans-serif] font-medium text-[10px] leading-4 text-center text-[#6b7280]">
          Be respectful. This is about shared living.
        </p>
      </div>

      {/* Input Area */}
      <footer className="shrink-0 bg-white px-4 pt-2.5 pb-[max(env(safe-area-inset-bottom),10px)] border-t border-[#e5e7eb]">
        {requestStatus === "pending" ? (
          // Pending State: Disabled Input
          <div className="bg-[#f3f4f6] rounded-[12px] px-[16px] py-[14px] text-center border border-[#e5e7eb]">
            <p className="font-['Inter:Medium',sans-serif] font-medium text-[13px] leading-[18px] text-[#6b7280]">
              You can chat once your request is accepted
            </p>
          </div>
        ) : (
          // Accepted State: Active Input
          <div className="flex items-end gap-2.5">
            <div className="flex-1 relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type a message..."
                className="block w-full min-h-[42px] max-h-[96px] px-3.5 py-2.5 bg-[#f3f4f6] border border-transparent rounded-[12px] font-['Inter:Regular',sans-serif] font-normal text-[14px] leading-[20px] text-[#1f2a37] placeholder:text-[#9da4ae] focus:outline-none focus:border-[#fe456a] focus:bg-white resize-none transition-colors"
                rows={1}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!inputText.trim()}
              className="flex-none size-[42px] bg-[#fe456a] rounded-[12px] flex items-center justify-center hover:bg-[#e63d5f] transition-colors disabled:bg-[#f3f4f6] disabled:cursor-not-allowed"
            >
              <Send className={`w-[20px] h-[20px] ${inputText.trim() ? "text-white" : "text-[#9da4ae]"}`} />
            </button>
          </div>
        )}
      </footer>
    </div>
  );
}

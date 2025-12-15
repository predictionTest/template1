import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useAccount } from "wagmi";
import { usePollChat } from "@/hooks/usePollChat";
import { Send, MessageSquare, X, Trash2, Smile } from "lucide-react";

// Trading-related emoji set
const TRADING_EMOJIS = [
  // Charts & Trends
  { emoji: "📈", label: "bullish" },
  { emoji: "📉", label: "bearish" },
  { emoji: "💹", label: "chart" },
  // To the moon
  { emoji: "🚀", label: "rocket" },
  { emoji: "🌙", label: "moon" },
  { emoji: "⭐", label: "star" },
  // Diamond hands
  { emoji: "💎", label: "diamond" },
  { emoji: "🙌", label: "hands" },
  { emoji: "💪", label: "strong" },
  // Bull & Bear
  { emoji: "🐂", label: "bull" },
  { emoji: "🐻", label: "bear" },
  { emoji: "🦈", label: "shark" },
  // Money
  { emoji: "💰", label: "money" },
  { emoji: "💵", label: "dollar" },
  { emoji: "🤑", label: "rich" },
  { emoji: "💸", label: "flying money" },
  // Energy
  { emoji: "🔥", label: "fire" },
  { emoji: "⚡", label: "lightning" },
  { emoji: "💥", label: "boom" },
  // Reactions
  { emoji: "✅", label: "yes" },
  { emoji: "❌", label: "no" },
  { emoji: "⚠️", label: "warning" },
  // Target & Luck
  { emoji: "🎯", label: "target" },
  { emoji: "🎰", label: "jackpot" },
  { emoji: "🎲", label: "dice" },
  // Faces
  { emoji: "👀", label: "eyes" },
  { emoji: "🤔", label: "thinking" },
  { emoji: "😱", label: "shocked" },
  { emoji: "😎", label: "cool" },
  { emoji: "🤝", label: "deal" },
  { emoji: "👍", label: "thumbs up" },
];

// Cache key for storing read comment counts
const COMMENTS_CACHE_KEY = "poll_comments_read";

// Get read count from localStorage
const getReadCount = (pollAddress: string): number => {
  try {
    const cache = JSON.parse(localStorage.getItem(COMMENTS_CACHE_KEY) || "{}");
    return cache[pollAddress.toLowerCase()] || 0;
  } catch {
    return 0;
  }
};

// Save read count to localStorage
const saveReadCount = (pollAddress: string, count: number) => {
  try {
    const cache = JSON.parse(localStorage.getItem(COMMENTS_CACHE_KEY) || "{}");
    cache[pollAddress.toLowerCase()] = count;
    localStorage.setItem(COMMENTS_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore localStorage errors
  }
};

interface PollChatProps {
  pollAddress: string;
}

export const PollChat = ({ pollAddress }: PollChatProps) => {
  const { address } = useAccount();
  const { messages, loading, sendMessage, deleteMessage, isEnabled } =
    usePollChat(pollAddress);
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [readCount, setReadCount] = useState(() => getReadCount(pollAddress));
  const [showEmojis, setShowEmojis] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addEmoji = (emoji: string) => {
    if (input.length + emoji.length <= MAX_MESSAGE_LENGTH) {
      setInput((prev) => prev + emoji);
      inputRef.current?.focus();
    }
  };

  const MAX_MESSAGE_LENGTH = 500;

  // Calculate unread count
  const unreadCount = Math.max(0, messages.length - readCount);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Mark comments as read when chat is opened
  const markAsRead = useCallback(() => {
    if (messages.length > 0) {
      saveReadCount(pollAddress, messages.length);
      setReadCount(messages.length);
    }
  }, [pollAddress, messages.length]);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      // Mark as read when opening
      markAsRead();
    }
  }, [messages, isOpen, markAsRead]);

  // Prevent body scroll when modal is open (preserve scroll position)
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || "0") * -1);
      }
    }
    return () => {
      const scrollY = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || "0") * -1);
      }
    };
  }, [isOpen]);

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() || !address) return;

    try {
      await sendMessage(input, address);
      setInput("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleDelete = async (messageId: string, senderAddress: string) => {
    if (deletingId || !address) return;

    setDeletingId(messageId);
    try {
      await deleteMessage(messageId, senderAddress);
    } catch (error) {
      console.error("Failed to delete message:", error);
    } finally {
      setDeletingId(null);
    }
  };

  const shortenAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const isOwnMessage = (senderAddress: string) => {
    return address?.toLowerCase() === senderAddress.toLowerCase();
  };

  // Convert URLs in text to clickable links
  const renderMessageWithLinks = (text: string) => {
    // URL regex pattern - matches http, https, and www links
    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    let match;

    while ((match = urlRegex.exec(text)) !== null) {
      // Add text before the URL
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }

      // Add the URL as a link
      let url = match[0];
      let href = url;

      // Add https:// if it's a www link
      if (url.startsWith("www.")) {
        href = `https://${url}`;
      }

      parts.push(
        <a
          key={match.index}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 underline break-all"
          onClick={(e) => e.stopPropagation()}
        >
          {url}
        </a>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text after the last URL
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    // If no URLs found, return original text
    if (parts.length === 0) {
      return text;
    }

    return parts;
  };

  if (!isEnabled) {
    return null;
  }

  return (
    <>
      {/* Chat button - icon with comment count and unread badge */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
        className="relative flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
        title={`${messages.length} comments${
          unreadCount > 0 ? ` (${unreadCount} new)` : ""
        }`}
      >
        <div className="relative">
          <MessageSquare className="w-4 h-4" />
          {/* Unread badge */}
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] flex items-center justify-center px-1 text-[9px] font-bold text-white bg-red-500 rounded-full animate-in zoom-in duration-200">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
        <span className="text-xs">
          {messages.length}
          <span className="hidden md:inline">
            {" "}
            comment{messages.length !== 1 ? "s" : ""}
          </span>
        </span>
      </button>

      {/* Modal overlay - rendered via portal to escape card's stacking context */}
      {isOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 dark:bg-slate-950/60 backdrop-blur-sm animate-macos-backdrop p-0 sm:p-4"
            onClick={() => setIsOpen(false)}
          >
            {/* Modal content - Glass effect with macOS-style smooth animation */}
            <div
              className="w-full sm:max-w-lg bg-white/95 dark:bg-gradient-to-b dark:from-slate-900/95 dark:via-slate-800/95 dark:to-slate-900/95 backdrop-blur-2xl sm:rounded-2xl rounded-t-3xl shadow-[0_8px_60px_rgba(0,0,0,0.15)] dark:shadow-[0_8px_60px_rgba(0,0,0,0.5)] border border-gray-200/50 dark:border-slate-700/50 ring-1 ring-black/5 dark:ring-white/5 flex flex-col animate-macos-window"
              style={{ maxHeight: "90vh", height: "auto" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/5 flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-primary-500/10 dark:bg-primary-500/20 flex items-center justify-center ring-1 ring-primary-500/20 dark:ring-primary-500/30">
                    <MessageSquare className="w-4 h-4 text-primary-500 dark:text-primary-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      Comments
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      {messages.length}{" "}
                      {messages.length === 1 ? "message" : "messages"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Messages area - scrollable */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 min-h-[200px] max-h-[50vh] sm:max-h-[400px]">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-slate-500">
                    <div className="w-6 h-6 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mb-3" />
                    <span className="text-sm">Loading...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-slate-500">
                    <MessageSquare className="w-10 h-10 mb-3 opacity-30" />
                    <span className="text-sm">No comments yet</span>
                    <span className="text-xs mt-1 text-gray-500 dark:text-slate-600">
                      Be the first to comment!
                    </span>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOwn = isOwnMessage(msg.sender_address);
                    return (
                      <div
                        key={msg.id}
                        className="group/message bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-100 dark:border-white/5 rounded-xl p-3 transition-all"
                      >
                        {/* Header row */}
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-primary-600 dark:text-primary-400">
                              {isOwn
                                ? "You"
                                : shortenAddress(msg.sender_address)}
                            </span>
                            <span className="text-[10px] text-gray-400 dark:text-slate-500">
                              {new Date(msg.created_at).toLocaleString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          {/* Delete button - right side */}
                          {isOwn && (
                            <button
                              onClick={() =>
                                handleDelete(msg.id, msg.sender_address)
                              }
                              disabled={deletingId === msg.id}
                              className="opacity-0 group-hover/message:opacity-100 p-1.5 text-gray-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-30"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        {/* Message text */}
                        <p className="text-sm text-gray-700 dark:text-slate-200 whitespace-pre-wrap break-words leading-relaxed">
                          {renderMessageWithLinks(msg.message)}
                        </p>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input area */}
              <div className="p-4 border-t border-gray-100 dark:border-white/5 flex-shrink-0 sm:rounded-b-2xl">
                {address ? (
                  <div className="space-y-2">
                    {/* Emoji picker */}
                    {showEmojis && (
                      <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-3 animate-in slide-in-from-bottom-2 duration-200">
                        <div className="grid grid-cols-9 gap-1">
                          {TRADING_EMOJIS.map(({ emoji, label }) => (
                            <button
                              key={label}
                              onClick={() => addEmoji(emoji)}
                              className="w-8 h-8 flex items-center justify-center text-lg hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-colors hover:scale-110 active:scale-95"
                              title={label}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Input row */}
                    <div className="flex items-end gap-2">
                      {/* Emoji toggle button */}
                      <button
                        onClick={() => setShowEmojis(!showEmojis)}
                        className={`w-10 h-10 flex items-center justify-center rounded-full transition-all hover:scale-105 active:scale-95 ${
                          showEmojis
                            ? "bg-primary-100 dark:bg-primary-500/20 text-primary-500"
                            : "bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-white/10"
                        }`}
                        title="Trading emojis"
                      >
                        <Smile className="w-5 h-5" />
                      </button>
                      <div className="flex-1 relative">
                        <input
                          ref={inputRef}
                          type="text"
                          value={input}
                          onChange={(e) =>
                            setInput(
                              e.target.value.slice(0, MAX_MESSAGE_LENGTH)
                            )
                          }
                          onKeyPress={(e) => e.key === "Enter" && handleSend()}
                          placeholder="Write a comment..."
                          className="w-full px-4 py-2.5 pr-12 text-sm border border-gray-200 dark:border-white/10 rounded-full bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:focus:border-primary-500/50 focus:bg-white dark:focus:bg-white/10 transition-all"
                          maxLength={MAX_MESSAGE_LENGTH}
                          autoFocus
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 dark:text-slate-600">
                          {input.length}/{MAX_MESSAGE_LENGTH}
                        </span>
                      </div>
                      <button
                        onClick={handleSend}
                        disabled={!input.trim()}
                        className="w-10 h-10 flex items-center justify-center bg-primary-500 text-white rounded-full disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary-600 dark:hover:bg-primary-400 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary-500/25"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <span className="text-sm text-gray-500 dark:text-slate-500">
                      Connect wallet to comment
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

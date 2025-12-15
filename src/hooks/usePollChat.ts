import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface ChatMessage {
  id: string;
  poll_address: string;
  sender_address: string;
  message: string;
  created_at: string;
}

export const usePollChat = (pollAddress: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Load existing messages
  useEffect(() => {
    if (!supabase || !pollAddress) {
      setLoading(false);
      return;
    }

    const loadMessages = async () => {
      if (!supabase) return;
      try {
        const { data, error } = await supabase
          .from("poll_comments")
          .select("*")
          .eq("poll_address", pollAddress)
          .order("created_at", { ascending: true })
          .limit(100);

        if (error) throw error;
        setMessages(data || []);
      } catch (error) {
        console.error("Error loading messages:", error);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [pollAddress]);

  // Realtime subscription for new/deleted messages
  useEffect(() => {
    if (!supabase || !pollAddress) return;

    const newChannel = supabase
      .channel(`poll-chat:${pollAddress}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "poll_comments",
          filter: `poll_address=eq.${pollAddress}`,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          setMessages((prev) => {
            const exists = prev.some((msg) => msg.id === newMessage.id);
            if (exists) return prev;
            return [...prev, newMessage];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "poll_comments",
          filter: `poll_address=eq.${pollAddress}`,
        },
        (payload) => {
          const deletedMessage = payload.old as ChatMessage;
          setMessages((prev) =>
            prev.filter((msg) => msg.id !== deletedMessage.id)
          );
        }
      )
      .subscribe();

    channelRef.current = newChannel;

    return () => {
      if (channelRef.current && supabase) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [pollAddress]);

  // Send message
  const sendMessage = useCallback(
    async (message: string, senderAddress: string) => {
      if (!supabase || !pollAddress || !message.trim()) {
        throw new Error("Supabase not configured or invalid input");
      }

      const { data, error } = await supabase
        .from("poll_comments")
        .insert({
          poll_address: pollAddress,
          sender_address: senderAddress,
          message: message.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      // Add message to local state immediately (avoid waiting for realtime)
      if (data) {
        setMessages((prev) => {
          // Avoid duplicates if realtime subscription already added it
          const exists = prev.some((msg) => msg.id === data.id);
          if (exists) return prev;
          return [...prev, data];
        });
      }

      return data;
    },
    [pollAddress]
  );

  // Delete message
  const deleteMessage = useCallback(
    async (messageId: string, senderAddress: string) => {
      if (!supabase) {
        throw new Error("Supabase not configured");
      }

      const { error } = await supabase
        .from("poll_comments")
        .delete()
        .eq("id", messageId)
        .eq("sender_address", senderAddress);

      if (error) throw error;

      // Remove from local state immediately
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    },
    []
  );

  return {
    messages,
    loading,
    sendMessage,
    deleteMessage,
    isEnabled: !!supabase,
  };
};

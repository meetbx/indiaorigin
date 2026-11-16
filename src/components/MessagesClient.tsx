"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { getConversationMessages, saveServerMessage, sendMediaMessage } from "@/app/actions/chat";
import {
  Send,
  ArrowLeft,
  Paperclip,
  Store,
  MessageSquare,
  FileText,
  X,
  Download,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import * as Ably from "ably";

interface MessagesClientProps {
  initialConversations: any[];
  initialActiveConv: any | null;
  initialMessages: any[];
  initialCurrentUserId: string | null;
  initialHasMoreMessages: boolean;
  initialOldestSequence: number | undefined;
}

export default function MessagesClient({
  initialConversations = [],
  initialActiveConv = null,
  initialMessages = [],
  initialCurrentUserId = null,
  initialHasMoreMessages = false,
  initialOldestSequence = undefined,
}: MessagesClientProps) {
  const [conversations, setConversations] = useState<any[]>(initialConversations || []);
  const [activeConv, setActiveConv] = useState<any | null>(initialActiveConv);
  const [messages, setMessages] = useState<any[]>(initialMessages || []);
  const [currentUserId, setCurrentUserId] = useState<string | null>(initialCurrentUserId);
  const [hasMoreMessages, setHasMoreMessages] = useState(initialHasMoreMessages);
  const [oldestSequence, setOldestSequence] = useState<number | undefined>(initialOldestSequence);
  const [loadingOlder, setLoadingOlder] = useState(false);

  const messageCacheRef = useRef(new Map() as Map<string, any[]>);
  const loadRequestRef = useRef(0);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const isNearBottomRef = useRef(true);
  const ablyRealtimeRef = useRef<Ably.Realtime | null>(null);
  const channelRef = useRef<any>(null);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (initialActiveConv?.id) {
      messageCacheRef.current.set(initialActiveConv.id, initialMessages);
    }
  }, [initialActiveConv, initialMessages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...newFiles]);
      e.target.value = "";
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSelectConversation = useCallback(async (conv: any) => {
    setActiveConv(conv);
    const cached = messageCacheRef.current.get(conv.id);
    if (cached) {
      setMessages(cached);
      setHasMoreMessages(true);
    } else {
      setMessages([]);
    }

    const requestId = ++loadRequestRef.current;
    try {
      const res = await getConversationMessages(conv.id, 20);
      if (requestId !== loadRequestRef.current) return;

      messageCacheRef.current.set(conv.id, res.items);
      setMessages(res.items);
      setHasMoreMessages(res.hasMore);
      setOldestSequence(res.nextCursor);
      setCurrentUserId(res.currentUserId);
    } catch (e) {
      console.error("Failed to load conversation messages", e);
    }
  }, []);

  // Ably Realtime Connection & Channel Subscription
  useEffect(() => {
    if (!activeConv?.id || !currentUserId) return;

    let realtime = ablyRealtimeRef.current;
    if (!realtime) {
      realtime = new Ably.Realtime({ authUrl: "/api/ably/auth" });
      ablyRealtimeRef.current = realtime;
    }

    const channel = realtime.channels.get(`conv_${activeConv.id}`);
    channelRef.current = channel;

    const onNewMessage = (message: any) => {
      const newMsg = message.data;
      if (!newMsg?.id) return;

      setMessages((prev) => {
        const existingIndex = prev.findIndex(
          (m) =>
            m.id === newMsg.id ||
            (newMsg.clientMessageId && m.clientMessageId === newMsg.clientMessageId)
        );

        if (existingIndex !== -1) {
          const updated = [...prev];
          updated[existingIndex] = newMsg;
          return updated;
        }

        return [...prev, newMsg];
      });
    };

    channel.subscribe("new_message", onNewMessage);
    channel.attach();

    return () => {
      channel.unsubscribe("new_message", onNewMessage);
      if (channelRef.current === channel) channelRef.current = null;
    };
  }, [activeConv?.id, currentUserId]);

  useEffect(() => {
    return () => {
      ablyRealtimeRef.current?.close();
      ablyRealtimeRef.current = null;
    };
  }, []);

  const handleScroll = async () => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    isNearBottomRef.current = distanceFromBottom < 150;

    if (container.scrollTop === 0 && hasMoreMessages && !loadingOlder && oldestSequence !== undefined) {
      setLoadingOlder(true);
      const previousHeight = container.scrollHeight;

      try {
        const res = await getConversationMessages(activeConv.id, 20, oldestSequence);
        if (res.items.length > 0) {
          setMessages((prev) => [...res.items, ...prev]);
          setHasMoreMessages(res.hasMore);
          setOldestSequence(res.nextCursor);

          requestAnimationFrame(() => {
            if (messagesContainerRef.current) {
              messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight - previousHeight;
            }
          });
        } else {
          setHasMoreMessages(false);
        }
      } catch (err) {
        console.error("Failed to load older messages", err);
      } finally {
        setLoadingOlder(false);
      }
    }
  };

  useEffect(() => {
    if (activeConv?.id) {
      messageCacheRef.current.set(activeConv.id, messages);
    }

    if (isNearBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping, activeConv?.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputText.trim() && selectedFiles.length === 0) || !activeConv || !currentUserId || isUploading) return;

    const conversationId = activeConv.id as string;
    const contentCopy = inputText.trim();
    const filesCopy = [...selectedFiles];
    const clientMessageId = crypto.randomUUID();
    const tempId = `temp-${clientMessageId}`;

    setInputText("");
    setSelectedFiles([]);
    setIsUploading(true);

    const optimisticMessage = {
      id: tempId,
      conversationId,
      clientMessageId,
      senderId: currentUserId,
      content: contentCopy || null,
      isRead: false,
      createdAt: new Date().toISOString(),
      attachments: filesCopy.map((file, idx) => ({
        id: `temp-att-${tempId}-${idx}`,
        fileUrl: URL.createObjectURL(file),
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        type: file.type === "application/pdf" ? "PDF" : "IMAGE",
      })),
      isOptimistic: true,
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      let savedMessage: any;
      if (filesCopy.length === 0) {
        savedMessage = await saveServerMessage(
          conversationId,
          contentCopy,
          clientMessageId
        );
      } else {
        const formData = new FormData();
        formData.append("content", contentCopy);
        filesCopy.forEach((file) => formData.append("files", file));
        savedMessage = await sendMediaMessage(conversationId, formData);
      }

      setMessages((prev) => prev.map((msg) => msg.id === tempId ? savedMessage : msg));
      messageCacheRef.current.set(conversationId, [
        ...(messageCacheRef.current.get(conversationId) || []).filter((msg: any) => msg.id !== tempId),
        savedMessage,
      ]);
      setConversations((prev) => prev.map((conv) => conv.id === conversationId
        ? { ...conv, lastMessageAt: savedMessage.createdAt }
        : conv));
      optimisticMessage.attachments.forEach((attachment: any) => URL.revokeObjectURL(attachment.fileUrl));
    } catch (err) {
      console.error("Failed to send message", err);
      setMessages((prev) => prev.map((msg) => msg.id === tempId ? { ...msg, hasError: true } : msg));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      {/* Sidebar Inbox */}
      <div 
        className={`w-full md:w-1/3 border-r border-gray-200 bg-white flex flex-col ${
          activeConv ? "hidden md:flex" : "flex"
        }`}
      >
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <Link href="/" className="text-gray-600 hover:text-orange-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-extrabold text-lg">Messages</h1>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100 pb-20 md:pb-0">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => handleSelectConversation(conv)}
              className={`p-4 cursor-pointer hover:bg-gray-50 transition flex items-center gap-3 ${
                activeConv?.id === conv.id ? "bg-orange-50/60 border-l-4 border-orange-500" : ""
              }`}
            >
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                {conv.manufacturer?.logo ? (
                  <Image src={conv.manufacturer.logo} alt={conv.manufacturer.name} fill sizes="48px" className="object-cover" />
                ) : (
                  <Store className="w-6 h-6 text-gray-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold truncate text-gray-900">{conv.manufacturer?.name}</h3>
                <p className="text-xs text-gray-500 truncate mt-0.5">
                  {conv.product?.name ? `Inquiry regarding ${conv.product.name}` : "Active conversation"}
                </p>
              </div>
            </div>
          ))}
          {conversations.length === 0 && (
            <div className="text-center p-8 text-gray-400 text-xs">No active conversations yet.</div>
          )}
        </div>
      </div>

      {/* Chat Window */}
      <div 
        className={`flex-1 flex flex-col bg-[#F8FAFC] w-full ${
          !activeConv ? "hidden md:flex" : "flex"
        }`}
      >
        {activeConv ? (
          <>
            {/* Header */}
            <div className="bg-white px-4 md:px-6 py-3.5 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setActiveConv(null)}
                  className="md:hidden text-gray-600 hover:text-gray-900 mr-1"
                  aria-label="Back to conversations"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 bg-gray-100 rounded-full relative overflow-hidden flex items-center justify-center flex-shrink-0">
                  {activeConv.manufacturer?.logo ? (
                    <Image src={activeConv.manufacturer.logo} alt="" fill sizes="40px" className="object-cover" />
                  ) : (
                    <Store className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-gray-900 truncate">{activeConv.manufacturer?.name}</h2>
                  <p className="text-[11px] text-gray-500 truncate">{activeConv.manufacturer?.city}, India</p>
                </div>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div
              ref={messagesContainerRef}
              onScroll={handleScroll}
              className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 space-y-4"
            >
              {loadingOlder && (
                <div className="text-center py-2">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-orange-500" />
                </div>
              )}
              {messages.map((msg) => {
                const isMe = msg.senderId === currentUserId;
                return (
                  <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] md:max-w-md px-4 py-2.5 rounded-2xl text-sm shadow-xs ${
                        isMe 
                          ? "bg-[#FF5500] text-white rounded-br-none" 
                          : "bg-white text-gray-900 border border-gray-200 rounded-bl-none"
                      }`}
                    >
                      {msg.content && <p className="whitespace-pre-wrap break-words">{msg.content}</p>}
                      
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="space-y-2 mt-2">
                          {msg.attachments.map((att: any) => (
                            <div key={att.id}>
                              {att.type === "IMAGE" ? (
                                <a href={att.fileUrl} target="_blank" rel="noopener noreferrer" className="block relative w-32 h-32 sm:w-40 sm:h-40 rounded-lg overflow-hidden border border-gray-200 bg-black/5">
                                  <Image 
                                    src={att.fileUrl} 
                                    alt={att.fileName || "Attachment"} 
                                    fill 
                                    sizes="(max-width: 768px) 128px, 160px" 
                                    className="object-cover" 
                                  />
                                </a>
                              ) : (
                                <a href={att.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-white/10 p-3 rounded-xl border border-gray-200 hover:bg-white/20 transition">
                                  <FileText className="w-8 h-8 text-orange-500 flex-shrink-0" />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold truncate">{att.fileName}</p>
                                    <p className="text-[10px] text-gray-400">{(att.fileSize / 1024).toFixed(1)} KB • PDF</p>
                                  </div>
                                  <Download className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      <div className={`text-[10px] mt-1 text-right ${isMe ? "text-orange-100" : "text-gray-400"}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                );
              })}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white px-4 py-2 rounded-2xl text-xs text-gray-400 italic border border-gray-200">
                    Manufacturer is typing...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* File Preview Tray */}
            {selectedFiles.length > 0 && (
              <div className="bg-gray-100 px-4 py-2 border-t border-gray-200 flex gap-2 overflow-x-auto">
                {selectedFiles.map((file, idx) => (
                  <div key={idx} className="relative bg-white border border-gray-300 rounded-lg p-2 flex items-center gap-2 flex-shrink-0 text-xs">
                    {file.type === "application/pdf" ? (
                      <FileText className="w-5 h-5 text-red-500" />
                    ) : (
                      <Paperclip className="w-5 h-5 text-orange-500" />
                    )}
                    <span className="max-w-[100px] truncate">{file.name}</span>
                    <button type="button" onClick={() => removeSelectedFile(idx)} className="text-gray-500 hover:text-red-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Message Composer */}
            <form 
              onSubmit={handleSendMessage} 
              className="bg-white p-3 md:p-4 border-t border-gray-200 flex items-center gap-3 pb-safe"
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                multiple 
                accept="image/jpeg,image/png,image/webp,application/pdf" 
                className="hidden" 
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-gray-500 hover:text-[#FF5500] p-2 transition flex-shrink-0"
                aria-label="Attach file"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={isUploading ? "Uploading attachment..." : "Type your message..."}
                disabled={isUploading}
                className="flex-1 bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5500]/20 focus:border-[#FF5500]"
              />
              <button
                type="submit"
                disabled={isUploading}
                className="bg-[#FF5500] hover:bg-[#E04B00] text-white px-5 py-3 rounded-xl transition font-bold flex items-center justify-center shadow-sm flex-shrink-0 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 text-sm font-medium p-6 text-center">
            <MessageSquare className="w-12 h-12 text-gray-300 mb-2 stroke-[1.5]" />
            <p>Select a conversation from the sidebar to start messaging</p>
          </div>
        )}
      </div>
    </>
  );
}
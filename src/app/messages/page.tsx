"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getBuyerConversations, getConversationMessages, saveServerMessage, sendMediaMessage } from "@/app/actions/chat";
import { Send, ArrowLeft, Store, MessageSquare , Paperclip, FileText, X, Download } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import * as Ably from "ably";


function MessagesContent() {
  const searchParams = useSearchParams();
  const targetConvId = searchParams.get("conversationId");

  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const messageCacheRef = useRef<Map<string, any[]>>(new Map());
  const loadRequestRef = useRef(0);
  const [inputText, setInputText] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const ablyRealtimeRef = useRef<Ably.Realtime | null>(null);
  const channelRef = useRef<any>(null);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    let cancelled = false;
    getBuyerConversations()
      .then((data) => {
        if (cancelled) return;
        setConversations(data);
        if (data.length > 0) {
          const matched = targetConvId
            ? data.find((c) => c.id === targetConvId) || (window.innerWidth >= 768 ? data[0] : null)
            : (window.innerWidth >= 768 ? data[0] : null);
          if (matched) void handleSelectConversation(matched);
        }
      })
      .catch((error) => console.error("Failed to load conversations", error));
    return () => { cancelled = true; };
  }, [targetConvId]);

  useEffect(() => {
    if (!activeConv?.id || !currentUserId) return;

    // Reuse one Ably connection while switching conversations; only the channel changes.
    let realtime = ablyRealtimeRef.current;
    if (!realtime) {
      realtime = new Ably.Realtime({ authUrl: "/api/ably/auth" });
      ablyRealtimeRef.current = realtime;
    }

    const channel = realtime.channels.get(`conv_${activeConv.id}`);
    channelRef.current = channel;

    const onNewMessage = (message: any) => {
      const newMsg = message.data;
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        const optimisticIndex = prev.findIndex(
          (m) => m.isOptimistic && m.senderId === newMsg.senderId && m.content === newMsg.content
        );
        if (optimisticIndex !== -1) {
          const updated = [...prev];
          updated[optimisticIndex] = newMsg;
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
      // Keep the Ably connection alive so opening another chat doesn't reconnect.
    };
  }, [activeConv?.id, currentUserId]);

  useEffect(() => {
    return () => {
      ablyRealtimeRef.current?.close();
      ablyRealtimeRef.current = null;
    };
  }, []);

  const handleSelectConversation = async (conv: any) => {
    // Show cached messages immediately while refreshing them in the background.
    setActiveConv(conv);
    const cached = messageCacheRef.current.get(conv.id);
    if (cached) setMessages(cached);
    else setMessages([]);

    const requestId = ++loadRequestRef.current;
    try {
      const res = await getConversationMessages(conv.id);
      messageCacheRef.current.set(conv.id, res.messages);
      if (requestId !== loadRequestRef.current) return;
      setMessages(res.messages);
      setCurrentUserId(res.currentUserId);
    } catch (e) {
      console.error("Failed to load conversation messages", e);
    }
  };

  useEffect(() => {
    if (activeConv?.id) messageCacheRef.current.set(activeConv.id, messages);
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages, isTyping, activeConv?.id]);

  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputText.trim() && selectedFiles.length === 0) || !activeConv || !currentUserId || isUploading) return;

    const conversationId = activeConv.id as string;
    const contentCopy = inputText.trim();
    const filesCopy = [...selectedFiles];
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    setInputText("");
    setSelectedFiles([]);
    setIsUploading(true);

    const optimisticMessage = {
      id: tempId,
      conversationId,
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
      // Text-only messages avoid FormData/media processing entirely.
      let savedMessage: any;
      if (filesCopy.length === 0) {
        savedMessage = await saveServerMessage(conversationId, contentCopy);
      } else {
        const formData = new FormData();
        formData.append("content", contentCopy);
        filesCopy.forEach((file) => formData.append("files", file));
        savedMessage = await sendMediaMessage(conversationId, formData);
      }

      // Publish only after persistence succeeds. Other participants receive it via Ably.
      const realtime = ablyRealtimeRef.current;
      const channel = realtime?.channels.get(`conv_${conversationId}`);
      if (channel && savedMessage) await channel.publish("new_message", savedMessage);

      setMessages((prev) => prev.map((msg) => msg.id === tempId ? savedMessage : msg));
      messageCacheRef.current.set(conversationId, [
        ...(messageCacheRef.current.get(conversationId) || []).filter((msg) => msg.id !== tempId),
        savedMessage,
      ]);
      setConversations((prev) => prev.map((conv) => conv.id === conversationId
        ? { ...conv, messages: [savedMessage], lastMessageAt: savedMessage.createdAt }
        : conv));
      optimisticMessage.attachments.forEach((attachment: any) => URL.revokeObjectURL(attachment.fileUrl));
    } catch (err) {
      console.error("Failed to send message", err);
      setMessages((prev) => prev.map((msg) => msg.id === tempId ? { ...msg, hasError: true } : msg));
    } finally {
      setIsUploading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
  };

  return (
    <div className="flex h-[100dvh] bg-gray-50 text-gray-900 max-w-6xl mx-auto border-x border-gray-200 overflow-hidden fixed inset-0">
      {/* Sidebar Inbox - Hidden on mobile if a conversation is active */}
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
                  {conv.messages[0]?.content || "No messages yet"}
                </p>
              </div>
            </div>
          ))}
          {conversations.length === 0 && (
            <div className="text-center p-8 text-gray-400 text-xs">No active conversations yet.</div>
          )}
        </div>
      </div>

      {/* Chat Window - Full width on mobile when active, side-by-side on desktop */}
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
            <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 space-y-4">
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
                                <a href={att.fileUrl} target="_blank" rel="noopener noreferrer" className="block relative w-48 h-48 rounded-lg overflow-hidden border border-gray-200">
                                  <Image src={att.fileUrl} alt={att.fileName || "Attachment"} fill className="object-cover" />
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

            {/* Message Composer */}
            {/* File Preview Tray */}
            {selectedFiles.length > 0 && (
              <div className="bg-gray-100 px-4 py-2 border-t border-gray-200 flex gap-2 overflow-x-auto">
                {selectedFiles.map((file, idx) => (
                  <div key={idx} className="relative bg-white border border-gray-300 rounded-lg p-2 flex items-center gap-2 flex-shrink-0 text-xs">
                    {file.type === "application/pdf" ? (
                      <FileText className="w-5 h-5 text-red-500" />
                    ) : (
                      <img src={URL.createObjectURL(file)} alt="" className="w-8 h-8 object-cover rounded" />
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
                onChange={handleInputChange}
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
    </div>
  );
}

export default function BuyerMessagesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading chat...</div>}>
      <MessagesContent />
    </Suspense>
  );
}
"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  MessageCircle, X, Send, Bot, User, FileText,
  Maximize2, Minimize2, Plus, Trash2, MessagesSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { aiService } from "@/services";

// ── Thinking indicator ────────────────────────────────────────────────────
function ThinkingIndicator() {
  return (
    <div className="flex self-start items-start max-w-[85%]">
      <div className="p-3 bg-muted rounded-lg rounded-tl-none text-sm text-muted-foreground flex items-center gap-2">
        <Bot className="h-4 w-4 text-primary animate-pulse shrink-0" />
        <span className="italic flex items-center gap-1">
          Đang suy nghĩ
          <span className="flex gap-0.5 ml-0.5">
            <span className="w-1 h-1 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-1 h-1 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-1 h-1 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </span>
        </span>
      </div>
    </div>
  );
}

// ── Sizes ─────────────────────────────────────────────────────────────────
const SIZES = {
  normal: { width: 620, height: 560 },
  large:  { width: 900, height: 720 },
};

const SIDEBAR_WIDTH = 180;

const WELCOME_MESSAGE = {
  role: "assistant",
  content: "Xin chào! Tôi là Trợ lý AI SmartHR. Nhờ vào việc thấu hiểu toàn bộ cơ sở dữ liệu của hệ thống, tôi có thể trích xuất và phân tích bất kỳ dữ liệu nhân sự, điểm danh, phép năm hay cấu hình nào theo yêu cầu của bạn. Bạn muốn tra cứu gì hôm nay?",
};

export default function AssistantChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [size, setSize] = useState(SIZES.normal);
  const [isAiActive, setIsAiActive] = useState(null);

  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingConvs, setIsLoadingConvs] = useState(false);
  const [isLoadingMsgs, setIsLoadingMsgs] = useState(false);

  const scrollRef = useRef(null);

  // Resize state
  const isResizing = useRef(false);
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 });

  // ── Auto-scroll ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // ── Check AI Status ───────────────────────────────────────────────────────
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await aiService.getStatus();
        if (res && res.success && res.data) {
          setIsAiActive(res.data.active);
        } else {
          setIsAiActive(false);
        }
      } catch (error) {
        setIsAiActive(false);
      }
    };
    checkStatus();
  }, []);

  // ── Load conversations on open ───────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      loadConversations();
    }
  }, [isOpen]);

  const loadConversations = async () => {
    setIsLoadingConvs(true);
    try {
      const res = await aiService.getConversations();
      if (res && res.success) {
        const convs = res.data || [];
        setConversations(convs);
        if (convs.length > 0) {
          selectConversation(convs[0].id);
        } else {
          // No conversations yet — start fresh
          setActiveConvId(null);
          setMessages([WELCOME_MESSAGE]);
        }
      }
    } catch (err) {
      console.error("Load conversations error:", err);
    } finally {
      setIsLoadingConvs(false);
    }
  };

  const selectConversation = async (convId) => {
    if (convId === activeConvId) return;
    setActiveConvId(convId);
    setMessages([]);
    setIsLoadingMsgs(true);
    try {
      const res = await aiService.getMessages(convId);
      if (res && res.success) {
        const dbMessages = res.data || [];
        if (dbMessages.length === 0) {
          setMessages([WELCOME_MESSAGE]);
        } else {
          setMessages(dbMessages.map((m) => ({ role: m.role, content: m.content, action: null })));
        }
      }
    } catch (err) {
      console.error("Load messages error:", err);
      setMessages([WELCOME_MESSAGE]);
    } finally {
      setIsLoadingMsgs(false);
    }
  };

  const handleNewConversation = async () => {
    try {
      const res = await aiService.createConversation("Cuộc hội thoại mới");
      if (res && res.success) {
        const newConv = res.data;
        setConversations((prev) => [newConv, ...prev]);
        setActiveConvId(newConv.id);
        setMessages([WELCOME_MESSAGE]);
      }
    } catch (err) {
      console.error("Create conversation error:", err);
    }
  };

  const handleDeleteConversation = async (e, convId) => {
    e.stopPropagation();
    if (!window.confirm("Bạn có chắc chắn muốn xóa cuộc trò chuyện này?")) return;
    try {
      await aiService.deleteConversation(convId);
      const remaining = conversations.filter((c) => c.id !== convId);
      setConversations(remaining);
      if (activeConvId === convId) {
        if (remaining.length > 0) {
          selectConversation(remaining[0].id);
        } else {
          setActiveConvId(null);
          setMessages([WELCOME_MESSAGE]);
        }
      }
    } catch (err) {
      console.error("Delete conversation error:", err);
    }
  };

  // ── Resize handler ───────────────────────────────────────────────────────
  const onResizeMouseDown = useCallback((e) => {
    e.preventDefault();
    isResizing.current = true;
    resizeStart.current = { x: e.clientX, y: e.clientY, w: size.width, h: size.height };
    const onMouseMove = (e2) => {
      if (!isResizing.current) return;
      const dw = resizeStart.current.x - e2.clientX;
      const dh = resizeStart.current.y - e2.clientY;
      setSize({
        width: Math.max(520, Math.min(1100, resizeStart.current.w + dw)),
        height: Math.max(420, Math.min(window.innerHeight - 80, resizeStart.current.h + dh)),
      });
    };
    const onMouseUp = () => {
      isResizing.current = false;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, [size]);

  const toggleExpand = () => {
    const next = !isExpanded;
    setIsExpanded(next);
    setSize(next ? SIZES.large : SIZES.normal);
  };

  // ── Send message ─────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!input.trim()) return;

    const userContent = input.trim();
    setInput("");
    setIsLoading(true);

    // Optimistic UI — add user message immediately
    setMessages((prev) => [...prev.filter((m) => m !== WELCOME_MESSAGE || prev.length > 1), { role: "user", content: userContent }]);

    try {
      const response = await aiService.chat(activeConvId, userContent);
      if (response && response.success) {
        const data = response.data;

        // If a new conversation was auto-created, refresh conversation list
        if (data.conversationId && data.conversationId !== activeConvId) {
          setActiveConvId(data.conversationId);
          const res = await aiService.getConversations();
          if (res && res.success) setConversations(res.data || []);
        } else {
          // Update conversation's updatedAt in list (move it to top)
          setConversations((prev) => {
            const existing = prev.find((c) => c.id === (data.conversationId || activeConvId));
            if (!existing) return prev;
            return [{ ...existing, updatedAt: new Date().toISOString() }, ...prev.filter((c) => c.id !== existing.id)];
          });
        }

        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.content, action: data.action },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau." },
        ]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Xin lỗi, kết nối không thành công." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Closed state — floating button ───────────────────────────────────────
  if (isAiActive === false) {
    return null;
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  const chatAreaHeight = size.height - 120; // subtract header + footer
  const chatWidth = size.width - SIDEBAR_WIDTH;

  return (
    <Card
      className="fixed bottom-6 right-6 shadow-2xl flex flex-col z-50 overflow-hidden border transition-all duration-200"
      style={{ width: size.width, height: size.height }}
    >
      {/* Resize handle */}
      <div
        onMouseDown={onResizeMouseDown}
        className="absolute top-0 left-0 w-5 h-5 cursor-nw-resize z-10 group"
        title="Kéo để thay đổi kích thước"
      >
        <svg width="14" height="14" className="absolute top-1 left-1 text-primary-foreground/40 group-hover:text-primary-foreground transition-colors" viewBox="0 0 14 14" fill="currentColor">
          <path d="M1 7L7 1M1 13L13 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      {/* Header */}
      <CardHeader className="p-4 bg-primary text-primary-foreground flex flex-row items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          <CardTitle className="text-md font-medium">HR Assistant</CardTitle>
        </div>
        <div className="flex items-center gap-1">
          {activeConvId && (
            <Button
              variant="ghost" size="icon"
              className="h-7 w-7 text-primary-foreground hover:bg-red-500/80 transition-colors mr-1"
              onClick={(e) => handleDeleteConversation(e, activeConvId)}
              title="Xóa cuộc trò chuyện này"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost" size="icon"
            className="h-7 w-7 text-primary-foreground hover:bg-primary/80"
            onClick={toggleExpand}
            title={isExpanded ? "Thu nhỏ" : "Mở rộng"}
          >
            {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-primary-foreground hover:bg-primary/80" onClick={() => setIsOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      {/* Body: sidebar + chat */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar ─────────────────────────────────────────────────────── */}
        <div
          className="flex flex-col border-r bg-muted/30 shrink-0"
          style={{ width: SIDEBAR_WIDTH }}
        >
          {/* New chat button */}
          <div className="p-2 border-b">
            <Button
              variant="outline" size="sm"
              className="w-full gap-1 text-xs h-7"
              onClick={handleNewConversation}
            >
              <Plus className="h-3 w-3" />
              Cuộc trò chuyện mới
            </Button>
          </div>

          {/* Conversations list */}
          <ScrollArea className="flex-1">
            {isLoadingConvs ? (
              <div className="p-3 text-xs text-muted-foreground text-center">Đang tải...</div>
            ) : conversations.length === 0 ? (
              <div className="p-3 text-xs text-muted-foreground text-center flex flex-col items-center gap-1 mt-4">
                <MessagesSquare className="h-6 w-6 opacity-40" />
                <span>Chưa có cuộc hội thoại</span>
              </div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => selectConversation(conv.id)}
                  className={`group flex items-center justify-between px-2 py-2 cursor-pointer rounded-sm mx-1 my-0.5 text-xs transition-colors hover:bg-muted ${
                    activeConvId === conv.id ? "bg-muted font-medium" : ""
                  }`}
                >
                  <span className="truncate flex-1 pr-1" title={conv.title}>{conv.title}</span>
                  <button
                    className={`shrink-0 transition-opacity text-destructive ${activeConvId === conv.id ? "opacity-100" : "opacity-0 group-hover:opacity-70 hover:!opacity-100"}`}
                    onClick={(e) => handleDeleteConversation(e, conv.id)}
                    title="Xóa"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))
            )}
          </ScrollArea>
        </div>

        {/* ── Chat area ───────────────────────────────────────────────────── */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <CardContent className="p-0 flex-1 overflow-hidden">
            <ScrollArea
              className="w-full p-4"
              style={{ height: chatAreaHeight }}
              ref={scrollRef}
            >
              <div className="flex flex-col gap-3">
                {isLoadingMsgs ? (
                  <div className="text-center text-xs text-muted-foreground py-6">Đang tải lịch sử...</div>
                ) : (
                  messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex flex-col max-w-[88%] ${msg.role === "user" ? "self-end items-end" : "self-start items-start"}`}
                    >
                      <div className={`flex items-center gap-2 mb-1 text-xs text-muted-foreground ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                        {msg.role === "user" ? <User className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
                        <span>{msg.role === "user" ? "Bạn" : "HR Assistant"}</span>
                      </div>
                      <div className={`p-3 rounded-lg text-sm whitespace-pre-wrap leading-relaxed ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-tr-none"
                          : "bg-muted text-foreground rounded-tl-none"
                      }`}>
                        {msg.content}
                      </div>
                      {msg.action && msg.action.type === "OPEN_REQUEST_FORM" && (
                        <Button variant="outline" size="sm" className="mt-2 text-xs" onClick={() => window.location.href = "/requests/create"}>
                          <FileText className="h-3 w-3 mr-1" />
                          Tạo Đơn Nghỉ Phép
                        </Button>
                      )}
                    </div>
                  ))
                )}
                {isLoading && <ThinkingIndicator />}
              </div>
            </ScrollArea>
          </CardContent>

          <CardFooter className="p-3 bg-background border-t shrink-0">
            <div className="flex w-full gap-2 items-center">
              <Input
                placeholder="Nhập câu hỏi..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1"
                disabled={isLoading || isLoadingMsgs}
              />
              <Button size="icon" onClick={handleSend} disabled={!input.trim() || isLoading || isLoadingMsgs}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        </div>
      </div>
    </Card>
  );
}

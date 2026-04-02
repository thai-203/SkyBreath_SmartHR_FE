"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Bot, User, FileText, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { aiService } from "@/services";

// Animated "Đang suy nghĩ..." thinking dots component
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

// Sizes for the chat window
const SIZES = {
  normal: { width: 380, height: 520 },
  large: { width: 600, height: 720 },
};

export default function AssistantChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [size, setSize] = useState(SIZES.normal);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Xin chào! Tôi là Trợ lý AI SmartHR. Nhờ vào việc thấu hiểu toàn bộ cơ sở dữ liệu của hệ thống, tôi có thể trích xuất và phân tích bất kỳ dữ liệu nhân sự, điểm danh, phép năm hay cấu hình nào theo yêu cầu của bạn. Bạn muốn tra cứu gì hôm nay?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

  // Resize state
  const isResizing = useRef(false);
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Mouse-drag resize handlers
  const onResizeMouseDown = useCallback((e) => {
    e.preventDefault();
    isResizing.current = true;
    resizeStart.current = { x: e.clientX, y: e.clientY, w: size.width, h: size.height };

    const onMouseMove = (e2) => {
      if (!isResizing.current) return;
      const dw = resizeStart.current.x - e2.clientX; // dragging left = wider
      const dh = resizeStart.current.y - e2.clientY; // dragging up = taller
      setSize({
        width: Math.max(320, Math.min(900, resizeStart.current.w + dw)),
        height: Math.max(400, Math.min(window.innerHeight - 80, resizeStart.current.h + dh)),
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

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { role: "user", content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await aiService.chat(newMessages);
      if (response && response.success) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: response.data.content, action: response.data.action }
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau." }
        ]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Xin lỗi, kết nối không thành công." }
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

  const chatHeight = size.height - 120; // subtract header + footer

  return (
    <Card
      className="fixed bottom-6 right-6 shadow-2xl flex flex-col z-50 overflow-hidden border transition-all duration-200"
      style={{ width: size.width, height: size.height }}
    >
      {/* Resize handle — top-left corner */}
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
          <Button
            variant="ghost"
            size="icon"
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

      {/* Messages area */}
      <CardContent className="p-0 flex-1 overflow-hidden">
        <ScrollArea
          className="w-full p-4"
          style={{ height: chatHeight }}
          ref={scrollRef}
        >
          <div className="flex flex-col gap-3">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col max-w-[85%] ${msg.role === "user" ? "self-end items-end" : "self-start items-start"}`}
              >
                <div className={`flex items-center gap-2 mb-1 text-xs text-muted-foreground ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  {msg.role === "user" ? <User className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
                  <span>{msg.role === "user" ? "Bạn" : "HR Assistant"}</span>
                </div>
                <div className={`p-3 rounded-lg text-sm whitespace-pre-wrap leading-relaxed ${msg.role === "user" ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-muted text-foreground rounded-tl-none"}`}>
                  {msg.content}
                </div>
                {msg.action && msg.action.type === 'OPEN_REQUEST_FORM' && (
                  <Button variant="outline" size="sm" className="mt-2 text-xs" onClick={() => window.location.href = '/requests/create'}>
                    <FileText className="h-3 w-3 mr-1" />
                    Tạo Đơn Nghỉ Phép
                  </Button>
                )}
              </div>
            ))}
            {isLoading && <ThinkingIndicator />}
          </div>
        </ScrollArea>
      </CardContent>

      {/* Input footer */}
      <CardFooter className="p-3 bg-background border-t shrink-0">
        <div className="flex w-full gap-2 items-center">
          <Input
            placeholder="Nhập câu hỏi..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1"
            disabled={isLoading}
          />
          <Button size="icon" onClick={handleSend} disabled={!input.trim() || isLoading}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, MessageCircle, FileText, Trash2, Edit3, Check, X, ChevronLeft, ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"

interface ChatSession {
  _id: string
  title: string
  type: "general" | "translation"
  lastMessage?: string
  updatedAt: string
  messageCount: number
}

interface ChatSidebarProps {
  userId: string
  currentChatId: string | null
  onChatSelect: (chatId: string, type: "general" | "translation") => void
  onNewChat: (type: "general" | "translation") => void
  isCollapsed: boolean
  onToggleCollapse: () => void
}

export default function ChatSidebar({
  userId,
  currentChatId,
  onChatSelect,
  onNewChat,
  isCollapsed,
  onToggleCollapse,
}: ChatSidebarProps) {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")

  useEffect(() => {
    loadChatSessions()
  }, [userId])

  const loadChatSessions = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/chat-sessions?userId=${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const sessions = await response.json()
        setChatSessions(sessions)
      }
    } catch (error) {
      console.error("Failed to load chat sessions:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteChat = async (chatId: string, type: "general" | "translation") => {
    try {
      const token = localStorage.getItem("token")
      const endpoint = type === "general" ? "/api/general-chat/delete" : "/api/chat/delete"

      const response = await fetch(endpoint, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ chatId }),
      })

      if (response.ok) {
        setChatSessions((prev) => prev.filter((chat) => chat._id !== chatId))
        if (currentChatId === chatId) {
          onNewChat(type)
        }
      }
    } catch (error) {
      console.error("Failed to delete chat:", error)
    }
  }

  const handleRenameChat = async (chatId: string, newTitle: string, type: "general" | "translation") => {
    try {
      const token = localStorage.getItem("token")
      const endpoint = type === "general" ? "/api/general-chat/rename" : "/api/chat/rename"

      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ chatId, title: newTitle }),
      })

      if (response.ok) {
        setChatSessions((prev) => prev.map((chat) => (chat._id === chatId ? { ...chat, title: newTitle } : chat)))
        setEditingId(null)
        setEditTitle("")
      }
    } catch (error) {
      console.error("Failed to rename chat:", error)
    }
  }

  const startEditing = (chatId: string, currentTitle: string) => {
    setEditingId(chatId)
    setEditTitle(currentTitle)
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditTitle("")
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return "오늘"
    if (diffDays === 2) return "어제"
    if (diffDays <= 7) return `${diffDays - 1}일 전`
    return date.toLocaleDateString("ko-KR")
  }

  const groupedChats = chatSessions.reduce(
    (groups, chat) => {
      const date = formatDate(chat.updatedAt)
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(chat)
      return groups
    },
    {} as Record<string, ChatSession[]>,
  )

  if (isCollapsed) {
    return (
      <div className="w-16 bg-gray-50 border-r border-gray-200 flex flex-col">
        <div className="p-3">
          <Button variant="ghost" size="sm" onClick={onToggleCollapse} className="w-full justify-center">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex-1 flex flex-col space-y-2 p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNewChat("general")}
            className="w-full justify-center p-2"
            title="새 일반 채팅"
          >
            <MessageCircle className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNewChat("translation")}
            className="w-full justify-center p-2"
            title="새 번역 채팅"
          >
            <FileText className="w-4 h-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">채팅 기록</h2>
          <Button variant="ghost" size="sm" onClick={onToggleCollapse}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNewChat("general")}
            className="flex-1 bg-white text-gray-700 hover:bg-gray-50"
          >
            <Plus className="w-4 h-4 mr-1" />
            일반 채팅
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNewChat("translation")}
            className="flex-1 bg-white text-gray-700 hover:bg-gray-50"
          >
            <Plus className="w-4 h-4 mr-1" />
            번역 채팅
          </Button>
        </div>
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto"></div>
              <p className="mt-2 text-sm">채팅 기록 로딩 중...</p>
            </div>
          ) : Object.keys(groupedChats).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">아직 채팅 기록이 없습니다</p>
              <p className="text-xs text-gray-400 mt-1">새 채팅을 시작해보세요!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedChats).map(([date, chats]) => (
                <div key={date}>
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide px-2 py-1">{date}</h3>
                  <div className="space-y-1">
                    {chats.map((chat) => (
                      <Card
                        key={chat._id}
                        className={`p-3 cursor-pointer transition-all hover:bg-white group ${
                          currentChatId === chat._id
                            ? "bg-white border-blue-200 shadow-sm"
                            : "bg-transparent border-transparent"
                        }`}
                        onClick={() => onChatSelect(chat._id, chat.type)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              {chat.type === "general" ? (
                                <MessageCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                              ) : (
                                <FileText className="w-3 h-3 text-blue-500 flex-shrink-0" />
                              )}
                              {editingId === chat._id ? (
                                <div className="flex-1 flex items-center space-x-1">
                                  <Input
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    className="h-6 text-xs"
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        handleRenameChat(chat._id, editTitle, chat.type)
                                      } else if (e.key === "Escape") {
                                        cancelEditing()
                                      }
                                    }}
                                    autoFocus
                                  />
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleRenameChat(chat._id, editTitle, chat.type)
                                    }}
                                  >
                                    <Check className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      cancelEditing()
                                    }}
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-sm font-medium text-gray-900 truncate">{chat.title}</span>
                              )}
                            </div>
                            {chat.lastMessage && <p className="text-xs text-gray-500 truncate">{chat.lastMessage}</p>}
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-xs text-gray-400">{chat.messageCount}개 메시지</span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                startEditing(chat._id, chat.title)
                              }}
                            >
                              <Edit3 className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteChat(chat._id, chat.type)
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

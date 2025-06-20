"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import ChatInterface from "@/components/chat-interface"
import PdfUpload from "@/components/pdf-upload"
import GeneralChat from "@/components/general-chat"
import ChatSidebar from "@/components/chat-sidebar"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LogOut, FileText, MessageCircle } from "lucide-react"

export default function HomePage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [currentChatType, setCurrentChatType] = useState<"general" | "translation">("general")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }

      const response = await fetch("/api/auth/verify", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      } else {
        localStorage.removeItem("token")
        router.push("/login")
      }
    } catch (error) {
      console.error("Auth check failed:", error)
      router.push("/login")
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    router.push("/login")
  }

  const handleChatSelect = (chatId: string, type: "general" | "translation") => {
    setCurrentChatId(chatId)
    setCurrentChatType(type)
  }

  const handleNewChat = (type: "general" | "translation") => {
    setCurrentChatId(null)
    setCurrentChatType(type)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <ChatSidebar
        userId={user?.id}
        currentChatId={currentChatId}
        onChatSelect={handleChatSelect}
        onNewChat={handleNewChat}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-gray-900">논문 번역기</h1>
              <span className="text-sm text-gray-500">안녕하세요, {user?.name}님!</span>
            </div>
            <Button variant="outline" onClick={handleLogout} className="bg-white text-gray-700 hover:bg-gray-50">
              <LogOut className="w-4 h-4 mr-2" />
              로그아웃
            </Button>
          </div>
        </header>

        {/* Chat Content */}
        <main className="flex-1 p-4">
          <Tabs
            value={currentChatType}
            onValueChange={(value) => setCurrentChatType(value as "general" | "translation")}
            className="w-full h-full"
          >
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="general" className="flex items-center space-x-2">
                <MessageCircle className="w-4 h-4" />
                <span>일반 채팅</span>
              </TabsTrigger>
              <TabsTrigger value="translation" className="flex items-center space-x-2">
                <MessageCircle className="w-4 h-4" />
                <span>논문 번역</span>
              </TabsTrigger>
              <TabsTrigger value="pdf" className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>PDF 번역</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="h-full">
              <GeneralChat
                userId={user?.id}
                chatId={currentChatId}
                onChatCreated={(chatId) => setCurrentChatId(chatId)}
              />
            </TabsContent>

            <TabsContent value="translation" className="h-full">
              <ChatInterface
                userId={user?.id}
                chatId={currentChatId}
                onChatCreated={(chatId) => setCurrentChatId(chatId)}
              />
            </TabsContent>

            <TabsContent value="pdf" className="h-full">
              <PdfUpload userId={user?.id} />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}

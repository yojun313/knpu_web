"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import ChatInterface from "@/components/chat-interface"
import PdfUpload from "@/components/pdf-upload"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LogOut, FileText, MessageCircle } from "lucide-react"
import GeneralChat from "@/components/general-chat"

export default function HomePage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-gray-900">CALLAB AI</h1>
            <span className="text-sm text-gray-500">안녕하세요, {user?.name}님!</span>
          </div>
          <Button variant="outline" onClick={handleLogout} className="bg-white text-gray-700 hover:bg-gray-50">
            <LogOut className="w-4 h-4 mr-2" />
            로그아웃
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4">
        <Tabs defaultValue="general" className="w-full">
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

          <TabsContent value="general">
            <GeneralChat userId={user?.id} />
          </TabsContent>

          <TabsContent value="translation">
            <ChatInterface userId={user?.id} />
          </TabsContent>

          <TabsContent value="pdf">
            <PdfUpload userId={user?.id} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

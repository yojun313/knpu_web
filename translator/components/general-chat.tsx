"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Bot, User, Loader2, X, FileText, ImageIcon, Upload, Eye, Brain } from 'lucide-react'
import EnhancedFileUpload from "@/components/enhanced-file-upload"
import ModelSelector from "@/components/model-selector"
import SimpleFileUpload from "@/components/simple-file-upload"

interface Message {
  _id?: string
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  files?: Array<{
    name: string
    type: string
    content: string
    analysis?: string
  }>
}

interface GeneralChatProps {
  userId: string
  chatId: string | null
  onChatCreated: (chatId: string) => void
}

export default function GeneralChat({ userId, chatId, onChatCreated }: GeneralChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState("gpt-4o")
  const [uploadedFiles, setUploadedFiles] = useState<
    Array<{
      name: string
      type: string
      content: string
      analysis?: string
    }>
  >([])
  const [showFileUpload, setShowFileUpload] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  useEffect(() => {
    if (chatId) {
      loadChatHistory(chatId)
    } else {
      setMessages([])
    }
    loadUserPreferences()
  }, [chatId, userId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadUserPreferences = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/auth/verify", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const userData = await response.json()
        setSelectedModel(userData.preferredModel || "gpt-4o")
      }
    } catch (error) {
      console.error("Failed to load user preferences:", error)
    }
  }

  const loadChatHistory = async (chatId: string) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/general-chat/history/${chatId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const history = await response.json()
        const parsedHistory = history.map((msg: any, index: number) => ({
          ...msg,
          id: msg._id || msg.id || `msg-${index}-${Date.now()}`,
          timestamp: new Date(msg.timestamp),
        }))
        setMessages(parsedHistory)
      }
    } catch (error) {
      console.error("Failed to load chat history:", error)
    }
  }

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }

  const handleFileUpload = (files: Array<{ name: string; type: string; content: string; analysis?: string }>) => {
    setUploadedFiles((prev) => [...prev, ...files])
    setShowFileUpload(false)
  }

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (error) => reject(error)
    })
  }

  const handleDirectFileUpload = async (files: File[]) => {
    const validFiles = files.filter((file) => {
      const isValidType =
        file.type.startsWith("image/") ||
        file.type === "text/plain" ||
        file.type === "application/pdf" ||
        file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      const isValidSize = file.size <= 25 * 1024 * 1024 // 25MB
      return isValidType && isValidSize
    })

    if (validFiles.length > 0) {
      const processedFiles = await Promise.all(
        validFiles.map(async (file) => {
          let content = ""

          if (file.type.startsWith("image/")) {
            const base64 = await fileToBase64(file)
            content = `[이미지 파일: ${file.name}]\n이미지를 분석해주세요.\n데이터: ${base64}`
          } else if (file.type === "text/plain") {
            content = await file.text()
          } else if (file.type === "application/pdf") {
            const base64 = await fileToBase64(file)
            content = `[PDF 파일: ${file.name}]\n파일 크기: ${(file.size / 1024 / 1024).toFixed(2)}MB\nPDF 내용을 분석해주세요.\n데이터: ${base64}`
          } else {
            content = `[파일: ${file.name}]\n파일 타입: ${file.type}\n파일 크기: ${file.size} bytes`
          }

          return {
            name: file.name,
            type: file.type,
            content,
          }
        }),
      )

      setUploadedFiles((prev) => [...prev, ...processedFiles])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!input.trim() && uploadedFiles.length === 0) || loading) return

    const userMessage: Message = {
      id: `user-${Date.now()}-${Math.random()}`,
      role: "user",
      content: input,
      timestamp: new Date(),
      files: uploadedFiles.length > 0 ? uploadedFiles : undefined,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    const currentFiles = uploadedFiles
    setUploadedFiles([])
    setLoading(true)

    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/general-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: input,
          userId,
          chatId,
          chatHistory: messages,
          model: selectedModel,
          files: currentFiles,
        }),
      })

      if (response.ok) {
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()
        let assistantMessage = ""

        const assistantMessageObj: Message = {
          id: `assistant-${Date.now()}-${Math.random()}`,
          role: "assistant",
          content: "",
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, assistantMessageObj])

        while (reader) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split("\n")

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6)
              if (data === "[DONE]") break

              try {
                const parsed = JSON.parse(data)
                if (parsed.content) {
                  assistantMessage += parsed.content
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessageObj.id ? { ...msg, content: assistantMessage } : msg,
                    ),
                  )
                }
                if (parsed.chatId && !chatId) {
                  onChatCreated(parsed.chatId)
                }
              } catch (e) {
                // Ignore parsing errors
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error)
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}-${Math.random()}`,
          role: "assistant",
          content: "죄송합니다. 오류가 발생했습니다. 다시 시도해주세요.",
          timestamp: new Date(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">🤖 AI 어시스턴트</h2>
          <ModelSelector selectedModel={selectedModel} onModelChange={setSelectedModel} />
        </div>
        <p className="text-sm text-gray-600">Vision AI와 고급 파일 분석으로 더 정확한 답변을 제공합니다</p>
      </div>

      <ScrollArea
        ref={scrollAreaRef}
        className="flex-1 p-4 relative"
        onDragOver={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setIsDragOver(true)
        }}
        onDragLeave={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setIsDragOver(false)
        }}
        onDrop={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setIsDragOver(false)

          const files = Array.from(e.dataTransfer.files)
          if (files.length > 0) {
            handleDirectFileUpload(files)
          }
        }}
      >
        <div className={`space-y-4 ${isDragOver ? "opacity-50" : ""}`}>
          {messages.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              <Bot className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium">안녕하세요! 무엇을 도와드릴까요?</p>
              <div className="mt-4 flex justify-center space-x-4 text-sm">
                <div className="flex items-center space-x-1 text-blue-600">
                  <Eye className="w-4 h-4" />
                  <span>Vision AI</span>
                </div>
                <div className="flex items-center space-x-1 text-green-600">
                  <Brain className="w-4 h-4" />
                  <span>고급 분석</span>
                </div>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start space-x-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {message.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-green-600" />
                </div>
              )}

              <div
                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                  message.role === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                }`}
              >
                {message.files && message.files.length > 0 && (
                  <div className="mb-2 space-y-1">
                    {message.files.map((file, index) => (
                      <div key={`file-${index}`} className="flex items-center space-x-2 text-xs opacity-80">
                        {file.type.startsWith("image/") ? (
                          <div className="flex items-center space-x-1">
                            <Eye className="w-3 h-3" />
                            <ImageIcon className="w-3 h-3" />
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1">
                            <Brain className="w-3 h-3" />
                            <FileText className="w-3 h-3" />
                          </div>
                        )}
                        <span>{file.name}</span>
                        {file.analysis && <span className="text-green-400">✓ 분석됨</span>}
                      </div>
                    ))}
                  </div>
                )}
                <p className="whitespace-pre-wrap">{message.content}</p>
                <p className="text-xs opacity-70 mt-1">{message.timestamp.toLocaleTimeString()}</p>
              </div>

              {message.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <Bot className="w-4 h-4 text-green-600" />
              </div>
              <div className="bg-gray-100 rounded-lg px-4 py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            </div>
          )}
        </div>
        {isDragOver && (
          <div className="absolute inset-0 bg-blue-50 bg-opacity-90 flex items-center justify-center z-10 border-2 border-dashed border-blue-400 rounded-lg">
            <div className="text-center">
              <Upload className="w-16 h-16 mx-auto mb-4 text-blue-500" />
              <p className="text-xl font-semibold text-blue-700">고급 AI 분석을 위해 파일을 놓으세요</p>
              <p className="text-sm text-blue-600 mt-2">Vision AI • 텍스트 추출 • 고급 처리</p>
            </div>
          </div>
        )}
      </ScrollArea>

      <div className="p-4 border-t">
        {/* Uploaded Files Display */}
        {uploadedFiles.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {uploadedFiles.map((file, index) => (
              <div
                key={`upload-${index}`}
                className="flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-1 text-sm"
              >
                {file.type.startsWith("image/") ? (
                  <div className="flex items-center space-x-1">
                    <Eye className="w-3 h-3 text-blue-500" />
                    <ImageIcon className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="flex items-center space-x-1">
                    <Brain className="w-3 h-3 text-green-500" />
                    <FileText className="w-4 h-4" />
                  </div>
                )}
                <span className="truncate max-w-32">{file.name}</span>
                {file.analysis && <span className="text-green-500 text-xs">✓</span>}
                <button onClick={() => removeFile(index)} className="text-gray-500 hover:text-red-500">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="flex space-x-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="메시지를 입력하세요..."
              className="flex-1 min-h-[60px] resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit(e)
                }
              }}
            />
            <div className="flex flex-col space-y-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowFileUpload(true)}
                className="bg-white text-gray-700 hover:bg-gray-50"
              >
                <Upload className="w-4 h-4" />
              </Button>
              <Button type="submit" disabled={loading || (!input.trim() && uploadedFiles.length === 0)}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </form>

        {showFileUpload && <SimpleFileUpload onUpload={handleFileUpload} onClose={() => setShowFileUpload(false)} />}
      </div>
    </Card>
  )
}

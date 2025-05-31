"use client"

import type React from "react"

import { useChat } from "@ai-sdk/react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { FileText, Send, Bot, User, MessageSquare } from 'lucide-react'
import { useRouter } from "next/navigation"

const SUGGESTED_QUESTIONS = [
  {
    title: "💰 사기 피해",
    question: "온라인 쇼핑몰에서 상품을 주문하고 돈을 보냈는데 상품을 받지 못했습니다. 판매자와 연락도 안 되고 있어요.",
  },
  {
    title: "👊 폭행 사건",
    question: "직장 동료가 회식 자리에서 저를 때렸습니다. 병원에서 진단서도 받았고 목격자도 있어요.",
  },
  {
    title: "💬 명예훼손",
    question: "온라인 커뮤니티에서 누군가 제 실명을 거론하며 거짓 사실을 퍼뜨려서 명예가 훼손되었습니다.",
  },
  {
    title: "💼 임금체불",
    question: "회사에서 3개월째 급여를 주지 않고 있습니다. 퇴직금도 받지 못했어요.",
  },
  {
    title: "🏠 임대차 분쟁",
    question: "집주인이 보증금을 돌려주지 않고 있습니다. 계약서도 있고 입금 증명서도 있어요.",
  },
  {
    title: "📱 개인정보 유출",
    question: "개인정보가 무단으로 유출되어 피해를 당했습니다. 스팸 문자와 전화가 계속 와요.",
  },
]

export default function ComplaintGenerator() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, append } = useChat()
  const [isGenerating, setIsGenerating] = useState(false)
  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // 메시지가 추가되거나 변경될 때마다 스크롤을 맨 아래로 이동
  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }

    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const generateComplaint = async () => {
    setIsGenerating(true)

    const collectedInfo = messages.map((m) => `${m.role === "user" ? "사용자" : "AI"}: ${m.content}`).join("\n\n")

    try {
      const response = await fetch("/api/generate-complaint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collectedInfo }),
      })

      const { complaint } = await response.json()
      localStorage.setItem("generatedComplaint", complaint)
      router.push("/edit")
    } catch (error) {
      console.error("고소장 생성 중 오류:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    handleSubmit(e)
    // 폼 제출 후 입력 필드에 포커스
    const inputElement = document.querySelector('input[name="prompt"]') as HTMLInputElement
    if (inputElement) {
      setTimeout(() => {
        inputElement.focus()
      }, 100)
    }
  }

  const handleSuggestedQuestion = (question: string) => {
    append({ content: question, role: "user" })
  }

  const canGenerateComplaint =
    messages.length > 4 && messages.some((m) => m.content.includes("정보 수집이 완료되었습니다"))

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-6 flex-shrink-0">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
            AI 고소장 생성기
          </h1>
          <p className="text-gray-600 mt-2">AI와 대화하며 정식 고소장을 자동으로 생성해보세요</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4">
        <Card className="h-full flex flex-col shadow-sm border-0 bg-white">
          <CardContent className="flex-1 flex flex-col p-0" ref={scrollAreaRef}>
            <ScrollArea className="flex-1">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <div className="p-4 bg-blue-50 rounded-full mb-4">
                    <Bot className="h-12 w-12 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">AI 고소장 생성을 시작해보세요</h2>
                  <p className="text-gray-600 mb-8">AI가 필요한 정보를 차근차근 물어볼게요</p>

                  {/* 추천 질문 리스트 */}
                  <div className="w-full max-w-2xl">
                    <div className="flex items-center gap-2 mb-4">
                      <MessageSquare className="h-5 w-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-800">추천 질문</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {SUGGESTED_QUESTIONS.map((item, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          className="h-auto p-4 text-left justify-start hover:bg-blue-50 hover:border-blue-300 transition-colors"
                          onClick={() => handleSuggestedQuestion(item.question)}
                        >
                          <div className="flex flex-col items-start gap-1">
                            <div className="font-medium text-sm text-blue-700">{item.title}</div>
                            <div className="text-xs text-gray-600 line-clamp-2">{item.question}</div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg max-w-md mt-8">
                    💡 <strong>수집할 정보:</strong> 고소인 정보, 피고소인 정보, 사건 개요, 피해 내용, 증거 자료 등
                  </div>
                </div>
              )}

              <div className="p-4 space-y-6">
                {messages.map((message, index) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                  >
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarFallback
                        className={message.role === "user" ? "bg-blue-600 text-white" : "bg-gray-600 text-white"}
                      >
                        {message.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>

                    <div
                      className={`flex flex-col ${message.role === "user" ? "items-end" : "items-start"} max-w-[80%]`}
                    >
                      <div className="text-xs text-gray-500 mb-1">
                        {message.role === "user" ? "사용자" : "AI 어시스턴트"}
                      </div>
                      <div
                        className={`p-4 rounded-2xl ${
                          message.role === "user"
                            ? "bg-blue-600 text-white rounded-br-md"
                            : "bg-gray-100 text-gray-900 rounded-bl-md"
                        }`}
                      >
                        <div className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</div>
                      </div>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-3">
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarFallback className="bg-gray-600 text-white">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start">
                      <div className="text-xs text-gray-500 mb-1">AI 어시스턴트</div>
                      <div className="bg-gray-100 text-gray-900 p-4 rounded-2xl rounded-bl-md">
                        <div className="flex items-center gap-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div
                              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                              style={{ animationDelay: "0.1s" }}
                            ></div>
                            <div
                              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                              style={{ animationDelay: "0.2s" }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">답변을 작성하고 있습니다</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {/* 스크롤 위치를 맨 아래로 이동시키기 위한 빈 div */}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </CardContent>

          <CardFooter className="border-t bg-gray-50 p-4">
            <form onSubmit={handleFormSubmit} className="flex w-full gap-3">
              <div className="flex-1 relative">
                <Input
                  name="prompt"
                  value={input}
                  onChange={handleInputChange}
                  placeholder="메시지를 입력하세요..."
                  disabled={isLoading}
                  className="pr-12 py-3 rounded-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
                <Button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full w-8 h-8 p-0 bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </CardFooter>
        </Card>

        {canGenerateComplaint && (
          <div className="mt-6 text-center px-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-green-800 font-medium">✅ 정보 수집이 완료되었습니다!</p>
              <p className="text-green-600 text-sm mt-1">이제 고소장을 생성할 수 있습니다.</p>
            </div>
            <Button
              onClick={generateComplaint}
              disabled={isGenerating}
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-full shadow-lg"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  고소장 생성 중...
                </>
              ) : (
                <>
                  <FileText className="h-5 w-5 mr-2" />
                  고소장 생성하기
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

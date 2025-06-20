"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Download, Loader2, FileText, X } from 'lucide-react'
import DragDropZone from "@/components/drag-drop-zone"

interface PdfUploadProps {
  userId: string
}

export default function PdfUpload({ userId }: PdfUploadProps) {
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [translating, setTranslating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [translatedText, setTranslatedText] = useState("")
  const [error, setError] = useState("")
  const [currentFileName, setCurrentFileName] = useState("")

  const handleFilesSelected = (selectedFiles: File[]) => {
    // PDF 번역은 한 번에 하나씩 처리
    const pdfFiles = selectedFiles.filter((file) => file.type === "application/pdf")
    if (pdfFiles.length > 0) {
      setFiles([pdfFiles[0]]) // 첫 번째 PDF만 선택
      setError("")
      setTranslatedText("")
    } else {
      setError("PDF 파일만 업로드 가능합니다.")
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
    setTranslatedText("")
  }

  const handleUploadAndTranslate = async () => {
    if (files.length === 0) return

    const file = files[0]
    setUploading(true)
    setTranslating(true)
    setProgress(0)
    setError("")
    setCurrentFileName(file.name)

    try {
      const formData = new FormData()
      formData.append("pdf", file)
      formData.append("userId", userId)

      const token = localStorage.getItem("token")
      const response = await fetch("/api/translate-pdf", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error("번역 요청에 실패했습니다.")
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let translatedContent = ""

      setUploading(false)
      setProgress(25)

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split("\n")

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6)
            if (data === "[DONE]") {
              setProgress(100)
              break
            }

            try {
              const parsed = JSON.parse(data)
              if (parsed.content) {
                translatedContent += parsed.content
                setTranslatedText(translatedContent)
              }
              if (parsed.progress) {
                setProgress(parsed.progress)
              } else {
                setProgress((prev) => Math.min(prev + 0.5, 95))
              }
            } catch (e) {
              // Ignore parsing errors
            }
          }
        }
      }
    } catch (error) {
      console.error("Translation error:", error)
      setError("번역 중 오류가 발생했습니다. 다시 시도해주세요.")
    } finally {
      setUploading(false)
      setTranslating(false)
    }
  }

  const downloadTranslation = () => {
    const blob = new Blob([translatedText], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${currentFileName.replace(".pdf", "")}_번역본.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">PDF 논문 업로드</h3>
            <p className="text-gray-600 mb-4">번역하고 싶은 PDF 논문을 드래그하거나 클릭하여 업로드하세요</p>
          </div>

          <DragDropZone
            onFilesSelected={handleFilesSelected}
            acceptedTypes={[".pdf"]}
            maxFileSize={50}
            multiple={false}
          >
            <div className="mt-4">
              <p className="text-sm text-blue-600 font-medium">
                ✨ 향상된 PDF 처리: 그래프, 이미지, 수식도 함께 분석합니다
              </p>
            </div>
          </DragDropZone>

          {files.length > 0 && (
            <div className="mt-4">
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-blue-50 rounded-lg p-3">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-red-500" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">{file.name}</p>
                      <p className="text-xs text-blue-600">
                        {(file.size / 1024 / 1024).toFixed(2)} MB • PDF 문서
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Translate Button */}
      {files.length > 0 && !translating && !translatedText && (
        <div className="text-center">
          <Button onClick={handleUploadAndTranslate} disabled={uploading} size="lg" className="px-8">
            {uploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            🚀 고급 번역 시작
          </Button>
          <p className="text-sm text-gray-500 mt-2">AI가 텍스트, 이미지, 그래프를 모두 분석합니다</p>
        </div>
      )}

      {/* Progress */}
      {(uploading || translating) && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {uploading ? "📄 PDF 분석 중..." : "🔄 AI 번역 진행 중..."}
              </span>
              <span className="text-sm text-gray-500">{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
            <div className="text-xs text-gray-500 space-y-1">
              <p>• 텍스트 추출 및 정제</p>
              <p>• 이미지 및 그래프 분석</p>
              <p>• 수식 및 기호 처리</p>
              <p>• 학술적 번역 수행</p>
            </div>
          </div>
        </Card>
      )}

      {/* Translation Result */}
      {translatedText && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">✅ 번역 완료</h3>
              <Button onClick={downloadTranslation} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                다운로드
              </Button>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <FileText className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">번역된 논문</span>
                <span className="text-xs text-gray-500">
                  ({translatedText.length.toLocaleString()} 글자)
                </span>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto p-4 bg-white rounded-lg border">
              <pre className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed">{translatedText}</pre>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

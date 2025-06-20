"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileText, Download, Loader2 } from "lucide-react"

interface PdfUploadProps {
  userId: string
}

export default function PdfUpload({ userId }: PdfUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [translating, setTranslating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [translatedText, setTranslatedText] = useState("")
  const [error, setError] = useState("")

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile)
      setError("")
      setTranslatedText("")
    } else {
      setError("PDF 파일만 업로드 가능합니다.")
    }
  }

  const handleUploadAndTranslate = async () => {
    if (!file) return

    setUploading(true)
    setTranslating(true)
    setProgress(0)
    setError("")

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
                setProgress((prev) => Math.min(prev + 1, 95))
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
    a.download = `${file?.name.replace(".pdf", "")}_번역본.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card className="p-6">
        <div className="text-center">
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">PDF 논문 업로드</h3>
          <p className="text-gray-600 mb-4">번역하고 싶은 PDF 논문을 업로드하세요</p>

          <input type="file" accept=".pdf" onChange={handleFileSelect} className="hidden" id="pdf-upload" />

          <label
            htmlFor="pdf-upload"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            <FileText className="w-4 h-4 mr-2" />
            PDF 파일 선택
          </label>

          {file && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                선택된 파일: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
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
      {file && !translating && !translatedText && (
        <div className="text-center">
          <Button onClick={handleUploadAndTranslate} disabled={uploading} size="lg" className="px-8">
            {uploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            번역 시작
          </Button>
        </div>
      )}

      {/* Progress */}
      {(uploading || translating) && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{uploading ? "PDF 업로드 중..." : "번역 진행 중..."}</span>
              <span className="text-sm text-gray-500">{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        </Card>
      )}

      {/* Translation Result */}
      {translatedText && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">번역 결과</h3>
              <Button onClick={downloadTranslation} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                다운로드
              </Button>
            </div>

            <div className="max-h-96 overflow-y-auto p-4 bg-gray-50 rounded-lg">
              <pre className="whitespace-pre-wrap text-sm text-gray-800">{translatedText}</pre>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

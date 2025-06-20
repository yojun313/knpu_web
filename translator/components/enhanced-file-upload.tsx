"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { X, FileText, ImageIcon, File, Loader2, Eye, Brain, Zap } from "lucide-react"
import DragDropZone from "@/components/drag-drop-zone"

interface EnhancedFileUploadProps {
  onUpload: (files: Array<{ name: string; type: string; content: string; analysis?: string }>) => void
  onClose: () => void
}

export default function EnhancedFileUpload({ onUpload, onClose }: EnhancedFileUploadProps) {
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [progress, setProgress] = useState(0)
  const [currentProcessing, setCurrentProcessing] = useState("")

  const handleFilesSelected = (selectedFiles: File[]) => {
    setFiles((prev) => [...prev, ...selectedFiles])
    setError("")
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const processFiles = async () => {
    setLoading(true)
    setError("")
    setProgress(0)

    try {
      const processedFiles = await Promise.all(
        files.map(async (file, index) => {
          const fileProgress = ((index + 1) / files.length) * 100
          setProgress(fileProgress)
          setCurrentProcessing(file.name)

          let content = ""
          let analysis = ""

          if (file.type.startsWith("image/")) {
            // 🔍 Vision API를 사용한 이미지 분석
            const base64 = await fileToBase64(file)
            analysis = await analyzeImageWithVision(base64, file.name)
            content = `[이미지 파일: ${file.name}]\n\n🔍 AI 비전 분석 결과:\n${analysis}`
          } else if (file.type === "application/pdf") {
            // 📄 향상된 PDF 텍스트 추출
            const extractedText = await extractPDFText(file)
            content = `[PDF 파일: ${file.name}]\n파일 크기: ${(file.size / 1024 / 1024).toFixed(2)}MB\n\n📄 추출된 텍스트:\n${extractedText}`
          } else if (file.type === "text/plain") {
            content = await file.text()
          } else {
            content = `[파일: ${file.name}]\n파일 타입: ${file.type}\n파일 크기: ${(file.size / 1024).toFixed(1)}KB`
          }

          return {
            name: file.name,
            type: file.type,
            content,
            analysis,
          }
        }),
      )

      onUpload(processedFiles)
      setFiles([])
      setProgress(100)
    } catch (error) {
      setError("파일 처리 중 오류가 발생했습니다.")
    } finally {
      setLoading(false)
      setCurrentProcessing("")
    }
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (error) => reject(error)
    })
  }

  const analyzeImageWithVision = async (base64Data: string, fileName: string): Promise<string> => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/vision-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          imageData: base64Data,
          prompt: `이 이미지를 자세히 분석해주세요:
          
1. 이미지에 텍스트가 있다면 모든 텍스트를 정확히 추출해주세요
2. 그래프, 차트, 표가 있다면 데이터와 내용을 설명해주세요  
3. 다이어그램이나 도식이 있다면 구조와 관계를 설명해주세요
4. 수식이나 공식이 있다면 LaTeX 형태로 표현해주세요
5. 전체적인 이미지의 맥락과 목적을 파악해주세요

파일명: ${fileName}`,
          model: "gpt-4o",
        }),
      })

      if (response.ok) {
        const result = await response.json()
        return result.analysis
      } else {
        return "이미지 분석 중 오류가 발생했습니다."
      }
    } catch (error) {
      console.error("Vision analysis error:", error)
      return "이미지 분석을 수행할 수 없습니다."
    }
  }

  const extractPDFText = async (file: File): Promise<string> => {
    try {
      const formData = new FormData()
      formData.append("pdf", file)

      const token = localStorage.getItem("token")
      const response = await fetch("/api/pdf-text-extract", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        return result.text
      } else {
        return "PDF 텍스트 추출 중 오류가 발생했습니다."
      }
    } catch (error) {
      console.error("PDF extraction error:", error)
      return "PDF 처리를 수행할 수 없습니다."
    }
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <ImageIcon className="w-4 h-4 text-blue-500" />
    if (type === "application/pdf") return <FileText className="w-4 h-4 text-red-500" />
    if (type === "text/plain") return <FileText className="w-4 h-4 text-gray-500" />
    return <File className="w-4 h-4 text-gray-400" />
  }

  const getProcessingIcon = (type: string) => {
    if (type.startsWith("image/")) return <Eye className="w-4 h-4 text-blue-500" />
    if (type === "application/pdf") return <Brain className="w-4 h-4 text-red-500" />
    return <Zap className="w-4 h-4 text-green-500" />
  }

  return (
    <Card className="absolute bottom-full left-0 right-0 mb-2 p-4 bg-white border shadow-lg z-10 max-w-2xl">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">🚀 향상된 파일 분석</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-3">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-3">
        <DragDropZone
          onFilesSelected={handleFilesSelected}
          acceptedTypes={["image/*", ".txt", ".pdf", ".docx"]}
          maxFileSize={50}
          multiple={true}
        >
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-center space-x-4 text-sm">
              <div className="flex items-center space-x-1 text-blue-600">
                <Eye className="w-4 h-4" />
                <span>Vision AI 분석</span>
              </div>
              <div className="flex items-center space-x-1 text-red-600">
                <Brain className="w-4 h-4" />
                <span>PDF 텍스트 추출</span>
              </div>
              <div className="flex items-center space-x-1 text-green-600">
                <Zap className="w-4 h-4" />
                <span>고급 처리</span>
              </div>
            </div>
          </div>
        </DragDropZone>

        {files.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">선택된 파일:</h4>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 rounded px-3 py-2">
                  <div className="flex items-center space-x-2">
                    {getFileIcon(file.type)}
                    <div>
                      <span className="text-sm font-medium">{file.name}</span>
                      <div className="text-xs text-gray-500">
                        {(file.size / 1024).toFixed(1)}KB •{" "}
                        {file.type.startsWith("image/")
                          ? "Vision AI 분석 예정"
                          : file.type === "application/pdf"
                            ? "텍스트 추출 예정"
                            : "기본 처리"}
                      </div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              {currentProcessing && getProcessingIcon(files.find((f) => f.name === currentProcessing)?.type || "")}
              <span className="text-sm font-medium">
                {currentProcessing ? `처리 중: ${currentProcessing}` : "파일 분석 중..."}
              </span>
            </div>
            <Progress value={progress} className="w-full" />
            <div className="text-xs text-gray-500 space-y-1">
              <p>• 이미지: OpenAI Vision API로 고해상도 분석</p>
              <p>• PDF: 향상된 텍스트 추출 및 구조 분석</p>
              <p>• 텍스트: 내용 분석 및 최적화</p>
            </div>
          </div>
        )}

        <div className="flex space-x-2">
          <Button onClick={processFiles} disabled={files.length === 0 || loading} className="flex-1">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                AI 분석 중...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4 mr-2" />
                고급 분석 시작
              </>
            )}
          </Button>
          <Button variant="outline" onClick={onClose} className="bg-white text-gray-700 hover:bg-gray-50">
            취소
          </Button>
        </div>
      </div>
    </Card>
  )
}

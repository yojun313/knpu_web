"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, X, FileText, ImageIcon, File } from "lucide-react"

interface FileUploadProps {
  onUpload: (files: Array<{ name: string; type: string; content: string }>) => void
  onClose: () => void
}

export default function FileUpload({ onUpload, onClose }: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    const validFiles = selectedFiles.filter((file) => {
      const isValidType =
        file.type.startsWith("image/") ||
        file.type === "text/plain" ||
        file.type === "application/pdf" ||
        file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      const isValidSize = file.size <= 10 * 1024 * 1024 // 10MB
      return isValidType && isValidSize
    })

    if (validFiles.length !== selectedFiles.length) {
      setError("일부 파일이 지원되지 않거나 크기가 너무 큽니다. (최대 10MB, 이미지/텍스트/PDF/DOCX만 지원)")
    } else {
      setError("")
    }

    setFiles((prev) => [...prev, ...validFiles])
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const processFiles = async () => {
    setLoading(true)
    setError("")

    try {
      const processedFiles = await Promise.all(
        files.map(async (file) => {
          let content = ""

          if (file.type.startsWith("image/")) {
            // For images, we'll just store the base64 data
            const base64 = await fileToBase64(file)
            content = `[이미지 파일: ${file.name}]\n데이터: ${base64}`
          } else if (file.type === "text/plain") {
            content = await file.text()
          } else if (file.type === "application/pdf") {
            // Simplified PDF processing - in production, use proper PDF parser
            content = `[PDF 파일: ${file.name}]\n파일 크기: ${file.size} bytes\n내용을 분석하려면 PDF 번역 기능을 사용해주세요.`
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

      onUpload(processedFiles)
      setFiles([])
    } catch (error) {
      setError("파일 처리 중 오류가 발생했습니다.")
    } finally {
      setLoading(false)
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

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <ImageIcon className="w-4 h-4" />
    if (type === "text/plain") return <FileText className="w-4 h-4" />
    return <File className="w-4 h-4" />
  }

  return (
    <Card className="absolute bottom-full left-0 right-0 mb-2 p-4 bg-white border shadow-lg z-10">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">파일 업로드</h3>
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
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
          <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-600 mb-2">이미지, 텍스트, PDF, DOCX 파일을 업로드하세요 (최대 10MB)</p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.txt,.pdf,.docx"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="bg-white text-gray-700 hover:bg-gray-50"
          >
            파일 선택
          </Button>
        </div>

        {files.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">선택된 파일:</h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 rounded px-3 py-2">
                  <div className="flex items-center space-x-2">
                    {getFileIcon(file.type)}
                    <span className="text-sm truncate">{file.name}</span>
                    <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(1)}KB)</span>
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

        <div className="flex space-x-2">
          <Button onClick={processFiles} disabled={files.length === 0 || loading} className="flex-1">
            {loading ? "처리 중..." : "업로드"}
          </Button>
          <Button variant="outline" onClick={onClose} className="bg-white text-gray-700 hover:bg-gray-50">
            취소
          </Button>
        </div>
      </div>
    </Card>
  )
}

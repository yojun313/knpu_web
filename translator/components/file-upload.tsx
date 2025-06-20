"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { X, FileText, ImageIcon, File, Loader2 } from "lucide-react"
import DragDropZone from "@/components/drag-drop-zone"

interface FileUploadProps {
  onUpload: (files: Array<{ name: string; type: string; content: string }>) => void
  onClose: () => void
}

export default function FileUpload({ onUpload, onClose }: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

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

    try {
      const processedFiles = await Promise.all(
        files.map(async (file) => {
          let content = ""

          if (file.type.startsWith("image/")) {
            // For images, we'll store the base64 data for Vision API
            const base64 = await fileToBase64(file)
            content = `[이미지 파일: ${file.name}]\n이미지를 분석해주세요.\n데이터: ${base64}`
          } else if (file.type === "text/plain") {
            content = await file.text()
          } else if (file.type === "application/pdf") {
            // Enhanced PDF processing
            content = await processPDFFile(file)
          } else {
            content = `[파일: ${file.name}]\n파일 타입: ${file.type}\n파일 크기: ${file.size} bytes\n\n파일 내용을 분석해주세요.`
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

  const processPDFFile = async (file: File): Promise<string> => {
    try {
      // Convert to base64 for better processing
      const base64 = await fileToBase64(file)
      return `[PDF 파일: ${file.name}]\n파일 크기: ${(file.size / 1024 / 1024).toFixed(2)}MB\n\nPDF 내용을 분석하고 텍스트를 추출해주세요. 그래프, 이미지, 수식이 포함되어 있다면 해당 내용도 설명해주세요.\n\n데이터: ${base64}`
    } catch (error) {
      return `[PDF 파일: ${file.name}]\n파일 처리 중 오류가 발생했습니다. 다시 시도해주세요.`
    }
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <ImageIcon className="w-4 h-4" />
    if (type === "application/pdf") return <FileText className="w-4 h-4 text-red-500" />
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
        <DragDropZone
          onFilesSelected={handleFilesSelected}
          acceptedTypes={["image/*", ".txt", ".pdf", ".docx"]}
          maxFileSize={25}
          multiple={true}
        />

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
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                처리 중...
              </>
            ) : (
              "업로드"
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

"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileText, ImageIcon, File } from "lucide-react"

interface DragDropZoneProps {
  onFilesSelected: (files: File[]) => void
  acceptedTypes?: string[]
  maxFileSize?: number // in MB
  multiple?: boolean
  className?: string
  children?: React.ReactNode
}

export default function DragDropZone({
  onFilesSelected,
  acceptedTypes = ["image/*", ".txt", ".pdf", ".docx"],
  maxFileSize = 10,
  multiple = true,
  className = "",
  children,
}: DragDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = useCallback(
    (file: File): boolean => {
      // Check file size
      if (file.size > maxFileSize * 1024 * 1024) {
        setError(`파일 크기가 ${maxFileSize}MB를 초과합니다: ${file.name}`)
        return false
      }

      // Check file type
      const isValidType = acceptedTypes.some((type) => {
        if (type.startsWith(".")) {
          return file.name.toLowerCase().endsWith(type.toLowerCase())
        }
        if (type.includes("*")) {
          const baseType = type.split("/")[0]
          return file.type.startsWith(baseType)
        }
        return file.type === type
      })

      if (!isValidType) {
        setError(`지원되지 않는 파일 형식입니다: ${file.name}`)
        return false
      }

      return true
    },
    [acceptedTypes, maxFileSize],
  )

  const handleFiles = useCallback(
    (files: FileList) => {
      setError("")
      const fileArray = Array.from(files)
      const validFiles = fileArray.filter(validateFile)

      if (validFiles.length > 0) {
        onFilesSelected(validFiles)
      }
    },
    [onFilesSelected, validateFile],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(false)

      const files = e.dataTransfer.files
      if (files.length > 0) {
        handleFiles(files)
      }
    },
    [handleFiles],
  )

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files) {
        handleFiles(files)
      }
      // Reset input value to allow selecting the same file again
      e.target.value = ""
    },
    [handleFiles],
  )

  const getFileIcon = (fileName: string) => {
    const extension = fileName.toLowerCase().split(".").pop()
    switch (extension) {
      case "pdf":
        return <FileText className="w-8 h-8 text-red-500" />
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
      case "webp":
        return <ImageIcon className="w-8 h-8 text-blue-500" />
      case "txt":
        return <FileText className="w-8 h-8 text-gray-500" />
      case "docx":
      case "doc":
        return <File className="w-8 h-8 text-blue-600" />
      default:
        return <File className="w-8 h-8 text-gray-400" />
    }
  }

  return (
    <div className={className}>
      <Card
        className={`border-2 border-dashed transition-all duration-200 cursor-pointer ${
          isDragOver ? "border-blue-400 bg-blue-50 scale-105" : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="p-8 text-center">
          <div className="mb-4">
            <Upload
              className={`w-12 h-12 mx-auto transition-colors ${isDragOver ? "text-blue-500" : "text-gray-400"}`}
            />
          </div>

          <div className="space-y-2">
            <p className="text-lg font-medium text-gray-700">
              {isDragOver ? "파일을 여기에 놓으세요" : "파일을 드래그하거나 클릭하여 업로드"}
            </p>
            <p className="text-sm text-gray-500">
              {acceptedTypes.includes("image/*") && "이미지, "}
              {acceptedTypes.includes(".pdf") && "PDF, "}
              {acceptedTypes.includes(".txt") && "텍스트, "}
              {acceptedTypes.includes(".docx") && "Word "}
              파일 지원 (최대 {maxFileSize}MB)
            </p>
          </div>

          {children}
        </div>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={acceptedTypes.join(",")}
        onChange={handleFileInputChange}
        className="hidden"
      />

      {error && (
        <Alert variant="destructive" className="mt-3">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}

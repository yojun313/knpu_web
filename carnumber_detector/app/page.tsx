"use client"

import type React from "react"

import { useState } from "react"
import { Upload, ImagePlus, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

export default function Home() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [plateText, setPlateText] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = (file: File) => {
    // Reset previous results
    setError(null)
    setPlateText(null)

    // Check if file is an image
    if (!file.type.match("image.*")) {
      setError("이미지 파일만 업로드 가능합니다.")
      return
    }

    setFile(file)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async () => {
    if (!file) return

    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("image", file)

      // 내부 API 엔드포인트로 요청 변경
      const response = await fetch("/api/extract-plate", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`서버 오류: ${response.status}`)
      }

      const data = await response.json()
      setPlateText(data.plate_text)
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">차량 번호판 인식 시스템</h1>
          <p className="text-gray-600">이미지를 업로드하여 차량 번호판을 인식해보세요</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>이미지 업로드</CardTitle>
            <CardDescription>차량 번호판이 포함된 이미지를 드래그하거나 선택하세요</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors",
                dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400",
                preview ? "p-4" : "p-12",
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById("file-upload")?.click()}
            >
              <input id="file-upload" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />

              {preview ? (
                <div className="space-y-4">
                  <div className="relative max-h-[300px] overflow-hidden rounded-md">
                    <img
                      src={preview || "/placeholder.svg"}
                      alt="업로드된 이미지"
                      className="mx-auto max-h-[300px] object-contain"
                    />
                  </div>
                  <p className="text-sm text-gray-500">
                    {file?.name} ({Math.round(file?.size / 1024)} KB)
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                    <ImagePlus className="h-6 w-6 text-gray-500" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-900">
                      이미지를 이곳에 드래그하거나 클릭하여 업로드하세요
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF 파일 지원 (최대 10MB)</p>
                  </div>
                </div>
              )}
            </div>

            {preview && (
              <div className="mt-4">
                <Button onClick={handleSubmit} disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      번호판 인식 중...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      번호판 인식하기
                    </>
                  )}
                </Button>
              </div>
            )}

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>오류</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {plateText && (
              <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-green-800 mb-2">인식 결과</h3>
                <div className="bg-white border border-green-300 rounded-md p-6 text-center">
                  <p className="text-3xl font-bold tracking-wider text-gray-900">{plateText}</p>
                </div>
                <p className="mt-2 text-sm text-green-700">성공적으로 번호판을 인식했습니다.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Download, Save, FileText, Eye, Edit3 } from "lucide-react"
import { useRouter } from "next/navigation"
import { Document, Packer, Paragraph, TextRun, AlignmentType } from "docx"
import jsPDF from "jspdf"

export default function EditComplaint() {
  const [complaint, setComplaint] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isPreview, setIsPreview] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // 페이지 제목 설정
    document.title = "AI 고소장 생성기 - 편집"

    const savedComplaint = localStorage.getItem("generatedComplaint")
    if (savedComplaint) {
      setComplaint(savedComplaint)
    } else {
      router.push("/")
    }
    setIsLoading(false)
  }, [router])

  const saveComplaint = () => {
    localStorage.setItem("editedComplaint", complaint)
    alert("고소장이 저장되었습니다.")
  }

  const downloadAsDocx = async () => {
    const lines = complaint.split("\n").filter((line) => line.trim() !== "")

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: lines.map((line, index) => {
            // 제목 처리
            if (line.includes("고 소 장")) {
              return new Paragraph({
                children: [new TextRun({ text: line, bold: true, size: 32 })],
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 },
              })
            }

            // 섹션 제목 처리 (1., 2., 3. 등)
            if (/^\d+\.\s/.test(line)) {
              return new Paragraph({
                children: [new TextRun({ text: line, bold: true, size: 24 })],
                spacing: { before: 300, after: 200 },
              })
            }

            // 일반 텍스트
            return new Paragraph({
              children: [new TextRun({ text: line, size: 22 })],
              spacing: { after: 100 },
            })
          }),
        },
      ],
    })

    const blob = await Packer.toBlob(doc)
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "고소장.docx"
    link.click()
    URL.revokeObjectURL(url)
  }

  const downloadAsPdf = () => {
    const pdf = new jsPDF("p", "mm", "a4")

    // 한글 폰트 설정을 위한 기본 설정
    pdf.setFont("helvetica")

    const lines = complaint.split("\n")
    let yPosition = 20
    const lineHeight = 7
    const pageHeight = 280

    lines.forEach((line) => {
      if (yPosition > pageHeight) {
        pdf.addPage()
        yPosition = 20
      }

      if (line.includes("고 소 장")) {
        pdf.setFontSize(20)
        pdf.setFont("helvetica", "bold")
        pdf.text(line, 105, yPosition, { align: "center" })
        yPosition += lineHeight * 2
      } else if (/^\d+\.\s/.test(line)) {
        pdf.setFontSize(14)
        pdf.setFont("helvetica", "bold")
        pdf.text(line, 20, yPosition)
        yPosition += lineHeight * 1.5
      } else if (line.trim() !== "") {
        pdf.setFontSize(11)
        pdf.setFont("helvetica", "normal")

        // 긴 텍스트를 여러 줄로 분할
        const splitText = pdf.splitTextToSize(line, 170)
        pdf.text(splitText, 20, yPosition)
        yPosition += lineHeight * splitText.length
      } else {
        yPosition += lineHeight / 2
      }
    })

    pdf.save("고소장.pdf")
  }

  const downloadAsTxt = () => {
    const element = document.createElement("a")
    const file = new Blob([complaint], { type: "text/plain;charset=utf-8" })
    element.href = URL.createObjectURL(file)
    element.download = "고소장.txt"
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const formatComplaintForDisplay = (text: string) => {
    return text.split("\n").map((line, index) => {
      if (line.includes("고 소 장")) {
        return (
          <div key={index} className="text-2xl font-bold text-center mb-8">
            {line}
          </div>
        )
      }
      if (/^\d+\.\s/.test(line)) {
        return (
          <div key={index} className="font-bold text-lg mt-6 mb-3 text-primary">
            {line}
          </div>
        )
      }
      if (line.trim() === "") {
        return <div key={index} className="h-2"></div>
      }
      return (
        <div key={index} className="mb-2 leading-relaxed">
          {line}
        </div>
      )
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.push("/")} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              돌아가기
            </Button>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              AI 고소장 생성기 - 편집
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={isPreview ? "default" : "outline"}
              size="sm"
              onClick={() => setIsPreview(true)}
              className="flex items-center gap-1"
            >
              <Eye className="h-4 w-4" />
              미리보기
            </Button>
            <Button
              variant={!isPreview ? "default" : "outline"}
              size="sm"
              onClick={() => setIsPreview(false)}
              className="flex items-center gap-1"
            >
              <Edit3 className="h-4 w-4" />
              편집
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-6">
        <Card className="shadow-lg">
          <CardHeader className="bg-primary text-primary-foreground">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {isPreview ? "고소장 미리보기" : "고소장 편집"}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={saveComplaint}
                  className="bg-background text-foreground hover:bg-muted"
                >
                  <Save className="h-4 w-4 mr-1" />
                  저장
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={downloadAsTxt}
                  className="bg-background text-foreground hover:bg-muted"
                >
                  <Download className="h-4 w-4 mr-1" />
                  TXT
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={downloadAsDocx}
                  className="bg-background text-foreground hover:bg-muted"
                >
                  <Download className="h-4 w-4 mr-1" />
                  DOCX
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={downloadAsPdf}
                  className="bg-background text-foreground hover:bg-muted"
                >
                  <Download className="h-4 w-4 mr-1" />
                  PDF
                </Button>
              </div>
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            {isPreview ? (
              <div className="p-8 bg-background min-h-[700px]" style={{ fontFamily: "맑은고딕, Arial, sans-serif" }}>
                <div className="max-w-4xl mx-auto bg-card shadow-sm border p-8">
                  {formatComplaintForDisplay(complaint)}
                </div>
              </div>
            ) : (
              <div className="p-6">
                <Textarea
                  value={complaint}
                  onChange={(e) => setComplaint(e.target.value)}
                  className="min-h-[700px] font-mono text-sm leading-relaxed border-0 focus:ring-0 resize-none"
                  placeholder="고소장 내용이 여기에 표시됩니다..."
                />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 max-w-2xl mx-auto">
            <p className="text-foreground text-sm">
              💡 <strong>안내:</strong> 생성된 고소장은 참고용이며, 실제 제출 전에 법무 전문가의 검토를 받으시기
              바랍니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

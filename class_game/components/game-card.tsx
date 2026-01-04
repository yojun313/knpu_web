"use client"

import { Download, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import type { Game } from "@/types/game"

interface GameCardProps {
  game: Game
}

export function GameCard({ game }: GameCardProps) {
  const handleDownload = async () => {
    try {
      const response = await fetch(`/api/download/${game.id}`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = game.filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("[v0] Failed to download game:", error)
      alert("게임 다운로드에 실패했습니다.")
    }
  }

  return (
    <Card className="overflow-hidden hover:border-primary/50 transition-colors">
      <div className="aspect-video bg-muted/50 flex items-center justify-center">
        <img
          src={game.thumbnail || "/placeholder.svg?height=200&width=400&query=game"}
          alt={game.title}
          className="w-full h-full object-cover"
        />
      </div>
      <CardHeader>
        <CardTitle className="text-balance">{game.title}</CardTitle>
        <CardDescription className="flex items-center gap-2">
          <User className="w-4 h-4" />
          {game.author}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-3 text-pretty">{game.description}</p>
      </CardContent>
      <CardFooter>
        <Button onClick={handleDownload} className="w-full gap-2">
          <Download className="w-4 h-4" />
          다운로드
        </Button>
      </CardFooter>
    </Card>
  )
}

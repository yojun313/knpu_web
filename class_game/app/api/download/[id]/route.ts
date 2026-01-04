import { type NextRequest, NextResponse } from "next/server"
import { readFile } from "fs/promises"
import { join } from "path"
import type { Game } from "@/types/game"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const gamesDataPath = join(process.cwd(), "games", "games.json")
    const fileContent = await readFile(gamesDataPath, "utf-8")
    const games: Game[] = JSON.parse(fileContent)

    const game = games.find((g) => g.id === id)

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 })
    }

    const gamePath = join(process.cwd(), "games", "files", game.filename)
    const gameFile = await readFile(gamePath)

    return new NextResponse(gameFile, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${game.filename}"`,
      },
    })
  } catch (error) {
    console.error("Error downloading game:", error)
    return NextResponse.json({ error: "Failed to download game" }, { status: 500 })
  }
}

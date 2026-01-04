import { NextResponse } from "next/server"
import { readFile } from "fs/promises"
import { join } from "path"
import type { Game } from "@/types/game"

export async function GET() {
  try {
    const gamesDataPath = join(process.cwd(), "games", "games.json")
    const fileContent = await readFile(gamesDataPath, "utf-8")
    const games: Game[] = JSON.parse(fileContent)

    return NextResponse.json(games)
  } catch (error) {
    console.error("[v0] Error reading games:", error)
    return NextResponse.json([], { status: 200 })
  }
}

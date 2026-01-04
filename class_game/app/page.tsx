import { GameList } from "@/components/game-list"
import { Header } from "@/components/header"

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <GameList />
    </main>
  )
}

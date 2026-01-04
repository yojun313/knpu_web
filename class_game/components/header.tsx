import { Gamepad2 } from "lucide-react"

export function Header() {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
            <Gamepad2 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-balance">게임 다운로드 센터</h1>
            <p className="text-sm text-muted-foreground">무료 게임을 다운로드하세요</p>
          </div>
        </div>
      </div>
    </header>
  )
}

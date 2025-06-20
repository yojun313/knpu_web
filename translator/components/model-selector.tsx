"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Zap, Clock, DollarSign, Sparkles } from "lucide-react"

interface ModelSelectorProps {
  selectedModel: string
  onModelChange: (model: string) => void
  className?: string
}

const models = [
  {
    id: "gpt-4o",
    name: "GPT-4o",
    description: "최신 모델, 가장 강력한 성능",
    icon: <Sparkles className="w-4 h-4" />,
    badge: "최신",
    badgeColor: "bg-purple-100 text-purple-800",
    color: "bg-purple-50 border-purple-200 hover:bg-purple-100",
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    description: "빠르고 경제적인 선택",
    icon: <Zap className="w-4 h-4" />,
    badge: "빠름",
    badgeColor: "bg-green-100 text-green-800",
    color: "bg-green-50 border-green-200 hover:bg-green-100",
  },
  {
    id: "gpt-4-turbo",
    name: "GPT-4 Turbo",
    description: "고성능 처리",
    icon: <Clock className="w-4 h-4" />,
    badge: "고성능",
    badgeColor: "bg-blue-100 text-blue-800",
    color: "bg-blue-50 border-blue-200 hover:bg-blue-100",
  },
  {
    id: "gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
    description: "경제적인 옵션",
    icon: <DollarSign className="w-4 h-4" />,
    badge: "경제적",
    badgeColor: "bg-orange-100 text-orange-800",
    color: "bg-orange-50 border-orange-200 hover:bg-orange-100",
  },
]

export default function ModelSelector({ selectedModel, onModelChange, className }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const selectedModelInfo = models.find((model) => model.id === selectedModel)

  return (
    <div className={`relative ${className}`}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white text-gray-700 hover:bg-gray-50 border-gray-300"
      >
        {selectedModelInfo?.icon}
        <span className="ml-2">{selectedModelInfo?.name}</span>
        <Badge className={`ml-2 ${selectedModelInfo?.badgeColor}`}>{selectedModelInfo?.badge}</Badge>
      </Button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <Card className="absolute top-full left-0 mt-2 p-2 bg-white border shadow-lg z-20 min-w-80">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-700 px-2 py-1">AI 모델 선택</h3>
              {models.map((model) => (
                <Button
                  key={model.id}
                  variant="ghost"
                  onClick={() => {
                    onModelChange(model.id)
                    setIsOpen(false)
                  }}
                  className={`w-full justify-start p-3 h-auto ${
                    selectedModel === model.id
                      ? `${model.color} border-2`
                      : "hover:bg-gray-50 border border-transparent"
                  }`}
                >
                  <div className="flex items-start space-x-3 w-full">
                    <div className="flex-shrink-0 mt-0.5">{model.icon}</div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-sm">{model.name}</span>
                        <Badge className={`text-xs ${model.badgeColor}`}>{model.badge}</Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{model.description}</p>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  )
}

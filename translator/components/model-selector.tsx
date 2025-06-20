"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Zap, Clock, DollarSign, Sparkles, Brain, Rocket, Cpu, Target, Crown, CloudLightningIcon as Lightning, Atom } from 'lucide-react'

interface ModelSelectorProps {
  selectedModel: string
  onModelChange: (model: string) => void
  className?: string
}

const modelCategories = [
  {
    category: "GPT-4.1 계열 (최신)",
    models: [
      {
        id: "gpt-4.1",
        name: "GPT-4.1",
        description: "고성능 범용 모델, 복잡한 작업에 탁월",
        icon: <Crown className="w-4 h-4" />,
        badge: "최고성능",
        badgeColor: "bg-purple-100 text-purple-800",
        color: "bg-purple-50 border-purple-200 hover:bg-purple-100",
      },
      {
        id: "gpt-4.1-mini",
        name: "GPT-4.1 Mini",
        description: "빠른 응답과 낮은 비용, 높은 지능 유지",
        icon: <Lightning className="w-4 h-4" />,
        badge: "균형",
        badgeColor: "bg-blue-100 text-blue-800",
        color: "bg-blue-50 border-blue-200 hover:bg-blue-100",
      },
      {
        id: "gpt-4.1-nano",
        name: "GPT-4.1 Nano",
        description: "초경량 모델, 분류/자동완성 등 경량 작업",
        icon: <Atom className="w-4 h-4" />,
        badge: "초경량",
        badgeColor: "bg-green-100 text-green-800",
        color: "bg-green-50 border-green-200 hover:bg-green-100",
      },
    ],
  },
  {
    category: "GPT-4o 계열 (멀티모달)",
    models: [
      {
        id: "gpt-4o",
        name: "GPT-4o",
        description: "빠르고 유연한 플래그십, 멀티모달 지원",
        icon: <Sparkles className="w-4 h-4" />,
        badge: "멀티모달",
        badgeColor: "bg-indigo-100 text-indigo-800",
        color: "bg-indigo-50 border-indigo-200 hover:bg-indigo-100",
      },
      {
        id: "gpt-4o-mini",
        name: "GPT-4o Mini",
        description: "비용/속도 최적화된 소형 모델",
        icon: <Zap className="w-4 h-4" />,
        badge: "빠름",
        badgeColor: "bg-green-100 text-green-800",
        color: "bg-green-50 border-green-200 hover:bg-green-100",
      },
    ],
  },
  {
    category: "GPT-4.5 계열 (미리보기)",
    models: [
      {
        id: "gpt-4.5-preview",
        name: "GPT-4.5 Preview",
        description: "2025년 2월 공개된 최신 미리보기 모델",
        icon: <Rocket className="w-4 h-4" />,
        badge: "미리보기",
        badgeColor: "bg-pink-100 text-pink-800",
        color: "bg-pink-50 border-pink-200 hover:bg-pink-100",
      },
    ],
  },
  {
    category: "o-시리즈 (추론 특화)",
    models: [
      {
        id: "o3",
        name: "o3",
        description: "복잡한 추론, 멀티스텝 작업에 강점",
        icon: <Brain className="w-4 h-4" />,
        badge: "추론",
        badgeColor: "bg-violet-100 text-violet-800",
        color: "bg-violet-50 border-violet-200 hover:bg-violet-100",
      },
      {
        id: "o3-pro",
        name: "o3 Pro",
        description: "최고 수준의 추론 능력",
        icon: <Target className="w-4 h-4" />,
        badge: "프로",
        badgeColor: "bg-red-100 text-red-800",
        color: "bg-red-50 border-red-200 hover:bg-red-100",
      },
      {
        id: "o3-mini",
        name: "o3 Mini",
        description: "경량화된 추론 모델",
        icon: <Cpu className="w-4 h-4" />,
        badge: "경량",
        badgeColor: "bg-teal-100 text-teal-800",
        color: "bg-teal-50 border-teal-200 hover:bg-teal-100",
      },
      {
        id: "o4-mini",
        name: "o4 Mini",
        description: "빠르고 저렴한 추론 특화 모델",
        icon: <Lightning className="w-4 h-4" />,
        badge: "고속",
        badgeColor: "bg-yellow-100 text-yellow-800",
        color: "bg-yellow-50 border-yellow-200 hover:bg-yellow-100",
      },
      {
        id: "o1",
        name: "o1",
        description: "이전 세대 추론 모델, 비용 효율적",
        icon: <Clock className="w-4 h-4" />,
        badge: "안정",
        badgeColor: "bg-gray-100 text-gray-800",
        color: "bg-gray-50 border-gray-200 hover:bg-gray-100",
      },
      {
        id: "o1-pro",
        name: "o1 Pro",
        description: "o1의 고성능 버전",
        icon: <Target className="w-4 h-4" />,
        badge: "프로",
        badgeColor: "bg-slate-100 text-slate-800",
        color: "bg-slate-50 border-slate-200 hover:bg-slate-100",
      },
      {
        id: "o1-mini",
        name: "o1 Mini",
        description: "o1의 경량 버전",
        icon: <DollarSign className="w-4 h-4" />,
        badge: "경제적",
        badgeColor: "bg-orange-100 text-orange-800",
        color: "bg-orange-50 border-orange-200 hover:bg-orange-100",
      },
    ],
  },
  {
    category: "기존 모델",
    models: [
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
    ],
  },
]

export default function ModelSelector({ selectedModel, onModelChange, className }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const selectedModelInfo = modelCategories
    .flatMap((category) => category.models)
    .find((model) => model.id === selectedModel)

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
          <Card className="absolute top-full left-0 mt-2 p-3 bg-white border shadow-lg z-20 min-w-96 max-h-96 overflow-y-auto">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 px-2 py-1">AI 모델 선택</h3>
              
              {modelCategories.map((category, categoryIndex) => (
                <div key={category.category}>
                  <h4 className="text-xs font-medium text-gray-500 px-2 py-1 uppercase tracking-wide">
                    {category.category}
                  </h4>
                  <div className="space-y-1">
                    {category.models.map((model) => (
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
                  {categoryIndex < modelCategories.length - 1 && <Separator className="my-2" />}
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  )
}

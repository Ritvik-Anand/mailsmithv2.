'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LeadSearchPreset, LeadSearchFilters } from '@/types'
import { SEARCH_PRESETS } from '@/lib/lead-finder/constants'
import { cn } from '@/lib/utils'
import {
    Sparkles,
    Rocket,
    Lightbulb,
    Megaphone,
    Briefcase,
    Globe,
    ShoppingCart,
    Building2,
    Users,
    ChevronRight
} from 'lucide-react'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    '🚀': Rocket,
    '💡': Lightbulb,
    '📢': Megaphone,
    '💼': Briefcase,
    '🇬🇧': Globe,
    '🛒': ShoppingCart,
    '🏦': Building2,
    '👥': Users,
}

interface SearchPresetsProps {
    onSelectPreset: (filters: LeadSearchFilters) => void
    selectedPresetId?: string
}

export function SearchPresets({ onSelectPreset, selectedPresetId }: SearchPresetsProps) {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Quick Start Templates</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {SEARCH_PRESETS.map((preset) => {
                    const Icon = preset.icon ? iconMap[preset.icon] : Sparkles
                    const isSelected = selectedPresetId === preset.id

                    return (
                        <Card
                            key={preset.id}
                            className={cn(
                                'cursor-pointer transition-all hover:shadow-md hover:border-primary/50',
                                isSelected && 'border-primary bg-primary/5'
                            )}
                            onClick={() => onSelectPreset(preset.filters)}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                    <div className={cn(
                                        'p-2 rounded-lg',
                                        isSelected
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted'
                                    )}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-sm truncate">
                                            {preset.name}
                                        </h4>
                                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                            {preset.description}
                                        </p>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}

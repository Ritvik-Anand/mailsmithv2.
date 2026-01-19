'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    LeadSearchFilters,
    SeniorityLevel,
    FunctionalLevel,
    CompanySize,
    FundingStage,
    EmailQuality
} from '@/types'
import {
    SENIORITY_LEVELS,
    FUNCTIONAL_LEVELS,
    COMPANY_SIZES,
    FUNDING_STAGES,
    REVENUE_RANGES,
    EMAIL_QUALITY_OPTIONS,
    POPULAR_INDUSTRIES,
    DEFAULT_FETCH_COUNT,
    MAX_FETCH_COUNT,
    COST_PER_1000_LEADS,
} from '@/lib/lead-finder/constants'
import { cn } from '@/lib/utils'
import {
    Users,
    MapPin,
    Building2,
    Mail,
    X,
    Plus,
    Info,
    DollarSign,
    TrendingUp,
    Target,
    Filter,
    Briefcase,
} from 'lucide-react'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'

interface SearchFiltersFormProps {
    filters: LeadSearchFilters
    onChange: (filters: LeadSearchFilters) => void
}

// Multi-select tag input component
function TagInput({
    value = [],
    onChange,
    placeholder,
    suggestions = [],
}: {
    value: string[]
    onChange: (value: string[]) => void
    placeholder?: string
    suggestions?: string[]
}) {
    const [input, setInput] = useState('')
    const [showSuggestions, setShowSuggestions] = useState(false)

    const addTag = (tag: string) => {
        const trimmed = tag.trim()
        if (trimmed && !value.includes(trimmed)) {
            onChange([...value, trimmed])
        }
        setInput('')
        setShowSuggestions(false)
    }

    const removeTag = (tag: string) => {
        onChange(value.filter(t => t !== tag))
    }

    const filteredSuggestions = suggestions.filter(
        s => s.toLowerCase().includes(input.toLowerCase()) && !value.includes(s)
    ).slice(0, 5)

    return (
        <div className="space-y-2">
            <div className="flex flex-wrap gap-2 min-h-[32px]">
                {value.map(tag => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-1 hover:text-destructive"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </Badge>
                ))}
            </div>
            <div className="relative">
                <Input
                    value={input}
                    onChange={(e) => {
                        setInput(e.target.value)
                        setShowSuggestions(true)
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault()
                            addTag(input)
                        }
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder={placeholder}
                    className="pr-10"
                />
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                    onClick={() => addTag(input)}
                    disabled={!input.trim()}
                >
                    <Plus className="h-4 w-4" />
                </Button>
                {showSuggestions && filteredSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-lg">
                        {filteredSuggestions.map(suggestion => (
                            <button
                                key={suggestion}
                                type="button"
                                className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                                onClick={() => addTag(suggestion)}
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

// Multi-checkbox component
function MultiSelect({
    options,
    value = [],
    onChange,
    columns = 2,
}: {
    options: { value: string; label: string }[]
    value: string[]
    onChange: (value: string[]) => void
    columns?: number
}) {
    const toggle = (val: string) => {
        if (value.includes(val)) {
            onChange(value.filter(v => v !== val))
        } else {
            onChange([...value, val])
        }
    }

    return (
        <div className={cn(
            'grid gap-2',
            columns === 2 && 'grid-cols-2',
            columns === 3 && 'grid-cols-3',
            columns === 4 && 'grid-cols-4'
        )}>
            {options.map(opt => (
                <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggle(opt.value)}
                    className={cn(
                        'px-3 py-2 text-xs rounded-md border text-left transition-colors',
                        value.includes(opt.value)
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background hover:bg-accent border-input'
                    )}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    )
}

export function SearchFiltersForm({ filters, onChange }: SearchFiltersFormProps) {
    const updateFilter = <K extends keyof LeadSearchFilters>(
        key: K,
        value: LeadSearchFilters[K]
    ) => {
        onChange({ ...filters, [key]: value })
    }

    // Calculate estimated cost
    const estimatedCost = ((filters.fetch_count || DEFAULT_FETCH_COUNT) / 1000) * COST_PER_1000_LEADS

    return (
        <TooltipProvider>
            <div className="space-y-6">
                <Tabs defaultValue="people" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="people" className="gap-2">
                            <Users className="h-4 w-4" />
                            <span className="hidden sm:inline">People</span>
                        </TabsTrigger>
                        <TabsTrigger value="location" className="gap-2">
                            <MapPin className="h-4 w-4" />
                            <span className="hidden sm:inline">Location</span>
                        </TabsTrigger>
                        <TabsTrigger value="company" className="gap-2">
                            <Building2 className="h-4 w-4" />
                            <span className="hidden sm:inline">Company</span>
                        </TabsTrigger>
                        <TabsTrigger value="settings" className="gap-2">
                            <Filter className="h-4 w-4" />
                            <span className="hidden sm:inline">Settings</span>
                        </TabsTrigger>
                    </TabsList>

                    {/* PEOPLE TAB */}
                    <TabsContent value="people" className="space-y-6 pt-4">
                        <div className="space-y-4">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Label>Job Titles</Label>
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <Info className="h-4 w-4 text-muted-foreground" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            Enter specific job titles to search for
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                                <TagInput
                                    value={filters.contact_job_title || []}
                                    onChange={(v) => updateFilter('contact_job_title', v)}
                                    placeholder="e.g., Marketing Manager, CTO, VP Sales"
                                    suggestions={['CEO', 'CTO', 'CFO', 'CMO', 'VP Marketing', 'VP Sales', 'Head of Engineering', 'Product Manager', 'Director']}
                                />
                            </div>

                            <Separator />

                            <div>
                                <Label className="mb-3 block">Seniority Level</Label>
                                <MultiSelect
                                    options={SENIORITY_LEVELS}
                                    value={filters.seniority_level || []}
                                    onChange={(v) => updateFilter('seniority_level', v as SeniorityLevel[])}
                                    columns={2}
                                />
                            </div>

                            <Separator />

                            <div>
                                <Label className="mb-3 block">Department / Function</Label>
                                <MultiSelect
                                    options={FUNCTIONAL_LEVELS}
                                    value={filters.functional_level || []}
                                    onChange={(v) => updateFilter('functional_level', v as FunctionalLevel[])}
                                    columns={2}
                                />
                            </div>

                            <Separator />

                            <div>
                                <Label className="mb-2 block">Exclude Job Titles</Label>
                                <TagInput
                                    value={filters.contact_not_job_title || []}
                                    onChange={(v) => updateFilter('contact_not_job_title', v)}
                                    placeholder="Titles to exclude"
                                />
                            </div>
                        </div>
                    </TabsContent>

                    {/* LOCATION TAB */}
                    <TabsContent value="location" className="space-y-6 pt-4">
                        <div className="p-3 bg-muted/50 rounded-lg">
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                                <Info className="h-4 w-4" />
                                Use either Region/Country OR Cities, not both for best results.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <Label className="mb-2 block">Region / Country / State</Label>
                                <TagInput
                                    value={filters.contact_location || []}
                                    onChange={(v) => updateFilter('contact_location', v)}
                                    placeholder="e.g., United States, EMEA, California"
                                    suggestions={['United States', 'United Kingdom', 'Germany', 'France', 'Canada', 'Australia', 'EMEA', 'APAC', 'California', 'New York', 'Texas']}
                                />
                            </div>

                            <div>
                                <Label className="mb-2 block">Cities (for city-level targeting)</Label>
                                <TagInput
                                    value={filters.contact_city || []}
                                    onChange={(v) => updateFilter('contact_city', v)}
                                    placeholder="e.g., San Francisco, London, Berlin"
                                    suggestions={['San Francisco', 'New York', 'Los Angeles', 'London', 'Berlin', 'Paris', 'Toronto', 'Sydney', 'Singapore']}
                                />
                            </div>

                            <Separator />

                            <div>
                                <Label className="mb-2 block">Exclude Regions</Label>
                                <TagInput
                                    value={filters.contact_not_location || []}
                                    onChange={(v) => updateFilter('contact_not_location', v)}
                                    placeholder="Regions to exclude"
                                />
                            </div>

                            <div>
                                <Label className="mb-2 block">Exclude Cities</Label>
                                <TagInput
                                    value={filters.contact_not_city || []}
                                    onChange={(v) => updateFilter('contact_not_city', v)}
                                    placeholder="Cities to exclude"
                                />
                            </div>
                        </div>
                    </TabsContent>

                    {/* COMPANY TAB */}
                    <TabsContent value="company" className="space-y-6 pt-4">
                        <div className="space-y-4">
                            <div>
                                <Label className="mb-2 block">Industries</Label>
                                <TagInput
                                    value={filters.company_industry || []}
                                    onChange={(v) => updateFilter('company_industry', v)}
                                    placeholder="e.g., SaaS, E-commerce, Healthcare"
                                    suggestions={POPULAR_INDUSTRIES}
                                />
                            </div>

                            <Separator />

                            <div>
                                <Label className="mb-3 block">Company Size (Employees)</Label>
                                <MultiSelect
                                    options={COMPANY_SIZES}
                                    value={filters.size || []}
                                    onChange={(v) => updateFilter('size', v as CompanySize[])}
                                    columns={3}
                                />
                            </div>

                            <Separator />

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="mb-2 block">Min Revenue</Label>
                                    <Select
                                        value={filters.min_revenue || 'any'}
                                        onValueChange={(v) => updateFilter('min_revenue', v === 'any' ? undefined : v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Any" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="any">Any</SelectItem>
                                            {REVENUE_RANGES.map(r => (
                                                <SelectItem key={r.value} value={r.value}>
                                                    {r.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="mb-2 block">Max Revenue</Label>
                                    <Select
                                        value={filters.max_revenue || 'any'}
                                        onValueChange={(v) => updateFilter('max_revenue', v === 'any' ? undefined : v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Any" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="any">Any</SelectItem>
                                            {REVENUE_RANGES.map(r => (
                                                <SelectItem key={r.value} value={r.value}>
                                                    {r.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <Separator />

                            <div>
                                <Label className="mb-3 block">Funding Stage</Label>
                                <MultiSelect
                                    options={FUNDING_STAGES}
                                    value={filters.funding || []}
                                    onChange={(v) => updateFilter('funding', v as FundingStage[])}
                                    columns={3}
                                />
                            </div>

                            <Separator />

                            <div>
                                <Label className="mb-2 block">Keywords (in company description)</Label>
                                <TagInput
                                    value={filters.company_keywords || []}
                                    onChange={(v) => updateFilter('company_keywords', v)}
                                    placeholder="Keywords to include"
                                />
                            </div>

                            <div>
                                <Label className="mb-2 block">Exclude Industries</Label>
                                <TagInput
                                    value={filters.company_not_industry || []}
                                    onChange={(v) => updateFilter('company_not_industry', v)}
                                    placeholder="Industries to exclude"
                                />
                            </div>

                            <div>
                                <Label className="mb-2 block">Specific Company Domains</Label>
                                <TagInput
                                    value={filters.company_domain || []}
                                    onChange={(v) => updateFilter('company_domain', v)}
                                    placeholder="e.g., google.com, microsoft.com"
                                />
                            </div>
                        </div>
                    </TabsContent>

                    {/* SETTINGS TAB */}
                    <TabsContent value="settings" className="space-y-6 pt-4">
                        <div className="space-y-4">
                            <div>
                                <Label className="mb-3 block">Email Quality</Label>
                                <div className="space-y-2">
                                    {EMAIL_QUALITY_OPTIONS.map(opt => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => {
                                                const current = filters.email_status || ['validated']
                                                if (current.includes(opt.value)) {
                                                    updateFilter('email_status', current.filter(v => v !== opt.value) as EmailQuality[])
                                                } else {
                                                    updateFilter('email_status', [...current, opt.value] as EmailQuality[])
                                                }
                                            }}
                                            className={cn(
                                                'w-full p-3 rounded-lg border text-left transition-colors',
                                                (filters.email_status || ['validated']).includes(opt.value)
                                                    ? 'bg-primary text-primary-foreground border-primary'
                                                    : 'bg-background hover:bg-accent border-input'
                                            )}
                                        >
                                            <div className="font-medium text-sm">{opt.label}</div>
                                            <div className="text-xs opacity-80 mt-1">{opt.description}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <Separator />

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <Label>Number of Leads</Label>
                                    <span className="text-sm text-muted-foreground">
                                        Max: {MAX_FETCH_COUNT.toLocaleString()}
                                    </span>
                                </div>
                                <Input
                                    type="number"
                                    value={filters.fetch_count || DEFAULT_FETCH_COUNT}
                                    onChange={(e) => updateFilter('fetch_count', Math.min(parseInt(e.target.value) || DEFAULT_FETCH_COUNT, MAX_FETCH_COUNT))}
                                    min={1}
                                    max={MAX_FETCH_COUNT}
                                />
                            </div>

                            <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <DollarSign className="h-5 w-5 text-primary" />
                                        <span className="font-medium">Estimated Cost</span>
                                    </div>
                                    <span className="text-2xl font-bold text-primary">
                                        ${estimatedCost.toFixed(2)}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                    Based on ${COST_PER_1000_LEADS}/1,000 leads
                                </p>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </TooltipProvider>
    )
}

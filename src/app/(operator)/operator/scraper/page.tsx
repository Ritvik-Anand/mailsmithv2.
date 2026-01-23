'use client'

import React, { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Search,
    Target,
    Users,
    Globe,
    Briefcase,
    Building2,
    DollarSign,
    Zap,
    Loader2,
    Shield,
    X,
    Plus,
    MinusCircle,
    Check,
    Layers
} from 'lucide-react'
import { getOrganizations } from '@/server/actions/organizations'
import { startLeadSearchJob } from '@/server/actions/lead-finder'
import { toast } from 'sonner'
import {
    LeadSearchFilters,
    SeniorityLevel,
    FunctionalLevel,
    CompanySize,
    FundingStage
} from '@/types'
import {
    POPULAR_INDUSTRIES,
    POPULAR_JOB_TITLES,
    POPULAR_LOCATIONS
} from '@/lib/lead-finder/constants'

const SENIORITY_OPTIONS: { label: string; value: SeniorityLevel }[] = [
    { label: 'Founder', value: 'founder' },
    { label: 'Owner', value: 'owner' },
    { label: 'C-Suite', value: 'c_suite' },
    { label: 'VP', value: 'vp' },
    { label: 'Head', value: 'head' },
    { label: 'Director', value: 'director' },
    { label: 'Manager', value: 'manager' },
    { label: 'Partner', value: 'partner' },
    { label: 'Senior', value: 'senior' },
    { label: 'Entry', value: 'entry' },
]

const FUNCTIONAL_OPTIONS: { label: string; value: FunctionalLevel }[] = [
    { label: 'Marketing', value: 'marketing' },
    { label: 'Sales', value: 'sales' },
    { label: 'Operations', value: 'operations' },
    { label: 'Finance', value: 'finance' },
    { label: 'Engineering', value: 'engineering' },
    { label: 'Product', value: 'product' },
    { label: 'IT', value: 'it' },
    { label: 'HR', value: 'hr' },
    { label: 'Legal', value: 'legal' },
    { label: 'Design', value: 'design' },
]

const SIZE_OPTIONS: CompanySize[] = [
    '1-10', '11-20', '21-50', '51-100', '101-200', '201-500', '501-1000', '1001-2000', '2001-5000', '5001-10000', '10001-20000', '20001-50000', '50000+'
]

const FUNDING_OPTIONS: { label: string; value: FundingStage }[] = [
    { label: 'Seed', value: 'seed' },
    { label: 'Angel', value: 'angel' },
    { label: 'Series A', value: 'series_a' },
    { label: 'Series B', value: 'series_b' },
    { label: 'Series C', value: 'series_c' },
    { label: 'Venture', value: 'venture' },
    { label: 'PE', value: 'pe' },
]

// Generic List Input Component with Suggestions
function ListInput({
    label,
    placeholder,
    icon: Icon,
    values,
    onAdd,
    onRemove,
    suggestions = [],
    isNegative = false
}: {
    label: string,
    placeholder: string,
    icon: any,
    values: string[],
    onAdd: (val: string) => void,
    onRemove: (val: string) => void,
    suggestions?: string[],
    isNegative?: boolean
}) {
    const [input, setInput] = useState('')
    const [showSuggestions, setShowSuggestions] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    const filteredSuggestions = suggestions.filter(s =>
        s.toLowerCase().includes(input.toLowerCase()) && !values.includes(s)
    ).slice(0, 8)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowSuggestions(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleAdd = (val: string = input) => {
        if (val.trim()) {
            onAdd(val.trim())
            setInput('')
            setShowSuggestions(false)
        }
    }

    return (
        <div className="space-y-3 relative" ref={containerRef}>
            <Label className={`text-[10px] font-black uppercase tracking-widest ${isNegative ? 'text-red-500/70' : 'text-zinc-500'}`}>
                {label} {isNegative && <span className="text-red-500">(EXCLUDE)</span>}
            </Label>
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Icon className={`absolute left-3 top-2.5 h-4 w-4 ${isNegative ? 'text-red-900' : 'text-zinc-600'}`} />
                    <Input
                        placeholder={placeholder}
                        className={`bg-black border-zinc-800 pl-10 h-10 text-sm ${isNegative ? 'focus-visible:ring-red-500/50' : ''}`}
                        value={input}
                        onChange={(e) => {
                            setInput(e.target.value)
                            setShowSuggestions(true)
                        }}
                        onFocus={() => setShowSuggestions(true)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    />

                    {/* Suggestions Dropdown */}
                    {showSuggestions && filteredSuggestions.length > 0 && (
                        <div className="absolute z-50 mt-1 w-full bg-zinc-950 border border-zinc-900 rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            {filteredSuggestions.map((s, i) => (
                                <button
                                    key={i}
                                    className="w-full text-left px-4 py-2.5 text-xs text-zinc-400 hover:bg-zinc-900 hover:text-white flex items-center justify-between group transition-colors"
                                    onClick={() => handleAdd(s)}
                                >
                                    {s}
                                    <Check className="h-3 w-3 opacity-0 group-hover:opacity-100 text-primary transition-opacity" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <Button
                    variant="outline"
                    className={`h-10 border-zinc-800 ${isNegative ? 'hover:bg-red-500/10 hover:text-red-500' : ''}`}
                    onClick={() => handleAdd()}
                >
                    {isNegative ? <MinusCircle className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                </Button>
            </div>
            <div className="flex flex-wrap gap-2">
                {values.map(v => (
                    <Badge
                        key={v}
                        className={`gap-2 py-1 pr-1.5 transition-all ${isNegative
                            ? 'bg-red-500/5 text-red-500 border-red-500/20'
                            : 'bg-primary/5 text-primary border-primary/20'
                            }`}
                    >
                        {v}
                        <button onClick={() => onRemove(v)} className="hover:text-white">
                            <X className="h-3 w-3" />
                        </button>
                    </Badge>
                ))}
            </div>
        </div>
    )
}

function ScraperContent() {
    const searchParams = useSearchParams()
    const orgIdFromQuery = searchParams.get('org')
    const [organizations, setOrganizations] = useState<any[]>([])
    const [selectedOrg, setSelectedOrg] = useState<string>('')

    useEffect(() => {
        if (orgIdFromQuery) {
            setSelectedOrg(orgIdFromQuery)
        }
    }, [orgIdFromQuery])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [filters, setFilters] = useState<Partial<LeadSearchFilters>>({
        contact_job_title: [],
        contact_not_job_title: [],
        company_industry: [],
        company_not_industry: [],
        contact_location: [],
        contact_not_location: [],
        contact_city: [],
        contact_not_city: [],
        seniority_level: [],
        functional_level: [],
        size: [],
        funding: [],
        company_keywords: [],
        company_not_keywords: [],
        company_domain: [],
        fetch_count: 50
    })

    useEffect(() => {
        const fetchOrgs = async () => {
            const orgs = await getOrganizations()
            setOrganizations(orgs)
        }
        fetchOrgs()
    }, [])

    const handleListChange = (field: keyof LeadSearchFilters, action: 'add' | 'remove', value: string) => {
        const current = (filters[field] as string[]) || []
        if (action === 'add') {
            if (current.includes(value)) return
            setFilters({ ...filters, [field]: [...current, value] })
        } else {
            setFilters({ ...filters, [field]: current.filter(v => v !== value) })
        }
    }

    const toggleArrayFilter = (field: keyof LeadSearchFilters, value: any) => {
        const current = (filters[field] as any[]) || []
        if (current.includes(value)) {
            setFilters({ ...filters, [field]: current.filter(v => v !== value) })
        } else {
            setFilters({ ...filters, [field]: [...current, value] })
        }
    }

    const handleStartJob = async () => {
        if (!selectedOrg) {
            toast.error('Please select a customer first')
            return
        }

        setIsSubmitting(true)
        try {
            const result = await startLeadSearchJob(filters as LeadSearchFilters, selectedOrg)
            if (result.success) {
                toast.success('Lead search job initiated successfully')
            } else {
                toast.error(result.error || 'Failed to start job')
            }
        } catch (error) {
            toast.error('An unexpected error occurred')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="space-y-8 pb-20 max-w-7xl mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black tracking-tighter text-white">MACHINE SCRAPER v2</h1>
                    <p className="text-zinc-500 font-medium">Global Lead Finding Infrastructure.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="ghost" onClick={() => setFilters({
                        contact_job_title: [],
                        contact_not_job_title: [],
                        company_industry: [],
                        company_not_industry: [],
                        contact_location: [],
                        contact_not_location: [],
                        contact_city: [],
                        contact_not_city: [],
                        seniority_level: [],
                        functional_level: [],
                        size: [],
                        funding: [],
                        company_keywords: [],
                        company_not_keywords: [],
                        company_domain: [],
                        fetch_count: 50
                    })}>Reset All</Button>
                    <Button
                        className="bg-primary hover:bg-primary/90 text-white font-black px-10 h-12 shadow-2xl shadow-primary/20"
                        onClick={handleStartJob}
                        disabled={isSubmitting || !selectedOrg}
                    >
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                        INITIALIZE SCRAPE
                    </Button>
                </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-4">
                {/* Configuration Sidebar */}
                <div className="space-y-6">
                    <Card className="bg-zinc-950 border-zinc-900 shadow-none border-2">
                        <CardHeader className="pb-4 border-b border-zinc-900">
                            <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">System Parameters</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-8 pt-6">
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Target Organization</Label>
                                <select
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg h-12 px-4 text-sm focus:ring-2 focus:ring-primary/50 outline-none text-zinc-200 transition-all"
                                    value={selectedOrg}
                                    onChange={(e) => setSelectedOrg(e.target.value)}
                                >
                                    <option value="">Select Tenant...</option>
                                    {organizations.map(org => (
                                        <option key={org.id} value={org.id}>{org.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Lead Volume</Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            className="w-20 h-8 bg-zinc-900 border-zinc-800 text-center font-mono text-xs focus-visible:ring-primary"
                                            value={filters.fetch_count}
                                            onChange={(e) => setFilters({ ...filters, fetch_count: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                </div>
                                <input
                                    type="range" min="10" max="5000" step="10"
                                    className="w-full h-2 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-primary"
                                    value={filters.fetch_count}
                                    onChange={(e) => setFilters({ ...filters, fetch_count: parseInt(e.target.value) })}
                                />
                                <div className="flex justify-between text-[10px] text-zinc-600 font-mono">
                                    <span>10</span>
                                    <span>2.5K</span>
                                    <span>5K</span>
                                </div>
                            </div>

                            <div className="p-5 bg-primary/5 rounded-2xl border border-primary/10 space-y-3">
                                <div className="flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-primary" />
                                    <span className="text-[10px] font-black text-primary uppercase tracking-tighter">Machine Status: READY</span>
                                </div>
                                <p className="text-[10px] text-zinc-500 leading-relaxed font-medium">
                                    Engine is connected to global proxy network. Catch-all verification enabled.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Filter Hub */}
                <div className="lg:col-span-3 space-y-6">
                    <Tabs defaultValue="people" className="w-full">
                        <TabsList className="bg-zinc-950 border border-zinc-900 w-full justify-start p-1 h-auto gap-1 border-2">
                            <TabsTrigger value="people" className="flex-1 py-3 data-[state=active]:bg-zinc-900 font-bold uppercase text-[10px] tracking-widest">
                                <Users className="h-4 w-4 mr-2" />
                                People
                            </TabsTrigger>
                            <TabsTrigger value="company" className="flex-1 py-3 data-[state=active]:bg-zinc-900 font-bold uppercase text-[10px] tracking-widest">
                                <Building2 className="h-4 w-4 mr-2" />
                                Company
                            </TabsTrigger>
                            <TabsTrigger value="geo" className="flex-1 py-3 data-[state=active]:bg-zinc-900 font-bold uppercase text-[10px] tracking-widest">
                                <Globe className="h-4 w-4 mr-2" />
                                Geo/Location
                            </TabsTrigger>
                            <TabsTrigger value="advanced" className="flex-1 py-3 data-[state=active]:bg-zinc-900 font-bold uppercase text-[10px] tracking-widest">
                                <Layers className="h-4 w-4 mr-2" />
                                Advanced
                            </TabsTrigger>
                        </TabsList>

                        {/* People Filters */}
                        <TabsContent value="people" className="mt-8 space-y-10">
                            <div className="grid gap-10 md:grid-cols-2">
                                <ListInput
                                    label="Job Titles"
                                    placeholder="e.g. CEO, Sales Director"
                                    icon={Briefcase}
                                    values={filters.contact_job_title || []}
                                    suggestions={POPULAR_JOB_TITLES}
                                    onAdd={(v) => handleListChange('contact_job_title', 'add', v)}
                                    onRemove={(v) => handleListChange('contact_job_title', 'remove', v)}
                                />
                                <ListInput
                                    label="Exclude Titles"
                                    placeholder="e.g. HR, Assistant"
                                    icon={Briefcase}
                                    values={filters.contact_not_job_title || []}
                                    suggestions={POPULAR_JOB_TITLES}
                                    onAdd={(v) => handleListChange('contact_not_job_title', 'add', v)}
                                    onRemove={(v) => handleListChange('contact_not_job_title', 'remove', v)}
                                    isNegative
                                />
                            </div>

                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Seniority Levels</Label>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                    {SENIORITY_OPTIONS.map(opt => (
                                        <Button
                                            key={opt.value}
                                            variant="outline"
                                            className={`h-12 text-[10px] font-black uppercase tracking-tight transition-all border-2 ${filters.seniority_level?.includes(opt.value) ? 'border-primary bg-primary/10 text-primary' : 'border-zinc-900 bg-black text-zinc-600'}`}
                                            onClick={() => toggleArrayFilter('seniority_level', opt.value)}
                                        >
                                            {opt.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </TabsContent>

                        {/* Company Filters */}
                        <TabsContent value="company" className="mt-8 space-y-10">
                            <div className="grid gap-10 md:grid-cols-2">
                                <ListInput
                                    label="Industries"
                                    placeholder="e.g. SaaS, Fintech"
                                    icon={Building2}
                                    values={filters.company_industry || []}
                                    suggestions={POPULAR_INDUSTRIES}
                                    onAdd={(v) => handleListChange('company_industry', 'add', v)}
                                    onRemove={(v) => handleListChange('company_industry', 'remove', v)}
                                />
                                <ListInput
                                    label="Exclude Industries"
                                    placeholder="e.g. Real Estate"
                                    icon={Building2}
                                    values={filters.company_not_industry || []}
                                    suggestions={POPULAR_INDUSTRIES}
                                    onAdd={(v) => handleListChange('company_not_industry', 'add', v)}
                                    onRemove={(v) => handleListChange('company_not_industry', 'remove', v)}
                                    isNegative
                                />
                            </div>

                            <div className="grid gap-10 md:grid-cols-2">
                                <ListInput
                                    label="Inclusion Keywords"
                                    placeholder="e.g. Artificial Intelligence"
                                    icon={Target}
                                    values={filters.company_keywords || []}
                                    onAdd={(v) => handleListChange('company_keywords', 'add', v)}
                                    onRemove={(v) => handleListChange('company_keywords', 'remove', v)}
                                />
                                <ListInput
                                    label="Exclusion Keywords"
                                    placeholder="e.g. Crypto"
                                    icon={Target}
                                    values={filters.company_not_keywords || []}
                                    onAdd={(v) => handleListChange('company_not_keywords', 'add', v)}
                                    onRemove={(v) => handleListChange('company_not_keywords', 'remove', v)}
                                    isNegative
                                />
                            </div>

                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Staff Count</Label>
                                <div className="flex flex-wrap gap-2">
                                    {SIZE_OPTIONS.map(size => (
                                        <Badge
                                            key={size}
                                            className={`cursor-pointer px-5 py-2.5 border-2 font-mono text-[10px] font-black transition-all ${filters.size?.includes(size) ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-black text-zinc-600 border-zinc-900 hover:border-zinc-700'}`}
                                            onClick={() => toggleArrayFilter('size', size)}
                                        >
                                            {size}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </TabsContent>

                        {/* Geo Filters */}
                        <TabsContent value="geo" className="mt-8 space-y-10">
                            <div className="grid gap-10 md:grid-cols-2">
                                <ListInput
                                    label="Countries"
                                    placeholder="e.g. United Kingdom"
                                    icon={Globe}
                                    values={filters.contact_location || []}
                                    suggestions={POPULAR_LOCATIONS}
                                    onAdd={(v) => handleListChange('contact_location', 'add', v)}
                                    onRemove={(v) => handleListChange('contact_location', 'remove', v)}
                                />
                                <ListInput
                                    label="Exclude Countries"
                                    placeholder="e.g. India"
                                    icon={Globe}
                                    values={filters.contact_not_location || []}
                                    suggestions={POPULAR_LOCATIONS}
                                    onAdd={(v) => handleListChange('contact_not_location', 'add', v)}
                                    onRemove={(v) => handleListChange('contact_not_location', 'remove', v)}
                                    isNegative
                                />
                            </div>
                            <div className="grid gap-10 md:grid-cols-2 border-t border-zinc-900 pt-10">
                                <ListInput
                                    label="Cities"
                                    placeholder="e.g. London"
                                    icon={Search}
                                    values={filters.contact_city || []}
                                    suggestions={POPULAR_LOCATIONS}
                                    onAdd={(v) => handleListChange('contact_city', 'add', v)}
                                    onRemove={(v) => handleListChange('contact_city', 'remove', v)}
                                />
                                <ListInput
                                    label="Exclude Cities"
                                    placeholder="e.g. Manchester"
                                    icon={Search}
                                    values={filters.contact_not_city || []}
                                    suggestions={POPULAR_LOCATIONS}
                                    onAdd={(v) => handleListChange('contact_not_city', 'add', v)}
                                    onRemove={(v) => handleListChange('contact_not_city', 'remove', v)}
                                    isNegative
                                />
                            </div>
                        </TabsContent>

                        {/* Advanced Filters */}
                        <TabsContent value="advanced" className="mt-8 space-y-10">
                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Functional Levels</Label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {FUNCTIONAL_OPTIONS.map(opt => (
                                        <Button
                                            key={opt.value}
                                            variant="outline"
                                            className={`h-12 text-[10px] font-black uppercase tracking-tight border-2 ${filters.functional_level?.includes(opt.value) ? 'border-primary bg-primary/10 text-primary' : 'border-zinc-900 bg-black text-zinc-600'}`}
                                            onClick={() => toggleArrayFilter('functional_level', opt.value)}
                                        >
                                            {opt.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4 border-t border-zinc-900 pt-10">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Funding Stages</Label>
                                <div className="flex flex-wrap gap-2">
                                    {FUNDING_OPTIONS.map(opt => (
                                        <Button
                                            key={opt.value}
                                            variant="outline"
                                            className={`px-8 h-12 text-[10px] font-black uppercase tracking-tight rounded-full border-2 ${filters.funding?.includes(opt.value) ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500' : 'border-zinc-900 bg-black text-zinc-600'}`}
                                            onClick={() => toggleArrayFilter('funding', opt.value)}
                                        >
                                            {opt.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid gap-10 md:grid-cols-2 border-t border-zinc-900 pt-10">
                                <ListInput
                                    label="Target Domains"
                                    placeholder="e.g. apple.com"
                                    icon={Building2}
                                    values={filters.company_domain || []}
                                    onAdd={(v) => handleListChange('company_domain', 'add', v)}
                                    onRemove={(v) => handleListChange('company_domain', 'remove', v)}
                                />
                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Revenue (USD)</Label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-3 h-4 w-4 text-zinc-700" />
                                            <Input placeholder="Min Revenue" className="bg-black border-2 border-zinc-900 pl-10 h-12 text-xs font-mono" onChange={(e) => setFilters({ ...filters, min_revenue: e.target.value })} />
                                        </div>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-3 h-4 w-4 text-zinc-700" />
                                            <Input placeholder="Max Revenue" className="bg-black border-2 border-zinc-900 pl-10 h-12 text-xs font-mono" onChange={(e) => setFilters({ ...filters, max_revenue: e.target.value })} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    )
}

export default function ScraperPage() {
    return (
        <Suspense fallback={
            <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-zinc-500 font-medium">Initializing Lead Engine...</p>
            </div>
        }>
            <ScraperContent />
        </Suspense>
    )
}

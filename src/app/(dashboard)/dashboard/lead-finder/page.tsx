'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { LeadSearchFilters } from '@/types'
import { SearchPresets, SearchFiltersForm, SearchJobsList } from '@/components/lead-finder'
import { startLeadSearchJob, quickLeadSearch } from '@/server/actions/lead-finder'
import { DEFAULT_FETCH_COUNT, COST_PER_1000_LEADS } from '@/lib/lead-finder/constants'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
    Search,
    Sparkles,
    Target,
    Zap,
    Users,
    ArrowRight,
    Loader2,
    CheckCircle2,
    Info,
    Rocket,
    Eye,
} from 'lucide-react'

export default function LeadFinderPage() {
    const [filters, setFilters] = useState<LeadSearchFilters>({
        email_status: ['validated'],
        fetch_count: DEFAULT_FETCH_COUNT,
    })
    const [selectedPresetId, setSelectedPresetId] = useState<string>()
    const [isSearching, setIsSearching] = useState(false)
    const [isPreviewing, setIsPreviewing] = useState(false)
    const [refreshKey, setRefreshKey] = useState(0)
    const [previewResults, setPreviewResults] = useState<{
        count: number
        samples: Array<{ name: string; title: string; company: string; email: string }>
    } | null>(null)

    const handlePresetSelect = (presetFilters: LeadSearchFilters) => {
        setFilters({
            ...filters,
            ...presetFilters,
        })
        setPreviewResults(null)
    }

    const handleFiltersChange = (newFilters: LeadSearchFilters) => {
        setFilters(newFilters)
        setSelectedPresetId(undefined)
        setPreviewResults(null)
    }

    const handlePreview = async () => {
        setIsPreviewing(true)
        try {
            const result = await quickLeadSearch(filters)
            if (result.success && result.leads) {
                setPreviewResults({
                    count: result.count || 0,
                    samples: result.leads.slice(0, 5).map(l => ({
                        name: l.full_name || `${l.first_name || ''} ${l.last_name || ''}`.trim() || 'Unknown',
                        title: l.job_title || 'N/A',
                        company: l.company_name || 'N/A',
                        email: l.email || 'N/A',
                    })),
                })
                toast.success(`Found ${result.count} matching leads`)
            } else {
                toast.error(result.error || 'Preview failed')
            }
        } catch {
            toast.error('Failed to preview results')
        } finally {
            setIsPreviewing(false)
        }
    }

    const handleStartSearch = async () => {
        setIsSearching(true)
        try {
            const result = await startLeadSearchJob(filters)
            if (result.success) {
                toast.success('Lead search started! We\'ll notify you when it\'s complete.')
                setRefreshKey(prev => prev + 1)
            } else {
                toast.error(result.error || 'Failed to start search')
            }
        } catch {
            toast.error('Failed to start search')
        } finally {
            setIsSearching(false)
        }
    }

    const hasFilters = () => {
        return (
            (filters.contact_job_title?.length || 0) > 0 ||
            (filters.seniority_level?.length || 0) > 0 ||
            (filters.functional_level?.length || 0) > 0 ||
            (filters.contact_location?.length || 0) > 0 ||
            (filters.contact_city?.length || 0) > 0 ||
            (filters.company_industry?.length || 0) > 0 ||
            (filters.size?.length || 0) > 0 ||
            (filters.funding?.length || 0) > 0
        )
    }

    const estimatedCost = ((filters.fetch_count || DEFAULT_FETCH_COUNT) / 1000) * COST_PER_1000_LEADS

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
                            <Target className="h-6 w-6 text-primary" />
                        </div>
                        Lead Finder
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Find and import high-quality B2B leads with verified emails
                    </p>
                </div>
            </div>

            {/* Feature Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/0 border-blue-500/20">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/10">
                            <Users className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                            <h4 className="font-medium text-sm">300M+ Contacts</h4>
                            <p className="text-xs text-muted-foreground">Global B2B database</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-500/5 to-green-500/0 border-green-500/20">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-green-500/10">
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                        </div>
                        <div>
                            <h4 className="font-medium text-sm">Verified Emails</h4>
                            <p className="text-xs text-muted-foreground">High deliverability</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-500/5 to-purple-500/0 border-purple-500/20">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-500/10">
                            <Zap className="h-5 w-5 text-purple-500" />
                        </div>
                        <div>
                            <h4 className="font-medium text-sm">Instant Import</h4>
                            <p className="text-xs text-muted-foreground">Ready for campaigns</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Start Templates */}
            <SearchPresets
                onSelectPreset={handlePresetSelect}
                selectedPresetId={selectedPresetId}
            />

            <Separator />

            {/* Search Builder */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Filters */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Search className="h-5 w-5 text-primary" />
                                Build Your Search
                            </CardTitle>
                            <CardDescription>
                                Customize your search criteria to find the perfect leads
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <SearchFiltersForm
                                filters={filters}
                                onChange={handleFiltersChange}
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Search Summary & Actions */}
                <div className="space-y-4">
                    <Card className="sticky top-6">
                        <CardHeader>
                            <CardTitle className="text-lg">Search Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Active Filters */}
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium">Active Filters</h4>
                                {hasFilters() ? (
                                    <div className="flex flex-wrap gap-1">
                                        {filters.contact_job_title?.map(t => (
                                            <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                                        ))}
                                        {filters.seniority_level?.map(s => (
                                            <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                                        ))}
                                        {filters.contact_location?.map(l => (
                                            <Badge key={l} variant="outline" className="text-xs">{l}</Badge>
                                        ))}
                                        {filters.contact_city?.map(c => (
                                            <Badge key={c} variant="outline" className="text-xs">{c}</Badge>
                                        ))}
                                        {filters.company_industry?.map(i => (
                                            <Badge key={i} variant="outline" className="text-xs">{i}</Badge>
                                        ))}
                                        {(filters.size?.length || 0) > 0 && (
                                            <Badge variant="outline" className="text-xs">
                                                {filters.size?.length} sizes
                                            </Badge>
                                        )}
                                        {(filters.funding?.length || 0) > 0 && (
                                            <Badge variant="outline" className="text-xs">
                                                {filters.funding?.length} funding stages
                                            </Badge>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-xs text-muted-foreground">
                                        No filters applied - this will search all available leads
                                    </p>
                                )}
                            </div>

                            <Separator />

                            {/* Lead Count */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Leads to fetch</span>
                                    <span className="text-lg font-bold">
                                        {(filters.fetch_count || DEFAULT_FETCH_COUNT).toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Estimated cost</span>
                                    <span className="text-lg font-bold text-primary">
                                        ${estimatedCost.toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            <Separator />

                            {/* Preview Results */}
                            {previewResults && (
                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium flex items-center gap-2">
                                        <Eye className="h-4 w-4" />
                                        Preview ({previewResults.count} samples)
                                    </h4>
                                    <div className="space-y-2 max-h-40 overflow-y-auto">
                                        {previewResults.samples.map((sample, i) => (
                                            <div key={i} className="p-2 bg-muted/50 rounded text-xs">
                                                <div className="font-medium">{sample.name}</div>
                                                <div className="text-muted-foreground">
                                                    {sample.title} at {sample.company}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <Separator />
                                </div>
                            )}

                            {/* Actions */}
                            <div className="space-y-2">
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={handlePreview}
                                    disabled={isPreviewing || isSearching}
                                >
                                    {isPreviewing ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Previewing...
                                        </>
                                    ) : (
                                        <>
                                            <Eye className="mr-2 h-4 w-4" />
                                            Preview Results
                                        </>
                                    )}
                                </Button>
                                <Button
                                    className="w-full"
                                    size="lg"
                                    onClick={handleStartSearch}
                                    disabled={isSearching || isPreviewing}
                                >
                                    {isSearching ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Starting Search...
                                        </>
                                    ) : (
                                        <>
                                            <Rocket className="mr-2 h-4 w-4" />
                                            Find Leads
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </>
                                    )}
                                </Button>
                            </div>

                            <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
                                <Info className="h-3 w-3" />
                                Results are automatically imported to your leads
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Separator />

            {/* Search History */}
            <Card>
                <CardHeader>
                    <CardTitle>Search History</CardTitle>
                    <CardDescription>
                        Track your lead searches and view imported results
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <SearchJobsList refreshKey={refreshKey} />
                </CardContent>
            </Card>
        </div>
    )
}

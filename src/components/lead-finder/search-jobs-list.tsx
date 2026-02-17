'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrapeJob } from '@/types'
import { getSearchJobs, cancelSearchJob, getSearchJobStatus } from '@/server/actions/lead-finder'
import { cn } from '@/lib/utils'
import {
    Clock,
    CheckCircle2,
    XCircle,
    Loader2,
    Loader,
    RefreshCw,
    Users,
    ChevronRight,
    StopCircle,
    Calendar,
    Target
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface SearchJobsListProps {
    onViewJob?: (jobId: string) => void
    refreshKey?: number
}

const statusConfig: Record<string, {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    animate?: boolean;
}> = {
    pending: {
        label: 'Pending',
        icon: Clock,
        color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
    },
    running: {
        label: 'Running',
        icon: Loader,
        color: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
        animate: false
    },
    completed: {
        label: 'Completed',
        icon: CheckCircle2,
        color: 'bg-green-500/10 text-green-600 border-green-500/20'
    },
    failed: {
        label: 'Failed',
        icon: XCircle,
        color: 'bg-red-500/10 text-red-600 border-red-500/20'
    },
}

export function SearchJobsList({ onViewJob, refreshKey }: SearchJobsListProps) {
    const [jobs, setJobs] = useState<ScrapeJob[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    const loadJobs = async (showRefresh = false) => {
        if (showRefresh) setRefreshing(true)
        else setLoading(true)

        const result = await getSearchJobs({ limit: 20 })
        if (result.success && result.jobs) {
            setJobs(result.jobs)
        }

        setLoading(false)
        setRefreshing(false)
    }

    useEffect(() => {
        loadJobs()
    }, [refreshKey])

    // Poll running jobs
    useEffect(() => {
        const runningJobs = jobs.filter(j => j.status === 'running')
        if (runningJobs.length === 0) return

        const interval = setInterval(async () => {
            let updated = false
            for (const job of runningJobs) {
                const result = await getSearchJobStatus(job.id)
                if (result.success && result.job && result.job.status !== 'running') {
                    updated = true
                }
            }
            if (updated) {
                loadJobs()
            }
        }, 5000)

        return () => clearInterval(interval)
    }, [jobs])

    const handleCancel = async (jobId: string) => {
        await cancelSearchJob(jobId)
        loadJobs()
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (jobs.length === 0) {
        return (
            <div className="text-center py-12">
                <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium text-lg">No searches yet</h3>
                <p className="text-sm text-muted-foreground mt-2">
                    Start your first lead search using the filters above
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Recent Searches</h3>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => loadJobs(true)}
                    disabled={refreshing}
                >
                    <RefreshCw className={cn('h-4 w-4 mr-2', refreshing && 'animate-spin')} />
                    Refresh
                </Button>
            </div>

            <div className="space-y-3">
                {jobs.map((job) => {
                    const status = statusConfig[job.status]
                    const StatusIcon = status.icon
                    const filters = job.input_params

                    // Create a summary of filters
                    const filterSummary = [
                        filters.contact_job_title?.length && `${filters.contact_job_title.length} titles`,
                        filters.contact_location?.length && filters.contact_location.join(', '),
                        filters.contact_city?.length && filters.contact_city.join(', '),
                        filters.company_industry?.length && `${filters.company_industry.length} industries`,
                        filters.size?.length && `${filters.size.length} company sizes`,
                    ].filter(Boolean).join(' • ') || 'All leads'

                    return (
                        <Card
                            key={job.id}
                            className={cn(
                                'transition-all hover:shadow-md cursor-pointer',
                                job.status === 'running' && 'border-primary/50'
                            )}
                            onClick={() => onViewJob?.(job.id)}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-start gap-4">
                                    <div className={cn(
                                        'p-2 rounded-lg shrink-0',
                                        status.color
                                    )}>
                                        <StatusIcon className={cn(
                                            'h-5 w-5',
                                            status.animate && 'animate-spin'
                                        )} />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge variant="outline" className={status.color}>
                                                {status.label}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                                            </span>
                                        </div>

                                        <p className="text-sm text-muted-foreground truncate">
                                            {filterSummary}
                                        </p>

                                        {job.status === 'running' && (
                                            <div className="mt-3">
                                                <Progress value={undefined} className="h-1" />
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Searching for leads...
                                                </p>
                                            </div>
                                        )}

                                        {job.status === 'completed' && (
                                            <div className="flex items-center gap-4 mt-2">
                                                <div className="flex items-center gap-1 text-sm">
                                                    <Users className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-medium">{job.leads_found.toLocaleString()}</span>
                                                    <span className="text-muted-foreground">found</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-sm text-green-600">
                                                    <CheckCircle2 className="h-4 w-4" />
                                                    <span className="font-medium">{job.leads_imported.toLocaleString()}</span>
                                                    <span>imported</span>
                                                </div>
                                            </div>
                                        )}

                                        {job.status === 'failed' && job.error_message && (
                                            <p className="text-xs text-red-500 mt-2">
                                                {job.error_message}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex flex-col items-end gap-2 shrink-0">
                                        {job.status === 'running' && (
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-xs"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        onViewJob?.(job.id)
                                                    }}
                                                >
                                                    <RefreshCw className="h-3 w-3 mr-1" />
                                                    Sync Now
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleCancel(job.id)
                                                    }}
                                                >
                                                    <StopCircle className="h-4 w-4 text-muted-foreground" />
                                                </Button>
                                            </div>
                                        )}
                                        {job.status === 'completed' && (
                                            <div className="flex gap-2">
                                                {job.leads_found > 0 && job.leads_imported === 0 && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-xs"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            onViewJob?.(job.id)
                                                        }}
                                                    >
                                                        <RefreshCw className="h-3 w-3 mr-1" />
                                                        Retry Sync
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    className="text-xs"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        onViewJob?.(job.id)
                                                    }}
                                                >
                                                    View Leads
                                                    <ChevronRight className="h-4 w-4 ml-1" />
                                                </Button>
                                            </div>
                                        )}
                                        {job.status !== 'completed' && job.status !== 'running' && (
                                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}

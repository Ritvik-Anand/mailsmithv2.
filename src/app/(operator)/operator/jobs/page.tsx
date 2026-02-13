'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
    Target,
    Search,
    Loader2,
    CheckCircle2,
    XCircle,
    Clock,
    RefreshCw,
    ArrowRight,
    Users
} from 'lucide-react'
import { getSearchJobs } from '@/server/actions/lead-finder'
import { ScrapeJob } from '@/types'
import { toast } from 'sonner'

export default function OperatorJobsPage() {
    const [jobs, setJobs] = useState<ScrapeJob[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    const fetchJobs = async () => {
        setIsLoading(true)
        try {
            const result = await getSearchJobs({ limit: 50 })
            if (result.success && result.jobs) {
                setJobs(result.jobs)
            }
        } catch (error) {
            toast.error('Failed to load jobs')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchJobs()
        // Poll for updates every 10 seconds
        const interval = setInterval(fetchJobs, 10000)
        return () => clearInterval(interval)
    }, [])

    const filteredJobs = jobs.filter(job =>
        job.input_params.contact_job_title?.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())) ||
        job.id.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const runningJobs = jobs.filter(j => j.status === 'running' || j.status === 'pending')
    const completedJobs = jobs.filter(j => j.status === 'completed')
    const failedJobs = jobs.filter(j => j.status === 'failed')

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'running':
            case 'pending':
                return <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
            case 'completed':
                return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            case 'failed':
                return <XCircle className="h-4 w-4 text-red-500" />
            default:
                return <Clock className="h-4 w-4 text-zinc-500" />
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'running':
            case 'pending':
                return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
            case 'completed':
                return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
            case 'failed':
                return 'bg-red-500/10 text-red-500 border-red-500/20'
            default:
                return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'
        }
    }

    if (isLoading && jobs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-zinc-500 font-medium">Loading scrape jobs...</p>
            </div>
        )
    }

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight text-white">Scrape Jobs</h1>
                    <p className="text-zinc-500 font-medium">Monitor all lead scraping operations in real-time.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" size="sm" onClick={fetchJobs} className="border-zinc-800">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                    <Link href="/operator/scraper">
                        <Button className="bg-primary hover:bg-primary/90">
                            <Target className="h-4 w-4 mr-2" />
                            New Scrape
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-amber-500/5 border-amber-500/20">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-amber-500/10 flex items-center justify-center">
                            <Loader2 className="h-6 w-6 text-amber-500 animate-spin" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-amber-500">{runningJobs.length}</p>
                            <p className="text-xs text-zinc-500 font-medium uppercase tracking-widest">Running</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-emerald-500/5 border-emerald-500/20">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-emerald-500">{completedJobs.length}</p>
                            <p className="text-xs text-zinc-500 font-medium uppercase tracking-widest">Completed</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-red-500/5 border-red-500/20">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-red-500/10 flex items-center justify-center">
                            <XCircle className="h-6 w-6 text-red-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-red-500">{failedJobs.length}</p>
                            <p className="text-xs text-zinc-500 font-medium uppercase tracking-widest">Failed</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-600" />
                <Input
                    placeholder="Search by job title or ID..."
                    className="pl-10 bg-zinc-950 border-zinc-800"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Jobs List */}
            <div className="space-y-3">
                {filteredJobs.length === 0 ? (
                    <Card className="bg-zinc-950 border-zinc-900">
                        <CardContent className="py-16 text-center">
                            <Target className="h-12 w-12 text-zinc-800 mx-auto mb-4" />
                            <h3 className="text-zinc-500 font-bold">No scrape jobs found</h3>
                            <p className="text-zinc-700 text-sm mt-2">Start a new scrape to see jobs here.</p>
                            <Link href="/operator/scraper">
                                <Button className="mt-4" variant="outline">
                                    Launch Lead Scraper
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    filteredJobs.map((job) => (
                        <Link key={job.id} href={`/operator/leads/${job.id}`}>
                            <Card className="bg-zinc-950 border-zinc-900 hover:border-zinc-700 transition-all cursor-pointer group">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-4">
                                        {/* Status Icon */}
                                        <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${job.status === 'running' || job.status === 'pending' ? 'bg-amber-500/10' :
                                            job.status === 'completed' ? 'bg-emerald-500/10' : 'bg-red-500/10'
                                            }`}>
                                            {getStatusIcon(job.status)}
                                        </div>

                                        {/* Job Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge variant="outline" className={`text-[10px] uppercase ${getStatusColor(job.status)}`}>
                                                    {job.status}
                                                </Badge>
                                                <span className="text-[10px] text-zinc-600 font-mono">
                                                    {job.id.slice(0, 8)}...
                                                </span>
                                            </div>
                                            <p className="text-sm font-bold text-white truncate">
                                                {job.name || job.input_params.contact_job_title?.join(', ') || 'General Search'}
                                            </p>
                                            <p className="text-xs text-zinc-500 mt-1">
                                                {new Date(job.created_at).toLocaleString()}
                                            </p>
                                        </div>

                                        {/* Stats */}
                                        <div className="text-right hidden md:block">
                                            <div className="flex items-center gap-1 text-zinc-400">
                                                <Users className="h-4 w-4" />
                                                <span className="text-lg font-bold">{job.leads_imported || 0}</span>
                                            </div>
                                            <p className="text-[10px] text-zinc-600 uppercase tracking-widest">Leads</p>
                                        </div>

                                        {/* Arrow */}
                                        <ArrowRight className="h-5 w-5 text-zinc-700 group-hover:text-primary transition-colors" />
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))
                )}
            </div>
        </div>
    )
}

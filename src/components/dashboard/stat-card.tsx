import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
    title: string
    value: string | number
    description?: string
    icon?: LucideIcon
    trend?: {
        value: number
        isPositive: boolean
    }
    className?: string
    loading?: boolean
}

export function StatCard({
    title,
    value,
    description,
    icon: Icon,
    trend,
    className,
    loading = false,
}: StatCardProps) {
    if (loading) {
        return (
            <Card className={cn('', className)}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-8 w-20 mb-1" />
                    <Skeleton className="h-3 w-32" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className={cn('', className)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {(description || trend) && (
                    <p className="text-xs text-muted-foreground mt-1">
                        {trend && (
                            <span
                                className={cn(
                                    'font-medium mr-1',
                                    trend.isPositive ? 'text-emerald-500' : 'text-rose-500'
                                )}
                            >
                                {trend.isPositive ? '+' : ''}
                                {trend.value}%
                            </span>
                        )}
                        {description}
                    </p>
                )}
            </CardContent>
        </Card>
    )
}

interface PercentageRingProps {
    value: number
    title: string
    size?: 'sm' | 'md' | 'lg'
    className?: string
}

export function PercentageRing({ value, title, size = 'md', className }: PercentageRingProps) {
    const sizeClasses = {
        sm: 'h-16 w-16',
        md: 'h-24 w-24',
        lg: 'h-32 w-32',
    }

    const strokeWidth = size === 'sm' ? 4 : size === 'md' ? 6 : 8
    const radius = size === 'sm' ? 28 : size === 'md' ? 42 : 56
    const circumference = 2 * Math.PI * radius
    const strokeDashoffset = circumference - (value / 100) * circumference

    const getColor = (val: number) => {
        if (val >= 70) return 'text-emerald-500'
        if (val >= 40) return 'text-amber-500'
        return 'text-rose-500'
    }

    return (
        <div className={cn('flex flex-col items-center gap-2', className)}>
            <div className={cn('relative', sizeClasses[size])}>
                <svg className="w-full h-full -rotate-90">
                    {/* Background circle */}
                    <circle
                        cx="50%"
                        cy="50%"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth={strokeWidth}
                        fill="none"
                        className="text-muted"
                    />
                    {/* Progress circle */}
                    <circle
                        cx="50%"
                        cy="50%"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth={strokeWidth}
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        className={cn('transition-all duration-500', getColor(value))}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className={cn('font-bold', size === 'sm' ? 'text-sm' : size === 'md' ? 'text-xl' : 'text-2xl')}>
                        {value}%
                    </span>
                </div>
            </div>
            <span className="text-xs text-muted-foreground font-medium">{title}</span>
        </div>
    )
}

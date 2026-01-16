'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
    Avatar,
    AvatarImage,
    AvatarFallback
} from '@/components/ui/avatar'
import {
    Users,
    Shield,
    ShieldCheck,
    ShieldAlert,
    MoreHorizontal,
    Plus,
    Search,
    Lock,
    Eye,
    EyeOff,
    Settings,
    UserPlus,
    Mail,
    RefreshCw,
    Key,
    Camera
} from 'lucide-react'
import { AdminRole, AdminPermission, SystemAdmin } from '@/types'
import { getAdminTeam, createAdmin, revokeAdminAccess } from '@/server/actions/admin-team'
import { useEffect, useTransition } from 'react'
import { toast } from 'sonner'

// Mock Admins
const mockTeam: SystemAdmin[] = [
    {
        id: '1',
        user_id: 'u1',
        email: 'ritvik@acquifix.com',
        full_name: 'Ritvik',
        role: 'master',
        permissions: ['manage_admins', 'manage_customers', 'manage_support', 'manage_system', 'view_financials', 'view_logs', 'send_broadcasts'],
        access_key: 'Rv@129',
        avatar_url: 'https://github.com/ritvikanand.png',
        created_at: '2026-01-01',
        updated_at: '2026-01-12'
    },
    {
        id: '2',
        user_id: 'u2',
        email: 'sarah.ops@acquifix.com',
        full_name: 'Sarah Chen',
        role: 'admin',
        permissions: ['manage_customers', 'manage_support', 'send_broadcasts', 'view_logs'],
        access_key: 'MS-A82J-92',
        avatar_url: null,
        created_at: '2026-01-05',
        updated_at: '2026-01-10'
    },
    {
        id: '3',
        user_id: 'u3',
        email: 'mike.support@acquifix.com',
        full_name: 'Mike Ross',
        role: 'support',
        permissions: ['manage_support', 'view_logs'],
        access_key: 'MS-K91L-10',
        avatar_url: null,
        created_at: '2026-01-08',
        updated_at: '2026-01-08'
    }
]

const PERMISSIONS: { id: AdminPermission; label: string; description: string }[] = [
    { id: 'manage_admins', label: 'Manage Admins', description: 'Can add/remove other admins and change roles' },
    { id: 'manage_customers', label: 'Manage Customers', description: 'Edit customer plans, features, and settings' },
    { id: 'manage_support', label: 'Handle Support', description: 'Access to support queue and live chat' },
    { id: 'manage_system', label: 'System Configuration', description: 'Change platform-wide settings and integrations' },
    { id: 'view_financials', label: 'View Financials', description: 'Access billing data and revenue reports' },
    { id: 'view_logs', label: 'Audit Logs', description: 'View system activity and security logs' },
    { id: 'send_broadcasts', label: 'Send Announcements', description: 'Broadcast notifications to all customers' },
]

export default function AdminTeamPage() {
    const [team, setTeam] = useState<SystemAdmin[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({})
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isPending, startTransition] = useTransition()

    // Form states
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'admin' as AdminRole,
        avatar_url: '',
        permissions: [] as AdminPermission[]
    })
    const [accessKey, setAccessKey] = useState('')

    const fetchTeam = async () => {
        setIsLoading(true)
        try {
            const data = await getAdminTeam()
            setTeam(data)
        } catch (error) {
            console.error(error)
            toast.error('Failed to load team data')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchTeam()
    }, [])

    useEffect(() => {
        if (isDialogOpen) {
            const newKey = `MS-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(10).substring(2, 4)}`
            setAccessKey(newKey)
        }
    }, [isDialogOpen])

    // In a real app, this would be determined by the logged-in user's role
    const isMasterAdmin = true

    const toggleKeyVisibility = (id: string) => {
        setVisibleKeys(prev => ({ ...prev, [id]: !prev[id] }))
    }

    const handleDeploy = () => {
        if (!formData.name || !formData.email) {
            toast.error('Please fill in all required fields')
            return
        }

        startTransition(async () => {
            try {
                await createAdmin({
                    full_name: formData.name,
                    email: formData.email,
                    role: formData.role,
                    permissions: formData.permissions,
                    access_key: accessKey,
                    avatar_url: formData.avatar_url || null
                })

                toast.success('New system administrator deployed successfully')
                setIsDialogOpen(false)
                fetchTeam()

                // Reset form
                setFormData({
                    name: '',
                    email: '',
                    role: 'admin',
                    avatar_url: '',
                    permissions: []
                })
            } catch (error: any) {
                toast.error(error.message || 'Deployment failed')
            }
        })
    }

    const handleRevoke = async (id: string) => {
        if (!confirm('Are you sure you want to revoke this administrator\'s access?')) return

        try {
            await revokeAdminAccess(id)
            toast.success('Administrator access revoked')
            fetchTeam()
        } catch (error: any) {
            toast.error(error.message || 'Recall failed')
        }
    }

    const togglePermission = (perm: AdminPermission) => {
        setFormData(prev => ({
            ...prev,
            permissions: prev.permissions.includes(perm)
                ? prev.permissions.filter(p => p !== perm)
                : [...prev.permissions, perm]
        }))
    }

    const handleCancel = () => {
        setIsDialogOpen(false)
    }

    const filteredTeam = team.filter(admin =>
        admin.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        admin.email.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-100 italic">Internal Command Team</h1>
                    <p className="text-zinc-500">
                        Manage administrative roles and system-locked access keys
                    </p>
                </div>
                {isMasterAdmin && (
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/10">
                                <UserPlus className="mr-2 h-4 w-4" />
                                Onboard New Admin
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 sm:max-w-2xl">
                            <DialogHeader>
                                <DialogTitle className="text-xl">Onboard New System Admin</DialogTitle>
                                <DialogDescription className="text-zinc-500">
                                    Assign a starting role and define specific access permissions.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-6 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-zinc-400">Full Name</Label>
                                        <Input
                                            id="name"
                                            placeholder="John Doe"
                                            className="bg-zinc-800 border-zinc-700"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-zinc-400">Email Address</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="john@acquifix.com"
                                            className="bg-zinc-800 border-zinc-700"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2 col-span-2">
                                        <Label htmlFor="avatar" className="text-zinc-400">Avatar URL (Optional)</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id="avatar"
                                                placeholder="https://..."
                                                className="bg-zinc-800 border-zinc-700"
                                                value={formData.avatar_url}
                                                onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                                            />
                                            <Button variant="outline" size="icon" className="border-zinc-800 shrink-0">
                                                <Camera className="h-4 w-4 text-zinc-500" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-xl bg-zinc-950 p-4 border border-zinc-800/50 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Key className="h-4 w-4 text-emerald-500" />
                                            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Auto-Generated Access Key</span>
                                        </div>
                                        <Badge className="bg-emerald-500/10 text-emerald-500 border-none">SECURE</Badge>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <code className="flex-1 bg-zinc-900 px-4 py-2 rounded-lg border border-zinc-800 text-emerald-400 font-mono text-sm tracking-widest">
                                            {accessKey}
                                        </code>
                                        <Button variant="outline" size="icon" className="border-zinc-800 h-9 w-9">
                                            <RefreshCw className="h-4 w-4 text-zinc-500" />
                                        </Button>
                                    </div>
                                    <p className="text-[10px] text-zinc-600">
                                        Note: This key will only be shown once. Please provide it securely to the team member.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <Label className="text-zinc-400">Permission Set</Label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {PERMISSIONS.map((permission) => (
                                            <div key={permission.id} className="flex items-start space-x-3 space-y-0 rounded-lg border border-zinc-800 p-3 hover:bg-zinc-800/50 transition-colors">
                                                <Checkbox
                                                    id={permission.id}
                                                    className="mt-1 border-zinc-600 data-[state=checked]:bg-primary"
                                                    checked={formData.permissions.includes(permission.id)}
                                                    onCheckedChange={() => togglePermission(permission.id)}
                                                />
                                                <div className="grid gap-1.5 leading-none">
                                                    <label
                                                        htmlFor={permission.id}
                                                        className="text-sm font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                    >
                                                        {permission.label}
                                                    </label>
                                                    <p className="text-xs text-zinc-500">
                                                        {permission.description}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    className="border-zinc-800 hover:bg-zinc-800"
                                    onClick={handleCancel}
                                    disabled={isPending}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className="bg-zinc-100 text-zinc-950 hover:bg-white font-bold"
                                    onClick={handleDeploy}
                                    disabled={isPending}
                                >
                                    {isPending ? (
                                        <>
                                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                            Deploying...
                                        </>
                                    ) : 'Deploy Access'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <div className="grid gap-6 lg:grid-cols-4">
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-500">Master Admins</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-primary" />
                            {team.filter(a => a.role === 'master').length}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-500">Operational Admins</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {team.filter(a => a.role === 'admin').length}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-500">Support Staff</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {team.filter(a => a.role === 'support').length}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-500">Total Force</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-500">
                            {team.length}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Team Hierarchy</CardTitle>
                            <CardDescription>Review and adjust internal permissions per user</CardDescription>
                        </div>
                        <div className="relative w-64">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
                            <Input
                                placeholder="Search team members..."
                                className="pl-9 bg-zinc-800/50 border-zinc-700"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader className="border-zinc-800">
                            <TableRow className="hover:bg-zinc-800/50 border-zinc-800">
                                <TableHead className="text-zinc-400">Team Member</TableHead>
                                <TableHead className="text-zinc-400">Authority</TableHead>
                                <TableHead className="text-zinc-400">Access Key (Master Only)</TableHead>
                                <TableHead className="text-zinc-400">Permissions</TableHead>
                                <TableHead className="text-zinc-400">Last Active</TableHead>
                                <TableHead className="text-right text-zinc-400">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredTeam.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-zinc-500">
                                        {isLoading ? (
                                            <div className="flex items-center justify-center gap-2">
                                                <RefreshCw className="h-4 w-4 animate-spin" />
                                                Scanning sector...
                                            </div>
                                        ) : (
                                            'No team members found in this sector.'
                                        )}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredTeam.map((admin) => (
                                    <TableRow key={admin.id} className="hover:bg-zinc-800/30 border-zinc-800 group transition-all">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9 border border-zinc-800">
                                                    <AvatarImage src={admin.avatar_url || ''} />
                                                    <AvatarFallback className="bg-zinc-800 text-zinc-400 text-xs text-center leading-9">
                                                        {admin.full_name?.substring(0, 2).toUpperCase() || '??'}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-zinc-100">{admin.full_name}</span>
                                                    <span className="text-xs text-zinc-500">{admin.email}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {admin.role === 'master' ? (
                                                    <Badge className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/30 px-2 py-1 uppercase text-[10px] font-black tracking-widest ring-1 ring-primary/50">
                                                        <ShieldCheck className="mr-1 h-3 w-3" />
                                                        Master Root
                                                    </Badge>
                                                ) : admin.role === 'admin' ? (
                                                    <Badge variant="secondary" className="bg-zinc-800 text-zinc-300 uppercase text-[10px] tracking-wider">
                                                        <Shield className="mr-1 h-3 w-3" />
                                                        Operational
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="border-zinc-800 text-zinc-500 uppercase text-[10px] tracking-wider">
                                                        <Users className="mr-1 h-3 w-3" />
                                                        {admin.role}
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {isMasterAdmin ? (
                                                <div className="flex items-center gap-2">
                                                    <code className="text-[10px] font-mono bg-zinc-950 px-2 py-1 rounded border border-zinc-800/50 text-emerald-500/80">
                                                        {visibleKeys[admin.id] ? admin.access_key : '••••••••••••'}
                                                    </code>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-zinc-600 hover:text-zinc-300"
                                                        onClick={() => toggleKeyVisibility(admin.id)}
                                                    >
                                                        {visibleKeys[admin.id] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                                    </Button>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-zinc-700 italic">Access Restricted</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1.5 max-w-[250px]">
                                                {admin.role === 'master' ? (
                                                    <span className="text-[10px] text-primary font-bold tracking-tight">FULL ACCESS</span>
                                                ) : (
                                                    admin.permissions?.slice(0, 3).map(p => (
                                                        <Badge key={p} variant="outline" className="bg-zinc-800/50 border-zinc-800 text-[9px] px-1.5 font-medium text-zinc-400">
                                                            {p.replace('_', ' ')}
                                                        </Badge>
                                                    ))
                                                )}
                                                {admin.permissions?.length > 3 && (
                                                    <Badge variant="outline" className="bg-zinc-800/50 border-zinc-800 text-[9px] px-1.5 text-zinc-500">
                                                        +{admin.permissions.length - 3}
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-sm text-zinc-300">{new Date(admin.created_at).toLocaleDateString()}</span>
                                                <span className="text-[10px] text-zinc-500">{new Date(admin.created_at).toLocaleTimeString()}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {isMasterAdmin && admin.role !== 'master' && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10"
                                                    onClick={() => handleRevoke(admin.id)}
                                                >
                                                    <ShieldAlert className="h-4 w-4" />
                                                </Button>
                                            )}
                                            {admin.role === 'master' && (
                                                <Lock className="h-4 w-4 text-zinc-700 ml-auto" />
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {isMasterAdmin && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <ShieldAlert className="h-6 w-6 text-primary" />
                        <h2 className="text-lg font-bold text-zinc-100">Master Admin Security Control</h2>
                    </div>
                    <p className="text-sm text-zinc-400 max-w-2xl">
                        As the Master Admin, any internal permissions you grant can be revoked instantly.
                        You are the only user with the authority to create others at the "Operational" level.
                    </p>
                    <div className="flex gap-4">
                        <Button variant="outline" className="border-primary/50 text-primary hover:bg-primary/10">View Security Logs</Button>
                        <Button className="bg-primary text-primary-foreground">Lock All Sub-Accounts</Button>
                    </div>
                </div>
            )}
        </div>
    )
}

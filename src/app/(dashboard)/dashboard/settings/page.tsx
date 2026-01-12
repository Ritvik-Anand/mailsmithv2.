'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
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
import {
    User,
    Users,
    Bell,
    Key,
    Palette,
    CreditCard,
    Loader2,
    Plus,
    Trash2,
    Mail,
    Shield,
    Link as LinkIcon,
} from 'lucide-react'
import { toast } from 'sonner'

// Mock team members
const mockTeamMembers = [
    {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'owner',
        avatarUrl: null,
        joinedAt: '2025-12-01',
    },
    {
        id: '2',
        name: 'Sarah Smith',
        email: 'sarah@example.com',
        role: 'admin',
        avatarUrl: null,
        joinedAt: '2026-01-05',
    },
    {
        id: '3',
        name: 'Mike Chen',
        email: 'mike@example.com',
        role: 'member',
        avatarUrl: null,
        joinedAt: '2026-01-10',
    },
]

const roleConfig: Record<string, { label: string; description: string }> = {
    owner: { label: 'Owner', description: 'Full access to all features' },
    admin: { label: 'Admin', description: 'Can manage team and campaigns' },
    member: { label: 'Member', description: 'Can view and edit campaigns' },
}

export default function SettingsPage() {
    const [profileLoading, setProfileLoading] = useState(false)
    const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
    const [notificationSettings, setNotificationSettings] = useState({
        emailReplies: true,
        campaignUpdates: true,
        weeklyDigest: false,
        systemAlerts: true,
    })

    const handleProfileSave = async () => {
        setProfileLoading(true)
        await new Promise((resolve) => setTimeout(resolve, 1500))
        toast.success('Profile updated successfully')
        setProfileLoading(false)
    }

    const maxTeamMembers = 5 // Based on plan

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">
                    Manage your account, team, and preferences
                </p>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="profile" className="space-y-6">
                <TabsList className="grid w-full max-w-2xl grid-cols-5">
                    <TabsTrigger value="profile">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                    </TabsTrigger>
                    <TabsTrigger value="team">
                        <Users className="mr-2 h-4 w-4" />
                        Team
                    </TabsTrigger>
                    <TabsTrigger value="notifications">
                        <Bell className="mr-2 h-4 w-4" />
                        Notifications
                    </TabsTrigger>
                    <TabsTrigger value="integrations">
                        <LinkIcon className="mr-2 h-4 w-4" />
                        Integrations
                    </TabsTrigger>
                    <TabsTrigger value="billing">
                        <CreditCard className="mr-2 h-4 w-4" />
                        Billing
                    </TabsTrigger>
                </TabsList>

                {/* Profile Tab */}
                <TabsContent value="profile" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile Information</CardTitle>
                            <CardDescription>Update your personal details</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Avatar */}
                            <div className="flex items-center gap-6">
                                <Avatar className="h-20 w-20">
                                    <AvatarImage src="/avatars/user.png" />
                                    <AvatarFallback className="text-2xl">JD</AvatarFallback>
                                </Avatar>
                                <div>
                                    <Button variant="outline" size="sm">
                                        Change Avatar
                                    </Button>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        JPG, PNG or GIF. Max 2MB.
                                    </p>
                                </div>
                            </div>

                            <Separator />

                            {/* Form Fields */}
                            <div className="grid gap-4 max-w-md">
                                <div className="space-y-2">
                                    <Label htmlFor="full-name">Full Name</Label>
                                    <Input id="full-name" defaultValue="John Doe" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" type="email" defaultValue="john@example.com" disabled />
                                    <p className="text-xs text-muted-foreground">
                                        Contact support to change your email
                                    </p>
                                </div>
                            </div>

                            <Button onClick={handleProfileSave} disabled={profileLoading}>
                                {profileLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Password */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Password</CardTitle>
                            <CardDescription>Update your password</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 max-w-md">
                            <div className="space-y-2">
                                <Label htmlFor="current-password">Current Password</Label>
                                <Input id="current-password" type="password" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new-password">New Password</Label>
                                <Input id="new-password" type="password" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirm-password">Confirm New Password</Label>
                                <Input id="confirm-password" type="password" />
                            </div>
                            <Button variant="outline">Update Password</Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Team Tab */}
                <TabsContent value="team" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Team Members</CardTitle>
                                    <CardDescription>
                                        {mockTeamMembers.length}/{maxTeamMembers} members on your plan
                                    </CardDescription>
                                </div>
                                <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button disabled={mockTeamMembers.length >= maxTeamMembers}>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Invite Member
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Invite Team Member</DialogTitle>
                                            <DialogDescription>
                                                Send an invitation to join your team
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="invite-email">Email Address</Label>
                                                <Input id="invite-email" type="email" placeholder="colleague@company.com" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="invite-role">Role</Label>
                                                <Select defaultValue="member">
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="admin">Admin</SelectItem>
                                                        <SelectItem value="member">Member</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                                                Cancel
                                            </Button>
                                            <Button onClick={() => {
                                                toast.success('Invitation sent!')
                                                setInviteDialogOpen(false)
                                            }}>
                                                <Mail className="mr-2 h-4 w-4" />
                                                Send Invitation
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Member</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Joined</TableHead>
                                        <TableHead className="w-[80px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {mockTeamMembers.map((member) => (
                                        <TableRow key={member.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={member.avatarUrl || undefined} />
                                                        <AvatarFallback>
                                                            {member.name.split(' ').map((n) => n[0]).join('')}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="font-medium">{member.name}</div>
                                                        <div className="text-sm text-muted-foreground">{member.email}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={member.role === 'owner' ? 'default' : 'secondary'}>
                                                    {roleConfig[member.role].label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {member.joinedAt}
                                            </TableCell>
                                            <TableCell>
                                                {member.role !== 'owner' && (
                                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Role Permissions Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Role Permissions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {Object.entries(roleConfig).map(([role, config]) => (
                                    <div key={role} className="flex items-center gap-4">
                                        <Badge variant={role === 'owner' ? 'default' : 'secondary'} className="w-20 justify-center">
                                            {config.label}
                                        </Badge>
                                        <span className="text-sm text-muted-foreground">{config.description}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Notifications Tab */}
                <TabsContent value="notifications">
                    <Card>
                        <CardHeader>
                            <CardTitle>Notification Preferences</CardTitle>
                            <CardDescription>Choose what you want to be notified about</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>Email Replies</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Get notified when someone replies to your campaigns
                                        </p>
                                    </div>
                                    <Switch
                                        checked={notificationSettings.emailReplies}
                                        onCheckedChange={(checked) =>
                                            setNotificationSettings({ ...notificationSettings, emailReplies: checked })
                                        }
                                    />
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>Campaign Updates</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Notifications when campaigns complete or need attention
                                        </p>
                                    </div>
                                    <Switch
                                        checked={notificationSettings.campaignUpdates}
                                        onCheckedChange={(checked) =>
                                            setNotificationSettings({ ...notificationSettings, campaignUpdates: checked })
                                        }
                                    />
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>Weekly Digest</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Weekly summary of your campaign performance
                                        </p>
                                    </div>
                                    <Switch
                                        checked={notificationSettings.weeklyDigest}
                                        onCheckedChange={(checked) =>
                                            setNotificationSettings({ ...notificationSettings, weeklyDigest: checked })
                                        }
                                    />
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>System Alerts</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Important system updates and maintenance notices
                                        </p>
                                    </div>
                                    <Switch
                                        checked={notificationSettings.systemAlerts}
                                        onCheckedChange={(checked) =>
                                            setNotificationSettings({ ...notificationSettings, systemAlerts: checked })
                                        }
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Integrations Tab */}
                <TabsContent value="integrations">
                    <Card>
                        <CardHeader>
                            <CardTitle>Instantly</CardTitle>
                            <CardDescription>Connect your Instantly account for email campaigns</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-4 p-4 rounded-lg border bg-muted/50">
                                <Mail className="h-10 w-10 text-blue-500" />
                                <div className="flex-1">
                                    <h4 className="font-medium">Instantly.ai</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Email campaign automation
                                    </p>
                                </div>
                                <Badge variant="outline" className="text-amber-500 border-amber-500">
                                    Not Connected
                                </Badge>
                            </div>
                            <div className="space-y-2 max-w-md">
                                <Label htmlFor="instantly-key">API Key</Label>
                                <Input id="instantly-key" type="password" placeholder="Enter your Instantly API key" />
                                <p className="text-xs text-muted-foreground">
                                    Find your API key in Instantly Settings → API
                                </p>
                            </div>
                            <Button>
                                <Key className="mr-2 h-4 w-4" />
                                Connect Instantly
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Billing Tab */}
                <TabsContent value="billing">
                    <Card>
                        <CardHeader>
                            <CardTitle>Current Plan</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between p-6 rounded-lg border bg-gradient-to-r from-primary/10 to-transparent">
                                <div>
                                    <Badge className="mb-2">Pro Plan</Badge>
                                    <h3 className="text-2xl font-bold">$49/month</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Billed monthly • Next billing: Feb 12, 2026
                                    </p>
                                </div>
                                <Button variant="outline">Manage Subscription</Button>
                            </div>

                            <div>
                                <h4 className="font-medium mb-4">Usage</h4>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Leads</span>
                                        <span className="font-medium">450 / 10,000</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                                        <div className="h-full bg-primary" style={{ width: '4.5%' }} />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Campaigns</span>
                                        <span className="font-medium">6 / 25</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                                        <div className="h-full bg-primary" style={{ width: '24%' }} />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Team Members</span>
                                        <span className="font-medium">3 / 5</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                                        <div className="h-full bg-primary" style={{ width: '60%' }} />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

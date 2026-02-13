'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Bell, Mail, Shield, User } from 'lucide-react'

export default function OperatorSettingsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">
                    Manage your operator preferences and notifications.
                </p>
            </div>

            {/* Profile Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Profile Settings
                    </CardTitle>
                    <CardDescription>
                        Update your personal information and preferences
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="name">Display Name</Label>
                            <Input
                                id="name"
                                placeholder="Your name"
                                defaultValue="Operator"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="operator@mailsmith.com"
                                disabled
                            />
                        </div>
                    </div>
                    <Button>Save Changes</Button>
                </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Notification Preferences
                    </CardTitle>
                    <CardDescription>
                        Choose how you want to be notified about events
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Email Notifications</Label>
                            <p className="text-sm text-muted-foreground">
                                Receive email updates on campaign activity
                            </p>
                        </div>
                        <Switch defaultChecked />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Customer Replies</Label>
                            <p className="text-sm text-muted-foreground">
                                Get notified when customers reply to campaigns
                            </p>
                        </div>
                        <Switch defaultChecked />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Scrape Job Completion</Label>
                            <p className="text-sm text-muted-foreground">
                                Notify when lead scraping jobs finish
                            </p>
                        </div>
                        <Switch defaultChecked />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>System Updates</Label>
                            <p className="text-sm text-muted-foreground">
                                Receive notifications about system changes
                            </p>
                        </div>
                        <Switch />
                    </div>
                </CardContent>
            </Card>

            {/* Email Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        Email Configuration
                    </CardTitle>
                    <CardDescription>
                        Configure email sending preferences
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="signature">Email Signature</Label>
                        <textarea
                            id="signature"
                            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            placeholder="Best regards,&#10;Your Name&#10;MailSmith Operator"
                        />
                    </div>
                    <Button>Save Signature</Button>
                </CardContent>
            </Card>

            {/* Security Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Security
                    </CardTitle>
                    <CardDescription>
                        Manage your account security settings
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Two-Factor Authentication</Label>
                            <p className="text-sm text-muted-foreground">
                                Add an extra layer of security to your account
                            </p>
                        </div>
                        <Button variant="outline">Configure</Button>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                        <Label>Change Password</Label>
                        <p className="text-sm text-muted-foreground mb-2">
                            Update your password regularly for better security
                        </p>
                        <Button variant="outline">Change Password</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

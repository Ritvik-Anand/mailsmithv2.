'use client'

import { useEffect, useCallback } from 'react'

const TIMEOUT_DURATION = 15 * 60 * 1000 // 15 minutes in milliseconds

export function SessionTracker() {
    const handleLogout = useCallback(() => {
        // Clear cookies
        document.cookie = "admin_access=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;"
        document.cookie = "admin_last_active=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;"
        // Reload to show login gate
        window.location.reload()
    }, [])

    const updateLastActive = useCallback(() => {
        const now = Date.now()
        document.cookie = `admin_last_active=${now}; path=/; max-age=3600; samesite=lax`
    }, [])

    useEffect(() => {
        const checkSession = () => {
            const cookies = document.cookie.split('; ')
            const lastActiveCookie = cookies.find(row => row.startsWith('admin_last_active='))

            if (lastActiveCookie) {
                const lastActiveTime = parseInt(lastActiveCookie.split('=')[1])
                const currentTime = Date.now()

                if (currentTime - lastActiveTime > TIMEOUT_DURATION) {
                    handleLogout()
                }
            }
        }

        // Event listeners for activity
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove']

        const resetTimer = () => {
            updateLastActive()
        }

        events.forEach(event => {
            window.addEventListener(event, resetTimer)
        })

        // Check for timeout every 30 seconds
        const intervalId = setInterval(checkSession, 30000)

        return () => {
            events.forEach(event => {
                window.removeEventListener(event, resetTimer)
            })
            clearInterval(intervalId)
        }
    }, [handleLogout, updateLastActive])

    return null // This is a logic-only component
}

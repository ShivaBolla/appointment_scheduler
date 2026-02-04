'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import NotificationToast from './NotificationToast';

export default function Notifications() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Popup state
    const [popupNotification, setPopupNotification] = useState(null);
    const lastNotificationIdRef = useRef(null);
    const isFirstLoadRef = useRef(true);

    const dropdownRef = useRef(null);

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/notifications');
            if (res.ok) {
                const data = await res.json();
                const fetchedNotifications = data.notifications;

                setNotifications(fetchedNotifications);
                setUnreadCount(data.unreadCount);

                // Detection logic for new popup
                if (fetchedNotifications.length > 0) {
                    const latest = fetchedNotifications[0];

                    // If it's not the first load, and the ID is different from the last one we saw
                    if (!isFirstLoadRef.current && latest._id !== lastNotificationIdRef.current) {
                        // And it is unread
                        if (!latest.read) {
                            setPopupNotification(latest);
                            // Play a subtle sound? (Optional, maybe later)
                        }
                    }

                    lastNotificationIdRef.current = latest._id;
                }

                if (isFirstLoadRef.current) {
                    isFirstLoadRef.current = false;
                }
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    };

    useEffect(() => {
        if (user) {
            fetchNotifications();
            // Poll every 10 seconds for more responsive updates
            const interval = setInterval(fetchNotifications, 10000);
            return () => clearInterval(interval);
        }
    }, [user]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAsRead = async (id) => {
        try {
            await fetch(`/api/notifications/${id}`, { method: 'PATCH' });
            setNotifications((prev) =>
                prev.map((n) => (n._id === id ? { ...n, read: true } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            setIsLoading(true);
            await fetch('/api/notifications', { method: 'PATCH' });
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'booking_approved':
                return (
                    <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center border border-green-200">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                );
            case 'booking_rejected':
            case 'booking_cancelled':
                return (
                    <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center border border-red-200">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                );
            case 'cancellation_request':
            case 'reschedule_request':
                return (
                    <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center border border-orange-200">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                    </div>
                );
            default:
                return (
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center border border-blue-200">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                );
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Popup Toast */}
            {popupNotification && (
                <NotificationToast
                    title={popupNotification.title}
                    message={popupNotification.message}
                    type={popupNotification.type}
                    onClose={() => setPopupNotification(null)}
                />
            )}

            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-all"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-600 rounded-full border border-background"></span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-background border border-border rounded-xl shadow-xl overflow-hidden z-[90]">
                    <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
                        <h3 className="text-foreground font-semibold">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                disabled={isLoading}
                                className="text-xs text-primary hover:text-primary/80 transition-colors font-medium"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">
                                <p>No notifications yet</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification._id}
                                        onClick={() => !notification.read && markAsRead(notification._id)}
                                        className={`p-4 hover:bg-muted/30 transition-colors cursor-pointer ${!notification.read ? 'bg-muted/10' : ''
                                            }`}
                                    >
                                        <div className="flex gap-3">
                                            {getIcon(notification.type)}
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4
                                                        className={`text-sm font-medium ${!notification.read ? 'text-foreground' : 'text-muted-foreground'
                                                            }`}
                                                    >
                                                        {notification.title}
                                                    </h4>
                                                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                                        {new Date(notification.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                                                    {notification.message}
                                                </p>
                                            </div>
                                            {!notification.read && (
                                                <div className="w-2 h-2 mt-1.5 bg-primary rounded-full flex-shrink-0"></div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

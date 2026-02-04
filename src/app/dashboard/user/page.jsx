'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

const statusStyles = {
    pending: 'bg-yellow-50/50 text-yellow-700 border-yellow-200',
    approved: 'bg-green-50/50 text-green-700 border-green-200',
    rejected: 'bg-red-50/50 text-red-700 border-red-200',
    cancelled: 'bg-zinc-50/50 text-zinc-700 border-zinc-200',
    completed: 'bg-blue-50/50 text-blue-700 border-blue-200',
    cancellation_requested: 'bg-orange-50/50 text-orange-700 border-orange-200',
    reschedule_requested: 'bg-purple-50/50 text-purple-700 border-purple-200',
};

export default function UserDashboard() {
    const { token } = useAuth();
    const [appointments, setAppointments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showRescheduleModal, setShowRescheduleModal] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [rescheduleData, setRescheduleData] = useState({ date: '', time: '', reason: '' });
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchAppointments();
    }, [token]);

    const handleCancelRequest = async () => {
        if (!selectedAppointment) return;
        setActionLoading(true);
        try {
            const res = await fetch(`/api/appointments/${selectedAppointment._id}/cancel`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ reason: cancelReason }),
            });
            if (!res.ok) throw new Error('Failed to submit cancellation request');
            await fetchAppointments();
            setShowCancelModal(false);
            setCancelReason('');
        } catch (err) {
            alert('Failed to submit request');
        } finally {
            setActionLoading(false);
        }
    };

    const handleRescheduleRequest = async () => {
        if (!selectedAppointment || !rescheduleData.date || !rescheduleData.time) return;
        setActionLoading(true);
        try {
            const newStartTime = new Date(`${rescheduleData.date}T${rescheduleData.time}`);
            const res = await fetch(`/api/appointments/${selectedAppointment._id}/reschedule`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    newStartTime: newStartTime.toISOString(),
                    reason: rescheduleData.reason,
                }),
            });
            if (!res.ok) throw new Error('Failed to submit reschedule request');
            await fetchAppointments();
            setShowRescheduleModal(false);
            setRescheduleData({ date: '', time: '', reason: '' });
        } catch (err) {
            alert('Failed to submit request');
        } finally {
            setActionLoading(false);
        }
    };

    const fetchAppointments = async () => {
        try {
            const response = await fetch('/api/appointments', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error('Failed to fetch appointments');

            const data = await response.json();
            setAppointments(data.appointments);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load appointments');
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const formatTime = (dateString) => {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div>
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">My Appointments</h1>
                    <p className="text-muted-foreground mt-1">View and manage your scheduled appointments</p>
                </div>
                <Link
                    href="/dashboard/user/book"
                    className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors shadow-sm"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Book Appointment
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'Total', value: appointments.length },
                    { label: 'Pending', value: appointments.filter(a => a.status === 'pending').length },
                    { label: 'Approved', value: appointments.filter(a => a.status === 'approved').length },
                    { label: 'Rejected', value: appointments.filter(a => a.status === 'rejected').length },
                ].map((stat) => (
                    <div
                        key={stat.label}
                        className="bg-background rounded-xl p-6 border border-border"
                    >
                        <p className="text-muted-foreground text-sm font-medium">{stat.label}</p>
                        <p className="text-3xl font-bold mt-1 text-foreground">
                            {stat.value}
                        </p>
                    </div>
                ))}
            </div>

            {/* Appointments List */}
            {isLoading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
                </div>
            ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
                    {error}
                </div>
            ) : appointments.length === 0 ? (
                <div className="bg-muted/30 rounded-xl p-12 text-center border border-border border-dashed">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                        <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-foreground">No appointments yet</h3>
                    <p className="text-muted-foreground mb-6">Book your first appointment to get started</p>
                    <Link
                        href="/dashboard/user/book"
                        className="px-6 py-2 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors"
                    >
                        Book Now
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {appointments.map((appointment) => (
                        <div
                            key={appointment._id}
                            className="bg-background rounded-xl p-6 border border-border hover:border-foreground/20 transition-all duration-200 shadow-sm"
                        >
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-3 mb-2">
                                        <h3 className="text-lg font-semibold text-foreground">{appointment.title}</h3>
                                        <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full border ${statusStyles[appointment.status]}`}>
                                            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                                        </span>
                                        <span className={`px-2 py-0.5 text-xs rounded border border-border bg-muted/50 text-muted-foreground`}>
                                            {appointment.type}
                                        </span>
                                    </div>
                                    {appointment.description && (
                                        <p className="text-muted-foreground text-sm mb-3">{appointment.description}</p>
                                    )}
                                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                        <span className="flex items-center">
                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            {formatDate(appointment.startTime)}
                                        </span>
                                        <span className="flex items-center">
                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                                        </span>
                                    </div>
                                </div>
                                {appointment.status === 'approved' && appointment.meetingLink && (
                                    <a
                                        href={appointment.meetingLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-4 lg:mt-0 inline-flex items-center px-4 py-2 border border-input bg-background hover:bg-muted text-foreground rounded-md transition-colors text-sm font-medium"
                                    >
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                        Join Meeting
                                    </a>
                                )}
                            </div>
                            {(appointment.status === 'pending' || appointment.status === 'approved') && (
                                <div className="mt-4 flex space-x-3 border-t border-border pt-4">
                                    <button
                                        onClick={() => {
                                            setSelectedAppointment(appointment);
                                            setShowRescheduleModal(true);
                                        }}
                                        className="text-sm text-foreground hover:text-muted-foreground transition-colors font-medium"
                                    >
                                        Reschedule
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSelectedAppointment(appointment);
                                            setShowCancelModal(true);
                                        }}
                                        className="text-sm text-red-600 hover:text-red-700 transition-colors font-medium"
                                    >
                                        Cancel Request
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}


            {/* Cancel Modal */}
            {
                showCancelModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                        <div className="bg-background rounded-xl w-full max-w-md border border-border p-6 shadow-lg">
                            <h3 className="text-xl font-bold text-foreground mb-4">Request Cancellation</h3>
                            <p className="text-muted-foreground mb-4 text-sm">Please provide a reason for cancelling this appointment.</p>
                            <textarea
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                className="w-full bg-background border border-input rounded-md p-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary mb-4 h-32"
                                placeholder="Reason for cancellation..."
                            />
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setShowCancelModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={handleCancelRequest}
                                    disabled={actionLoading || !cancelReason.trim()}
                                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 text-sm font-medium"
                                >
                                    {actionLoading ? 'Submitting...' : 'Confirm Request'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Reschedule Modal */}
            {
                showRescheduleModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                        <div className="bg-background rounded-xl w-full max-w-md border border-border p-6 shadow-lg">
                            <h3 className="text-xl font-bold text-foreground mb-4">Request Reschedule</h3>
                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">New Date</label>
                                    <input
                                        type="date"
                                        value={rescheduleData.date}
                                        onChange={(e) => setRescheduleData({ ...rescheduleData, date: e.target.value })}
                                        className="w-full bg-background border border-input rounded-md p-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">New Time</label>
                                    <input
                                        type="time"
                                        value={rescheduleData.time}
                                        onChange={(e) => setRescheduleData({ ...rescheduleData, time: e.target.value })}
                                        className="w-full bg-background border border-input rounded-md p-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">Reason</label>
                                    <textarea
                                        value={rescheduleData.reason}
                                        onChange={(e) => setRescheduleData({ ...rescheduleData, reason: e.target.value })}
                                        className="w-full bg-background border border-input rounded-md p-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary h-24 sm:text-sm"
                                        placeholder="Reason for rescheduling..."
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setShowRescheduleModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={handleRescheduleRequest}
                                    disabled={actionLoading || !rescheduleData.date || !rescheduleData.time}
                                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 text-sm font-medium"
                                >
                                    {actionLoading ? 'Submitting...' : 'Confirm Request'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    );
}

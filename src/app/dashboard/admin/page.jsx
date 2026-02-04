'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

const statusStyles = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    approved: 'bg-green-100 text-green-800 border-green-200',
    rejected: 'bg-red-100 text-red-800 border-red-200',
    cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
    completed: 'bg-blue-100 text-blue-800 border-blue-200',
    cancellation_requested: 'bg-orange-100 text-orange-800 border-orange-200',
    reschedule_requested: 'bg-indigo-100 text-indigo-800 border-indigo-200',
};

export default function AdminDashboard() {
    const { token } = useAuth();
    const [appointments, setAppointments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [meetingLinkModal, setMeetingLinkModal] = useState(null);

    useEffect(() => {
        fetchAppointments();
    }, [token]);

    const fetchAppointments = async () => {
        try {
            const response = await fetch('/api/appointments', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            setAppointments(data.appointments);
        } catch (err) {
            console.error('Failed to fetch appointments', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleApprove = async (id, meetingLink) => {
        setActionLoading(id);
        try {
            const response = await fetch(`/api/appointments/${id}/approve`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ meetingLink }),
            });

            if (response.ok) {
                fetchAppointments();
                setMeetingLinkModal(null);
            }
        } catch (err) {
            console.error('Failed to approve', err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (id) => {
        setActionLoading(id);
        try {
            const response = await fetch(`/api/appointments/${id}/reject`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({}),
            });

            if (response.ok) {
                fetchAppointments();
            }
        } catch (err) {
            console.error('Failed to reject', err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleRequestAction = async (id, action) => {
        setActionLoading(id);
        try {
            const response = await fetch(`/api/appointments/${id}/handle-request`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ action }),
            });

            if (response.ok) {
                fetchAppointments();
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to process request');
            }
        } catch (err) {
            console.error('Failed to process request', err);
        } finally {
            setActionLoading(null);
        }
    };

    const formatDateTime = (dateString) => {
        return new Date(dateString).toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const pendingCount = appointments.filter((a) => a.status === 'pending').length;
    const todayCount = appointments.filter((a) => {
        const today = new Date().toDateString();
        return new Date(a.startTime).toDateString() === today;
    }).length;

    return (
        <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground mb-8">Manage appointment requests</p>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'Total Appointments', value: appointments.length },
                    { label: 'Pending Approval', value: pendingCount },
                    { label: 'Today', value: todayCount },
                    { label: 'Approved', value: appointments.filter((a) => a.status === 'approved').length },
                ].map((stat) => (
                    <div key={stat.label} className="bg-background rounded-xl p-6 border border-border">
                        <p className="text-muted-foreground text-sm font-medium">{stat.label}</p>
                        <p className="text-3xl font-bold mt-1 text-foreground">
                            {stat.value}
                        </p>
                    </div>
                ))}
            </div>

            {/* Requests Section */}
            <div className="mb-8">
                <h2 className="text-lg font-semibold text-foreground mb-4">Cancellation & Reschedule Requests</h2>
                {appointments.filter(a => ['cancellation_requested', 'reschedule_requested'].includes(a.status)).length === 0 ? (
                    <div className="bg-background rounded-xl p-6 text-center border border-border border-dashed mb-6">
                        <p className="text-muted-foreground">No active requests</p>
                    </div>
                ) : (
                    <div className="space-y-4 mb-6">
                        {appointments.filter(a => ['cancellation_requested', 'reschedule_requested'].includes(a.status)).map((appointment) => (
                            <div key={appointment._id} className="bg-background rounded-xl p-6 border border-border border-l-4 border-l-orange-500 shadow-sm">
                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3 mb-2">
                                            <h3 className="text-lg font-semibold text-foreground">{appointment.title}</h3>
                                            <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full border ${statusStyles[appointment.status]}`}>
                                                {appointment.status === 'cancellation_requested' ? 'Cancellation Request' : 'Reschedule Request'}
                                            </span>
                                        </div>

                                        <div className="bg-muted/30 rounded-lg p-3 mb-3 border border-border">
                                            {appointment.status === 'cancellation_requested' ? (
                                                <p className="text-sm text-foreground"><span className="text-muted-foreground font-medium">Reason:</span> {appointment.cancellationReason}</p>
                                            ) : (
                                                <div className="space-y-1">
                                                    <p className="text-sm text-foreground"><span className="text-muted-foreground font-medium">New Time:</span> {appointment.rescheduleRequestedTime ? formatDateTime(appointment.rescheduleRequestedTime) : 'N/A'}</p>
                                                    <p className="text-sm text-foreground"><span className="text-muted-foreground font-medium">Reason:</span> {appointment.rescheduleReason}</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex gap-4 text-xs text-muted-foreground">
                                            <span>Original: {formatDateTime(appointment.startTime)}</span>
                                            <span>By: {appointment.name}</span>
                                        </div>
                                    </div>
                                    <div className="flex space-x-3">
                                        {appointment.status === 'cancellation_requested' ? (
                                            <>
                                                <button
                                                    onClick={() => handleRequestAction(appointment._id, 'confirm_cancel')}
                                                    disabled={actionLoading === appointment._id}
                                                    className="px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-md hover:bg-red-100 transition-colors disabled:opacity-50 text-sm font-medium"
                                                >
                                                    Approve Cancel
                                                </button>
                                                <button
                                                    onClick={() => handleRequestAction(appointment._id, 'reject_cancel')}
                                                    disabled={actionLoading === appointment._id}
                                                    className="px-4 py-2 bg-muted text-muted-foreground border border-border rounded-md hover:bg-muted/80 transition-colors disabled:opacity-50 text-sm font-medium"
                                                >
                                                    Reject
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => handleRequestAction(appointment._id, 'confirm_reschedule')}
                                                    disabled={actionLoading === appointment._id}
                                                    className="px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md hover:bg-indigo-100 transition-colors disabled:opacity-50 text-sm font-medium"
                                                >
                                                    Approve New Time
                                                </button>
                                                <button
                                                    onClick={() => handleRequestAction(appointment._id, 'reject_reschedule')}
                                                    disabled={actionLoading === appointment._id}
                                                    className="px-4 py-2 bg-muted text-muted-foreground border border-border rounded-md hover:bg-muted/80 transition-colors disabled:opacity-50 text-sm font-medium"
                                                >
                                                    Reject
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Pending Requests */}
            <div className="mb-8">
                <h2 className="text-lg font-semibold text-foreground mb-4">Pending Requests</h2>
                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                    </div>
                ) : appointments.filter((a) => a.status === 'pending').length === 0 ? (
                    <div className="bg-background rounded-xl p-8 text-center border border-border border-dashed">
                        <p className="text-muted-foreground">No pending requests</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {appointments
                            .filter((a) => a.status === 'pending')
                            .map((appointment) => (
                                <div
                                    key={appointment._id}
                                    className="bg-background rounded-xl p-6 border border-border shadow-sm hover:border-foreground/20 transition-all"
                                >
                                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3 mb-2">
                                                <h3 className="text-lg font-semibold text-foreground">{appointment.title}</h3>
                                                <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full border bg-muted/50 text-muted-foreground border-border`}>
                                                    {appointment.type}
                                                </span>
                                            </div>
                                            <p className="text-muted-foreground text-sm mb-2">{appointment.description}</p>
                                            <div className="flex gap-4 text-xs text-muted-foreground">
                                                <span>{formatDateTime(appointment.startTime)}</span>
                                                <span>By: {appointment.name}</span>
                                            </div>
                                        </div>
                                        <div className="flex space-x-3">
                                            <button
                                                onClick={() => setMeetingLinkModal({ id: appointment._id, link: '' })}
                                                className="p-2 bg-green-50 text-green-600 border border-green-200 hover:bg-green-100 rounded-md transition-colors"
                                                title="Approve"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleReject(appointment._id)}
                                                className="p-2 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 rounded-md transition-colors"
                                                title="Reject"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                    </div>
                )}
            </div>

            {/* Meeting Link Modal */}
            {meetingLinkModal && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-background rounded-xl p-6 w-full max-w-md border border-border shadow-lg">
                        <h3 className="text-lg font-semibold text-foreground mb-4">Add Meeting Link (Optional)</h3>
                        <input
                            type="url"
                            value={meetingLinkModal.link}
                            onChange={(e) => setMeetingLinkModal({ ...meetingLinkModal, link: e.target.value })}
                            placeholder="https://meet.google.com/..."
                            className="w-full px-4 py-3 bg-background border border-input rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary mb-4"
                        />
                        <div className="flex space-x-3">
                            <button
                                onClick={() => setMeetingLinkModal(null)}
                                className="flex-1 py-2 bg-muted text-muted-foreground border border-border rounded-lg hover:bg-muted/80 transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleApprove(meetingLinkModal.id, meetingLinkModal.link)}
                                className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                            >
                                Approve
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

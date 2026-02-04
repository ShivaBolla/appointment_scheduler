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

export default function AppointmentsPage() {
    const { token } = useAuth();
    const [appointments, setAppointments] = useState([]);
    const [filteredAppointments, setFilteredAppointments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (token) {
            fetchAppointments();
        }
    }, [token]);

    useEffect(() => {
        let result = appointments;

        if (statusFilter !== 'all') {
            result = result.filter((a) => a.status === statusFilter);
        }

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(
                (a) =>
                    a.title.toLowerCase().includes(term) ||
                    a.name.toLowerCase().includes(term) ||
                    a.email.toLowerCase().includes(term)
            );
        }

        setFilteredAppointments(result);
    }, [appointments, statusFilter, searchTerm]);

    const fetchAppointments = async () => {
        try {
            const response = await fetch('/api/appointments', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            setAppointments(data.appointments);
            setFilteredAppointments(data.appointments);
        } catch (err) {
            console.error('Failed to fetch appointments', err);
        } finally {
            setIsLoading(false);
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

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">All Appointments</h1>
            <p className="text-muted-foreground mb-8">View and manage all booking history</p>

            {/* Filters */}
            <div className="bg-background rounded-xl p-4 border border-border mb-8 flex flex-col md:flex-row gap-4 shadow-sm">
                <div className="flex-1">
                    <input
                        type="text"
                        placeholder="Search by title, name, or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 bg-muted/20 border border-border rounded-lg text-foreground focus:ring-primary focus:border-primary placeholder-muted-foreground focus:outline-none focus:ring-1"
                    />
                </div>
                <div className="w-full md:w-48">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full px-4 py-2 bg-muted/20 border border-border rounded-lg text-foreground focus:ring-primary focus:border-primary focus:outline-none focus:ring-1"
                    >
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="cancellation_requested">Cancellation Requested</option>
                        <option value="reschedule_requested">Reschedule Requested</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-background rounded-xl border border-border overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border bg-muted/30">
                                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Date & Time</th>
                                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Title</th>
                                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">User</th>
                                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Type</th>
                                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAppointments.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                                        No appointments found
                                    </td>
                                </tr>
                            ) : (
                                filteredAppointments.map((appointment) => (
                                    <tr key={appointment._id} className="border-b border-border hover:bg-muted/10 transition-colors last:border-0">
                                        <td className="px-6 py-4 text-foreground/80 whitespace-nowrap text-sm">
                                            {formatDateTime(appointment.startTime)}
                                        </td>
                                        <td className="px-6 py-4 text-foreground font-medium">{appointment.title}</td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            <div>
                                                <p className="text-foreground text-sm">{appointment.name}</p>
                                                <p className="text-xs text-muted-foreground">{appointment.email}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full border bg-muted/50 text-muted-foreground border-border`}>
                                                {appointment.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full border ${statusStyles[appointment.status]}`}>
                                                {appointment.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

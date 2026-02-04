'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function BlockedSlotsPage() {
    const { token } = useAuth();
    const [blockedSlots, setBlockedSlots] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        date: '',
        startTime: '',
        endTime: '',
        reason: '',
    });

    useEffect(() => {
        if (token) {
            fetchBlockedSlots();
        }
    }, [token]);

    const fetchBlockedSlots = async () => {
        try {
            const response = await fetch('/api/blocked-slots', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (response.ok) {
                setBlockedSlots(data.blockedSlots);
            }
        } catch (err) {
            console.error('Failed to fetch blocked slots', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const start = new Date(`${formData.date}T${formData.startTime}`);
        const end = new Date(`${formData.date}T${formData.endTime}`);

        try {
            const response = await fetch('/api/blocked-slots', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    startTime: start,
                    endTime: end,
                    reason: formData.reason,
                }),
            });

            if (response.ok) {
                setFormData({ date: '', startTime: '', endTime: '', reason: '' });
                fetchBlockedSlots();
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to block slot');
            }
        } catch (err) {
            console.error('Failed to block slot', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to unblock this slot?')) return;

        try {
            const response = await fetch(`/api/blocked-slots/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                setBlockedSlots(blockedSlots.filter((slot) => slot._id !== id));
            } else {
                alert('Failed to delete slot');
            }
        } catch (err) {
            console.error('Failed to delete slot', err);
        }
    };

    const formatDateTime = (dateString) => {
        return new Date(dateString).toLocaleString();
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
            <h1 className="text-2xl font-bold text-foreground mb-2">Blocked Slots</h1>
            <p className="text-muted-foreground mb-8">Manage unavailable times</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form */}
                <div className="bg-background rounded-xl p-6 border border-border h-fit shadow-sm">
                    <h2 className="text-lg font-semibold text-foreground mb-4">Block New Slot</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">Date</label>
                            <input
                                type="date"
                                required
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="w-full px-4 py-2 bg-muted/20 border border-border rounded-lg text-foreground focus:ring-primary focus:border-primary focus:outline-none focus:ring-1"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">Start Time</label>
                                <input
                                    type="time"
                                    required
                                    value={formData.startTime}
                                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                    className="w-full px-4 py-2 bg-muted/20 border border-border rounded-lg text-foreground focus:ring-primary focus:border-primary focus:outline-none focus:ring-1"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">End Time</label>
                                <input
                                    type="time"
                                    required
                                    value={formData.endTime}
                                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                    className="w-full px-4 py-2 bg-muted/20 border border-border rounded-lg text-foreground focus:ring-primary focus:border-primary focus:outline-none focus:ring-1"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">Reason (Optional)</label>
                            <input
                                type="text"
                                value={formData.reason}
                                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                placeholder="e.g. Lunch break"
                                className="w-full px-4 py-2 bg-muted/20 border border-border rounded-lg text-foreground focus:ring-primary focus:border-primary focus:outline-none focus:ring-1"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 font-medium"
                        >
                            {isSubmitting ? 'Blocking...' : 'Block Slot'}
                        </button>
                    </form>
                </div>

                {/* List */}
                <div className="lg:col-span-2">
                    <div className="bg-background rounded-xl border border-border overflow-hidden shadow-sm">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border bg-muted/30">
                                    <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Start Time</th>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">End Time</th>
                                    <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Reason</th>
                                    <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {blockedSlots.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                                            No blocked slots found
                                        </td>
                                    </tr>
                                ) : (
                                    blockedSlots.map((slot) => (
                                        <tr key={slot._id} className="border-b border-border hover:bg-muted/10 transition-colors last:border-0">
                                            <td className="px-6 py-4 text-foreground text-sm">
                                                {formatDateTime(slot.startTime)}
                                            </td>
                                            <td className="px-6 py-4 text-foreground text-sm">
                                                {formatDateTime(slot.endTime)}
                                            </td>
                                            <td className="px-6 py-4 text-muted-foreground text-sm">
                                                {slot.reason || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleDelete(slot._id)}
                                                    className="text-red-600 hover:text-red-500 transition-colors text-sm font-medium"
                                                >
                                                    Unblock
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

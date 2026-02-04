'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function UsersPage() {
    const { token, user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => {
        if (token) {
            fetchUsers();
        }
    }, [token]);

    const fetchUsers = async () => {
        try {
            const response = await fetch('/api/users', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (response.ok) {
                setUsers(data.users);
            } else {
                console.error('Failed to fetch users:', data.error);
            }
        } catch (err) {
            console.error('Failed to fetch users', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

        setActionLoading(id);
        try {
            const response = await fetch(`/api/users/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                setUsers(users.filter((u) => u._id !== id));
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to delete user');
            }
        } catch (err) {
            console.error('Failed to delete user', err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleRoleChange = async (id, newRole) => {
        setActionLoading(id);
        try {
            const response = await fetch(`/api/users/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ role: newRole }),
            });

            if (response.ok) {
                setUsers(
                    users.map((u) => (u._id === id ? { ...u, role: newRole } : u))
                );
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to update role');
            }
        } catch (err) {
            console.error('Failed to update role', err);
        } finally {
            setActionLoading(null);
        }
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
            <h1 className="text-2xl font-bold text-foreground mb-2">User Management</h1>
            <p className="text-muted-foreground mb-8">Manage registered users and their roles</p>

            <div className="bg-background rounded-xl border border-border overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border bg-muted/30">
                                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Name</th>
                                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Email</th>
                                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Role</th>
                                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Joined</th>
                                <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user._id} className="border-b border-border hover:bg-muted/10 transition-colors last:border-0">
                                    <td className="px-6 py-4 text-foreground font-medium">{user.name}</td>
                                    <td className="px-6 py-4 text-muted-foreground">{user.email}</td>
                                    <td className="px-6 py-4">
                                        <select
                                            value={user.role}
                                            onChange={(e) => handleRoleChange(user._id, e.target.value)}
                                            disabled={actionLoading === user._id || user._id === currentUser?.id}
                                            className="bg-muted/20 border border-border text-foreground text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 disabled:opacity-50 focus:outline-none focus:ring-1"
                                        >
                                            <option value="user">User</option>
                                            <option value="sub-admin">Admin</option>
                                            <option value="super-admin">Super Admin</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 text-muted-foreground text-sm">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleDelete(user._id)}
                                            disabled={actionLoading === user._id || user._id === currentUser?.id}
                                            className="text-red-600 hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                                        >
                                            {actionLoading === user._id ? 'Processing...' : 'Delete'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

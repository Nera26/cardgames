'use client';

import React, { useState } from 'react';
import { UserResponse, Role } from '@poker/shared';
import { users as mockUsers } from '@/data/admin/mockData';

// Props with sensible defaults for standalone usage
interface UserManagementProps {
    users?: UserResponse[];
    onBan?: (id: string) => void;
    onRoleChange?: (id: string, newRole: Role) => void;
}

export default function UserManagement({
    users = mockUsers,
    onBan = (id) => console.log('Ban user:', id),
    onRoleChange = (id, role) => console.log('Change role:', id, role)
}: UserManagementProps) {
    // ... component implementation
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
                <thead className="bg-secondary-bg text-text-secondary uppercase tracking-wider">
                    <tr>
                        <th className="px-6 py-4 font-semibold">User</th>
                        <th className="px-6 py-4 font-semibold">Role</th>
                        <th className="px-6 py-4 font-semibold">Status</th>
                        <th className="px-6 py-4 font-semibold text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border-dark">
                    {users.map((user) => (
                        <tr key={user.id} className="hover:bg-hover-bg transition-colors">
                            <td className="px-6 py-4">
                                <div className="flex items-center">
                                    <div className="h-10 w-10 rounded-full bg-accent-blue/20 flex items-center justify-center text-accent-blue font-bold mr-3">
                                        {user.username.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-bold text-text-primary">{user.username}</p>
                                        <p className="text-xs text-text-secondary">{user.email}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${user.role === 'ADMIN' ? 'bg-accent-yellow/20 text-accent-yellow' : 'bg-border-dark text-text-secondary'}`}>
                                    {user.role}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                {user.isBanned ? (
                                    <span className="text-danger-red font-bold">Banned</span>
                                ) : (
                                    <span className="text-accent-green font-bold">Active</span>
                                )}
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button
                                    onClick={() => onBan(user.id)}
                                    className="text-danger-red hover:text-white hover:bg-danger-red px-3 py-1 rounded transition"
                                >
                                    {user.isBanned ? 'Unban' : 'Ban'}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

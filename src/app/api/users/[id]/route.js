import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';

// DELETE - Delete a user
export async function DELETE(request, { params }) {
    try {
        await dbConnect();
        const { id } = await params;

        const userRole = request.headers.get('x-user-role');
        const requesterId = request.headers.get('x-user-id');

        if (userRole !== 'super-admin') {
            // Only super-admin can delete users ideally, or sub-admin too? 
            // Let's stick to admins.
            if (userRole !== 'sub-admin') {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
        }

        const userToDelete = await User.findById(id);
        if (!userToDelete) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Prevent self-deletion
        if (userToDelete._id.toString() === requesterId) {
            return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
        }

        await User.findByIdAndDelete(id);

        return NextResponse.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PATCH - Update user role
export async function PATCH(request, { params }) {
    try {
        await dbConnect();
        const { id } = await params;

        const userRole = request.headers.get('x-user-role');
        const requesterId = request.headers.get('x-user-id');

        // Only super-admin can change roles? Or admin?
        // Let's restrict role changes to super-admin for safety, or allow admins for now.
        // Assuming 'sub-admin' is a normal admin.
        if (userRole !== 'super-admin' && userRole !== 'sub-admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { role } = body;

        if (!['user', 'sub-admin', 'super-admin'].includes(role)) {
            return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
        }

        const userToUpdate = await User.findById(id);
        if (!userToUpdate) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Prevent self-demotion/promotion loop issues if needed, or just allow it.
        // Prevent changing another super-admin if you are just a sub-admin.
        if (userToUpdate.role === 'super-admin' && userRole !== 'super-admin') {
            return NextResponse.json({ error: 'Cannot modify a super-admin' }, { status: 403 });
        }

        userToUpdate.role = role;
        await userToUpdate.save();

        return NextResponse.json({ message: 'User role updated', user: userToUpdate });

    } catch (error) {
        console.error('Update user role error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

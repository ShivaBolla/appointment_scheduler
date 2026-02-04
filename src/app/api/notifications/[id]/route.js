import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Notification from '@/models/Notification';

// Mark single notification as read
export async function PATCH(
    request,
    { params }
) {
    try {
        const resolvedParams = await params;
        await dbConnect();

        const userId = request.headers.get('x-user-id');
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = resolvedParams;

        const notification = await Notification.findOneAndUpdate(
            { _id: id, userId },
            { $set: { read: true } },
            { new: true }
        );

        if (!notification) {
            return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
        }

        return NextResponse.json({ notification });
    } catch (error) {
        console.error('Update notification error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

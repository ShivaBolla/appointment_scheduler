import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import BlockedSlot from '@/models/BlockedSlot';

export async function DELETE(request, { params }) {
    try {
        await dbConnect();
        const { id } = await params;

        const userRole = request.headers.get('x-user-role');

        if (userRole !== 'sub-admin' && userRole !== 'super-admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const deletedSlot = await BlockedSlot.findByIdAndDelete(id);

        if (!deletedSlot) {
            return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Slot unblocked successfully' });
    } catch (error) {
        console.error('Delete blocked slot error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

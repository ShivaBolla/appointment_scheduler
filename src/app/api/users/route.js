import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function GET(request) {
    try {
        await dbConnect();

        const userRole = request.headers.get('x-user-role');

        if (userRole !== 'super-admin' && userRole !== 'sub-admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const users = await User.find({}, '-password').sort({ createdAt: -1 });

        return NextResponse.json({ users });
    } catch (error) {
        console.error('Fetch users error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

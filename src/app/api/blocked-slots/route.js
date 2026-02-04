import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import BlockedSlot from '@/models/BlockedSlot';

export async function GET(request) {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        let query = {};
        if (startDate && endDate) {
            query = {
                startTime: { $gte: new Date(startDate) },
                endTime: { $lte: new Date(endDate) },
            };
        }

        const blockedSlots = await BlockedSlot.find(query).sort({ startTime: 1 });
        return NextResponse.json({ blockedSlots });
    } catch (error) {
        console.error('Fetch blocked slots error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        await dbConnect();

        const userRole = request.headers.get('x-user-role');
        const userId = request.headers.get('x-user-id');

        if (userRole !== 'sub-admin' && userRole !== 'super-admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { startTime, endTime, reason } = body;

        if (!startTime || !endTime) {
            return NextResponse.json({ error: 'Start and end time are required' }, { status: 400 });
        }

        const blockedSlot = await BlockedSlot.create({
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            reason,
            createdBy: new mongoose.Types.ObjectId(userId),
        });

        return NextResponse.json(
            { message: 'Slot blocked successfully', blockedSlot },
            { status: 201 }
        );
    } catch (error) {
        console.error('Create blocked slot error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

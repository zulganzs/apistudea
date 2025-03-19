import { NextResponse } from 'next/server';
import connectMongo from '@/lib/mongoose';
import User from '@/models/user';

export async function GET(request) {
  try {
    await connectMongo();
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    if (!token || !email) {
      return NextResponse.json({ message: 'Invalid or missing token/email' }, { status: 400 });
    }

    const user = await User.findOne({ email, verify_token: token });
    if (!user || user.verified) {
      return NextResponse.json({ message: 'Invalid or already verified' }, { status: 400 });
    }

    if (new Date() > user.verify_expired) {
      return NextResponse.json({ message: 'Verification token expired' }, { status: 400 });
    }

    user.verified = true;
    user.verify_token = '';
    await user.save();

    return NextResponse.json({ message: 'Email verified successfully' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

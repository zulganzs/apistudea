import { NextResponse } from "next/server";
import bcrypt from 'bcryptjs';
import connectMongo from '@/lib/mongoose';
import User from '@/models/user';
import nodemailer from 'nodemailer';


export async function GET() {
  return NextResponse.json(
    { message: 'Please use POST method for login' },
    { status: 405 }
  );
}

export async function POST(request) {
  try {
    await connectMongo();
    console.log('MongoDB connected in login route');

    // Get data from either URL parameters or JSON body
    let email, password;
    const missingFields = [];
    
    // Try URL parameters first
    // const url = new URL(request.url);
    // const params = url.searchParams;
    
    // if (params.has('email') || params.has('password')) {
    //   email = params.get('email');
    //   password = params.get('password');
    //   console.log('Got data from URL parameters');
    // } else {
      // Try JSON body
      try {
        const body = await request.json();
        email = body.email;
        password = body.password;
        console.log('Got data from JSON body');
      } catch (error) {
        console.log('Failed to parse JSON body');
      }
    //}

    // Check for missing fields
    if (!email) missingFields.push('email');
    if (!password) missingFields.push('password');

    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          message: `Missing required fields: ${missingFields.join(', ')}`,
          missingFields 
        },
        { status: 400 }
      );
    }

    // Validate email format
    if (!email.includes('@')) {
      return NextResponse.json(
        { message: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    console.log('User logged in successfully:', email);

    return NextResponse.json({
      message: 'Login successful',
      user: {
        email: user.email,
        username: user.username,
        _id: user._id
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { 
        message: 'Internal server error', 
        error: error.message,
        stack: error.stack 
      },
      { status: 500 }
    );
  }
}

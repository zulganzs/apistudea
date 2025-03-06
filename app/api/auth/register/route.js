import { NextResponse } from "next/server";
import bcrypt from 'bcryptjs';
import connectMongo from '@/lib/mongoose';
import User from '@/models/user';

export async function GET() {
  return NextResponse.json(
    { message: 'Please use POST method for registration' },
    { status: 405 }
  );
}

export async function POST(request) {
  try {
    await connectMongo();
    console.log('MongoDB connected in register route');

    // Get data from either URL parameters or JSON body
    let email, username, password;
    const missingFields = [];
    
    // Try URL parameters first
    //const url = new URL(request.url);
    //const params = url.searchParams;
    
    // if (params.has('email') || params.has('username') || params.has('password')) {
    //   email = params.get('email');
    //   username = params.get('username');
    //   password = params.get('password');
    //   console.log('Got data from URL parameters');
    // } else {
      try {
        const body = await request.json();
        email = body.email;
        username = body.username;
        password = body.password;
        console.log('Got data from JSON body');
      } catch (error) {
        console.log('Failed to parse JSON body');
      }
    //}

    // Check for missing fields
    if (!email) missingFields.push('email');
    if (!username) missingFields.push('username');
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

    // Validate username length
    if (username.length < 3) {
      return NextResponse.json(
        { message: 'Username must be at least 3 characters' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { message: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return NextResponse.json(
        { message: 'User already exists' },
        { status: 400 }
      );
    }

    // Create new user
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      email,
      username,
      password: hashedPassword,
    });

    const savedUser = await newUser.save();
    console.log('New user created successfully:', email);

    return NextResponse.json({
      message: 'User registered successfully',
      user: {
        email: savedUser.email,
        username: savedUser.username,
        _id: savedUser._id
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
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

import { NextResponse } from "next/server";
import bcrypt from 'bcryptjs';
import connectMongo from '@/lib/mongoose';
import User from '@/models/user';
import crypto from 'crypto';
import transporter from '@/transport';
import { env } from "process";

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

    const verifyToken = crypto.randomBytes(20).toString('hex');
    savedUser.verify_token = verifyToken;
    savedUser.verify_expired = new Date(Date.now() + 1 * 60 * 60 * 1000);
    await savedUser.save();

    const origin = request.headers.get('origin')
    const verifyLink = `${origin}/api/auth/verify?token=${verifyToken}&email=${savedUser.email}`;
    await transporter.sendMail({
      to: savedUser.email,
      subject: 'Email Verification',
      text: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Verification</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background-color: #4CAF50;
            color: #ffffff;
            padding: 20px;
            text-align: center;
        }
        .content {
            padding: 20px;
            text-align: left;
        }
        .button-container {
            text-align: center;
            margin-top: 20px;
        }
        .button {
            display: inline-block;
            background-color: #4CAF50;
            color: #ffffff;
            padding: 15px 25px;
            text-decoration: none;
            border-radius: 5px;
        }
        .footer {
            text-align: center;
            padding: 20px;
            font-size: 12px;
            color: #777777;
        }
        @media (max-width: 600px) {
            .container {
                width: 100%;
                box-shadow: none;
            }
            .button {
                width: 100%;
                box-sizing: border-box;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Email Verification</h1>
        </div>
        <div class="content">
            <h2>Hello ${savedUser.username},</h2>
            <p>Thank you for signing up! To complete your registration, please verify your email address by clicking the button below:</p>
            <div class="button-container">
                <a href="${verifyLink}" class="button">Verify Email</a>
            </div>
            <p>If you did not create an account, no further action is required.</p>
        </div>
    </div>
</body>
</html>`
    });

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

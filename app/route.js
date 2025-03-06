import { NextResponse } from "next/server";
import connectMongo from '@/lib/mongoose';

// Initialize MongoDB connection
try {
  await connectMongo();
} catch (error) {
  console.error('Initial MongoDB connection failed:', error);
}

export async function GET() {
  return NextResponse.json({ 
    message: "Server is running",
    status: "ok" 
  });
}

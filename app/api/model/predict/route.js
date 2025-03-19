import { NextResponse } from "next/server";
import { DateTime } from 'luxon';
import { getPredictions } from '../../../lib/modelLoader';

export async function GET() {
  return NextResponse.json(
    { message: 'Please use POST method for predictions' },
    { status: 405 }
  );
}

export async function POST(request) {
  try {
    // Get request body
    const body = await request.json();
    const { user_profile, top_n = 5, reference_date = '2024-01-01' } = body;

    // Validate user profile
    if (!user_profile || !Array.isArray(user_profile) || user_profile.length !== 5) {
      return NextResponse.json(
        { message: 'Invalid user profile. Must be an array of 5 numbers.' },
        { status: 400 }
      );
    }

    // Get predictions using the loader module
    const { predictionValues, institutionsData } = await getPredictions(
      user_profile,
      top_n,
      reference_date
    );

    // Add scores to institutions data
    const recommendations = institutionsData.map((inst, i) => ({
      ...inst,
      match_score: predictionValues[i]
    }));

    // Filter by active deadlines
    const refDate = DateTime.fromISO(reference_date).startOf('day');
    const active = recommendations.filter(rec => {
      const deadline = DateTime.fromISO(rec.app_deadline);
      return deadline >= refDate;
    });

    // Get top N for each type
    const universities = active
      .filter(rec => rec.type === 'university')
      .sort((a, b) => b.match_score - a.match_score)
      .slice(0, top_n);

    const scholarships = active
      .filter(rec => rec.type === 'scholarship')
      .sort((a, b) => b.match_score - a.match_score)
      .slice(0, top_n);

    // Combine and clean results
    const results = [...universities, ...scholarships].map(rec => ({
      name: rec.name,
      type: rec.type,
      app_deadline: rec.app_deadline,
      match_score: rec.match_score
    }));

    return NextResponse.json({
      message: 'Predictions generated successfully',
      recommendations: results
    }, { status: 200 });

  } catch (error) {
    console.error('Prediction error:', error);
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

import { NextResponse } from "next/server";
import * as tf from '@tensorflow/tfjs-node';  // Use tfjs-node instead of tfjs
import fs from 'fs/promises';
import path from 'path';
import { DateTime } from 'luxon';

let model;
let institutionsData;

// Load model and data
async function loadModelAndData() {
  if (!model) {
    try {
      // Load the model using tfjs-node's file system handler
      const modelPath = path.join(process.cwd(), 'ai/Model');
      model = await tf.node.loadSavedModel(modelPath);
      
      const datasetPath = path.join(process.cwd(), 'ai/dataset.json');
      const rawData = await fs.readFile(datasetPath, 'utf8');
      institutionsData = JSON.parse(rawData);
    } catch (error) {
      console.error('Error loading model or data:', error);
      throw error;
    }
  }
  return { model, institutionsData };
}

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

    // Load model and data
    const { model, institutionsData } = await loadModelAndData();

    // Extract features from institutions data
    const featureColumns = ['academic_min', 'non_academic_min', 'income_max', 'motivation_min', 'interest'];
    const institutionsFeatures = institutionsData.map(inst => 
      featureColumns.map(col => inst[col])
    );

    // Create tensors and get predictions
    const userFeatures = tf.tidy(() => {
      const userTensor = tf.tensor2d([user_profile], [1, 5]);
      return tf.tile(userTensor, [institutionsData.length, 1]);
    });

    const instFeatures = tf.tensor2d(institutionsFeatures);

    // Get predictions using the loaded SavedModel
    const predictions = await model.predict({
      inputs: userFeatures,
      inputs_1: instFeatures
    });

    // Get prediction values
    const predictionValues = await predictions.array();
    tf.dispose([userFeatures, instFeatures, predictions]);

    // Add scores to institutions data
    const recommendations = institutionsData.map((inst, i) => ({
      ...inst,
      match_score: predictionValues[0][i]
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

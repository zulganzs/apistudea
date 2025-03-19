import * as tf from '@tensorflow/tfjs';
import { readFile } from 'fs/promises';
import { join } from 'path';

let model = null;
let institutionsData = null;

// Simple function to normalize features
function normalizeFeatures(features) {
  return features.map(f => f / 5.0);  // Assuming features are on a 1-5 scale
}

// Calculate cosine similarity between two vectors
function cosineSimilarity(a, b) {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

async function loadModelAndData() {
  if (!model || !institutionsData) {
    try {
      // Load dataset
      const datasetPath = join(process.cwd(), 'ai/dataset.json');
      const rawData = await readFile(datasetPath, 'utf8');
      institutionsData = JSON.parse(rawData);

      // Initialize TensorFlow.js
      await tf.ready();
    } catch (error) {
      console.error('Error loading data:', error);
      throw error;
    }
  }
  return { institutionsData };
}

export async function getPredictions(userProfile, topN = 5, referenceDate = '2024-01-01') {
  try {
    const { institutionsData } = await loadModelAndData();

    // Extract features
    const featureColumns = ['academic_min', 'non_academic_min', 'income_max', 'motivation_min', 'interest'];
    const institutionsFeatures = institutionsData.map(inst => 
      featureColumns.map(col => inst[col])
    );

    // Normalize features
    const normalizedUserProfile = normalizeFeatures(userProfile);

    // Calculate similarity scores
    const predictionValues = institutionsFeatures.map(features => {
      const normalizedFeatures = normalizeFeatures(features);
      return cosineSimilarity(normalizedUserProfile, normalizedFeatures);
    });

    return { predictionValues, institutionsData };
  } catch (error) {
    console.error('Error in getPredictions:', error);
    throw error;
  }
}

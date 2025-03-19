const tf = require('@tensorflow/tfjs');
require('@tensorflow/tfjs-node');  // This will set the backend to Node
const fs = require('fs').promises;
const path = require('path');

let model = null;
let institutionsData = null;

// Simple function to normalize features
function normalizeFeatures(features) {
  return features.map(f => f / 5.0);  // Assuming features are on a 1-5 scale
}

async function loadModelAndData() {
  if (!model || !institutionsData) {
    try {
      // Load dataset first
      const datasetPath = path.join(process.cwd(), 'ai/dataset.json');
      const rawData = await fs.readFile(datasetPath, 'utf8');
      institutionsData = JSON.parse(rawData);

      // Create a simple model that mimics the original model's structure
      model = tf.sequential({
        layers: [
          tf.layers.dense({
            inputShape: [5],
            units: 32,
            activation: 'relu'
          }),
          tf.layers.dense({
            units: 16,
            activation: 'relu'
          }),
          tf.layers.dense({
            units: 1,
            activation: 'sigmoid'
          })
        ]
      });

      // Initialize with some weights
      await model.compile({
        optimizer: 'adam',
        loss: 'binaryCrossentropy',
        metrics: ['accuracy']
      });
    } catch (error) {
      console.error('Error loading data:', error);
      throw error;
    }
  }
  return { model, institutionsData };
}

async function getPredictions(userProfile, topN = 5, referenceDate = '2024-01-01') {
  const { model, institutionsData } = await loadModelAndData();

  // Extract features
  const featureColumns = ['academic_min', 'non_academic_min', 'income_max', 'motivation_min', 'interest'];
  const institutionsFeatures = institutionsData.map(inst => 
    featureColumns.map(col => inst[col])
  );

  // Normalize features
  const normalizedUserProfile = normalizeFeatures(userProfile);

  // Create tensors and get predictions
  const predictions = tf.tidy(() => {
    const userTensor = tf.tensor2d([normalizedUserProfile], [1, 5]);
    const predictionValues = [];

    // Calculate match scores for each institution
    for (let i = 0; i < institutionsFeatures.length; i++) {
      const instFeatures = normalizeFeatures(institutionsFeatures[i]);
      const featureDiff = userTensor.sub(tf.tensor2d([instFeatures], [1, 5]));
      const matchScore = tf.scalar(1).sub(featureDiff.abs().mean());
      predictionValues.push(matchScore.dataSync()[0]);
    }

    return predictionValues;
  });

  return { predictionValues: predictions, institutionsData };
}

module.exports = {
  getPredictions
};

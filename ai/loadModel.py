import tensorflow as tf
import pandas as pd
import numpy as np
import json
from datetime import datetime

# Load the model and data at module level so they're only loaded once
model = tf.saved_model.load('./Model')
predict_fn = model.signatures['serving_default']

with open('dataset.json') as f:
    institutions_data = pd.json_normalize(json.load(f))

def get_recommendations(user_profile, top_n=5, reference_date=None):
    """
    Get recommendations for both universities and scholarships based on user profile.
    
    Parameters:
    user_profile (list): List of 5 values representing user features [academic, non_academic, income, motivation, interest]
    top_n (int): Number of top recommendations to return for each type (universities/scholarships)
    reference_date (datetime.date, optional): Date to filter active opportunities. Defaults to 2024-01-01.
    
    Returns:
    pandas.DataFrame: Top recommendations with name, type, application deadline, and match score
    """
    if reference_date is None:
        reference_date = datetime(2024, 1, 1).date()
    elif isinstance(reference_date, str):
        reference_date = datetime.strptime(reference_date, '%Y-%m-%d').date()
    
    # Get features for model
    feature_columns = ['academic_min', 'non_academic_min', 
                      'income_max', 'motivation_min', 'interest']
    user_features = np.tile(user_profile, (len(institutions_data), 1))
    inst_features = institutions_data[feature_columns].values
    
    # Convert to tensors
    user_tensor = tf.convert_to_tensor(user_features, dtype=tf.float32)
    inst_tensor = tf.convert_to_tensor(inst_features, dtype=tf.float32)
    
    # Get predictions
    predictions = predict_fn(inputs=user_tensor, inputs_1=inst_tensor)
    output_key = list(predictions.keys())[0]
    prediction_values = predictions[output_key].numpy().flatten()
    
    # Add scores to data
    recommendations = institutions_data.copy()
    recommendations['match_score'] = prediction_values
    
    # Filter by active deadlines
    recommendations['deadline_date'] = pd.to_datetime(recommendations['app_deadline']).dt.date
    active = recommendations[recommendations['deadline_date'] >= reference_date]
    
    # Get top N for each type
    universities = active[active['type'] == 'university'].nlargest(top_n, 'match_score')
    scholarships = active[active['type'] == 'scholarship'].nlargest(top_n, 'match_score')
    
    # Combine and clean results
    results = pd.concat([universities, scholarships])
    results = results[['name', 'type', 'app_deadline', 'match_score']]
    
    return results

# For direct execution
if __name__ == "__main__":
    user_profile = [5, 5, 5, 5, 1]
    recommendations = get_recommendations(user_profile)
    print(recommendations)
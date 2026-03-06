"""
Modern Flask-based Web UI for AI Image Detector
Supports single and batch image detection with history tracking
"""

from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import sys
import json
import uuid
from datetime import datetime
from pathlib import Path
import tempfile
from PIL import Image
import base64
from io import BytesIO
import numpy as np

# Add src to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))
from predict import predict_image

app = Flask(__name__)
CORS(app)

# Configuration
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), '..', 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
MAX_FILE_SIZE = 200 * 1024 * 1024  # 200MB

# Create uploads directory if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# In-memory detection history (could be replaced with database)
detection_history = []


def allowed_file(filename):
    """Check if file has allowed extension"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def get_image_base64(image_path):
    """Convert image to base64 string for embedding in response"""
    with open(image_path, 'rb') as img_file:
        return base64.b64encode(img_file.read()).decode('utf-8')


@app.route('/')
def index():
    """Serve the main page"""
    return render_template('index.html')


@app.route('/api/detect', methods=['POST'])
def detect():
    """Single image detection endpoint"""
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image provided'}), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'File type not allowed. Use PNG, JPG, or JPEG'}), 400
        
        # Save temporarily and process
        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp:
            file.save(tmp.name)
            
            try:
                # Get predictions
                ai_score, real_score = predict_image(tmp.name)
                
                # Determine verdict
                is_ai = ai_score > real_score
                confidence = max(ai_score, real_score)
                
                # Get image info
                image = Image.open(tmp.name)
                width, height = image.size
                file_size = os.path.getsize(tmp.name) / 1024  # KB
                
                # Create result entry
                result = {
                    'id': str(uuid.uuid4()),
                    'filename': file.filename,
                    'timestamp': datetime.now().isoformat(),
                    'width': width,
                    'height': height,
                    'file_size': round(file_size, 2),
                    'ai_score': round(ai_score, 4),
                    'real_score': round(real_score, 4),
                    'verdict': 'AI Generated' if is_ai else 'Authentic',
                    'confidence': round(confidence, 4),
                    'image_base64': f'data:image/png;base64,{get_image_base64(tmp.name)}'
                }
                
                # Add to history
                detection_history.insert(0, result)
                
                # Clean up temp file
                os.unlink(tmp.name)
                
                return jsonify(result), 200
                
            except Exception as e:
                os.unlink(tmp.name)
                return jsonify({'error': f'Detection failed: {str(e)}'}), 500
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/detect-batch', methods=['POST'])
def detect_batch():
    """Batch image detection endpoint"""
    try:
        if 'images' not in request.files:
            return jsonify({'error': 'No images provided'}), 400
        
        files = request.files.getlist('images')
        results = []
        errors = []
        
        for idx, file in enumerate(files):
            if file.filename == '':
                continue
            
            if not allowed_file(file.filename):
                errors.append({
                    'filename': file.filename,
                    'error': 'File type not allowed'
                })
                continue
            
            try:
                with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp:
                    file.save(tmp.name)
                    
                    # Get predictions
                    ai_score, real_score = predict_image(tmp.name)
                    is_ai = ai_score > real_score
                    confidence = max(ai_score, real_score)
                    
                    # Get image info
                    image = Image.open(tmp.name)
                    width, height = image.size
                    file_size = os.path.getsize(tmp.name) / 1024
                    
                    result = {
                        'id': str(uuid.uuid4()),
                        'filename': file.filename,
                        'timestamp': datetime.now().isoformat(),
                        'width': width,
                        'height': height,
                        'file_size': round(file_size, 2),
                        'ai_score': round(ai_score, 4),
                        'real_score': round(real_score, 4),
                        'verdict': 'AI Generated' if is_ai else 'Authentic',
                        'confidence': round(confidence, 4)
                    }
                    
                    results.append(result)
                    detection_history.insert(0, result)
                    
                    os.unlink(tmp.name)
                    
            except Exception as e:
                errors.append({
                    'filename': file.filename,
                    'error': str(e)
                })
        
        return jsonify({
            'success': len(results),
            'failed': len(errors),
            'results': results,
            'errors': errors
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/history', methods=['GET'])
def get_history():
    """Get detection history"""
    limit = request.args.get('limit', default=20, type=int)
    return jsonify(detection_history[:limit]), 200


@app.route('/api/history/<detection_id>', methods=['GET'])
def get_detection(detection_id):
    """Get specific detection from history"""
    for detection in detection_history:
        if detection['id'] == detection_id:
            return jsonify(detection), 200
    return jsonify({'error': 'Detection not found'}), 404


@app.route('/api/history/clear', methods=['POST'])
def clear_history():
    """Clear all detection history"""
    global detection_history
    detection_history = []
    return jsonify({'message': 'History cleared'}), 200


@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get statistics about detections"""
    if not detection_history:
        return jsonify({
            'total': 0,
            'ai_detected': 0,
            'authentic_detected': 0,
            'average_confidence': 0
        }), 200
    
    ai_count = sum(1 for d in detection_history if d['verdict'] == 'AI Generated')
    authentic_count = len(detection_history) - ai_count
    avg_confidence = sum(d['confidence'] for d in detection_history) / len(detection_history)
    
    return jsonify({
        'total': len(detection_history),
        'ai_detected': ai_count,
        'authentic_detected': authentic_count,
        'average_confidence': round(avg_confidence, 4)
    }), 200


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)

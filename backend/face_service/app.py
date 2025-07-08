from flask import Flask, request, jsonify
from flask_cors import CORS
from deepface import DeepFace
import numpy as np
from PIL import Image
import io
import logging

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)

def get_embedding(image_bytes):
    logging.info("[face_service] Reading image bytes...")
    try:
        img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        logging.info("[face_service] Image loaded successfully.")
    except Exception as e:
        logging.error(f"[face_service] Error loading image: {e}")
        raise
    try:
        logging.info("[face_service] Running DeepFace.represent...")
        embedding = DeepFace.represent(img_path=np.array(img), model_name='Facenet')[0]["embedding"]
        logging.info("[face_service] Embedding extracted successfully.")
        return embedding
    except Exception as e:
        logging.error(f"[face_service] Error extracting embedding: {e}")
        raise

@app.route('/', methods=['GET'])
def health():
    return jsonify({'status': 'ok'}), 200

@app.route('/extract-embedding', methods=['POST'])
def extract_embedding():
    logging.info("[face_service] /extract-embedding endpoint called.")
    if 'image' not in request.files:
        logging.warning("[face_service] No image uploaded in request.")
        return jsonify({'error': 'No image uploaded'}), 400
    image = request.files['image'].read()
    logging.info(f"[face_service] Received image of size: {len(image)} bytes.")
    try:
        embedding = get_embedding(image)
        logging.info("[face_service] Returning embedding response.")
        return jsonify({'embedding': embedding})
    except Exception as e:
        logging.error(f"[face_service] Error in /extract-embedding: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/compare-embedding', methods=['POST'])
def compare_embedding():
    data = request.get_json()
    new_emb = np.array(data['new_embedding'])
    existing = [np.array(e) for e in data['existing_embeddings']]
    threshold = data.get('threshold', 10.0)  # Lower is stricter
    best_score = float('inf')
    best_idx = -1
    for idx, emb in enumerate(existing):
        dist = np.linalg.norm(new_emb - emb)
        if dist < best_score:
            best_score = dist
            best_idx = idx
    match = best_score < threshold
    return jsonify({'match': bool(match), 'best_score': float(best_score), 'best_idx': int(best_idx)})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001) 
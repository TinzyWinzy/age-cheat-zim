from flask import Flask, request, jsonify
from flask_cors import CORS
from deepface import DeepFace
import numpy as np
from PIL import Image
import io

app = Flask(__name__)
CORS(app)

def get_embedding(image_bytes):
    img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
    embedding = DeepFace.represent(img_path=np.array(img), model_name='Facenet')[0]["embedding"]
    return embedding

@app.route('/extract-embedding', methods=['POST'])
def extract_embedding():
    if 'image' not in request.files:
        return jsonify({'error': 'No image uploaded'}), 400
    image = request.files['image'].read()
    try:
        embedding = get_embedding(image)
        return jsonify({'embedding': embedding})
    except Exception as e:
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
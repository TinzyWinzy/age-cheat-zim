from deepface import DeepFace
import numpy as np
from PIL import Image

# Create a dummy image (100x100 white square)
dummy_img = np.ones((100, 100, 3), dtype=np.uint8) * 255

# Run DeepFace to trigger model download, bypassing face detection
print("Triggering DeepFace Facenet model download...")
DeepFace.represent(img_path=dummy_img, model_name='Facenet', enforce_detection=False)
print("Model weights should now be downloaded to ~/.deepface") 
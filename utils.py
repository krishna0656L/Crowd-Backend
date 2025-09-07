from PIL import Image
import numpy as np
import io

def preprocess_image(file):
    image = Image.open(file).resize((64, 64)).convert('L')
    return np.array(image).flatten()

def predict_from_frame(model, frame):
    return model.predict([frame])[0]

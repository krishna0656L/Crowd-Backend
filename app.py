from flask import Flask, Response, jsonify, request
from flask_cors import CORS
import cv2
import torch
import threading
import numpy as np  # Required for /detect-image

app = Flask(__name__)
CORS(app)

# 🔁 Global shared frame and lock
current_frame = None
frame_lock = threading.Lock()

# 🚀 Load the YOLOv5m model
model = torch.hub.load('ultralytics/yolov5', 'yolov5m', trust_repo=True)
model.classes = [0]  # Only detect 'person' class
print("✅ YOLOv5m model loaded.")

# 🎥 Start video capture in background
cap = cv2.VideoCapture(0)

def generate_frames():
    global current_frame
    while True:
        success, frame = cap.read()
        if not success:
            break

        results = model(frame, size=640)
        detections = results.pandas().xyxy[0]
        people = detections[detections['name'] == 'person']

        # Draw bounding boxes
        for _, row in people.iterrows():
            x1, y1, x2, y2 = map(int, [row['xmin'], row['ymin'], row['xmax'], row['ymax']])
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)

        # Update shared frame
        with frame_lock:
            current_frame = frame.copy()

        # Encode and yield frame
        _, buffer = cv2.imencode('.jpg', frame)
        frame_bytes = buffer.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

@app.route('/video-feed')
def video_feed():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/predict-frame')
def predict_frame():
    with frame_lock:
        frame = current_frame.copy() if current_frame is not None else None

    if frame is None:
        return jsonify({"crowdCount": 0})

    results = model(frame, size=640)
    detections = results.pandas().xyxy[0]
    person_count = len(detections[detections['name'] == 'person'])

    return jsonify({"crowdCount": person_count})

@app.route('/detect-image', methods=['POST'])
def detect_image():
    if 'image' not in request.files:
        return jsonify({'error': 'No image uploaded'}), 400

    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'Empty filename'}), 400

    # Read image
    file_bytes = file.read()
    np_arr = np.frombuffer(file_bytes, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    results = model(img, size=640)
    detections = results.pandas().xyxy[0]
    person_count = len(detections[detections['name'] == 'person'])

    return jsonify({'crowdCount': person_count})

if __name__ == '__main__':
    app.run(debug=True)

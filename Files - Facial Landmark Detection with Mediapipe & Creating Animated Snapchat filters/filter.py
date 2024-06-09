import cv2
import itertools
import numpy as np
from time import time
import mediapipe as mp
from flask import Flask, render_template, Response
from flask_socketio import SocketIO, emit

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

# Initialize the mediapipe face detection class.
mp_face_detection = mp.solutions.face_detection

# Setup the face detection function.
face_detection = mp_face_detection.FaceDetection(model_selection=0, min_detection_confidence=0.5)

# Initialize the mediapipe drawing class.
mp_drawing = mp.solutions.drawing_utils

# Initialize the mediapipe face mesh class.
mp_face_mesh = mp.solutions.face_mesh

# Setup the face landmarks function for images.
face_mesh_images = mp_face_mesh.FaceMesh(static_image_mode=True, max_num_faces=2,
                                         min_detection_confidence=0.5)

# Setup the face landmarks function for videos.
face_mesh_videos = mp_face_mesh.FaceMesh(static_image_mode=False, max_num_faces=1, 
                                         min_detection_confidence=0.5, min_tracking_confidence=0.3)

# Initialize the mediapipe drawing styles class.
mp_drawing_styles = mp.solutions.drawing_styles


def detectFacialLandmarks(image, face_mesh):
    results = face_mesh.process(image[:, :, ::-1])
    output_image = image[:, :, ::-1].copy()
    if results.multi_face_landmarks:
        for face_landmarks in results.multi_face_landmarks:
            mp_drawing.draw_landmarks(image=output_image, landmark_list=face_landmarks,
                                      connections=mp_face_mesh.FACEMESH_TESSELATION,
                                      landmark_drawing_spec=None, 
                                      connection_drawing_spec=mp_drawing_styles.get_default_face_mesh_tesselation_style())
            mp_drawing.draw_landmarks(image=output_image, landmark_list=face_landmarks,
                                      connections=mp_face_mesh.FACEMESH_CONTOURS,
                                      landmark_drawing_spec=None, 
                                      connection_drawing_spec=mp_drawing_styles.get_default_face_mesh_contours_style())
    return np.ascontiguousarray(output_image[:, :, ::-1], dtype=np.uint8), results


def getSize(image, face_landmarks, INDEXES):
    image_height, image_width, _ = image.shape
    INDEXES_LIST = list(itertools.chain(*INDEXES))
    landmarks = []
    for INDEX in INDEXES_LIST:
        landmarks.append([int(face_landmarks.landmark[INDEX].x * image_width),
                          int(face_landmarks.landmark[INDEX].y * image_height)])
    _, _, width, height = cv2.boundingRect(np.array(landmarks))
    landmarks = np.array(landmarks)
    return width, height, landmarks


def isOpen(image, face_mesh_results, face_part, threshold=5):
    image_height, image_width, _ = image.shape
    output_image = image.copy()
    status = {}
    if face_part == 'MOUTH':
        INDEXES = mp_face_mesh.FACEMESH_LIPS
        loc = (10, image_height - image_height // 40)
        increment = -30
    elif face_part == 'LEFT EYE':
        INDEXES = mp_face_mesh.FACEMESH_LEFT_EYE
        loc = (10, 30)
        increment = 30
    elif face_part == 'RIGHT EYE':
        INDEXES = mp_face_mesh.FACEMESH_RIGHT_EYE
        loc = (image_width - 300, 30)
        increment = 30
    else:
        return
    for face_no, face_landmarks in enumerate(face_mesh_results.multi_face_landmarks):
        _, height, _ = getSize(image, face_landmarks, INDEXES)
        _, face_height, _ = getSize(image, face_landmarks, mp_face_mesh.FACEMESH_FACE_OVAL)
        if (height / face_height) * 100 > threshold:
            status[face_no] = 'OPEN'
            color = (0, 255, 0)
        else:
            status[face_no] = 'CLOSE'
            color = (0, 0, 255)
        cv2.putText(output_image, f'FACE {face_no + 1} {face_part} {status[face_no]}.',
                    (loc[0], loc[1] + (face_no * increment)), cv2.FONT_HERSHEY_PLAIN, 1.4, color, 2)
    return output_image, status


def overlay(image, filter_img, face_landmarks, face_part, INDEXES):
    annotated_image = image.copy()
    try:
        filter_img_height, filter_img_width, _ = filter_img.shape
        _, face_part_height, landmarks = getSize(image, face_landmarks, INDEXES)
        required_height = int(face_part_height * 2.5)
        resized_filter_img = cv2.resize(filter_img, (int(filter_img_width *
                                                         (required_height / filter_img_height)),
                                                     required_height))
        filter_img_height, filter_img_width, _ = resized_filter_img.shape
        _, filter_img_mask = cv2.threshold(cv2.cvtColor(resized_filter_img, cv2.COLOR_BGR2GRAY),
                                           25, 255, cv2.THRESH_BINARY_INV)
        center = landmarks.mean(axis=0).astype("int")
        if face_part == 'MOUTH':
            location = (int(center[0] - filter_img_width / 3), int(center[1]))
        else:
            location = (int(center[0] - filter_img_width / 2), int(center[1] - filter_img_height / 2))
        ROI = image[location[1]: location[1] + filter_img_height,
                    location[0]: location[0] + filter_img_width]
        resultant_image = cv2.bitwise_and(ROI, ROI, mask=filter_img_mask)
        resultant_image = cv2.add(resultant_image, resized_filter_img)
        annotated_image[location[1]: location[1] + filter_img_height,
                        location[0]: location[0] + filter_img_width] = resultant_image
    except Exception as e:
        pass
    return annotated_image


@app.route('/')
def index():
    return render_template('index.html')


def gen_frames():
    camera_video = cv2.VideoCapture(0)
    camera_video.set(3, 1280)
    camera_video.set(4, 960)

    # Read the left and right eyes images.
    left_eye = cv2.imread('C:\\Users\\adity\\Downloads\\Files - Facial Landmark Detection with Mediapipe & Creating Animated Snapchat filters-20240515T144901Z-001\\Files - Facial Landmark Detection with Mediapipe & Creating Animated Snapchat filters\\media\\left_eye.png')
    right_eye = cv2.imread('C:\\Users\\adity\\Downloads\\Files - Facial Landmark Detection with Mediapipe & Creating Animated Snapchat filters-20240515T144901Z-001\\Files - Facial Landmark Detection with Mediapipe & Creating Animated Snapchat filters\\media\\right_eye.png')

    # Initialize the VideoCapture object to read from the smoke animation video stored in the disk.
    smoke_animation = cv2.VideoCapture('C:\\Users\\adity\\Downloads\\Files - Facial Landmark Detection with Mediapipe & Creating Animated Snapchat filters-20240515T144901Z-001\\Files - Facial Landmark Detection with Mediapipe & Creating Animated Snapchat filters\\media\\smoke_animation.mp4')


    smoke_frame_counter = 0

    while camera_video.isOpened():
        ok, frame = camera_video.read()
        if not ok:
            continue
        _, smoke_frame = smoke_animation.read()
        smoke_frame_counter += 1
        if smoke_frame_counter == smoke_animation.get(cv2.CAP_PROP_FRAME_COUNT):
            smoke_animation.set(cv2.CAP_PROP_POS_FRAMES, 0)
            smoke_frame_counter = 0
        frame = cv2.flip(frame, 1)
        _, face_mesh_results = detectFacialLandmarks(frame, face_mesh_videos)
        if face_mesh_results.multi_face_landmarks:
            _, mouth_status = isOpen(frame, face_mesh_results, 'MOUTH', threshold=15)
            _, left_eye_status = isOpen(frame, face_mesh_results, 'LEFT EYE', threshold=4.5)
            _, right_eye_status = isOpen(frame, face_mesh_results, 'RIGHT EYE', threshold=4.5)
            for face_num, face_landmarks in enumerate(face_mesh_results.multi_face_landmarks):
                if left_eye_status[face_num] == 'OPEN':
                    frame = overlay(frame, left_eye, face_landmarks,
                                    'LEFT EYE', mp_face_mesh.FACEMESH_LEFT_EYE)
                if right_eye_status[face_num] == 'OPEN':
                    frame = overlay(frame, right_eye, face_landmarks,
                                    'RIGHT EYE', mp_face_mesh.FACEMESH_RIGHT_EYE)
                if mouth_status[face_num] == 'OPEN':
                    frame = overlay(frame, smoke_frame, face_landmarks,
                                    'MOUTH', mp_face_mesh.FACEMESH_LIPS)
        ret, buffer = cv2.imencode('.jpg', frame)
        frame = buffer.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')


@app.route('/video_feed')
def video_feed():
    return Response(gen_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')


if __name__ == "__main__":
    socketio.run(app, host='0.0.0.0', port=5000)

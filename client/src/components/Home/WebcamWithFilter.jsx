import React, { useRef, useEffect, useState } from "react";
import * as faceapi from "face-api.js";
import { MainImg } from "../../assets/export";

const loadModels = () => {
  const MODEL_URL = "/models";
  return Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
  ]);
};

const WebcamWithFilter = () => {
  const [stream, setStream] = useState(null);
  const videoRef = useRef();
  const canvasRef = useRef();
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [faceLandmarks, setFaceLandmarks] = useState(null);
  const overlayImageRef = useRef(null);

  useEffect(() => {
    loadModels().then(startVideo);
    const image = new Image();
    image.src = "/faceOverlay.png"; // Path to the face overlay image in the public folder
    overlayImageRef.current = image;
  }, []);

  const startVideo = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.addEventListener("play", handleVideoPlay);
      }
    } catch (err) {
      console.error("Error accessing the camera: ", err);
    }
  };

  const handleVideoPlay = () => {
    if (videoRef.current) {
      const displaySize = {
        width: videoRef.current.videoWidth,
        height: videoRef.current.videoHeight,
      };
      faceapi.matchDimensions(canvasRef.current, displaySize);

      const drawLoop = async () => {
        const detections = await faceapi
          .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks();

        const resizedDetections = faceapi.resizeResults(detections, displaySize);

        if (resizedDetections.length > 0) {
          setFaceLandmarks(resizedDetections[0].landmarks);
        }

        const canvasCtx = canvasRef.current.getContext("2d");
        canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        if (faceLandmarks) {
          drawFaceImage(canvasCtx, faceLandmarks);
        }

        setTimeout(drawLoop, 100); // Reduce the frequency of drawing operations
      };

      drawLoop();
    }
  };

  const drawFaceImage = (canvasCtx, landmarks) => {
    const image = overlayImageRef.current;
    if (!image.complete) {
      return;
    }

    const positions = landmarks.positions;

    // Get bounding box for the face
    const [minX, minY] = [Math.min(...positions.map(p => p.x)), Math.min(...positions.map(p => p.y))];
    const [maxX, maxY] = [Math.max(...positions.map(p => p.x)), Math.max(...positions.map(p => p.y))];

    const faceWidth = maxX - minX;
    const faceHeight = maxY - minY;

    // Adjust the size and position of the overlay image
    const overlayWidth = faceWidth * 1.2; // Adjust the multiplier for better fitting
    const overlayHeight = faceHeight * 1.2; // Adjust the multiplier for better fitting
    const overlayX = minX - (overlayWidth - faceWidth) / 2;
    const overlayY = minY - (overlayHeight - faceHeight) / 2;

    canvasCtx.drawImage(image, overlayX, overlayY, overlayWidth, overlayHeight);
  };

  const startRecording = () => {
    if (videoRef.current) {
      const stream = videoRef.current.captureStream();
      const newMediaRecorder = new MediaRecorder(stream);

      newMediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setRecordedChunks((prev) => [...prev, event.data]);
        }
      };

      newMediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "recording.mp4";
        a.click();
      };

      newMediaRecorder.start();
      setMediaRecorder(newMediaRecorder);
      setRecording(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setRecording(false);
    }
  };

  return (
    <div className="bg-mainBG md:h-screen w-full flex flex-col md:flex-row items-center">
      <img className="pt-20" src={MainImg} alt="MainImg" />
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        onClick={startVideo}
      >
        OPEN CAMERA
      </button>
      <div style={{ position: "relative", width: "640px", height: "480px" }}>
        <div className="video-container relative">
          <video
            ref={videoRef}
            autoPlay
            style={{ display: stream ? "block" : "none" }}
            className="rounded-lg"
          />
          <canvas
            ref={canvasRef}
            width="640"
            height="480"
            style={{ position: "absolute", top: 0, left: 0 }}
          />
        </div>
      </div>
      <button
        onClick={recording ? stopRecording : startRecording}
        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-700 transition"
      >
        {recording ? "Stop Recording" : "Start Recording"}
      </button>
    </div>
  );
};

export default WebcamWithFilter;

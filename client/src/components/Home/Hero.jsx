import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaCamera, FaStopCircle, FaPlayCircle } from "react-icons/fa";
import { MainImg } from "../../assets/export"; // Adjust if needed
import * as faceapi from "face-api.js";
import {
  addImage,
  addVideo,
  addCustomImage
} from "./db"; // Assuming db.js is in the same directory

const Hero = ({ setCapturedImage }) => {
  const [stream, setStream] = useState(null);
  const [filter, setFilter] = useState("none");
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();
  const [resizedDetections, setResizedDetections] = useState([]);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const mediaRecorderRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const overlayImageRef = useRef(new Image());
  const lastLandmarksRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const loadModels = async () => {
      await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
      await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
      setModelsLoaded(true);
    };
    loadModels();

    overlayImageRef.current.src = "/snort.png"; // Path to your overlay image
  }, []);

  const startCamera = async () => {
    if (!modelsLoaded) {
      alert("Models are still loading, please wait.");
      return;
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.addEventListener("play", handleVideoPlay);
      }
    } catch (err) {
      console.error("Error accessing the camera", err);
    }
  };

  const handleVideoPlay = () => {
    const videoElement = videoRef.current;
    if (!videoElement) {
      console.error("Video element is not available");
      return;
    }

    const displaySize = {
      width: videoElement.videoWidth,
      height: videoElement.videoHeight,
    };

    const canvas = canvasRef.current;
    canvas.width = displaySize.width;
    canvas.height = displaySize.height;
    const context = canvas.getContext("2d");

    faceapi.matchDimensions(canvas, displaySize);

    const drawLoop = async () => {
      if (videoElement.paused || videoElement.ended || videoElement.readyState !== videoElement.HAVE_ENOUGH_DATA) {
        requestAnimationFrame(drawLoop);
        return;
      }

      const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 });
      const detections = await faceapi.detectAllFaces(videoElement, options).withFaceLandmarks();

      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      setResizedDetections(resizedDetections);

      context.clearRect(0, 0, canvas.width, canvas.height);
      context.filter = filter;
      context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

      if (resizedDetections.length > 0) {
        const detection = resizedDetections[0];
        const { landmarks } = detection;

        if (lastLandmarksRef.current) {
          // Smooth the landmark positions
          for (let i = 0; i < landmarks.positions.length; i++) {
            landmarks.positions[i]._x = 0.7 * landmarks.positions[i]._x + 0.3 * lastLandmarksRef.current[i]._x;
            landmarks.positions[i]._y = 0.7 * landmarks.positions[i]._y + 0.3 * lastLandmarksRef.current[i]._y;
          }
        }

        lastLandmarksRef.current = landmarks.positions;

        const nose = landmarks.getNose();
        const jaw = landmarks.getJawOutline();
        const leftEye = landmarks.getLeftEye();
        const rightEye = landmarks.getRightEye();

        const faceWidth = jaw[16].x - jaw[0].x;
        const faceHeight = jaw[8].y - nose[0].y;

        const centerX = (leftEye[0].x + rightEye[3].x) / 2;
        const centerY = (leftEye[0].y + rightEye[3].y) / 2;
        const angle = Math.atan2(rightEye[0].y - leftEye[0].y, rightEye[0].x - leftEye[0].x);

        context.save();
        context.translate(centerX, centerY);
        context.rotate(angle);
        context.translate(-centerX, -centerY);

        const offsetX = jaw[0].x - faceWidth * 0.7; // Adjusted for better coverage
        const offsetY = nose[0].y - faceHeight * 1.4; // Adjusted for better coverage

        context.drawImage(overlayImageRef.current, offsetX, offsetY, faceWidth * 2.5, faceHeight * 3.6); // Adjusted scale
        context.restore();
      }


      // Add watermark to each frame
      const watermarkText = "snort";
      context.font = "30px Arial";
      context.fillStyle = "rgba(255, 255, 255, 0.5)";
      context.textAlign = "right";
      context.textBaseline = "bottom";
      context.fillText(watermarkText, canvas.width - 10, canvas.height - 10);


      requestAnimationFrame(drawLoop);
    };

    drawLoop();
  };

  const startRecording = async () => {
    if (!stream) {
      console.error("Stream not available");
      return;
    }

    const canvasStream = canvasRef.current.captureStream();
    mediaRecorderRef.current = new MediaRecorder(canvasStream);

    let chunks = [];
    mediaRecorderRef.current.ondataavailable = (event) => {
      chunks.push(event.data);
    };

    mediaRecorderRef.current.onstop = async () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);

      await addVideo({ url, blob });
      chunks = [];
      setIsRecording(false);
      navigate("/captured"); // Redirect to capture page after recording stops
    };

    mediaRecorderRef.current.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
    setIsRecording(false);
  };

  const captureImage = async (resizedDetections) => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);

      const overlayImage = overlayImageRef.current;
      if (resizedDetections.length > 0) {
        const detection = resizedDetections[0];
        const { landmarks } = detection;
        const nose = landmarks.getNose();
        const jaw = landmarks.getJawOutline();
        const leftEye = landmarks.getLeftEye();
        const rightEye = landmarks.getRightEye();

        const faceWidth = jaw[16].x - jaw[0].x;
        const faceHeight = jaw[8].y - nose[0].y;

        const centerX = (leftEye[0].x + rightEye[3].x) / 2;
        const centerY = (leftEye[0].y + rightEye[3].y) / 2;
        const angle = Math.atan2(rightEye[0].y - leftEye[0].y, rightEye[0].x - leftEye[0].x);

        context.save();
        context.translate(centerX, centerY);
        context.rotate(angle);
        context.translate(-centerX, -centerY);

        const offsetX = jaw[0].x - faceWidth * 0.7; // Adjusted for better coverage
        const offsetY = nose[0].y - faceHeight * 1.4; // Adjusted for better coverage

        context.drawImage(overlayImage, offsetX, offsetY, faceWidth * 2.5, faceHeight * 3.6); // Adjusted scale
        context.restore();
      }

      const watermarkText = "snort";
      context.font = "30px Arial";
      context.fillStyle = "rgba(255, 255, 255, 0.5)";
      context.textAlign = "right";
      context.textBaseline = "bottom";
      context.fillText(watermarkText, canvasRef.current.width - 10, canvasRef.current.height - 10);

      const imageData = canvasRef.current.toDataURL("image/png");
      setCapturedImage(imageData);
      await addImage(imageData);

      setTimeout(() => {
        navigate("/captured");
      }, 300);
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => processUploadedFile(img);
    }
  };

  const processUploadedFile = async (img) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = img.width;
    canvas.height = img.height;
    context.drawImage(img, 0, 0);

    const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 });
    const detections = await faceapi.detectAllFaces(img, options).withFaceLandmarks();

    const displaySize = { width: img.width, height: img.height };
    const resizedDetections = faceapi.resizeResults(detections, displaySize);

    if (resizedDetections.length > 0) {
      const detection = resizedDetections[0];
      const { landmarks } = detection;
      const nose = landmarks.getNose();
      const jaw = landmarks.getJawOutline();
      const leftEye = landmarks.getLeftEye();
      const rightEye = landmarks.getRightEye();

      const faceWidth = jaw[16].x - jaw[0].x;
      const faceHeight = jaw[8].y - nose[0].y;

      const centerX = (leftEye[0].x + rightEye[3].x) / 2;
      const centerY = (leftEye[0].y + rightEye[3].y) / 2;
      const angle = Math.atan2(rightEye[0].y - leftEye[0].y, rightEye[0].x - leftEye[0].x);

      context.save();
      context.translate(centerX, centerY);
      context.rotate(angle);
      context.translate(-centerX, -centerY);

      const offsetX = jaw[0].x - faceWidth * 0.7; // Adjusted for better coverage
      const offsetY = nose[0].y - faceHeight * 1.5; // Adjusted for better coverage

      context.drawImage(overlayImageRef.current, offsetX, offsetY, faceWidth * 2.5, faceHeight * 3.5); // Adjusted scale
      context.restore();
    }

    const watermarkText = "snort";
    context.font = "30px Arial";
    context.fillStyle = "rgba(255, 255, 255, 0.5)";
    context.textAlign = "right";
    context.textBaseline = "bottom";
    context.fillText(watermarkText, canvas.width - 10, canvas.height - 10);

    const image = canvas.toDataURL("image/png");
    await addCustomImage(image);
    setCapturedImage(image);
    navigate("/captured");
  };

  return (
    <div className="bg-mainBG md:h-screen w-full flex flex-col md:flex-row items-center">
      <img className="pt-20" src={MainImg} alt="MainImg" />

      <div className="text-white flex flex-col items-center w-full">
        <p className="text-2xl mb-4">Try Snort Filter</p>
        <div className="flex flex-row gap-4 mb-4">
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            onClick={startCamera}
          >
            OPEN CAMERA
          </button>
          <button
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-700 transition"
            onClick={() => navigate("/captured")}
          >
            VIEW CAPTURED IMAGES
          </button>
          <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        <button 
        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-700 transition"
        onClick={() => fileInputRef.current.click()}>
          Upload Image
        </button>
        </div>
        <div className="video-container relative">
          <video
            ref={videoRef}
            autoPlay
            style={{ display: stream ? "block" : "none" }}
            className="rounded-lg"
          />
          <canvas ref={canvasRef} style={{ position: "absolute", top: 0, left: 0 }} />
          {stream && (
            <>
              <button
                className="absolute bottom-4 left-1/4 transform -translate-x-1/2 bg-red-500 text-white p-4 rounded-full hover:bg-red-700 transition"
                onClick={() => captureImage(resizedDetections)}
              >
                <FaCamera className="w-8 h-8" />
              </button>
              <button
            className="absolute bottom-4 right-1/4 bg-red-500 text-white p-4 rounded-full hover:bg-red-700 transition"
            onClick={isRecording ? stopRecording : startRecording}
          >
            {isRecording ? <FaStopCircle className="w-8 h-8" /> : <FaPlayCircle className="w-8 h-8" />}
          </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Hero;

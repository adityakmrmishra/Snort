import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaCamera } from "react-icons/fa";
import { MainImg, Cartoon } from "../../assets/export";
import * as faceapi from "face-api.js";

const Hero = ({ setCapturedImage }) => {
    const [stream, setStream] = useState(null);
    const [filter, setFilter] = useState('none');
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const navigate = useNavigate();
    const [resizedDetections, setResizedDetections] = useState([]);
    const [modelsLoaded, setModelsLoaded] = useState(false);

    useEffect(() => {
        const loadModels = async () => {
            console.log("Loading models...");
            await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
            console.log("TinyFaceDetector loaded");
            await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
            console.log("FaceLandmark68Net loaded");
            setModelsLoaded(true);
            console.log("All models loaded");
        };
        loadModels();
    }, []);

    const startCamera = async () => {
        if (!modelsLoaded) {
            alert("Models are still loading, please wait.");
            return;
        }

        try {
            console.log("Starting camera...");
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
            console.log("Camera started");
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                videoRef.current.addEventListener('play', handleVideoPlay);
                console.log("Video element ready and event listener added");
            }
        } catch (err) {
            console.error("Error accessing the camera", err);
        }
    };

    const handleVideoPlay = () => {
        console.log("Video playing...");
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
        const context = canvas.getContext('2d');
        
        faceapi.matchDimensions(canvas, displaySize);
        console.log("Display size matched:", displaySize);

        setInterval(async () => {
            if (videoElement.paused || videoElement.ended || videoElement.readyState !== videoElement.HAVE_ENOUGH_DATA) {
                console.log("Video not ready for detection");
                return;
            }
            console.log("Detecting faces...");
            const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 });
            const detections = await faceapi.detectAllFaces(videoElement, options).withFaceLandmarks();
            console.log("Detections:", detections);

            const resizedDetections = faceapi.resizeResults(detections, displaySize);
            setResizedDetections(resizedDetections);
            console.log("Resized Detections:", resizedDetections);

            context.clearRect(0, 0, canvas.width, canvas.height);
            faceapi.draw.drawDetections(canvas, resizedDetections);
            faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
            console.log("Detections drawn on canvas");

           // Inside the resizedDetections.forEach loop
resizedDetections.forEach(detection => {
    const { landmarks } = detection;
    const [nose, leftEye, rightEye, mouth] = [
        landmarks.getNose()[0],
        landmarks.getLeftEye(),
        landmarks.getRightEye(),
        landmarks.getMouth()
    ];

    // Calculate position and size for the image
    const faceWidth = Math.abs(rightEye[0].x - leftEye[3].x);
    const faceHeight = Math.abs(mouth[0].y - nose.y);
    const offsetX = leftEye[0].x - faceWidth ;
    const offsetY = nose.y - faceHeight;

    // Draw the image on the canvas
    const image = new Image();
    image.src = Cartoon; // Replace with the path to your image
    image.onload = () => {
        context.drawImage(image, offsetX, offsetY, faceWidth * 5, faceHeight * 3);
    };
});
        }, 100);
    };

    
    const captureImage = (resizedDetections) => {
        if (videoRef.current && canvasRef.current) {
            console.log("Capturing image...");
            const context = canvasRef.current.getContext("2d");
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
            context.filter = filter; // Apply the filter to the canvas
            context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
            console.log("Image drawn on canvas with filter:", filter);
    
            // Draw the overlay image
            const overlayImage = new Image();
            overlayImage.src = Cartoon; // Replace with the path to your overlay image
            overlayImage.onload = () => {
                const { landmarks } = resizedDetections[0]; // Assuming only one face is detected
                const [nose, leftEye, rightEye, mouth] = [
                    landmarks.getNose()[0],
                    landmarks.getLeftEye(),
                    landmarks.getRightEye(),
                    landmarks.getMouth()
                ];
                const faceWidth = Math.abs(rightEye[0].x - leftEye[3].x);
                const faceHeight = Math.abs(mouth[0].y - nose.y);
                const offsetX = leftEye[0].x - faceWidth;
                const offsetY = nose.y - faceHeight;
                context.drawImage(overlayImage, offsetX, offsetY, faceWidth *5, faceHeight * 3);
                
                // Add watermark
                const watermarkText = 'EGMA'; // Change to your desired watermark text
                context.font = '30px Arial';
                context.fillStyle = 'rgba(255, 255, 255, 0.5)';
                context.textAlign = 'right';
                context.textBaseline = 'bottom';
                context.fillText(watermarkText, canvasRef.current.width - 10, canvasRef.current.height - 10);
                
                // Capture the image
                const imageData = canvasRef.current.toDataURL("image/png");
                setCapturedImage(imageData);
                saveImageToLocalStorage(imageData);
                console.log("Image captured and saved to local storage");
                setTimeout(() => {
                    navigate("/captured");
                    console.log("Navigated to /captured");
                }, 300); // Delay to allow transition effect
            };
        }
    };
    

    const saveImageToLocalStorage = (imageData) => {
        let images = JSON.parse(localStorage.getItem('capturedImages')) || [];
        images.push(imageData);
        localStorage.setItem('capturedImages', JSON.stringify(images));
        console.log("Image data saved to local storage");
    };

    const applyFilter = (filter) => {
        setFilter(filter);
        if (videoRef.current) {
            videoRef.current.style.filter = filter; // Apply the filter to the video element
            console.log("Filter applied to video element:", filter);
        }
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
                </div>
                {stream && (
                    <div className="flex flex-row gap-2 mb-4">
                        <button 
                            className="bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-700 transition"
                            onClick={() => applyFilter('none')}
                        >
                            No Filter
                        </button>
                        <button 
                            className="bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-700 transition"
                            onClick={() => applyFilter('grayscale(100%)')}
                        >
                            Grayscale
                        </button>
                        <button 
                            className="bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-700 transition"
                            onClick={() => applyFilter('sepia(100%)')}
                        >
                            Sepia
                        </button>
                        <button 
                            className="bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-700 transition"
                            onClick={() => applyFilter('invert(100%)')}
                        >
                            Invert
                        </button>
                        <button 
                            className="bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-700 transition"
                            onClick={() => applyFilter('brightness(100%)')}
                        >
                            Brightness
                        </button>
                        <button 
                            className="bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-700 transition"
                            onClick={() => applyFilter('contrast(150%)')}
                        >
                            Contrast
                        </button>
                    </div>
                )}
                <div className="video-container relative">
                    <video 
                        ref={videoRef} 
                        autoPlay 
                        style={{ display: stream ? 'block' : 'none', filter: filter }} 
                        className="rounded-lg"
                    />
                    <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0 }} />
                    {stream && (
                        <button 
    className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white p-4 rounded-full hover:bg-red-700 transition"
    onClick={() => captureImage(resizedDetections)}
>
    <FaCamera className="w-8 h-8" />
</button>

                    )}
                </div>
            </div>
        </div>
    );
};

export default Hero;

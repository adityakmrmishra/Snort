import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaCamera } from "react-icons/fa";
import { MainImg } from "../../assets/export";

const Hero = ({ setCapturedImage }) => {
    const [stream, setStream] = useState(null);
    const [filter, setFilter] = useState('none');
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const navigate = useNavigate();

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error("Error accessing the camera", err);
        }
    };

    const captureImage = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext("2d");
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
            context.filter = filter; // Apply the filter to the canvas
            context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);

            // Add watermark
            const watermarkText = 'EGMA'; // Change to your desired watermark text
            context.font = '30px Arial';
            context.fillStyle = 'rgba(255, 255, 255, 0.5)';
            context.textAlign = 'right';
            context.textBaseline = 'bottom';
            context.fillText(watermarkText, canvasRef.current.width - 10, canvasRef.current.height - 10);

            const imageData = canvasRef.current.toDataURL("image/png");
            setCapturedImage(imageData);
            saveImageToLocalStorage(imageData);
            setTimeout(() => {
                navigate("/captured");
            }, 300); // Delay to allow transition effect
        }
    };

    const saveImageToLocalStorage = (imageData) => {
        let images = JSON.parse(localStorage.getItem('capturedImages')) || [];
        images.push(imageData);
        localStorage.setItem('capturedImages', JSON.stringify(images));
    };

    const applyFilter = (filter) => {
        setFilter(filter);
        if (videoRef.current) {
            videoRef.current.style.filter = filter; // Apply the filter to the video element
        }
    };

    return (
        <div className="bg-mainBG h-screen w-full flex  items-center">
            <img className=" pt-[14vw]" src={MainImg} alt="MainImg" />

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
                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                    {stream && (
                        <button 
                            className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white p-4 rounded-full hover:bg-red-700 transition"
                            onClick={captureImage}
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

import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaCamera } from "react-icons/fa";
import { MainImg } from "../../assets/export";

const Hero = ({ setCapturedImage }) => {
    const [stream, setStream] = useState(null);
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
            context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
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

    return (
        <div className="bg-mainBG h-screen w-full flex flex-row justify-between">
            <img className="pt-[203px]" src={MainImg} alt="MainImg" />
            <div className="text-white flex flex-col items-center w-full">
                <p>Try Snort Filter</p>
                <div className="flex flex-row gap-2">
                    <button onClick={startCamera}>TRY FILTER</button>
                    <button onClick={() => navigate("/captured")}>VIEW CAPTURED IMAGE</button>
                </div>
                <div className="video-container">
                    <video ref={videoRef} autoPlay style={{ display: stream ? 'block' : 'none' }} />
                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                </div>
                {stream && (
                    <div className="flex items-center">
                        <button onClick={captureImage}>
                            <FaCamera className="mt-4 w-[3vw] h-[3vw]" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Hero;

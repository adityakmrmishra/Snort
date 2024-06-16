import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ImageModal from "./ImageModal";
import { MdDelete } from "react-icons/md";
import { FaSave } from "react-icons/fa";

const CapturedImagePage = () => {
    const [images, setImages] = useState([]);
    const [selectedImageIndex, setSelectedImageIndex] = useState(null);
    const navigate = useNavigate();
    const [videos, setVideos] = useState([]);

    useEffect(() => {
        const storedImages = JSON.parse(localStorage.getItem('capturedImages')) || [];
        const storedVideos = JSON.parse(localStorage.getItem('capturedVideos')) || [];
        setImages(storedImages);
        setVideos(storedVideos);
        setSelectedImageIndex(null);
    }, []);

    const saveMedia = (mediaData, isVideo = false) => {
        const link = document.createElement('a');
        link.href = mediaData;
        link.download = isVideo ? 'captured_video.webm' : 'captured_image.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const openModal = (index) => {  
        setSelectedImageIndex(index);
    };

    const closeModal = () => {
        setSelectedImageIndex(null);
    };

    const goToNextImage = () => {
        setSelectedImageIndex((prevIndex) => {
            const newIndex = (prevIndex + 1) % images.length; // Loop to the first image if at the end
            return newIndex;
        });
    };

    const goToPrevImage = () => {
        // setSelectedImageIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
        setSelectedImageIndex((prevIndex) => {
            const newIndex = (prevIndex - 1 + images.length) % images.length; // Loop to the last image if at the beginning
            return newIndex;
        });
    };

    const deleteImage = (index) => {
        const updatedImages = [...images];
        updatedImages.splice(index, 1);
        setImages(updatedImages);
        localStorage.setItem('capturedImages', JSON.stringify(updatedImages));
    };

    const deleteVideo = (index) => {
        const updatedVideos = [...videos];
        updatedVideos.splice(index, 1);
        setVideos(updatedVideos);
        localStorage.setItem('capturedVideos', JSON.stringify(updatedVideos));
    };

    return (
        <div className="bg-mainBG h-screen w-full flex flex-col items-center p-4">
            <div className="flex flex-row items-center w-full mb-4">
                <button
                    className="bg-blue-500 text-white px-4 py-2 rounded absolute top-4 left-4"
                    onClick={() => navigate("/")}
                >
                    BACK
                </button>
                <h3 className="text-white text-xl mx-auto">Captured Images and Videos</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full max-w-screen-lg">
                {images.length === 0 && videos.length === 0 && <p className="text-white col-span-full">No images or videos captured</p>}
                {images.map((image, index) => (
                    <div key={index} className="relative group">
                        <img
                            src={image}
                            alt={`Captured ${index}`}
                            className="w-full h-auto cursor-pointer rounded-lg"
                            onClick={() => openModal(index)}
                        />
                        <div className="absolute inset-0 flex justify-center items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-50 rounded-lg pointer-events-none">
                            <button
                                className="p-2 bg-white rounded-full text-black pointer-events-auto"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    saveMedia(image);
                                }}
                            >
                                <FaSave />
                            </button>
                            <button
                                className="p-2 bg-white rounded-full text-red-500 pointer-events-auto"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    deleteImage(index);
                                }}
                            >
                                <MdDelete />
                            </button>
                        </div>
                    </div>
                ))}
                {videos.map((video, index) => (
                    <div key={`video-${index}`} className="relative group">
                        <video
                            src={video}
                            controls
                            className="w-full h-auto cursor-pointer rounded-lg"
                        />
                        <div className="absolute inset-0 flex justify-center items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-50 rounded-lg pointer-events-none">
                            <button
                                className="p-2 bg-white rounded-full text-black pointer-events-auto"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    saveMedia(video, true);
                                }}
                            >
                                <FaSave />
                            </button>
                            <button
                                className="p-2 bg-white rounded-full text-red-500 pointer-events-auto"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    deleteVideo(index);
                                }}
                            >
                                <MdDelete />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {selectedImageIndex !== null && (
                <ImageModal
                    image={images[selectedImageIndex]}
                    onClose={closeModal}
                    onNext={goToNextImage}
                    onPrev={goToPrevImage}
                />
            )}
        </div>
    );
};

export default CapturedImagePage;
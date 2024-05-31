import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ImageModal from "./ImageModal";
import { MdDelete } from "react-icons/md";
import { FaSave } from "react-icons/fa";

const CapturedImagePage = () => {
    const [images, setImages] = useState([]);
    const [selectedImageIndex, setSelectedImageIndex] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const storedImages = JSON.parse(localStorage.getItem('capturedImages')) || [];
        setImages(storedImages);
        setSelectedImageIndex(null); // Reset selected image index when images change
    }, []);

    const saveImage = (imageData) => {
        const link = document.createElement('a');
        link.href = imageData;
        link.download = 'captured_image.png';
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

    return (
        <div className="bg-mainBG h-screen w-full flex flex-col items-center">
            <h3 className="text-white">Captured Images:</h3>
            <div className="flex items-center gap-4 w-[30%]">
                {images.length === 0 && <p className="text-white">No images captured</p>}
                {images.map((image, index) => (
                    <div key={index} className="flex flex-col items-center">
                        <img src={image} alt={`Captured ${index}`} className="mb-2" onClick={() => openModal(index)} />
                        <div className="flex gap-10">
                            <button onClick={() => saveImage(image)}><FaSave /></button>
                            <button onClick={() => deleteImage(index)}><MdDelete /></button>
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex flex-row gap-2 mt-4">
                <button onClick={() => navigate("/")}>BACK</button>
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

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ImageModal from "./ImageModal";
import { MdDelete } from "react-icons/md";
import { FaSave, FaFacebook, FaTwitter, FaInstagram } from "react-icons/fa";
import {
  getAllImages,
  deleteImageById,
  getAllVideos,
  deleteVideoById,
  getAllCustomImages,
  deleteCustomImageById,
} from "./db"; // Assuming db.js is in the same directory

const CapturedImagePage = () => {
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [customImages, setCustomImages] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const storedImages = await getAllImages();
      const storedVideos = await getAllVideos();
      const storedCustomImages = await getAllCustomImages();
      setImages(storedImages);
      setVideos(storedVideos);
      setCustomImages(storedCustomImages);
      setSelectedImageIndex(null);
    };
    fetchData();
  }, []);

  const saveMedia = (mediaData, isVideo = false) => {
    const link = document.createElement("a");
    link.href = mediaData;
    link.download = isVideo ? "captured_video.webm" : "captured_image.png";
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
    setSelectedImageIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const goToPrevImage = () => {
    setSelectedImageIndex(
      (prevIndex) => (prevIndex - 1 + images.length) % images.length
    );
  };

  const deleteImage = async (id) => {
    await deleteImageById(id);
    const updatedImages = await getAllImages();
    setImages(updatedImages);
  };

  const deleteVideo = async (id) => {
    await deleteVideoById(id);
    const updatedVideos = await getAllVideos();
    setVideos(updatedVideos);
  };

  const deleteCustomImage = async (id) => {
    await deleteCustomImageById(id);
    const updatedCustomImages = await getAllCustomImages();
    setCustomImages(updatedCustomImages);
  };

  const shareOnFacebook = (imageURL) => {
    const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      imageURL
    )}&quote=${encodeURIComponent("Check out this amazing image!")}`;
    window.open(facebookShareUrl, "_blank");
  };

  const shareOnTwitter = (imageURL) => {
    const twitterShareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(
      imageURL
    )}&text=${encodeURIComponent("Check out this amazing image!")}`;
    window.open(twitterShareUrl, "_blank");
  };

  const shareOnInstagram = (imageURL) => {
    alert(
      "Instagram does not support direct web sharing. Please download the image and share it manually on Instagram."
    );
  };

  return (
    <div className="bg-mainBG h-auto w-full flex flex-col items-center p-4">
      <div className="flex flex-row items-center w-full mb-4">
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded absolute top-4 left-4"
          onClick={() => navigate("/")}
        >
          BACK
        </button>
        <h3 className="text-white text-xl mx-auto">
          Captured Images and Videos
        </h3>
      </div>
      <div className="w-full max-w-screen-lg">
        <h4 className="text-white text-lg mb-4">Captured Images</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {images.length === 0 && (
            <p className="text-white col-span-full">No images captured</p>
          )}
          {images.map(({ id, image }, index) => (
            <div key={`image-${id}`} className="relative group">
              <img
                src={image}
                alt={`Captured ${index}`}
                className="w-full h-auto cursor-pointer rounded-lg"
                onClick={() => openModal(index)}
              />
              <div className="absolute inset-0 flex flex-col justify-center items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-50 rounded-lg pointer-events-none">
                <div className="gap-2 flex flex-row">
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
                      deleteImage(id);
                    }}
                  >
                    <MdDelete />
                  </button>
                </div>

                <div className="flex flex-row gap-2">
                  <button
                    className="p-2 text-xs bg-white rounded-full text-blue-600 pointer-events-auto"
                    onClick={(e) => {
                      e.stopPropagation();
                      shareOnFacebook(image);
                    }}
                  >
                    <FaFacebook />
                  </button>
                  <button
                    className="p-2 text-xs bg-white rounded-full text-blue-400 pointer-events-auto"
                    onClick={(e) => {
                      e.stopPropagation();
                      shareOnTwitter(image);
                    }}
                  >
                    <FaTwitter />
                  </button>
                  <button
                    className="p-2 text-xs bg-white rounded-full text-purple-500 pointer-events-auto"
                    onClick={(e) => {
                      e.stopPropagation();
                      shareOnInstagram(image);
                    }}
                  >
                    <FaInstagram />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ... (other sections remain unchanged) ... */}
      </div>
      {selectedImageIndex !== null && (
        <ImageModal
          image={images[selectedImageIndex].image}
          onClose={closeModal}
          onNext={goToNextImage}
          onPrev={goToPrevImage}
        />
      )}
    </div>
  );
};

export default CapturedImagePage;

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ImageModal from "./ImageModal";
import { MdDelete } from "react-icons/md";
import { FaSave, FaShareAlt } from "react-icons/fa";
import {
  getAllImages,
  deleteImageById,
  getAllVideos,
  deleteVideoById,
  getAllCustomImages,
  deleteCustomImageById,
} from "./db";
import Modal from "react-modal";
import {
  FacebookShareButton,
  TwitterShareButton,
  FacebookIcon,
  TwitterIcon,
} from "react-share";

Modal.setAppElement("#root");

const CapturedImagePage = () => {
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [customImages, setCustomImages] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");

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

  const openShareModal = (base64Image) => {
    const blob = base64ToBlob(base64Image);
    const imageUrl = URL.createObjectURL(blob);
    setCurrentUrl(imageUrl);
    setIsModalOpen(true);
  };

  const closeShareModal = () => {
    setIsModalOpen(false);
    setCurrentUrl("");
    URL.revokeObjectURL(currentUrl);
  };

  const base64ToBlob = (base64Data) => {
    const byteCharacters = atob(base64Data.split(",")[1]);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    return new Blob(byteArrays, { type: "image/png" });
  };

  return (
    <div className="bg-mainBG min-h-screen w-full flex flex-col items-center p-4">
      <div className="flex flex-row items-center w-full mb-4">
        <button
          className="bg-blue-900 text-white px-8 py-4 rounded-full absolute top-4 left-4 font-['Archivo-Bold']"
          onClick={() => navigate("/")}
        >
          BACK
        </button>
        <h3 className="text-white pt-2 text-4xl mx-auto font-['Archivo-Bold']">
          All Images and Videos
        </h3>
      </div>
      <div className="w-full max-w-screen-lg">
        <h4 className="text-white text-xl mb-4 font-['Archivo-Bold']">
          Captured Images
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {images.length === 0 && (
            <p className="text-gray-600 col-span-full font-['Archivo-light']">
              No images captured
            </p>
          )}
          {images.map(({ id, image }, index) => (
            <div key={`image-${id}`} className="relative group">
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
                    deleteImage(id);
                  }}
                >
                  <MdDelete />
                </button>
                <button
                  className="btn btn-primary p-2 bg-white rounded-full text-black pointer-events-auto"
                  onClick={() => openShareModal(image)}
                >
                  <FaShareAlt />
                </button>
              </div>
            </div>
          ))}
        </div>
        <h4 className="text-white text-xl mb-4 font-['Archivo-Bold']">
          Captured Videos
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {videos.length === 0 && (
            <p className="text-gray-600 col-span-full  font-['Archivo-light']">
              No videos captured
            </p>
          )}
          {videos.map(({ id, blob }, index) => {
            const videoURL = URL.createObjectURL(
              new Blob([blob], { type: "video/webm" })
            );
            return (
              <div key={`video-${id}`} className="relative group">
                <video
                  src={videoURL}
                  controls
                  className="w-full h-auto cursor-pointer rounded-lg"
                />
                <div className="absolute inset-0 flex justify-center items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-50 rounded-lg pointer-events-none">
                  <button
                    className="p-2 bg-white rounded-full text-black pointer-events-auto"
                    onClick={(e) => {
                      e.stopPropagation();
                      saveMedia(videoURL, true);
                    }}
                  >
                    <FaSave />
                  </button>
                  <button
                    className="p-2 bg-white rounded-full text-red-500 pointer-events-auto"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteVideo(id);
                    }}
                  >
                    <MdDelete />
                  </button>
                  <button
                    className="btn btn-primary p-2 bg-white rounded-full text-black pointer-events-auto"
                    onClick={() => openShareModal(videoURL)}
                  >
                    <FaShareAlt />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <h4 className="text-white text-xl mb-4 font-['Archivo-Bold'] pt-6">
          Uploaded Images
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {customImages.length === 0 && (
            <p className="text-gray-600  col-span-full font-['Archivo-light']">
              No custom images
            </p>
          )}
          {customImages.map(({ id, image }, index) => (
            <div key={`custom-image-${id}`} className="relative group">
              <img
                src={image}
                alt={`Custom Captured ${index}`}
                className="w-full h-auto cursor-pointer rounded-lg"
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
                    deleteCustomImage(id);
                  }}
                >
                  <MdDelete />
                </button>
                <button
                  className="btn btn-primary p-2 bg-white rounded-full text-black pointer-events-auto"
                  onClick={() => openShareModal(image)}
                >
                  <FaShareAlt />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeShareModal}
        contentLabel="Share Modal"
        className="Modal px-16 py-4 flex flex-col gap-0"
        overlayClassName="Overlay"
      >
        <div className="flex flex-row pb-6">
          <h2 className="text-3xl text-center w-full font-['Archivo-Bold']">Share</h2>
        </div>

        <div className="flex justify-between gap-4 ">
          <FacebookShareButton url={currentUrl}>
            <FacebookIcon className="transform hover:scale-150 transition duration-300 ease-in-out" size={40} round />
          </FacebookShareButton>
          <TwitterShareButton url={currentUrl}>
            <TwitterIcon className="transform hover:scale-150 transition duration-300 ease-in-out" size={40} round />
          </TwitterShareButton>
        </div>
        <button
          className="btn btn-secondary text-sm"
          onClick={closeShareModal}
        ></button>
      </Modal>

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

import React from "react";
import { FaArrowLeft, FaArrowRight, FaTimes } from "react-icons/fa";

const ImageModal = ({ image, onClose, onNext, onPrev }) => {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-lg p-4 w-full max-w-lg mx-2 sm:mx-4 md:mx-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="absolute top-2 right-2 text-black" onClick={onClose}>
          <FaTimes size={24} />
        </button>
        <img src={image} alt="Preview" className="w-full h-auto rounded-lg" />
        <div className="flex justify-between mt-4">
          <button
            className="p-2 bg-gray-800 text-white rounded-full"
            onClick={onPrev}
          >
            <FaArrowLeft />
          </button>
          <button
            className="p-2 bg-gray-800 text-white rounded-full"
            onClick={onNext}
          >
            <FaArrowRight />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageModal;

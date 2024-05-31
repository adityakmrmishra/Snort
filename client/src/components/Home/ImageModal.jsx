import React from "react";

const ImageModal = ({ image, onClose, onNext, onPrev }) => {
    return (
        <div className="modal">
            <div className="modal-content">
                <span className="close text-black text-[2.5vw] -top-6 " onClick={onClose}>&times;</span>
                <img src={image} alt="Captured" className="center-image" />
                <div className="navigation-buttons">
                    <button onClick={onPrev}>Previous</button>
                    <button onClick={onNext}>Next</button>
                </div>
            </div>
        </div>
    );
};

export default ImageModal;

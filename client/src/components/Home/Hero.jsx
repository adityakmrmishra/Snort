import React from "react";
import { MainImg } from "../../assets/export";

const MainHome = () => {
    return (
        <div className="bg-mainBG h-screen w-full flex flex-row justify-between">
            <img className="pt-[203px]" src={MainImg} alt="MainImg" />

            <div className="text-white flex flex-col items-center w-full">
                <p>Try Snort Filter</p>
                <div className="flex flex-row gap-2">
                    <button>TRY FILTER</button>
                    <button>ADD FILTER</button>
                </div>
                
            </div>
        </div>
    );
};

export default MainHome;

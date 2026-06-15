import React from 'react';
import Tooltip from './Tooltip';
import { ZoomOutIcon } from './icons/ZoomOutIcon';
import { ZoomInIcon } from './icons/ZoomInIcon';

interface ZoomControlProps {
    zoom: number;
    setZoom: (zoom: number) => void;
    isVisible: boolean;
}

const MIN_ZOOM = 5; // px per day
const MAX_ZOOM = 200; // px per day

const ZoomControl: React.FC<ZoomControlProps> = ({ zoom, setZoom, isVisible }) => {
    
    const getSliderValue = (val: number) => {
        const minv = Math.log(MIN_ZOOM);
        const maxv = Math.log(MAX_ZOOM);
        const scale = (maxv - minv) / (100 - 0);
        return (Math.log(val) - minv) / scale;
    };

    const getZoomValue = (sliderValue: number) => {
        const minv = Math.log(MIN_ZOOM);
        const maxv = Math.log(MAX_ZOOM);
        const scale = (maxv - minv) / (100 - 0);
        return Math.exp(minv + scale * sliderValue);
    };

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newZoom = getZoomValue(parseFloat(e.target.value));
        setZoom(newZoom);
    };
    
    const handleZoomIn = () => {
      setZoom(Math.min(MAX_ZOOM, zoom * 1.25));
    }
    
    const handleZoomOut = () => {
      setZoom(Math.max(MIN_ZOOM, zoom / 1.25));
    }

    return (
        <div className={`absolute bottom-full mb-3 left-1/2 -translate-x-1/2 p-3 bg-white rounded-xl shadow-lg border border-gray-200 flex items-center space-x-3 w-60 ${isVisible ? 'animate-fade-in' : 'animate-fade-out'}`}>
            <div className="flex-grow flex items-center space-x-2">
                <Tooltip text="Zoom Out">
                    <button onClick={handleZoomOut} className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600">
                        <ZoomOutIcon className="h-5 w-5"/>
                    </button>
                </Tooltip>
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={getSliderValue(zoom)}
                    onChange={handleSliderChange}
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                 <Tooltip text="Zoom In">
                    <button onClick={handleZoomIn} className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600">
                        <ZoomInIcon className="h-5 w-5"/>
                    </button>
                </Tooltip>
            </div>
        </div>
    );
};

export default ZoomControl;
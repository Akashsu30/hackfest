// src/hooks/useWebgazer.js
import { useEffect, useState } from 'react';

const useWebgazer = () => {
    const [isReady, setIsReady] = useState(false);
    const [gazeData, setGazeData] = useState({ x: 0, y: 0 });

    useEffect(() => {
        // Access the global webgazer object
        const wg = window.webgazer;

        wg.setGazeListener((data, elapsedTime) => {
            if (data) {
                setGazeData({ x: data.x, y: data.y });
            }
        }).begin();

        wg.showVideoPreview(true); // Shows the webcam feed in the corner
        setIsReady(true);

        // Cleanup: Stop the tracker when the component unmounts
        return () => {
            wg.pause();
            wg.end();
        };
    }, []);

    return { isReady, gazeData };
};

export default useWebgazer;
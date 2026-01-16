import React from "react";
import Webcam from "react-webcam";

const CameraPreview = React.forwardRef((props, ref) => {
  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: "environment", 
  };

  return (
    <Webcam
      audio={false}
      ref={ref}
      screenshotFormat="image/jpeg"
      videoConstraints={videoConstraints}
      className="rounded-2xl w-full h-full object-cover"
    />
  );
});

export default CameraPreview;
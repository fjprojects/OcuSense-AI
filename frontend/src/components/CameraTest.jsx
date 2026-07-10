import React, { useRef } from "react";

export default function CameraTest() {
  const videoRef = useRef(null);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
    } catch (e) {
      console.error(e);
      alert(e.name + ": " + e.message);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <button onClick={start}>Start Camera</button>
      <br /><br />
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{ width: "500px", border: "1px solid black" }}
      />
    </div>
  );
}
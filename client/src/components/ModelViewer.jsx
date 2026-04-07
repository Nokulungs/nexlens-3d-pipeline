import React, { useEffect, useRef } from "react";
import * as BABYLON from "@babylonjs/core";
import "@babylonjs/loaders/glTF"; // Essential for loading .glb files

const ModelViewer = ({ modelUrl }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !modelUrl) return;

    // 1. Initialize Engine and Scene
    const engine = new BABYLON.Engine(canvasRef.current, true);
    const scene = new BABYLON.Scene(engine);
    
    // NexEra Style: Clean, light-gray background
    scene.clearColor = new BABYLON.Color4(0.95, 0.95, 0.95, 1);

    // 2. Create Camera
    const camera = new BABYLON.ArcRotateCamera(
      "camera",
      Math.PI / 2, // Alpha
      Math.PI / 4, // Beta
      10,          // Radius
      BABYLON.Vector3.Zero(),
      scene
    );
    camera.attachControl(canvasRef.current, true);
    
    // Enable "Auto-Framing" - This makes the model fit the screen perfectly
    camera.useFramingBehavior = true;

    // 3. Lighting
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 0.8;

    // 4. Load the Model
    BABYLON.SceneLoader.ImportMesh("", "", modelUrl, scene, (meshes) => {
      // AI models often come with a "root" node that needs scaling
      const root = meshes[0];

      // Auto-Center the model at (0,0,0)
      const bounds = root.getHierarchyBoundingVectors();
      const center = bounds.max.add(bounds.min).scale(0.5);
      root.setPivotPoint(center);
      root.position = BABYLON.Vector3.Zero();

      // Trigger the camera to zoom to the model's actual size
      const framingBehavior = camera.getBehaviorByName("Framing");
      if (framingBehavior) {
        framingBehavior.zoomOnMeshesHierarchy(meshes);
      }

      // Optional: Slow rotation for a "gallery" feel
      camera.useAutoRotationBehavior = true;
      camera.autoRotationBehavior.idleRotationSpeed = 0.1;
    });

    // 5. Render Loop & Resize Handling
    engine.runRenderLoop(() => {
      scene.render();
    });

    const handleResize = () => {
      engine.resize();
    };

    window.addEventListener("resize", handleResize);

    // Cleanup when component unmounts
    return () => {
      engine.dispose();
      window.removeEventListener("resize", handleResize);
    };
  }, [modelUrl]);

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-full outline-none" 
      style={{ minHeight: "400px" }} 
    />
  );
};

export default ModelViewer;
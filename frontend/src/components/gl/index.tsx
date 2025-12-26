import { Perf } from "r3f-perf";
import { Effects } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useControls } from "leva";
import { Particles } from "./particles";
import { VignetteShader } from "./shaders/vignetteShader";

interface GLProps {
  hovering: boolean;
  speed?: number;
  darknessMultiplier?: number;
}

export const GL = ({ hovering, speed: externalSpeed = 1.0, darknessMultiplier = 1.0 }: GLProps) => {
  // PERMANENT CHANGES:
  // To make changes permanent, update the 'value' fields below with your desired settings.
  // Example: speed: { value: 1.5, ... }
  const controls = useControls(
    "Particle System",
    {
      speed: { value: 1.0, min: 0, max: 2, step: 0.01 },
      noiseScale: { value: 0.6, min: 0.1, max: 5, step: 0.1 },
      noiseIntensity: { value: 0.52, min: 0, max: 2, step: 0.01 },
      timeScale: { value: 1, min: 0, max: 2, step: 0.01 },
      // focus: { value: 3.8, min: 0.1, max: 20, step: 0.1 },
      focus: { value: 3.6, min: 0.1, max: 20, step: 0.1 },
      aperture: { value: 1.79, min: 0, max: 2, step: 0.01 },
      pointSize: { value: 10.0, min: 0.1, max: 10, step: 0.1 },
      opacity: { value: 0.8, min: 0, max: 1, step: 0.01 },
      planeScale: { value: 10.0, min: 0.1, max: 10, step: 0.1 },
      size: {
        value: 512,
        options: [256, 512, 1024],
      },
      showDebugPlane: { value: false },
      vignetteDarkness: { value: 1.5, min: 0, max: 2, step: 0.1 },
      vignetteOffset: { value: 0.4, min: 0, max: 2, step: 0.1 },
      useManualTime: { value: false },
      manualTime: { value: 0, min: 0, max: 50, step: 0.01 },
    },
    {
      // Hide controls by default in production or based on a condition
      // hidden: process.env.NODE_ENV === "production",
      render: () => process.env.NODE_ENV !== "production",
      // render: () => false,
    }
  );

  const {
    speed,
    focus,
    aperture,
    size,
    noiseScale,
    noiseIntensity,
    timeScale,
    pointSize,
    opacity,
    planeScale,
    vignetteDarkness,
    vignetteOffset,
    useManualTime,
    manualTime,
  } = controls;

  // Apply external multipliers directly (leva caches initial values, so we multiply here)
  // darknessMultiplier > 1 means darker: reduce opacity and increase vignette
  const effectiveSpeed = speed * externalSpeed;
  const effectiveOpacity = opacity / darknessMultiplier; // e.g. 0.8 / 5 = 0.16 (80% darker)
  const effectiveVignetteDarkness = Math.min(vignetteDarkness * darknessMultiplier, 2.0);

  return (
    <div id="webgl">
      <Canvas
        camera={{
          position: [1.2629783123314589, 2.664606471394044, -1.8178993743288914],
          fov: 50,
          near: 0.01,
          far: 300,
        }}
      >
        {/* <Perf position="top-left" /> */}
        <color attach="background" args={["#000"]} />
        <Particles
          speed={effectiveSpeed}
          aperture={aperture}
          focus={focus}
          size={size}
          noiseScale={noiseScale}
          noiseIntensity={noiseIntensity}
          timeScale={timeScale}
          pointSize={pointSize}
          opacity={effectiveOpacity}
          planeScale={planeScale}
          useManualTime={useManualTime}
          manualTime={manualTime}
          introspect={hovering}
        />
        <Effects multisamping={0} disableGamma>
          <shaderPass
            args={[VignetteShader]}
            uniforms-darkness-value={effectiveVignetteDarkness}
            uniforms-offset-value={vignetteOffset}
          />
        </Effects>
      </Canvas>
    </div>
  );
};

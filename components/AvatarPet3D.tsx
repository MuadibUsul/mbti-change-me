"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import * as THREE from "three";
import type { PetModel } from "@/lib/types";

type AvatarPet3DProps = {
  petModel?: PetModel | null;
  className?: string;
  interactive?: boolean;
  compact?: boolean;
};

function hslToThree(hslValue: string, fallback = "hsl(200 50% 50%)") {
  const value = hslValue || fallback;
  const match = value.match(/hsl\(([-\d.]+)\s+([-\d.]+)%\s+([-\d.]+)%\)/i);
  const color = new THREE.Color();
  if (!match) {
    color.setStyle(fallback);
    return color;
  }
  const h = Number(match[1] ?? 200) / 360;
  const s = Number(match[2] ?? 50) / 100;
  const l = Number(match[3] ?? 50) / 100;
  color.setHSL(Math.max(0, Math.min(1, h)), Math.max(0, Math.min(1, s)), Math.max(0, Math.min(1, l)));
  return color;
}

function toon(color: THREE.Color, emissive = 0) {
  return new THREE.MeshToonMaterial({
    color,
    emissive: emissive ? color.clone().multiplyScalar(emissive) : undefined,
    transparent: false,
  });
}

function addOutline(mesh: THREE.Mesh, color = 0x1d1b1a) {
  const edges = new THREE.EdgesGeometry(mesh.geometry, 24);
  const line = new THREE.LineSegments(
    edges,
    new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.6,
    }),
  );
  line.position.copy(mesh.position);
  line.rotation.copy(mesh.rotation);
  line.scale.copy(mesh.scale);
  mesh.parent?.add(line);
  return line;
}

function dispose(root: THREE.Object3D) {
  root.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.geometry.dispose();
      if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
      else obj.material.dispose();
    }
    if (obj instanceof THREE.LineSegments) {
      obj.geometry.dispose();
      if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
      else obj.material.dispose();
    }
  });
}

function fallbackSvg(model?: PetModel | null) {
  if (!model) return "";
  const line = model.palette.line;
  const body = model.palette.body;
  const skin = model.palette.skin;
  const accent = model.palette.accent;
  const aura = model.palette.aura;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 220" role="img" aria-label="宠物形象">
  <defs><filter id="g"><feGaussianBlur stdDeviation="5" /></filter></defs>
  <circle cx="110" cy="120" r="80" fill="${aura}" opacity="0.16" filter="url(#g)"/>
  <ellipse cx="110" cy="192" rx="56" ry="10" fill="${line}" opacity="0.18"/>
  <ellipse cx="110" cy="120" rx="44" ry="38" fill="${body}" stroke="${line}" stroke-width="4"/>
  <circle cx="110" cy="74" r="40" fill="${skin}" stroke="${line}" stroke-width="4"/>
  <circle cx="96" cy="68" r="7" fill="${line}"/><circle cx="124" cy="68" r="7" fill="${line}"/>
  <path d="M93 90 Q110 104 127 90" stroke="${line}" stroke-width="5" fill="none" stroke-linecap="round"/>
  <circle cx="65" cy="122" r="11" fill="${accent}" stroke="${line}" stroke-width="3"/>
  <circle cx="155" cy="122" r="11" fill="${accent}" stroke="${line}" stroke-width="3"/>
  </svg>`;
}

export function AvatarPet3D({ petModel, className, interactive = true, compact = false }: AvatarPet3DProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [webglFailed, setWebglFailed] = useState(false);

  const markFailed = useCallback(() => {
    window.setTimeout(() => setWebglFailed(true), 0);
  }, []);

  const fallback = useMemo(() => fallbackSvg(petModel), [petModel]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !petModel || webglFailed) return;

    let frameId = 0;
    let disposed = false;
    const pointer = { x: 0, y: 0 };
    let eyeBlink = 1;
    let nextBlink = 1.1;

    try {
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setClearColor(0x000000, 0);
      container.innerHTML = "";
      container.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
      camera.position.set(0, compact ? 1.25 : 1.35, compact ? 5 : 5.7);
      scene.add(camera);

      scene.add(new THREE.AmbientLight(0xffffff, 0.95));
      const key = new THREE.DirectionalLight(0xffffff, 0.88);
      key.position.set(2.8, 4.2, 3.5);
      scene.add(key);
      const fill = new THREE.PointLight(0xb6f0ff, 0.52, 12);
      fill.position.set(-2.5, 2.2, -2.8);
      scene.add(fill);

      const root = new THREE.Group();
      scene.add(root);

      const cSkin = hslToThree(petModel.palette.skin);
      const cBody = hslToThree(petModel.palette.body);
      const cAccent = hslToThree(petModel.palette.accent);
      const cAura = hslToThree(petModel.palette.aura);

      const aura = new THREE.Mesh(
        new THREE.SphereGeometry(compact ? 1.45 : 1.62, 26, 20),
        new THREE.MeshBasicMaterial({ color: cAura, transparent: true, opacity: petModel.auraStyle === "none" ? 0 : 0.12 }),
      );
      aura.position.y = compact ? 0.15 : 0.2;
      root.add(aura);

      const body = new THREE.Mesh(
        new THREE.SphereGeometry(0.7 * petModel.bodyScale, 24, 20),
        toon(cBody),
      );
      body.position.y = 0.15;
      root.add(body);

      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.84 * petModel.headScale, 28, 24),
        toon(cSkin),
      );
      head.position.y = 1.08;
      root.add(head);

      const earL = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.34, 14), toon(cBody));
      const earR = earL.clone();
      const hasEars = petModel.species !== "blob" && petModel.species !== "sprite";
      if (hasEars) {
        const baseY = 1.74;
        earL.position.set(-0.42, baseY, 0);
        earR.position.set(0.42, baseY, 0);
        earL.rotation.z = petModel.species === "bunny" ? -0.24 : -0.56;
        earR.rotation.z = petModel.species === "bunny" ? 0.24 : 0.56;
        root.add(earL);
        root.add(earR);
      }

      const armL = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.36 * petModel.limbScale, 6, 10), toon(cAccent));
      const armR = armL.clone();
      armL.position.set(-0.68, 0.1, 0.02);
      armR.position.set(0.68, 0.1, 0.02);
      root.add(armL);
      root.add(armR);

      const legL = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.4 * petModel.limbScale, 6, 10), toon(cBody.clone().offsetHSL(0, 0.02, -0.08)));
      const legR = legL.clone();
      legL.position.set(-0.26, -0.72, 0);
      legR.position.set(0.26, -0.72, 0);
      root.add(legL);
      root.add(legR);

      const eyeMaterial = toon(new THREE.Color(0x1b1b1d), petModel.eyeStyle === "sparkle" ? 0.15 : 0);
      const eyeGeo = new THREE.SphereGeometry(0.075 * petModel.eyeScale, 14, 12);
      const eyeL = new THREE.Mesh(eyeGeo, eyeMaterial);
      const eyeR = eyeL.clone();
      eyeL.position.set(-0.24, 1.16, 0.72);
      eyeR.position.set(0.24, 1.16, 0.72);
      root.add(eyeL);
      root.add(eyeR);

      if (petModel.eyeStyle === "sparkle") {
        const sparkMat = new THREE.MeshBasicMaterial({ color: cAccent, transparent: true, opacity: 0.72 });
        const sp1 = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8), sparkMat);
        const sp2 = sp1.clone();
        sp1.position.set(-0.2, 1.24, 0.74);
        sp2.position.set(0.2, 1.24, 0.74);
        root.add(sp1);
        root.add(sp2);
      }

      const mouthGeo = new THREE.TorusGeometry(0.13, 0.018, 8, 20, Math.PI);
      const mouth = new THREE.Mesh(mouthGeo, new THREE.MeshBasicMaterial({ color: new THREE.Color(0x2d2827) }));
      mouth.position.set(0, 0.93, 0.74);
      mouth.rotation.z = Math.PI;
      root.add(mouth);

      if (petModel.accessory === "halo") {
        const halo = new THREE.Mesh(new THREE.TorusGeometry(0.54, 0.04, 12, 30), toon(cAccent, 0.25));
        halo.position.y = 2.0;
        halo.rotation.x = Math.PI / 2.2;
        root.add(halo);
      } else if (petModel.accessory === "scarf") {
        const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.54, 0.08, 14, 28), toon(cAccent));
        scarf.position.y = 0.66;
        scarf.rotation.x = Math.PI / 2;
        root.add(scarf);
      } else if (petModel.accessory === "headband") {
        const band = new THREE.Mesh(new THREE.TorusGeometry(0.74, 0.06, 12, 28, Math.PI * 1.4), toon(cAccent));
        band.position.y = 1.34;
        band.rotation.y = Math.PI / 2;
        root.add(band);
      } else if (petModel.accessory === "glasses") {
        const glassMat = new THREE.MeshBasicMaterial({ color: cAccent, transparent: true, opacity: 0.62 });
        const gL = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.025, 10, 20), glassMat);
        const gR = gL.clone();
        const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.015, 0.02), glassMat);
        gL.position.set(-0.2, 1.16, 0.74);
        gR.position.set(0.2, 1.16, 0.74);
        bridge.position.set(0, 1.16, 0.74);
        root.add(gL);
        root.add(gR);
        root.add(bridge);
      } else if (petModel.accessory === "leaf") {
        const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), toon(cAccent));
        leaf.scale.set(1.5, 0.7, 1);
        leaf.position.set(0.2, 1.88, 0.06);
        leaf.rotation.z = -0.5;
        root.add(leaf);
      } else if (petModel.accessory === "orb") {
        const orb = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), toon(cAccent, 0.5));
        orb.position.set(0.84, 0.44, 0.2);
        root.add(orb);
      }

      const outlineMeshes: THREE.Mesh[] = [body, head, armL, armR, legL, legR];
      if (hasEars) {
        outlineMeshes.push(earL, earR);
      }
      const outlines = outlineMeshes.map((m) => addOutline(m, hslToThree(petModel.palette.line).getHex()));

      const shadow = new THREE.Mesh(
        new THREE.CircleGeometry(compact ? 0.86 : 1.02, 24),
        new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.16 }),
      );
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.y = -1.08;
      scene.add(shadow);

      root.position.y = compact ? -0.02 : 0.05;

      const updateSize = () => {
        const w = Math.max(1, container.clientWidth);
        const h = Math.max(1, container.clientHeight);
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      updateSize();

      const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateSize) : null;
      ro?.observe(container);
      if (!ro) window.addEventListener("resize", updateSize);

      const onMove = (event: PointerEvent) => {
        if (!interactive) return;
        const rect = container.getBoundingClientRect();
        pointer.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
        pointer.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
      };
      const onLeave = () => {
        pointer.x = 0;
        pointer.y = 0;
      };

      if (interactive) {
        container.addEventListener("pointermove", onMove);
        container.addEventListener("pointerleave", onLeave);
      }

      const clock = new THREE.Clock();
      let rotY = 0;

      const animate = () => {
        if (disposed) return;
        frameId = window.requestAnimationFrame(animate);

        const t = clock.getElapsedTime();
        const bounce = Math.sin(t * 2.6) * (compact ? 0.04 : 0.06);
        root.position.y = (compact ? -0.02 : 0.05) + bounce;

        const targetY = pointer.x * (compact ? 0.22 : 0.36);
        rotY += (targetY - rotY) * 0.08;
        root.rotation.y = rotY + Math.sin(t * 0.9) * 0.05;
        root.rotation.x = pointer.y * -0.06;

        armL.rotation.x = Math.sin(t * 2.4) * 0.15;
        armR.rotation.x = -Math.sin(t * 2.4) * 0.15;

        if (t > nextBlink) {
          eyeBlink -= 0.18;
          if (eyeBlink <= 0.05) {
            eyeBlink = 1;
            nextBlink = t + 1.4 + Math.random() * 2.8;
          }
        } else {
          eyeBlink = Math.min(1, eyeBlink + 0.2);
        }
        eyeL.scale.y = eyeBlink;
        eyeR.scale.y = eyeBlink;

        if (petModel.auraStyle !== "none") {
          aura.scale.setScalar(1 + Math.sin(t * 1.3) * 0.06);
          aura.material.opacity =
            petModel.auraStyle === "ring" ? 0.16 : petModel.auraStyle === "flame" ? 0.2 : 0.12;
        }

        outlines.forEach((lineObj, index) => {
          lineObj.position.copy(outlineMeshes[index].position);
          lineObj.rotation.copy(outlineMeshes[index].rotation);
          lineObj.scale.copy(outlineMeshes[index].scale);
        });

        renderer.render(scene, camera);
      };

      animate();

      return () => {
        disposed = true;
        window.cancelAnimationFrame(frameId);
        if (interactive) {
          container.removeEventListener("pointermove", onMove);
          container.removeEventListener("pointerleave", onLeave);
        }
        ro?.disconnect();
        if (!ro) window.removeEventListener("resize", updateSize);
        dispose(scene);
        renderer.dispose();
        container.innerHTML = "";
      };
    } catch (error) {
      console.warn("3D pet render failed, fallback to line art:", error);
      markFailed();
    }
  }, [compact, interactive, markFailed, petModel, webglFailed]);

  return (
    <div className={clsx("relative h-full w-full", className)}>
      <div ref={containerRef} className="h-full w-full overflow-hidden rounded-[var(--radius-md)]" />
      {webglFailed && petModel ? (
        <div
          className="absolute inset-0"
          dangerouslySetInnerHTML={{
            __html: fallback,
          }}
        />
      ) : null}
    </div>
  );
}

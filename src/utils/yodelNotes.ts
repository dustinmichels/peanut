import * as THREE from "three";

export interface YodelNotesHandle {
  readonly group: THREE.Group;
  setVisible: (visible: boolean) => void;
  update: (time: number) => void;
  dispose: () => void;
}

interface NoteConfig {
  x: number;
  y: number;
  scale: number;
  phase: number;
  drift: number;
  color: number;
  mirrored: boolean;
}

const NOTE_Z = 1.12;
const NOTE_CONFIGS: readonly NoteConfig[] = [
  { x: 0.58, y: 2.28, scale: 0.75, phase: 0, drift: 0.08, color: 0x266f78, mirrored: false },
  { x: -0.48, y: 2.38, scale: 0.92, phase: 0.28, drift: -0.09, color: 0x9a4e2b, mirrored: true },
  { x: 0.72, y: 2.56, scale: 1.05, phase: 0.55, drift: 0.1, color: 0xd18b28, mirrored: false },
  { x: -0.4, y: 2.68, scale: 0.72, phase: 0.78, drift: -0.06, color: 0x32271f, mirrored: true },
];

/** Creates a small stream of musical notes that rises around Peanut's face while he yodels. */
export function createYodelNotes(): YodelNotesHandle {
  const root = new THREE.Group();
  root.name = "YodelNotesRoot";
  root.visible = false;

  const headGeometry = new THREE.CircleGeometry(0.075, 18);
  headGeometry.scale(1.2, 0.72, 1);
  const stemGeometry = new THREE.PlaneGeometry(0.026, 0.27);
  const flagShape = new THREE.Shape();
  flagShape.moveTo(0, 0.07);
  flagShape.bezierCurveTo(0.12, 0.055, 0.17, -0.005, 0.12, -0.08);
  flagShape.bezierCurveTo(0.085, -0.02, 0.045, 0.005, 0, 0.005);
  flagShape.closePath();
  const flagGeometry = new THREE.ShapeGeometry(flagShape, 8);

  const materials: THREE.MeshBasicMaterial[] = [];
  const notes = NOTE_CONFIGS.map((config) => {
    const material = new THREE.MeshBasicMaterial({
      color: config.color,
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      toneMapped: false,
    });
    materials.push(material);

    const note = new THREE.Group();
    const direction = config.mirrored ? -1 : 1;

    const head = new THREE.Mesh(headGeometry, material);
    head.rotation.z = direction * -0.22;

    const stem = new THREE.Mesh(stemGeometry, material);
    stem.position.set(direction * 0.066, 0.12, 0);

    const flag = new THREE.Mesh(flagGeometry, material);
    flag.position.set(direction * 0.066, 0.25, 0);
    flag.scale.x = direction;

    note.add(head, stem, flag);
    note.renderOrder = 4;
    root.add(note);
    return { config, material, note };
  });

  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;

  function setVisible(visible: boolean) {
    root.visible = visible;
  }

  function update(time: number) {
    if (!root.visible) return;

    for (const { config, material, note } of notes) {
      if (reducedMotion) {
        note.position.set(config.x, config.y + config.phase * 0.35, NOTE_Z);
        note.rotation.z = config.mirrored ? -0.08 : 0.08;
        note.scale.setScalar(config.scale);
        material.opacity = 0.88;
        continue;
      }

      const phase = (time * 0.42 + config.phase) % 1;
      const envelope = Math.sin(phase * Math.PI);
      note.position.set(
        config.x + Math.sin(phase * Math.PI * 2) * config.drift,
        config.y + phase * 0.62,
        NOTE_Z,
      );
      note.rotation.z = (config.mirrored ? -0.12 : 0.12) + Math.sin(phase * Math.PI * 2) * 0.08;
      note.scale.setScalar(config.scale * (0.72 + envelope * 0.38));
      material.opacity = Math.min(1, envelope * 1.7);
    }
  }

  function dispose() {
    root.removeFromParent();
    headGeometry.dispose();
    stemGeometry.dispose();
    flagGeometry.dispose();
    for (const material of materials) material.dispose();
  }

  return { group: root, setVisible, update, dispose };
}

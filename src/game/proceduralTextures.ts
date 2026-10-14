import * as THREE from 'three';

// ============================================================================
// TECH QUEST: ROUND 2 — PROCEDURAL CANVAS TEXTURE GENERATOR
// ============================================================================
// Generates gritty, realistic materials: rusted metal, masonry brick, damp concrete,
// weathered wood, oscilloscope tube, hazard stripes, and parchment notes.
// ============================================================================

export function createRustedMetalTexture(tint: string = '#374151'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = tint;
  ctx.fillRect(0, 0, 512, 512);

  // Metal micro-scratches
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.3;
  for (let i = 0; i < 600; i++) {
    ctx.beginPath();
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    ctx.moveTo(x, y);
    ctx.lineTo(x + (Math.random() - 0.5) * 30, y + (Math.random() - 0.5) * 30);
    ctx.stroke();
  }

  // Rust patches and corrosion specks
  const rustColors = ['#7c2d12', '#9a3412', '#b45309', '#6b3210', '#44403c'];
  for (let i = 0; i < 400; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const radius = 5 + Math.random() * 30;
    ctx.fillStyle = rustColors[Math.floor(Math.random() * rustColors.length)];
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Seams & rivets
  ctx.globalAlpha = 1.0;
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 4;
  ctx.strokeRect(8, 8, 496, 496);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  return tex;
}

export function createBrickMasonryTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Light industrial mortar background
  ctx.fillStyle = '#475569';
  ctx.fillRect(0, 0, 512, 512);

  const rowHeight = 32;
  const brickWidth = 64;

  let row = 0;
  for (let y = 0; y < 512; y += rowHeight) {
    const offset = (row % 2) * (brickWidth / 2);
    for (let x = -brickWidth; x < 512 + brickWidth; x += brickWidth) {
      // Warm daylight brick tone with gritty variation
      const shade = 65 + Math.floor(Math.random() * 30);
      const red = shade + 65 + Math.floor(Math.random() * 25);
      ctx.fillStyle = `rgb(${red}, ${shade}, ${Math.max(40, shade - 15)})`;
      ctx.fillRect(x + offset + 2, y + 2, brickWidth - 4, rowHeight - 4);

      // Subtle surface aging
      if (Math.random() < 0.25) {
        ctx.fillStyle = 'rgba(30, 41, 59, 0.25)';
        ctx.fillRect(x + offset + 2, y + 2, brickWidth - 4, rowHeight - 4);
      }
    }
    row++;
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  return tex;
}

export function createDampConcreteTexture(stainColor: string = '#334155'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Brighter daylight concrete tone
  ctx.fillStyle = '#526071';
  ctx.fillRect(0, 0, 512, 512);

  // Noise specks
  for (let i = 0; i < 4000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const val = 70 + Math.floor(Math.random() * 50);
    ctx.fillStyle = `rgba(${val}, ${val + 4}, ${val + 10}, 0.5)`;
    ctx.fillRect(x, y, 2, 2);
  }

  // Water stain drips
  ctx.fillStyle = stainColor;
  ctx.globalAlpha = 0.35;
  for (let i = 0; i < 12; i++) {
    const x = Math.random() * 512;
    const w = 20 + Math.random() * 50;
    const h = 80 + Math.random() * 160;
    ctx.fillRect(x, 0, w, h);
  }
  ctx.globalAlpha = 1.0;

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  return tex;
}

export function createWeatheredWoodTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#4a3525';
  ctx.fillRect(0, 0, 512, 512);

  // Wood grain lines
  for (let y = 0; y < 512; y += 4) {
    const shade = 65 + Math.sin(y * 0.15) * 20 + (Math.random() - 0.5) * 10;
    ctx.fillStyle = `rgb(${shade + 35}, ${shade + 10}, ${Math.max(25, shade - 10)})`;
    ctx.fillRect(0, y, 512, 3);
  }

  // Knots & cracks
  ctx.strokeStyle = '#120b06';
  ctx.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

export function createHazardStripesTexture(isUnlocked: boolean = false): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  const color1 = isUnlocked ? '#065f46' : '#111827';
  const color2 = isUnlocked ? '#10b981' : '#f59e0b';

  ctx.fillStyle = color1;
  ctx.fillRect(0, 0, 256, 64);

  ctx.fillStyle = color2;
  for (let x = -64; x < 256 + 64; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 16, 0);
    ctx.lineTo(x + 16 + 32, 64);
    ctx.lineTo(x + 32, 64);
    ctx.closePath();
    ctx.fill();
  }

  return new THREE.CanvasTexture(canvas);
}

export function createOscilloscopeTexture(phase: number = 0): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#021008';
  ctx.fillRect(0, 0, 256, 256);

  // Phosphor grid
  ctx.strokeStyle = '#052e16';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 256; i += 32) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 256);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(256, i);
    ctx.stroke();
  }

  // Oscilloscope wave
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 2.5;
  ctx.shadowColor = '#34d399';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  for (let x = 0; x < 256; x++) {
    const y = 128 + Math.sin(x * 0.08 + phase) * 45 + (Math.random() - 0.5) * 8;
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // CRT scanlines
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  for (let y = 0; y < 256; y += 4) {
    ctx.fillRect(0, y, 256, 2);
  }

  // Text status
  ctx.fillStyle = '#34d399';
  ctx.font = 'bold 12px monospace';
  ctx.fillText('CAN BUS CH-02 [S2 ACTIVE]', 12, 28);
  ctx.fillText('100 kbit/s DOMINANT', 12, 240);

  return new THREE.CanvasTexture(canvas);
}

export function createCRTTerminalTexture(text: string, title: string = 'SCADA TERMINAL'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#05111b';
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = '#06b6d4';
  ctx.lineWidth = 2;
  ctx.strokeRect(6, 6, 244, 244);

  ctx.fillStyle = '#22d3ee';
  ctx.font = 'bold 13px monospace';
  ctx.fillText(title, 16, 28);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '10px monospace';
  const lines = text.split('\n');
  lines.forEach((l, idx) => {
    ctx.fillText(l, 16, 56 + idx * 20);
  });

  return new THREE.CanvasTexture(canvas);
}

export function createParchmentTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Aged yellowish paper
  ctx.fillStyle = '#fef3c7';
  ctx.fillRect(0, 0, 512, 512);

  // Stains and burned edges
  for (let i = 0; i < 200; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = 10 + Math.random() * 30;
    ctx.fillStyle = 'rgba(217, 119, 6, 0.08)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Border vignette
  ctx.strokeStyle = 'rgba(120, 53, 15, 0.4)';
  ctx.lineWidth = 16;
  ctx.strokeRect(8, 8, 496, 496);

  return new THREE.CanvasTexture(canvas);
}

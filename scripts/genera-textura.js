// Genera la textura de laberinto de la og image (patron de
// reaccion-difusion, modelo Gray-Scott). La malla envuelve por los bordes
// (indices modulo N), asi que el mosaico resultante repite sin costura.
//
// Salida: un .pam RGBA que luego ffmpeg convierte a PNG/WebP.
//
// La textura que hay en produccion (assets/textura-difusion.png) es
// exactamente esto:
//
//   node scripts/genera-textura.js textura.pam 256 6000 0.05
//   ffmpeg -i textura.pam assets/textura-difusion.png
//
// El ultimo argumento es el alfa maximo, que es la palanca de intensidad:
// 0.09 se veia con demasiado grano, 0.05 es el valor actual. La semilla
// esta fijada, asi que con los mismos argumentos sale el mismo dibujo.
// El CSS la pinta a 128px aunque la malla sea de 256: esa es la densidad
// de la og image, y de paso queda nitida en pantallas de doble densidad.
const fs = require('fs');

const N     = Number(process.argv[3] || 256);
const PASOS = Number(process.argv[4] || 6000);
const F = 0.030;   // alimentacion  -> con k=0.057 da el patron laberinto
const K = 0.057;   // eliminacion
const DU = 0.16, DV = 0.08, DT = 1.0;

const u = new Float32Array(N * N).fill(1);
const v = new Float32Array(N * N).fill(0);

// semillas deterministas: mismo resultado en cada ejecucion
let semilla = 20260831;
const rnd = () => (semilla = (semilla * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
for (let s = 0; s < 40; s++) {
  const cx = Math.floor(rnd() * N), cy = Math.floor(rnd() * N), r = 3 + Math.floor(rnd() * 4);
  for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    if (dx * dx + dy * dy > r * r) continue;
    const i = ((cy + dy + N) % N) * N + ((cx + dx + N) % N);
    u[i] = 0.5; v[i] = 0.25;
  }
}

const un = new Float32Array(N * N);
const vn = new Float32Array(N * N);

for (let paso = 0; paso < PASOS; paso++) {
  for (let y = 0; y < N; y++) {
    const yA = ((y - 1 + N) % N) * N, yC = y * N, yB = ((y + 1) % N) * N;
    for (let x = 0; x < N; x++) {
      const xA = (x - 1 + N) % N, xB = (x + 1) % N;
      const i = yC + x;
      // laplaciano 3x3: ortogonales .2, diagonales .05, centro -1
      const lu = 0.2  * (u[yC + xA] + u[yC + xB] + u[yA + x] + u[yB + x])
               + 0.05 * (u[yA + xA] + u[yA + xB] + u[yB + xA] + u[yB + xB]) - u[i];
      const lv = 0.2  * (v[yC + xA] + v[yC + xB] + v[yA + x] + v[yB + x])
               + 0.05 * (v[yA + xA] + v[yA + xB] + v[yB + xA] + v[yB + xB]) - v[i];
      const uvv = u[i] * v[i] * v[i];
      un[i] = u[i] + (DU * lu - uvv + F * (1 - u[i])) * DT;
      vn[i] = v[i] + (DV * lv + uvv - (F + K) * v[i]) * DT;
    }
  }
  u.set(un); v.set(vn);
}

// v normalizado -> alfa. Se sube a una potencia para afinar las lineas y
// dejar el fondo limpio, que es como se ve en la og.
let min = Infinity, max = -Infinity;
for (const t of v) { if (t < min) min = t; if (t > max) max = t; }
console.log('v en [' + min.toFixed(4) + ', ' + max.toFixed(4) + ']');

const ALFA_MAX = Number(process.argv[5] || 0.10);
const GAMMA = 1.6;
const COLOR = [168, 205, 255];   // azul claro, el de los brillos de la og

const px = Buffer.alloc(N * N * 4);
for (let i = 0; i < N * N; i++) {
  const t = max > min ? (v[i] - min) / (max - min) : 0;
  const a = Math.pow(t, GAMMA) * ALFA_MAX;
  px[i * 4]     = COLOR[0];
  px[i * 4 + 1] = COLOR[1];
  px[i * 4 + 2] = COLOR[2];
  px[i * 4 + 3] = Math.max(0, Math.min(255, Math.round(a * 255)));
}

const cabecera = Buffer.from(
  'P7\nWIDTH ' + N + '\nHEIGHT ' + N + '\nDEPTH 4\nMAXVAL 255\nTUPLTYPE RGB_ALPHA\nENDHDR\n', 'ascii');
fs.writeFileSync(process.argv[2], Buffer.concat([cabecera, px]));
console.log('escrito ' + process.argv[2] + '  (' + N + 'x' + N + ', ' + PASOS + ' pasos, alfa max ' + ALFA_MAX + ')');

/**
 * Zero-Dependency Pure JavaScript QR Code Generator
 * Implements ISO/IEC 18004 QR Code specification (Byte mode, Error Correction Level M).
 * Generates exact 2D module matrix and clean SVG / Canvas renderings.
 */

// Galois Field (256) tables with primitive polynomial 0x11D (285)
const GF256_EXP = new Uint8Array(512);
const GF256_LOG = new Uint8Array(256);

(function initGaloisField() {
  let val = 1;
  for (let i = 0; i < 255; i++) {
    GF256_EXP[i] = val;
    GF256_EXP[i + 255] = val;
    GF256_LOG[val] = i;
    val = (val << 1) ^ (val >= 128 ? 0x11D : 0);
  }
})();

function gfMultiply(a, b) {
  if (a === 0 || b === 0) return 0;
  return GF256_EXP[GF256_LOG[a] + GF256_LOG[b]];
}

// Generates Reed-Solomon generator polynomial for degree `deg`
function rsGeneratorPoly(deg) {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < deg; i++) {
    const factor = new Uint8Array([1, GF256_EXP[i]]);
    const nextPoly = new Uint8Array(poly.length + 1);
    for (let j = 0; j < poly.length; j++) {
      nextPoly[j] ^= gfMultiply(poly[j], factor[0]);
      nextPoly[j + 1] ^= gfMultiply(poly[j], factor[1]);
    }
    poly = nextPoly;
  }
  return poly;
}

// Computes Reed-Solomon error correction codewords
function rsEncode(data, ecCount) {
  const genPoly = rsGeneratorPoly(ecCount);
  const remainder = new Uint8Array(data.length + ecCount);
  remainder.set(data);

  for (let i = 0; i < data.length; i++) {
    const lead = remainder[i];
    if (lead !== 0) {
      for (let j = 0; j < genPoly.length; j++) {
        remainder[i + j] ^= gfMultiply(lead, genPoly[j]);
      }
    }
  }
  return remainder.slice(data.length);
}

// Table of QR specifications for Error Correction Level M
// [version, totalCodewords, dataCodewords, ecCodewords, ecBlocksGroup1, dataPerBlock1, ecBlocksGroup2, dataPerBlock2]
const QR_SPECS_M = [
  null,
  { ver: 1, total: 26, data: 16, ec: 10, g1Blocks: 1, g1Data: 16, g2Blocks: 0, g2Data: 0 },
  { ver: 2, total: 44, data: 28, ec: 16, g1Blocks: 1, g1Data: 28, g2Blocks: 0, g2Data: 0 },
  { ver: 3, total: 70, data: 44, ec: 26, g1Blocks: 1, g1Data: 44, g2Blocks: 0, g2Data: 0 },
  { ver: 4, total: 100, data: 64, ec: 18, g1Blocks: 2, g1Data: 32, g2Blocks: 0, g2Data: 0 },
  { ver: 5, total: 134, data: 86, ec: 24, g1Blocks: 2, g1Data: 43, g2Blocks: 0, g2Data: 0 },
  { ver: 6, total: 172, data: 108, ec: 16, g1Blocks: 4, g1Data: 27, g2Blocks: 0, g2Data: 0 },
  { ver: 7, total: 196, data: 124, ec: 18, g1Blocks: 4, g1Data: 31, g2Blocks: 0, g2Data: 0 },
  { ver: 8, total: 242, data: 154, ec: 22, g1Blocks: 2, g1Data: 38, g2Blocks: 2, g2Data: 39 },
  { ver: 9, total: 292, data: 182, ec: 22, g1Blocks: 3, g1Data: 36, g2Blocks: 2, g2Data: 37 },
  { ver: 10, total: 346, data: 216, ec: 26, g1Blocks: 4, g1Data: 40, g2Blocks: 1, g2Data: 41 }
];

// Alignment pattern centers for versions 1 to 10
const ALIGNMENT_PATTERN_POS = [
  [],
  [],
  [6, 18],
  [6, 22],
  [6, 26],
  [6, 30],
  [6, 34],
  [6, 22, 38],
  [6, 24, 42],
  [6, 26, 46],
  [6, 28, 50]
];

// Format information bitstrings for mask 0-7 with Error Correction Level M
const FORMAT_INFO_M = [
  0b101010000010010, // mask 0
  0b101000100100101, // mask 1
  0b101111001111100, // mask 2
  0b101101101001011, // mask 3
  0b100010111111001, // mask 4
  0b100000011001110, // mask 5
  0b100111110010111, // mask 6
  0b100101010100000  // mask 7
];

/**
 * Encodes input string into QR data bit stream (Byte Mode)
 */
function encodeData(text, spec) {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(text);

  const bits = [];
  function pushBits(val, len) {
    for (let i = len - 1; i >= 0; i--) {
      bits.push((val >> i) & 1);
    }
  }

  // 1. Mode indicator for Byte Mode: 0100
  pushBits(0b0100, 4);

  // 2. Character count indicator (8 bits for ver 1-9, 16 bits for ver 10+)
  const charCountBits = spec.ver <= 9 ? 8 : 16;
  pushBits(bytes.length, charCountBits);

  // 3. Data bytes
  for (let i = 0; i < bytes.length; i++) {
    pushBits(bytes[i], 8);
  }

  // 4. Terminator (up to 4 zero bits)
  const maxDataBits = spec.data * 8;
  const termBits = Math.min(4, maxDataBits - bits.length);
  for (let i = 0; i < termBits; i++) bits.push(0);

  // 5. Pad to multiple of 8
  while (bits.length % 8 !== 0) {
    bits.push(0);
  }

  // Convert bitstream to bytes
  const codewords = new Uint8Array(spec.data);
  let byteIdx = 0;
  for (let i = 0; i < bits.length; i += 8) {
    let b = 0;
    for (let j = 0; j < 8; j++) {
      b = (b << 1) | bits[i + j];
    }
    codewords[byteIdx++] = b;
  }

  // 6. Pad bytes (0xEC, 0x11 alternate)
  const padPatterns = [0xEC, 0x11];
  let padToggle = 0;
  while (byteIdx < spec.data) {
    codewords[byteIdx++] = padPatterns[padToggle];
    padToggle ^= 1;
  }

  return codewords;
}

/**
 * Builds interleaved data + error-correction codeword stream
 */
function createCodewords(text, spec) {
  const dataCodewords = encodeData(text, spec);

  const blocks = [];
  let offset = 0;

  for (let b = 0; b < spec.g1Blocks; b++) {
    const slice = dataCodewords.slice(offset, offset + spec.g1Data);
    const ec = rsEncode(slice, spec.ec);
    blocks.push({ data: slice, ec });
    offset += spec.g1Data;
  }

  for (let b = 0; b < spec.g2Blocks; b++) {
    const slice = dataCodewords.slice(offset, offset + spec.g2Data);
    const ec = rsEncode(slice, spec.ec);
    blocks.push({ data: slice, ec });
    offset += spec.g2Data;
  }

  // Interleave data codewords
  const result = [];
  const maxDataLen = Math.max(spec.g1Data, spec.g2Data || 0);
  for (let i = 0; i < maxDataLen; i++) {
    for (const blk of blocks) {
      if (i < blk.data.length) result.push(blk.data[i]);
    }
  }

  // Interleave error correction codewords
  for (let i = 0; i < spec.ec; i++) {
    for (const blk of blocks) {
      if (i < blk.ec.length) result.push(blk.ec[i]);
    }
  }

  return new Uint8Array(result);
}

/**
 * Generates the full 2D QR matrix
 */
export function generateQrMatrix(text) {
  const byteCount = new TextEncoder().encode(text).length;
  let spec = null;
  for (let v = 1; v <= 10; v++) {
    const s = QR_SPECS_M[v];
    const overhead = s.ver <= 9 ? 2 : 3;
    if (byteCount + overhead <= s.data) {
      spec = s;
      break;
    }
  }

  if (!spec) {
    spec = QR_SPECS_M[10]; // Fallback to max supported version
  }

  const codewords = createCodewords(text, spec);
  const size = spec.ver * 4 + 17;

  // Matrix: null = unassigned, true = black, false = white
  const matrix = Array.from({ length: size }, () => Array(size).fill(null));
  const isFunction = Array.from({ length: size }, () => Array(size).fill(false));

  function setModule(r, c, val) {
    matrix[r][c] = val;
    isFunction[r][c] = true;
  }

  // 1. Finder patterns (7x7) + Separators
  function placeFinder(top, left) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const nr = top + r;
        const nc = left + c;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
          if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
            const isBlack = (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4));
            setModule(nr, nc, isBlack);
          } else {
            setModule(nr, nc, false); // Separator
          }
        }
      }
    }
  }

  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  // 2. Alignment patterns for Version 2+
  const alignCoords = ALIGNMENT_PATTERN_POS[spec.ver] || [];
  for (const r of alignCoords) {
    for (const c of alignCoords) {
      // Don't place on top of finder patterns
      const isTopLeft = r <= 8 && c <= 8;
      const isTopRight = r <= 8 && c >= size - 8;
      const isBottomLeft = r >= size - 8 && c <= 8;
      if (!isTopLeft && !isTopRight && !isBottomLeft) {
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const isBlack = (Math.abs(dr) === 2 || Math.abs(dc) === 2 || (dr === 0 && dc === 0));
            setModule(r + dr, c + dc, isBlack);
          }
        }
      }
    }
  }

  // 3. Timing patterns (Row 6, Col 6)
  for (let i = 8; i < size - 8; i++) {
    if (!isFunction[6][i]) setModule(6, i, i % 2 === 0);
    if (!isFunction[i][6]) setModule(i, 6, i % 2 === 0);
  }

  // 4. Dark module
  setModule(4 * spec.ver + 9, 8, true);

  // 5. Reserve format info areas
  for (let i = 0; i <= 8; i++) {
    if (!isFunction[8][i]) isFunction[8][i] = true;
    if (!isFunction[i][8]) isFunction[i][8] = true;
  }
  for (let i = 0; i < 8; i++) {
    isFunction[8][size - 1 - i] = true;
    isFunction[size - 1 - i][8] = true;
  }

  // 6. Place data bits (Mask 0: (row + col) % 2 === 0)
  let bitIdx = 0;
  const totalBits = codewords.length * 8;
  let dir = -1; // Going up
  let col = size - 1;

  while (col > 0) {
    if (col === 6) col--; // Skip timing column
    const rowRange = dir === -1
      ? Array.from({ length: size }, (_, i) => size - 1 - i)
      : Array.from({ length: size }, (_, i) => i);

    for (const r of rowRange) {
      for (const c of [col, col - 1]) {
        if (!isFunction[r][c]) {
          let bit = 0;
          if (bitIdx < totalBits) {
            const byteVal = codewords[Math.floor(bitIdx / 8)];
            bit = (byteVal >> (7 - (bitIdx % 8))) & 1;
            bitIdx++;
          }
          // Mask 0 invert condition: (r + c) % 2 === 0
          const maskInvert = (r + c) % 2 === 0;
          matrix[r][c] = (bit === 1) ^ maskInvert;
        }
      }
    }
    col -= 2;
    dir = -dir;
  }

  // 7. Write Format Information (Mask 0)
  const formatBits = FORMAT_INFO_M[0];
  const formatModules = [];
  for (let i = 14; i >= 0; i--) {
    formatModules.push(((formatBits >> i) & 1) === 1);
  }

  // Top-left format placement
  const tlCoords = [
    [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
    [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8]
  ];
  for (let i = 0; i < 15; i++) {
    const [r, c] = tlCoords[i];
    matrix[r][c] = formatModules[i];
  }

  // Split format placement across top-right and bottom-left
  for (let i = 0; i < 7; i++) {
    matrix[size - 1 - i][8] = formatModules[i];
  }
  for (let i = 7; i < 15; i++) {
    matrix[8][size - 15 + i] = formatModules[i];
  }

  return matrix;
}

/**
 * Generates an SVG string representation of the QR code
 */
export function generateQrSvg(text, { size = 260, margin = 3, dark = "#0b1329", light = "#ffffff" } = {}) {
  const matrix = generateQrMatrix(text);
  const matrixSize = matrix.length;
  const totalModules = matrixSize + margin * 2;
  const cellSize = size / totalModules;

  let pathData = "";
  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      if (matrix[r][c]) {
        const x = (c + margin) * cellSize;
        const y = (r + margin) * cellSize;
        pathData += `M${x.toFixed(2)},${y.toFixed(2)}h${cellSize.toFixed(2)}v${cellSize.toFixed(2)}h-${cellSize.toFixed(2)}z `;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
    <rect width="${size}" height="${size}" fill="${light}" rx="12" />
    <path d="${pathData}" fill="${dark}" shape-rendering="crispEdges" />
  </svg>`;
}

/**
 * Draws the QR code to an HTML Canvas element
 */
export function drawQrToCanvas(canvas, text, { size = 280, margin = 3, dark = "#0b1329", light = "#ffffff" } = {}) {
  if (!canvas) return;
  const matrix = generateQrMatrix(text);
  const matrixSize = matrix.length;
  const totalModules = matrixSize + margin * 2;
  const cellSize = Math.floor(size / totalModules);
  const actualSize = cellSize * totalModules;

  canvas.width = actualSize;
  canvas.height = actualSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.fillStyle = light;
  ctx.fillRect(0, 0, actualSize, actualSize);

  ctx.fillStyle = dark;
  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      if (matrix[r][c]) {
        ctx.fillRect((c + margin) * cellSize, (r + margin) * cellSize, cellSize, cellSize);
      }
    }
  }
}

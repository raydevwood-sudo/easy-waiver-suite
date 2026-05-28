/**
 * DocumentScanner
 *
 * Camera → OpenCV pipeline → preview → multi-page PDF assembly
 *
 * Pipeline per capture:
 *  1. Draw captured image onto a hidden canvas
 *  2. OpenCV: convert to grayscale
 *  3. OpenCV: find document contour (findContours on Canny edges)
 *  4. OpenCV: perspective warp to a portrait A4-like rect
 *  5. OpenCV: adaptive threshold (removes shadows / uneven lighting)
 *  6. Return processed canvas data-URL for preview
 *
 * When "Done — Create PDF":
 *  jsPDF: add each processed image as a full page → produces a File object
 *  → calls onPdfReady(file) so UploadWaiver can pick it up
 */

import { useRef, useState, useEffect, useCallback } from 'react';
import jsPDF from 'jspdf';

/* ── OpenCV type shim ──────────────────────────────────────────────────────── */
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cv: any;
  }
}

interface Props {
  onPdfReady: (file: File) => void;
}

type PageEntry = {
  dataUrl: string;   // processed image data-URL (grayscale adaptive-threshold)
  width: number;     // natural pixel width after warp
  height: number;    // natural pixel height after warp
};

// ── helpers ────────────────────────────────────────────────────────────────

/** Return true once window.cv is loaded and the runtime is ready */
function isCvReady(): boolean {
  return typeof window.cv !== 'undefined' && typeof window.cv.Mat !== 'undefined';
}

/** Wait for window.cv to be fully initialised (polls every 200 ms, max 30 s) */
function waitForCv(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (isCvReady()) { resolve(); return; }
    let attempts = 0;
    const id = setInterval(() => {
      if (isCvReady()) { clearInterval(id); resolve(); return; }
      if (++attempts > 150) { clearInterval(id); reject(new Error('OpenCV.js failed to load')); }
    }, 200);
  });
}

/**
 * Sort 4 points into [topLeft, topRight, bottomRight, bottomLeft] order.
 * Used for the perspective transform.
 */
function sortCorners(pts: number[][]): number[][] {
  const sorted = [...pts].sort((a, b) => a[1] - b[1]); // sort by y
  const top = sorted.slice(0, 2).sort((a, b) => a[0] - b[0]);
  const bot = sorted.slice(2).sort((a, b) => a[0] - b[0]);
  return [top[0], top[1], bot[1], bot[0]]; // TL TR BR BL
}

/** Detect document corners on a canvas. Returns [TL, TR, BR, BL] in image coords. */
function detectCorners(sourceCanvas: HTMLCanvasElement): number[][] {
  const cv = window.cv;
  const src = cv.imread(sourceCanvas);
  const gray = new cv.Mat();
  const blurred = new cv.Mat();
  const edges = new cv.Mat();

  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
  cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
  cv.Canny(blurred, edges, 50, 150);

  const kernel = cv.Mat.ones(3, 3, cv.CV_8U);
  const dilated = new cv.Mat();
  cv.dilate(edges, dilated, kernel);
  kernel.delete();

  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  cv.findContours(dilated, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
  dilated.delete();

  // Find the largest contour by area
  let largestCnt = null;
  let maxArea = 0;
  for (let i = 0; i < contours.size(); i++) {
    const cnt = contours.get(i);
    const area = cv.contourArea(cnt);
    if (area > maxArea) {
      maxArea = area;
      largestCnt = cnt;
    } else {
      cnt.delete();
    }
  }

  let docContour: number[][] | null = null;

  if (largestCnt && maxArea > src.cols * src.rows * 0.05) {
    const peri = cv.arcLength(largestCnt, true);
    // Try progressively larger epsilons until we get exactly 4 points
    for (const factor of [0.02, 0.04, 0.06, 0.08, 0.10, 0.15]) {
      const approx = new cv.Mat();
      cv.approxPolyDP(largestCnt, approx, factor * peri, true);
      if (approx.rows === 4) {
        docContour = [];
        for (let r = 0; r < 4; r++) {
          docContour.push([approx.data32S[r * 2], approx.data32S[r * 2 + 1]]);
        }
        approx.delete();
        break;
      }
      approx.delete();
    }

    // If still no 4-point contour, use the bounding rect of the largest contour
    if (!docContour) {
      const rect = cv.boundingRect(largestCnt);
      docContour = [
        [rect.x, rect.y],
        [rect.x + rect.width, rect.y],
        [rect.x + rect.width, rect.y + rect.height],
        [rect.x, rect.y + rect.height],
      ];
    }
    largestCnt.delete();
  }

  // Final fallback: full image corners
  if (!docContour) {
    docContour = [[0,0],[src.cols-1,0],[src.cols-1,src.rows-1],[0,src.rows-1]];
  }

  [src, gray, blurred, edges, contours, hierarchy].forEach(m => { try { m.delete(); } catch { /* ignore */ } });
  return sortCorners(docContour);
}

/**
 * Apply perspective warp + adaptive threshold to a canvas given explicit [TL,TR,BR,BL] corners.
 * thresholdC controls how aggressively shadows are removed (higher = whiter background).
 */
function applyTransform(sourceCanvas: HTMLCanvasElement, corners: number[][], thresholdC: number): HTMLCanvasElement {
  const cv = window.cv;
  const src = cv.imread(sourceCanvas);

  const [tl, tr, br, bl] = corners;
  const widthTop = Math.hypot(tr[0]-tl[0], tr[1]-tl[1]);
  const widthBot = Math.hypot(br[0]-bl[0], br[1]-bl[1]);
  const dstW = Math.round(Math.max(widthTop, widthBot));
  const heightLeft = Math.hypot(bl[0]-tl[0], bl[1]-tl[1]);
  const heightRight = Math.hypot(br[0]-tr[0], br[1]-tr[1]);
  const dstH = Math.round(Math.max(heightLeft, heightRight));

  const srcPts = cv.matFromArray(4, 1, cv.CV_32FC2, [tl[0],tl[1],tr[0],tr[1],br[0],br[1],bl[0],bl[1]]);
  const dstPts = cv.matFromArray(4, 1, cv.CV_32FC2, [0,0,dstW,0,dstW,dstH,0,dstH]);
  const M = cv.getPerspectiveTransform(srcPts, dstPts);
  const warped = new cv.Mat();
  cv.warpPerspective(src, warped, M, new cv.Size(dstW, dstH), cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar(255,255,255,255));

  const warpedGray = new cv.Mat();
  cv.cvtColor(warped, warpedGray, cv.COLOR_RGBA2GRAY);
  const thresholded = new cv.Mat();
  cv.adaptiveThreshold(warpedGray, thresholded, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 15, thresholdC);

  const outCanvas = document.createElement('canvas');
  outCanvas.width = dstW;
  outCanvas.height = dstH;
  cv.imshow(outCanvas, thresholded);

  [src, srcPts, dstPts, M, warped, warpedGray, thresholded].forEach(m => { try { m.delete(); } catch { /* ignore */ } });
  return outCanvas;
}

// ── CropEditor ─────────────────────────────────────────────────────────────
// Shows the original image with 4 draggable corner handles and a contrast slider.
// Corners are in image-pixel space; handles are rendered in display-pixel space.

interface CropEditorProps {
  rawDataUrl: string;
  canvasDataUrl: string;
  imageWidth: number;
  imageHeight: number;
  initialCorners: number[][];  // [TL, TR, BR, BL] in image pixels
  onConfirm: (corners: number[][], thresholdC: number) => void;
  onRotate: () => void;
  onRetake: () => void;
}

function CropEditor({ rawDataUrl, canvasDataUrl, imageWidth, imageHeight, initialCorners, onConfirm, onRotate, onRetake }: CropEditorProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [corners, setCorners] = useState<number[][]>(initialCorners.map(c => [...c]));
  const [thresholdC, setThresholdC] = useState(15);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced live preview whenever corners or thresholdC changes
  useEffect(() => {
    if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    previewTimerRef.current = setTimeout(() => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = imageWidth;
        canvas.height = imageHeight;
        canvas.getContext('2d')!.drawImage(img, 0, 0);
        try {
          const out = applyTransform(canvas, corners, thresholdC);
          setPreviewDataUrl(out.toDataURL('image/jpeg', 0.7));
        } catch { /* ignore */ }
      };
      img.src = canvasDataUrl;
    }, 250);
    return () => { if (previewTimerRef.current) clearTimeout(previewTimerRef.current); };
  }, [corners, thresholdC, canvasDataUrl, imageWidth, imageHeight]);

  // dragging a corner: { type:'corner', idx }
  // dragging an edge:  { type:'edge', indices:[a,b] }
  // startImgPt: image-space pointer position at pointerdown
  // startCorners: corner snapshot at pointerdown
  const dragging = useRef<{
    type: 'corner' | 'edge';
    indices: number[];
    startImgPt: [number, number];
    startCorners: number[][];
  } | null>(null);

  // Map display coords → image coords
  function toImage(dispX: number, dispY: number): [number, number] {
    const el = imgRef.current;
    if (!el) return [dispX, dispY];
    const rect = el.getBoundingClientRect();
    const scaleX = imageWidth / el.clientWidth;
    const scaleY = imageHeight / el.clientHeight;
    return [
      Math.max(0, Math.min(imageWidth - 1, (dispX - rect.left) * scaleX)),
      Math.max(0, Math.min(imageHeight - 1, (dispY - rect.top) * scaleY)),
    ];
  }

  function startDrag(e: React.PointerEvent, type: 'corner' | 'edge', indices: number[]) {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragging.current = {
      type, indices,
      startImgPt: toImage(e.clientX, e.clientY),
      startCorners: corners.map(c => [...c]),
    };
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging.current) return;
    e.preventDefault();
    const [ix, iy] = toImage(e.clientX, e.clientY);
    const { type, indices, startImgPt, startCorners } = dragging.current;

    if (type === 'corner') {
      setCorners(prev => prev.map((c, i) => i === indices[0] ? [ix, iy] : c));
    } else {
      // Move both edge endpoints by the same delta
      const dx = ix - startImgPt[0];
      const dy = iy - startImgPt[1];
      setCorners(prev => prev.map((c, i) =>
        indices.includes(i)
          ? [
              Math.max(0, Math.min(imageWidth - 1, startCorners[i][0] + dx)),
              Math.max(0, Math.min(imageHeight - 1, startCorners[i][1] + dy)),
            ]
          : c
      ));
    }
  }

  function onPointerUp() {
    dragging.current = null;
  }

  // Corners: [TL=0, TR=1, BR=2, BL=3]
  // Edges: top(0,1), right(1,2), bottom(2,3), left(3,0)
  const EDGE_PAIRS = [[0, 1], [1, 2], [2, 3], [3, 0]];
  const CORNER_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
  const CORNER_LABELS = ['TL', 'TR', 'BR', 'BL'];
  const handleR = Math.max(16, imageWidth / 35);
  const edgeR = Math.max(12, imageWidth / 50);

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700">
        <p className="font-medium">Adjust crop corners</p>
        <p className="text-blue-600 mt-0.5">Drag the coloured corner handles or the white edge handles to adjust the crop.</p>
      </div>

      {/* Image + SVG overlay */}
      <div
        className="relative select-none touch-none rounded-xl overflow-hidden border border-gray-200"
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <img
          ref={imgRef}
          src={rawDataUrl}
          alt="Captured page"
          className="w-full block"
          draggable={false}
        />
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox={`0 0 ${imageWidth} ${imageHeight}`}
          preserveAspectRatio="none"
        >
          {/* Quad fill */}
          <polygon
            points={corners.map(c => c.join(',')).join(' ')}
            fill="rgba(59,130,246,0.1)"
            stroke="#3b82f6"
            strokeWidth={Math.max(2, imageWidth / 200)}
          />
          {/* Edge midpoint handles */}
          {EDGE_PAIRS.map(([a, b], ei) => {
            const mx = (corners[a][0] + corners[b][0]) / 2;
            const my = (corners[a][1] + corners[b][1]) / 2;
            return (
              <g key={`edge-${ei}`}>
                <circle
                  cx={mx} cy={my}
                  r={edgeR}
                  fill="white"
                  stroke="#3b82f6"
                  strokeWidth={Math.max(2, imageWidth / 300)}
                  opacity={0.9}
                  style={{ cursor: 'grab', touchAction: 'none' }}
                  onPointerDown={(e) => startDrag(e, 'edge', [a, b])}
                />
              </g>
            );
          })}
          {/* Corner handles */}
          {corners.map((c, i) => (
            <g key={i}>
              <circle
                cx={c[0]} cy={c[1]}
                r={handleR}
                fill={CORNER_COLORS[i]}
                opacity={0.85}
                style={{ cursor: 'grab', touchAction: 'none' }}
                onPointerDown={(e) => startDrag(e, 'corner', [i])}
              />
              <text
                x={c[0]} y={c[1]}
                textAnchor="middle" dominantBaseline="central"
                fill="white"
                fontSize={Math.max(10, imageWidth / 60)}
                style={{ userSelect: 'none', pointerEvents: 'none' }}
              >{CORNER_LABELS[i]}</text>
            </g>
          ))}
        </svg>
      </div>

      {/* Live preview + contrast slider */}
      <div className="space-y-2">
        {previewDataUrl && (
          <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
            <p className="text-[10px] text-gray-400 px-2 pt-1">Preview</p>
            <img src={previewDataUrl} alt="Processed preview" className="w-full block" />
          </div>
        )}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Background brightness</span>
            <span>{thresholdC}</span>
          </div>
          <input
            type="range" min={5} max={30} step={1} value={thresholdC}
            onChange={e => setThresholdC(Number(e.target.value))}
            className="w-full accent-brand-500"
          />
          <div className="flex justify-between text-[10px] text-gray-400">
            <span>Darker</span><span>Brighter / remove shadows</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button type="button" onClick={onRetake}
          className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors">
          Retake
        </button>
        <button type="button" onClick={onRotate}
          className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          Rotate
        </button>
        <button type="button" onClick={() => onConfirm(corners, thresholdC)}
          className="flex-1 py-3 bg-brand-500 text-white rounded-xl font-semibold hover:bg-brand-600 transition-colors">
          Apply Crop
        </button>
      </div>
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────

// CropState holds everything needed to show the crop editor for one captured image
interface CropState {
  rawDataUrl: string;
  imageWidth: number;
  imageHeight: number;
  corners: number[][];
  // We keep the scaled canvas in a ref so we can re-run applyTransform without re-reading the file
  canvasDataUrl: string;
}

export default function DocumentScanner({ onPdfReady }: Props) {
  const [cvReady, setCvReady] = useState(false);
  const [cvError, setCvError] = useState<string | null>(null);
  const [pages, setPages] = useState<PageEntry[]>([]);
  const [processing, setProcessing] = useState(false);
  const [assembling, setAssembling] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewPages, setPreviewPages] = useState<PageEntry[]>([]);
  const [cropState, setCropState] = useState<CropState | null>(null);

  const captureInputRef = useRef<HTMLInputElement>(null);
  const hiddenCanvasRef = useRef<HTMLCanvasElement>(null);

  // Wait for OpenCV to be ready
  useEffect(() => {
    waitForCv()
      .then(() => setCvReady(true))
      .catch((err: Error) => setCvError(err.message));
  }, []);

  // Handle image captured from camera / file picker
  const handleCapture = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset the input so the same file can be re-selected after removal
    e.target.value = '';

    setProcessingError(null);
    setProcessing(true);

    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);

      const canvas = hiddenCanvasRef.current!;
      // Scale down to max 1800px on the long edge to keep file size manageable
      const MAX_PX = 1800;
      const scale = Math.min(1, MAX_PX / Math.max(img.naturalWidth, img.naturalHeight));
      canvas.width = Math.round(img.naturalWidth * scale);
      canvas.height = Math.round(img.naturalHeight * scale);
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      try {
        // Detect corners and show crop editor — don't add to pages yet
        const corners = detectCorners(canvas);
        setCropState({
          rawDataUrl: canvas.toDataURL('image/jpeg', 0.8),
          imageWidth: canvas.width,
          imageHeight: canvas.height,
          corners,
          canvasDataUrl: canvas.toDataURL('image/png'),
        });
      } catch (err: unknown) {
        setProcessingError(err instanceof Error ? err.message : 'Processing failed');
      } finally {
        setProcessing(false);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      setProcessingError('Could not read the captured image.');
      setProcessing(false);
    };
    img.src = url;
  }, []);

  const removePage = (index: number) => {
    setPages(prev => prev.filter((_, i) => i !== index));
  };

  const createPdf = useCallback(async () => {
    if (pages.length === 0) return;
    setAssembling(true);

    try {
      // Use the orientation and dimensions of the first page to initialise jsPDF
      const first = pages[0];
      const isPortrait = first.height >= first.width;
      const orientation = isPortrait ? 'portrait' : 'landscape';

      // Work in mm; assume 96 dpi for the on-screen canvas pixels
      const pxToMm = (px: number) => (px / 96) * 25.4;

      const pdf = new jsPDF({
        orientation,
        unit: 'mm',
        format: [pxToMm(first.width), pxToMm(first.height)],
      });

      pages.forEach((page, idx) => {
        if (idx > 0) {
          pdf.addPage([pxToMm(page.width), pxToMm(page.height)], page.height >= page.width ? 'portrait' : 'landscape');
        }
        pdf.addImage(page.dataUrl, 'PNG', 0, 0, pxToMm(page.width), pxToMm(page.height));
      });

      const blob = pdf.output('blob');
      const file = new File([blob], 'scanned-waiver.pdf', { type: 'application/pdf' });
      setPreviewFile(file);
      setPreviewPages([...pages]);
    } finally {
      setAssembling(false);
    }
  }, [pages]);

  // ── Render ─────────────────────────────────────────────────────────────────

  // Crop editor — shown after each capture before adding to pages
  if (cropState) {
    // Reconstruct the canvas from the stored dataUrl for re-processing
    const applyCrop = (corners: number[][], thresholdC: number) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = cropState.imageWidth;
        canvas.height = cropState.imageHeight;
        canvas.getContext('2d')!.drawImage(img, 0, 0);
        try {
          const processed = applyTransform(canvas, corners, thresholdC);
          const dataUrl = processed.toDataURL('image/png');
          setPages(prev => [...prev, { dataUrl, width: processed.width, height: processed.height }]);
          setCropState(null);
        } catch (err: unknown) {
          setProcessingError(err instanceof Error ? err.message : 'Processing failed');
          setCropState(null);
        }
      };
      img.src = cropState.canvasDataUrl;
    };

    const handleRotate = () => {
      const img = new Image();
      img.onload = () => {
        // Rotate 90° CW: new canvas is transposed
        const canvas = document.createElement('canvas');
        canvas.width = img.height;
        canvas.height = img.width;
        const ctx = canvas.getContext('2d')!;
        ctx.translate(canvas.width, 0);
        ctx.rotate(Math.PI / 2);
        ctx.drawImage(img, 0, 0);
        const newW = canvas.width;
        const newH = canvas.height;
        const canvasDataUrl = canvas.toDataURL('image/png');
        // Downscale raw preview for display
        let rawCanvas = canvas;
        if (Math.max(newW, newH) > 1200) {
          const scale = 1200 / Math.max(newW, newH);
          const rc = document.createElement('canvas');
          rc.width = Math.round(newW * scale);
          rc.height = Math.round(newH * scale);
          rc.getContext('2d')!.drawImage(canvas, 0, 0, rc.width, rc.height);
          rawCanvas = rc;
        }
        const rawDataUrl = rawCanvas.toDataURL('image/jpeg', 0.8);
        let corners: number[][];
        try { corners = detectCorners(canvas); }
        catch { corners = [[0,0],[newW,0],[newW,newH],[0,newH]]; }
        setCropState({ rawDataUrl, canvasDataUrl, imageWidth: newW, imageHeight: newH, corners });
      };
      img.src = cropState.canvasDataUrl;
    };

    return (
      <CropEditor
        rawDataUrl={cropState.rawDataUrl}
        canvasDataUrl={cropState.canvasDataUrl}
        imageWidth={cropState.imageWidth}
        imageHeight={cropState.imageHeight}
        initialCorners={cropState.corners}
        onConfirm={applyCrop}
        onRotate={handleRotate}
        onRetake={() => setCropState(null)}
      />
    );
  }

  // Approval screen — shown after PDF is assembled
  if (previewFile) {
    return (
      <div className="space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
          <p className="font-medium">Review your scan</p>
          <p className="text-amber-700 mt-0.5">Check all pages are legible before submitting.</p>
        </div>
        <div className="space-y-3">
          {previewPages.map((page, idx) => (
            <div key={idx} className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between px-3 py-1.5 bg-gray-50 border-b border-gray-200">
                <p className="text-xs text-gray-500">Page {idx + 1} of {previewPages.length}</p>
                <button
                  type="button"
                  onClick={() => {
                    setPages(previewPages.filter((_, i) => i !== idx));
                    setPreviewFile(null);
                    setPreviewPages([]);
                  }}
                  className="text-xs text-red-600 hover:text-red-800 font-medium"
                >
                  Retake this page
                </button>
              </div>
              <img src={page.dataUrl} alt={`Page ${idx + 1}`} className="w-full object-contain" />
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => { setPreviewFile(null); setPreviewPages([]); setPages([]); }}
            className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
          >
            Rescan
          </button>
          <button
            type="button"
            onClick={() => { onPdfReady(previewFile); }}
            className="flex-1 py-3 bg-brand-500 text-white rounded-xl font-semibold hover:bg-brand-600 transition-colors"
          >
            Use This Scan
          </button>
        </div>
      </div>
    );
  }

  if (cvError) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
        <p className="font-medium">OpenCV.js failed to load</p>
        <p className="mt-1 text-red-600">{cvError}</p>
        <p className="mt-1 text-red-500">Please check your internet connection and reload the page.</p>
      </div>
    );
  }

  if (!cvReady) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-gray-500">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-brand-500 rounded-full animate-spin" />
        <p className="text-sm">Loading document scanner…</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Hidden canvas used as buffer for OpenCV processing */}
      <canvas ref={hiddenCanvasRef} className="hidden" aria-hidden="true" />

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700">
        <p className="font-medium mb-1">How to scan</p>
        <ul className="list-disc list-inside space-y-0.5 text-blue-600">
          <li>Lay the waiver flat on a dark, contrasting surface</li>
          <li>Capture each page separately — add as many pages as needed</li>
          <li>Shadow removal and contrast normalisation are applied automatically</li>
          <li>When all pages are ready, tap <strong>Create PDF</strong></li>
        </ul>
      </div>

      {/* Page thumbnails */}
      {pages.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">{pages.length} page{pages.length !== 1 ? 's' : ''} captured</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {pages.map((page, idx) => (
              <div key={idx} className="relative group rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                <img
                  src={page.dataUrl}
                  alt={`Page ${idx + 1}`}
                  className="w-full object-contain aspect-[3/4]"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <button
                    onClick={() => removePage(idx)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold shadow"
                    title="Remove page"
                    aria-label={`Remove page ${idx + 1}`}
                  >
                    ✕
                  </button>
                </div>
                <p className="absolute bottom-1 left-0 right-0 text-center text-[10px] text-gray-500">
                  Page {idx + 1}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {processingError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {processingError}
        </div>
      )}

      {/* Capture button */}
      <div className="flex flex-col sm:flex-row gap-3">
        <label
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-xl text-sm font-medium cursor-pointer transition-colors
            ${processing
              ? 'border-gray-200 text-gray-400 pointer-events-none'
              : 'border-brand-400 text-brand-700 hover:bg-brand-50'
            }`}
        >
          {processing ? (
            <>
              <div className="w-4 h-4 border-2 border-gray-300 border-t-brand-500 rounded-full animate-spin" />
              Processing…
            </>
          ) : (
            <>
              {/* Camera icon */}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {pages.length === 0 ? 'Capture Page 1' : `Capture Page ${pages.length + 1}`}
            </>
          )}
          <input
            ref={captureInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleCapture}
            className="sr-only"
            disabled={processing}
          />
        </label>

        {/* Also allow picking from gallery / file system (no capture attribute) */}
        <label
          className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-xl text-sm font-medium cursor-pointer transition-colors
            ${processing
              ? 'border-gray-200 text-gray-400 pointer-events-none'
              : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M14 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          From gallery
          <input
            type="file"
            accept="image/*"
            onChange={handleCapture}
            className="sr-only"
            disabled={processing}
          />
        </label>
      </div>

      {/* Create PDF */}
      {pages.length > 0 && (
        <button
          onClick={createPdf}
          disabled={assembling || processing}
          className="w-full py-3.5 bg-brand-500 text-white rounded-xl font-semibold hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {assembling ? (
            <>
              <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Assembling PDF…
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Create PDF ({pages.length} page{pages.length !== 1 ? 's' : ''})
            </>
          )}
        </button>
      )}
    </div>
  );
}

import { useRef, useEffect, useState, useCallback } from 'react';
import SignaturePad from 'signature_pad';

interface SignatureCanvasProps {
  onSave: (dataURL: string, timestamp: Date) => void;
}

type SignMode = 'draw' | 'type';

export default function SignatureCanvas({ onSave }: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePad | null>(null);
  const [mode, setMode] = useState<SignMode>('draw');
  const [typedName, setTypedName] = useState('');
  const [sigError, setSigError] = useState<string | null>(null);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !padRef.current) return;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const data = padRef.current.toData();
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    canvas.getContext('2d')!.scale(ratio, ratio);
    padRef.current.clear();
    padRef.current.fromData(data);
  }, []);

  useEffect(() => {
    if (mode !== 'draw') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    padRef.current = new SignaturePad(canvas, {
      backgroundColor: 'rgb(255,255,255)',
      penColor: '#1e293b',
    });
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      padRef.current?.off();
    };
  }, [mode, resizeCanvas]);

  useEffect(() => {
    if (mode !== 'type') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    ctx.scale(ratio, ratio);
    ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
    if (typedName) {
      ctx.font = `italic 40px 'Georgia', serif`;
      ctx.fillStyle = '#1e293b';
      ctx.textBaseline = 'middle';
      ctx.fillText(typedName, 24, canvas.offsetHeight / (2 * ratio));
    }
  }, [mode, typedName]);

  const handleClear = () => {
    setSigError(null);
    if (mode === 'draw') {
      padRef.current?.clear();
    } else {
      setTypedName('');
    }
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (mode === 'draw') {
      if (!padRef.current || padRef.current.isEmpty()) {
        setSigError('Please draw your signature before saving.');
        return;
      }
    } else {
      if (!typedName.trim()) {
        setSigError('Please type your name before saving.');
        return;
      }
    }

    setSigError(null);
    const dataURL = canvas.toDataURL('image/png');
    onSave(dataURL, new Date());
  };

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => { setMode('draw'); setSigError(null); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            mode === 'draw'
              ? 'bg-brand-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Draw
        </button>
        <button
          type="button"
          onClick={() => { setMode('type'); setSigError(null); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            mode === 'type'
              ? 'bg-brand-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Type
        </button>
      </div>

      {mode === 'type' && (
        <input
          type="text"
          value={typedName}
          onChange={(e) => setTypedName(e.target.value)}
          placeholder="Type your full name"
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      )}

      <canvas
        ref={canvasRef}
        className="w-full h-40 rounded-lg border border-gray-200 bg-white touch-none"
      />

      {sigError && <p className="text-xs text-red-600">{sigError}</p>}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleClear}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-brand-500 text-white hover:bg-brand-600 transition-all"
        >
          Save Signature
        </button>
      </div>
    </div>
  );
}

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

  // Render typed name onto canvas for preview
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
      if (padRef.current?.isEmpty()) {
        setSigError('Please provide a signature before saving.');
        return;
      }
    } else {
      if (!typedName.trim()) {
        setSigError('Please type your name before saving.');
        return;
      }
    }

    const dataURL = canvas.toDataURL('image/png');
    setSigError(null);
    onSave(dataURL, new Date());
  };

  return (
    <div className="space-y-4">
      {/* Mode tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => { setMode('draw'); setSigError(null); }}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            mode === 'draw'
              ? 'border-brand-500 text-brand-500'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Draw
        </button>
        <button
          onClick={() => { setMode('type'); setSigError(null); }}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            mode === 'type'
              ? 'border-brand-500 text-brand-500'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Type
        </button>
      </div>

      {mode === 'type' && (
        <input
          type="text"
          value={typedName}
          onChange={(e) => { setTypedName(e.target.value); setSigError(null); }}
          placeholder="Type your full name"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      )}

      {/* Canvas */}
      <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          style={{ height: '200px' }}
          className="w-full touch-none cursor-crosshair block"
        />
      </div>
      {mode === 'draw' && (
        <p className="text-xs text-gray-400 text-center">Sign above with your mouse or finger</p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleClear}
          className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="flex-1 px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 transition-colors"
        >
          Save Signature
        </button>
      </div>
      {sigError && (
        <p className="text-sm text-red-600 text-center">{sigError}</p>
      )}
    </div>
  );
}

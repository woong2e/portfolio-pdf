import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import { Download, Loader2, ZoomIn, ZoomOut } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const SCALE_STEP = 0.15;
const MIN_SCALE = 0.5;
const MAX_SCALE = 2.5;
const DEFAULT_SCALE = 1.0;

export default function ViewPortfolio() {
  const { id } = useParams<{ id: string }>();
  const [numPages, setNumPages] = useState<number>();
  const [scale, setScale] = useState(DEFAULT_SCALE);

  const fileUrl = `${import.meta.env.VITE_API_BASE_URL || '/api'}/portfolio/${id}`;
  const downloadUrl = `${fileUrl}/download`;

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  const getBaseWidth = () => Math.min(window.innerWidth - 32, 1200);

  const zoomIn = () => setScale((s) => Math.min(s + SCALE_STEP, MAX_SCALE));
  const zoomOut = () => setScale((s) => Math.max(s - SCALE_STEP, MIN_SCALE));
  const resetZoom = () => setScale(DEFAULT_SCALE);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white shadow-sm z-50 px-4 sm:px-6 py-3 flex justify-between items-center">
        <h1 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">Portfolio</h1>

        {/* Zoom Controls (center) */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-full px-1 py-1">
          <button
            onClick={zoomOut}
            disabled={scale <= MIN_SCALE}
            className="p-2 rounded-full hover:bg-white hover:shadow-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed text-gray-700"
            title="축소"
          >
            <ZoomOut size={18} />
          </button>
          <button
            onClick={resetZoom}
            className="px-3 py-1 text-xs font-bold text-gray-700 hover:bg-white rounded-full transition-all min-w-[52px] text-center"
            title="원래 크기"
          >
            {Math.round(scale * 100)}%
          </button>
          <button
            onClick={zoomIn}
            disabled={scale >= MAX_SCALE}
            className="p-2 rounded-full hover:bg-white hover:shadow-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed text-gray-700"
            title="확대"
          >
            <ZoomIn size={18} />
          </button>
        </div>

        <a
          href={downloadUrl}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow-md"
        >
          <Download size={18} />
          <span className="hidden sm:inline">PDF 다운로드</span>
        </a>
      </header>

      {/* Main Content */}
      <main className="flex-1 mt-[68px] p-4 flex flex-col items-center w-full overflow-x-auto">
        <div className="flex justify-center items-center flex-col bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden py-4" style={{ minWidth: 'fit-content' }}>
          <Document
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="flex flex-col items-center justify-center py-32 text-gray-400">
                <Loader2 className="animate-spin mb-4" size={40} />
                <p className="text-sm font-medium">PDF 문서를 불러오는 중입니다...</p>
              </div>
            }
            error={
              <div className="py-32 text-rose-500 text-center">
                <p className="font-semibold text-lg">문서를 불러오는데 실패했습니다.</p>
                <p className="text-sm mt-2 text-rose-400">올바르지 않은 링크거나 파일이 존재하지 않습니다.</p>
              </div>
            }
          >
            {Array.from(new Array(numPages || 0), (_, index) => (
              <div key={`page_${index + 1}`} className="mb-4 last:mb-0 border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                <Page
                  pageNumber={index + 1}
                  width={getBaseWidth() * scale}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  className="shadow-sm"
                />
              </div>
            ))}
          </Document>
        </div>
      </main>
    </div>
  );
}

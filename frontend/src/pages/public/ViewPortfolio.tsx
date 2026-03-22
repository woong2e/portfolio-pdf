import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import { Download, Loader2 } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

export default function ViewPortfolio() {
  const { uuid } = useParams<{ uuid: string }>();
  const [numPages, setNumPages] = useState<number>();

  const fileUrl = `${import.meta.env.VITE_API_BASE_URL || '/api'}/portfolio/${uuid}`;
  const downloadUrl = `${fileUrl}/download`;

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  // 간단한 반응형 폭 계산
  const getPageWidth = () => {
    return Math.min(window.innerWidth - 32, 800);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white shadow-sm z-50 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Portfolio</h1>
        </div>
        <a
          href={downloadUrl}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow-md"
        >
          <Download size={18} />
          PDF 다운로드
        </a>
      </header>

      {/* Main Content */}
      <main className="flex-1 mt-20 p-4 flex flex-col items-center w-full">
        <div className="w-full max-w-4xl flex justify-center items-center flex-col bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden py-4">
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
                  width={getPageWidth()}
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

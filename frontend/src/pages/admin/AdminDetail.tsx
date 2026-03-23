import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api/axiosInstance';
import { ArrowLeft, Copy, Edit2, Trash2, ExternalLink, Calendar, FileText } from 'lucide-react';
import { showToast } from '../../components/Toast';
import ConfirmModal from '../../components/ConfirmModal';

interface Portfolio {
  id: string;
  company_name: string;
  original_file_name: string;
  created_at: string;
  updated_at: string;
}

export default function AdminDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editCompanyName, setEditCompanyName] = useState('');
  const [editFile, setEditFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Confirm Delete Modal State
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/portfolio/${id}`);
      const data = res.data.data ? res.data.data : res.data;
      setPortfolio(data);
      setEditCompanyName(data.company_name);
    } catch (error) {
      console.error('Fetch error', error);
      showToast('데이터를 불러오지 못했습니다.', 'error');
      navigate('/admin');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleCopyLink = () => {
    const link = `${window.location.origin}/view/${id}`;
    navigator.clipboard.writeText(link).then(() => {
      showToast('링크가 클립보드에 복사되었습니다.', 'success');
    });
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/portfolio/${id}`);
      showToast('성공적으로 삭제되었습니다.', 'success');
      navigate('/admin');
    } catch (error) {
      console.error('Delete error', error);
      showToast('삭제에 실패했습니다.', 'error');
    }
    setIsDeleteConfirmOpen(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCompanyName) {
      showToast('기업명을 입력해주세요.', 'warning');
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('company_name', editCompanyName);
    if (editFile) {
      formData.append('file', editFile);
    }

    try {
      await api.put(`/admin/portfolio/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      showToast('성공적으로 수정되었습니다.', 'success');
      setIsEditModalOpen(false);
      setEditFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchDetail();
      
      const iframe = document.getElementById('preview-iframe') as HTMLIFrameElement;
      if (iframe) {
        const baseUrl = iframe.src.split('?')[0];
        iframe.src = `${baseUrl}?t=${new Date().getTime()}`;
      }

    } catch (error) {
      console.error('Update error', error);
      showToast('수정에 실패했습니다.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !portfolio) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
         <div className="animate-pulse flex flex-col items-center">
            <div className="h-10 w-10 bg-gray-200 rounded-full mb-4"></div>
            <p className="text-gray-400 font-medium">정보를 불러오는 중입니다...</p>
         </div>
      </div>
    );
  }

  const publicLink = `${window.location.origin}/view/${id}`;

  return (
    <div className="h-screen flex flex-col sm:flex-row bg-gray-50 font-sans overflow-hidden">
      {/* Left: Preview (Iframe) */}
      <div className="flex-1 bg-gray-200 relative border-r border-gray-200 shadow-inner overflow-hidden order-2 sm:order-1 h-[60vh] sm:h-full">
        <div className="absolute top-0 w-full bg-white/90 backdrop-blur-sm border-b border-gray-200 py-2 px-4 shadow-sm z-10 hidden sm:flex justify-center items-center">
            <span className="text-xs font-semibold text-gray-500 tracking-wider">사용자 뷰어 미리보기</span>
        </div>
        <iframe 
          id="preview-iframe"
          title="Portfolio Preview"
          src={`/view/${id}`}
          className="w-full h-full border-0 pt-0 sm:pt-10"
        />
      </div>

      {/* Right: Management Panel */}
      <div className="w-full sm:w-[400px] lg:w-[450px] bg-white flex flex-col shadow-xl order-1 sm:order-2 h-auto sm:h-full shrink-0 z-20">
        <div className="p-6 border-b border-gray-100 flex items-center gap-4">
          <button 
            onClick={() => navigate('/admin')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-lg font-bold text-gray-900">포트폴리오 상세 관리</h2>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {/* Info Card */}
          <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6 mb-8 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <FileText size={80} />
            </div>
            <div className="bg-white p-3 rounded-xl inline-block shadow-sm mb-4 border border-blue-100">
               <FileText className="text-blue-600" size={28} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1 relative z-10 break-keep">{portfolio.company_name}</h3>
            <p className="text-sm font-medium text-gray-500 relative z-10 px-4 line-clamp-2" title={portfolio.original_file_name}>
              {portfolio.original_file_name}
            </p>
            
            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-500 font-medium">
                <Calendar size={14} />
                <span>등록일: {new Date(portfolio.created_at).toLocaleString()}</span>
            </div>
          </div>

          <div className="space-y-4">
            <button 
              onClick={handleCopyLink}
              className="w-full flex items-center justify-center gap-3 bg-gray-900 hover:bg-black text-white p-3.5 rounded-xl font-semibold transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
            >
              <Copy size={18} />
              공유용 링크 복사
            </button>
            <a 
              href={publicLink} 
              target="_blank" 
              rel="noreferrer"
              className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 p-3.5 rounded-xl font-semibold transition-colors shadow-sm active:scale-[0.98]"
            >
              <ExternalLink size={18} />
              새 탭에서 열어보기
            </a>

            <div className="my-8 border-t border-gray-100"></div>

            <button 
              onClick={() => setIsEditModalOpen(true)}
              className="w-full flex items-center justify-center gap-3 bg-blue-50 text-blue-700 hover:bg-blue-100 p-3.5 rounded-xl font-semibold transition-colors active:scale-[0.98]"
            >
              <Edit2 size={18} />
              기업 정보 및 파일 수정
            </button>
            
            <button 
              onClick={() => setIsDeleteConfirmOpen(true)}
              className="w-full flex items-center justify-center gap-3 bg-rose-50 text-rose-600 hover:bg-rose-100 p-3.5 rounded-xl font-semibold transition-colors mt-6 active:scale-[0.98]"
            >
              <Trash2 size={18} />
              이 포트폴리오 삭제
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        title="포트폴리오 삭제"
        message="정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없으며, 파일과 메타데이터가 완전히 삭제됩니다."
        confirmText="삭제"
        cancelText="취소"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setIsDeleteConfirmOpen(false)}
      />

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">정보 수정</h3>
            <form onSubmit={handleUpdate}>
              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-2">기업명</label>
                <input 
                  type="text" 
                  value={editCompanyName}
                  onChange={(e) => setEditCompanyName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                  required
                />
              </div>
              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-700 mb-2">새 PDF 파일 교체 (선택사항)</label>
                <p className="text-xs text-gray-500 mb-3 block">※ 파일을 선택하지 않으면 기존 파일이 유지됩니다.</p>
                <input 
                  type="file" 
                  accept="application/pdf"
                  ref={fileInputRef}
                  onChange={(e) => setEditFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-gray-600 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-dashed border-gray-300 rounded-xl p-2"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  취소
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl disabled:opacity-50 transition-colors shadow-sm"
                >
                  {isSubmitting ? '저장 중...' : '변경사항 반영하기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

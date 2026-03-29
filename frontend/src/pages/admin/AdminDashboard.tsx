import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../api/axiosInstance';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, LogOut, FileText, ChevronRight, Link as LinkIcon } from 'lucide-react';
import { showToast } from '../../components/Toast';

interface Portfolio {
  id: string;
  company_name: string;
  original_file_name: string;
  created_at: string;
  updated_at: string;
}

export default function AdminDashboard() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [companyName, setCompanyName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchPortfolios = async () => {
    try {
      const response = await api.get('/admin/portfolios');
      const data = response.data.data ? response.data.data : response.data;
      setPortfolios(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch portfolios', error);
      showToast('목록을 불러오는데 실패했습니다.', 'error');
    }
  };

  useEffect(() => {
    fetchPortfolios();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !selectedFile) {
      showToast('기업명과 PDF 파일을 모두 입력/선택해주세요.', 'warning');
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('company_name', companyName);
    formData.append('file', selectedFile);

    try {
      await api.post('/admin/portfolio', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      showToast('성공적으로 추가되었습니다.', 'success');
      setIsModalOpen(false);
      setCompanyName('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchPortfolios();
    } catch (error) {
      console.error('Create error', error);
      showToast('추가에 실패했습니다.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="bg-blue-600 text-white p-2 rounded-lg">
                <FileText size={20} />
             </div>
             <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin/settings')}
              className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
            >
              <LinkIcon size={16} />
              링크 설정
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-red-600 transition-colors"
            >
              <LogOut size={16} />
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">발송된 포트폴리오</h2>
            <p className="text-sm text-gray-500 mt-1">기업에 발송된 포트폴리오 링크를 관리합니다.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow-md active:scale-95"
          >
            <Plus size={18} />
            새 기업 포트폴리오 추가
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {portfolios.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <div className="bg-gray-50 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                <FileText size={32} className="text-gray-300" />
              </div>
              <p className="font-medium text-gray-900">등록된 포트폴리오가 없습니다.</p>
              <p className="text-sm text-gray-500 mt-1">우측 상단 버튼을 눌러 첫 포트폴리오를 업로드해보세요.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {portfolios.map((item) => (
                <li key={item.id} className="group">
                  <Link to={`/admin/${item.id}`} className="block hover:bg-gray-50 transition-colors px-6 py-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-5">
                        <div className="bg-blue-50/50 border border-blue-100 p-3 rounded-xl text-blue-600">
                          <FileText size={24} />
                        </div>
                        <div>
                          <p className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{item.company_name}</p>
                          <p className="text-sm text-gray-500 mt-1 truncate max-w-[200px] sm:max-w-xs">{item.original_file_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right hidden sm:block">
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(item.created_at).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">최초 등록일</p>
                        </div>
                        <div className="bg-white border flex items-center justify-center h-8 w-8 rounded-full shadow-sm group-hover:border-blue-200 group-hover:text-blue-600 transition-colors">
                            <ChevronRight size={16} />
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 border border-gray-100 translate-y-0">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">새 포트폴리오 추가</h3>
            <form onSubmit={handleCreate}>
              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-2">기업명</label>
                <input 
                  type="text" 
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="예: 토스, 카카오뱅크"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>
              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-700 mb-2">PDF 파일 (포트폴리오)</label>
                <div className="relative">
                    <input 
                    type="file" 
                    accept="application/pdf"
                    ref={fileInputRef}
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="w-full text-sm text-gray-600 
                    file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 
                    file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 
                    hover:file:bg-blue-100 cursor-pointer border border-dashed border-gray-300 rounded-xl p-2"
                    required
                    />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  취소
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl disabled:opacity-50 transition-colors shadow-sm"
                >
                  {isSubmitting ? '업로드 중...' : '추가하기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

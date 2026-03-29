import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/axiosInstance';
import { ArrowLeft, Github, Linkedin, Save, Link as LinkIcon } from 'lucide-react';
import { showToast } from '../../components/Toast';

interface SettingsForm {
  github_link: string;
  linkedin_link: string;
}

export default function AdminSettings() {
  const navigate = useNavigate();
  const [form, setForm] = useState<SettingsForm>({ github_link: '', linkedin_link: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/admin/settings');
        const data = res.data;
        setForm({
          github_link: data.github_link || '',
          linkedin_link: data.linkedin_link || '',
        });
      } catch (error) {
        console.error('Failed to fetch settings', error);
        showToast('설정을 불러오지 못했습니다.', 'error');
      }
    };
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.put('/admin/settings', form);
      showToast('설정이 저장되었습니다.', 'success');
    } catch (error) {
      console.error('Failed to update settings', error);
      showToast('설정 저장에 실패했습니다.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/admin')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white p-2 rounded-lg">
              <LinkIcon size={20} />
            </div>
            <h1 className="text-xl font-bold text-gray-900">링크 설정</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <p className="text-sm text-gray-500 mb-8">
          등록된 링크는 모든 포트폴리오 뷰어 페이지 상단에 버튼으로 노출됩니다.
        </p>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <Github size={16} />
              GitHub
            </label>
            <input
              type="url"
              value={form.github_link}
              onChange={(e) => setForm({ ...form, github_link: e.target.value })}
              placeholder="https://github.com/username"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <Linkedin size={16} />
              LinkedIn
            </label>
            <input
              type="url"
              value={form.linkedin_link}
              onChange={(e) => setForm({ ...form, linkedin_link: e.target.value })}
              placeholder="https://linkedin.com/in/username"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow-md disabled:opacity-50 active:scale-95"
            >
              <Save size={16} />
              {isSubmitting ? '저장 중...' : '저장하기'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

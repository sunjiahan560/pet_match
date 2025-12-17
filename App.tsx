import React, { useState, useEffect } from 'react';
import { QUESTIONS, DEFAULT_SYSTEM_PROMPT } from './constants';
import { Answer, AppState, PetRecommendation, ApiSettings } from './types';
import { getPetRecommendation, getPetImage, testApiConnection } from './services/geminiService';
import { Button } from './components/Button';
import { ProgressBar } from './components/ProgressBar';
import { QuestionCard } from './components/QuestionCard';
import { ResultCard } from './components/ResultCard';
import { PawPrint, Sparkles, AlertCircle, Key, ChevronLeft, Settings, Save, RotateCcw, Radio, CheckCircle2, XCircle } from 'lucide-react';

const SETTINGS_KEY = 'petmatch_api_settings';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('welcome');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  
  // Changed from single recommendation to array
  const [recommendations, setRecommendations] = useState<PetRecommendation[]>([]);
  const [selectedPetIndex, setSelectedPetIndex] = useState<number>(0);
  
  // Image cache: index -> url
  const [petImages, setPetImages] = useState<Record<number, string>>({});
  
  const [error, setError] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState('AI 正在思考中...');

  // Settings State
  const [apiSettings, setApiSettings] = useState<ApiSettings>({
    endpoint: 'https://api.siliconflow.cn/v1/chat/completions',
    apiKey: '',
    model: 'Qwen/Qwen2.5-7B-Instruct',
    systemPrompt: DEFAULT_SYSTEM_PROMPT
  });

  // Test Connection State
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<'none' | 'success' | 'error'>('none');
  const [testMessage, setTestMessage] = useState('');

  useEffect(() => {
    // Load settings on mount
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      setApiSettings(JSON.parse(stored));
    }
  }, []);

  const handleStart = async () => {
    // If no custom key is set, try standard Google Auth check
    const hasCustomKey = apiSettings.apiKey && apiSettings.endpoint;
    
    if (!hasCustomKey && window.aistudio) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        try {
          await window.aistudio.openSelectKey();
        } catch (e) {
          console.error(e);
          return;
        }
      }
    }

    setAppState('questionnaire');
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setError(null);
  };

  const handleAnswer = (optionId: string, optionLabel: string) => {
    const newAnswer: Answer = {
      questionId: QUESTIONS[currentQuestionIndex].id,
      optionId,
      optionLabel
    };

    const filtered = answers.filter(a => a.questionId !== QUESTIONS[currentQuestionIndex].id);
    const updatedAnswers = [...filtered, newAnswer];
    setAnswers(updatedAnswers);

    if (currentQuestionIndex < QUESTIONS.length - 1) {
      setTimeout(() => {
        setCurrentQuestionIndex(prev => prev + 1);
      }, 300);
    } else {
      processAnswers(updatedAnswers);
    }
  };

  const processAnswers = async (finalAnswers: Answer[]) => {
    setAppState('processing');
    setLoadingText('正在分析您的偏好...');
    setPetImages({}); // Reset images
    setSelectedPetIndex(0);
    
    try {
      // 1. Get the text recommendations (returns array now)
      const results = await getPetRecommendation(finalAnswers);
      setRecommendations(results);
      
      // 2. Show results IMMEDIATELY
      setAppState('results');

      // 3. Load image for the FIRST pet immediately
      if (results.length > 0) {
        loadPetImage(0, results[0]);
      }

    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "抱歉，连接 AI 服务时出错。请检查您的网络或 API 设置。");
      setAppState('error');
    }
  };

  const loadPetImage = (index: number, pet: PetRecommendation) => {
    // Don't reload if already exists
    if (petImages[index]) return;

    getPetImage(pet.name, pet.description, pet.englishName)
      .then(imageUrl => {
        if (imageUrl) {
          setPetImages(prev => ({ ...prev, [index]: imageUrl }));
        }
      })
      .catch(err => {
         console.warn(`Image load failed for index ${index}`, err);
      });
  };

  // Handle pet switching
  const handleSelectPet = (index: number) => {
    setSelectedPetIndex(index);
    // Load image for this pet if not already loaded
    if (recommendations[index]) {
        loadPetImage(index, recommendations[index]);
    }
  };

  const handleRefineStart = () => setAppState('refining');

  const handleRefineUpdate = (questionId: string, optionId: string) => {
    const question = QUESTIONS.find(q => q.id === questionId);
    if (!question) return;
    const option = question.options.find(o => o.id === optionId);
    if (!option) return;

    setAnswers(prevAnswers => {
      const newAnswers = prevAnswers.map(ans => 
        ans.questionId === questionId 
          ? { ...ans, optionId: option.id, optionLabel: option.label }
          : ans
      );
      if (!newAnswers.find(a => a.questionId === questionId)) {
        newAnswers.push({ questionId, optionId, optionLabel: option.label });
      }
      return newAnswers;
    });
  };

  const handleRefineSubmit = () => processAnswers(answers);

  const saveSettings = () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(apiSettings));
    setAppState('welcome');
  };

  const resetSettings = () => {
    localStorage.removeItem(SETTINGS_KEY);
    setApiSettings({
        endpoint: 'https://api.siliconflow.cn/v1/chat/completions',
        apiKey: '',
        model: 'Qwen/Qwen2.5-7B-Instruct',
        systemPrompt: DEFAULT_SYSTEM_PROMPT
    });
    setTestStatus('none');
  };

  const runConnectionTest = async () => {
    setIsTesting(true);
    setTestStatus('none');
    setTestMessage('');
    
    try {
        await testApiConnection(apiSettings);
        setTestStatus('success');
        setTestMessage('连接成功！API 配置有效，可以直接使用。');
    } catch (error) {
        setTestStatus('error');
        setTestMessage(error instanceof Error ? error.message : '连接失败，请检查设置');
    } finally {
        setIsTesting(false);
    }
  };

  const renderContent = () => {
    switch (appState) {
      case 'welcome':
        return (
          <div className="flex flex-col items-center justify-center text-center p-6 max-w-2xl mx-auto min-h-[60vh]">
            <div className="bg-teal-100 p-4 rounded-full mb-6 animate-bounce">
              <PawPrint className="w-12 h-12 text-teal-600" />
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
              找到您的<span className="text-teal-600">灵魂伴侣</span>
            </h1>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed max-w-lg">
              不知道养什么宠物好？回答几个简单的问题，让 AI 为您推荐 3 个最完美的宠物伙伴。
            </p>
            
            <div className="flex flex-col items-center gap-4 w-full max-w-xs">
              <Button onClick={handleStart} className="text-lg px-10 py-4 shadow-xl shadow-teal-200 w-full">
                开始匹配
              </Button>
              
              <button 
                onClick={() => setAppState('settings')}
                className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-teal-600 transition-colors py-2"
              >
                <Settings className="w-4 h-4" />
                <span>自定义 API 设置</span>
              </button>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="max-w-2xl mx-auto w-full py-8 px-4 fade-in">
             <div className="flex items-center gap-2 mb-6">
                <button onClick={() => setAppState('welcome')} className="p-2 hover:bg-gray-100 rounded-full">
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <h2 className="text-2xl font-bold text-gray-800">AI API 设置</h2>
             </div>

             <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-6">
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">API 端点地址 (API Endpoint)</label>
                    <input 
                        type="text" 
                        value={apiSettings.endpoint}
                        onChange={(e) => setApiSettings({...apiSettings, endpoint: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                        placeholder="例如: https://api.siliconflow.cn/v1/chat/completions"
                    />
                    <p className="text-xs text-gray-400">系统会自动尝试补全 /v1/chat/completions 后缀</p>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">API 密钥 (Key)</label>
                    <input 
                        type="password" 
                        value={apiSettings.apiKey}
                        onChange={(e) => setApiSettings({...apiSettings, apiKey: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                        placeholder="sk-..."
                    />
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">模型名称 (Model Name)</label>
                    <input 
                        type="text" 
                        value={apiSettings.model}
                        onChange={(e) => setApiSettings({...apiSettings, model: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                        placeholder="例如: Qwen/Qwen2.5-7B-Instruct"
                    />
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">系统提示词 (System Prompt)</label>
                    <textarea 
                        value={apiSettings.systemPrompt}
                        onChange={(e) => setApiSettings({...apiSettings, systemPrompt: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all h-32 text-sm leading-relaxed"
                    />
                </div>

                <div className="flex flex-col gap-4 pt-4 border-t border-gray-100">
                    {/* Test Result Display */}
                    {testStatus !== 'none' && (
                        <div className={`p-3 rounded-lg flex items-start gap-2 text-sm whitespace-pre-line break-words ${
                            testStatus === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                            {testStatus === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" /> : <XCircle className="w-5 h-5 shrink-0 mt-0.5" />}
                            <span>{testMessage}</span>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3">
                        <Button onClick={saveSettings} fullWidth className="gap-2 flex justify-center items-center order-1 sm:order-2">
                            <Save className="w-4 h-4" /> 保存设置
                        </Button>
                        <button 
                            onClick={runConnectionTest}
                            disabled={isTesting || !apiSettings.apiKey || !apiSettings.endpoint}
                            className="order-2 sm:order-1 px-4 py-3 rounded-xl font-medium text-teal-600 bg-teal-50 border border-teal-200 hover:bg-teal-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isTesting ? <Sparkles className="w-4 h-4 animate-spin" /> : <Radio className="w-4 h-4" />}
                            <span>测试连接</span>
                        </button>
                        <button 
                            onClick={resetSettings}
                            className="order-3 px-4 py-3 rounded-xl font-medium text-gray-500 hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                            title="重置默认"
                        >
                            <RotateCcw className="w-4 h-4" />
                            <span className="sm:hidden">重置默认</span>
                        </button>
                    </div>
                </div>
             </div>
          </div>
        );

      case 'questionnaire':
        return (
          <div className="max-w-xl mx-auto w-full py-8 px-4">
             <div className="flex items-center justify-between mb-4 text-sm font-medium text-gray-500">
                <span>问题 {currentQuestionIndex + 1} / {QUESTIONS.length}</span>
                <span>PetMatch AI</span>
             </div>
            <ProgressBar current={currentQuestionIndex + 1} total={QUESTIONS.length} />
            <QuestionCard 
              question={QUESTIONS[currentQuestionIndex]} 
              onAnswer={handleAnswer}
            />
          </div>
        );
      
      case 'refining':
        return (
          <div className="max-w-2xl mx-auto w-full py-8 px-4 fade-in">
             <button 
              onClick={() => setAppState('results')}
              className="flex items-center gap-1 text-gray-500 hover:text-teal-600 mb-6 font-medium"
            >
              <ChevronLeft className="w-4 h-4" />
              返回结果
            </button>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-6">调整您的偏好</h2>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 divide-y divide-gray-100 mb-8">
              {QUESTIONS.map((q) => {
                const currentAnswer = answers.find(a => a.questionId === q.id);
                return (
                  <div key={q.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <label className="font-medium text-gray-700 sm:w-1/2">{q.text}</label>
                    <select 
                      className="form-select block w-full sm:w-1/2 rounded-lg border-gray-200 bg-gray-50 text-gray-900 py-2.5 px-3 focus:ring-teal-500 focus:border-teal-500 text-sm"
                      value={currentAnswer?.optionId || ''}
                      onChange={(e) => handleRefineUpdate(q.id, e.target.value)}
                    >
                      <option value="" disabled>请选择...</option>
                      {q.options.map(opt => (
                        <option key={opt.id} value={opt.id}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
            <div className="sticky bottom-4 z-20">
              <Button onClick={handleRefineSubmit} fullWidth className="shadow-2xl">更新推荐结果</Button>
            </div>
          </div>
        );

      case 'processing':
        return (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-teal-200 rounded-full opacity-20 animate-ping"></div>
              <div className="relative bg-white p-6 rounded-full shadow-lg border-2 border-teal-100">
                <Sparkles className="w-10 h-10 text-teal-500 animate-spin-slow" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">正在咨询 AI 专家</h2>
            <p className="text-gray-500 animate-pulse">{loadingText}</p>
          </div>
        );

      case 'results':
        return recommendations.length > 0 ? (
          <div className="py-8 px-4 w-full">
            <ResultCard 
              recommendations={recommendations} 
              activeIndex={selectedPetIndex}
              onSelectPet={handleSelectPet}
              imageUrl={petImages[selectedPetIndex] || null}
              onRestart={() => setAppState('welcome')} 
              onRefine={handleRefineStart}
            />
          </div>
        ) : null;

      case 'error':
        return (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
            <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">出错了</h2>
            <p className="text-gray-600 mb-8 max-w-md">{error}</p>
            <div className="flex flex-col gap-3">
              <Button onClick={() => setAppState('settings')}>检查 API 设置</Button>
              <Button onClick={handleStart} variant="secondary">重试</Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-teal-100 selection:text-teal-900">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10 backdrop-blur-md bg-white/80">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-center sm:justify-between">
          <div 
            className="flex items-center gap-2 font-bold text-xl text-teal-700 cursor-pointer" 
            onClick={() => setAppState('welcome')}
          >
            <PawPrint className="w-6 h-6" />
            <span>PetMatch AI</span>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto">
        {renderContent()}
      </main>

      <footer className="py-8 text-center text-gray-400 text-sm">
        <p>© {new Date().getFullYear()} PetMatch AI. Powered by Google Gemini & Custom LLMs.</p>
      </footer>
    </div>
  );
};

export default App;
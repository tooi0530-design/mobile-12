import React, { useState, useCallback, useEffect } from 'react';
import { AppState } from './types';
import { generateWallpaper } from './services/geminiService';
import { SparklesIcon, DownloadIcon, ErrorIcon, ArrowPathIcon } from './components/icons';

// The global `window.aistudio` type is assumed to be provided by the execution environment.
// The conflicting local declaration has been removed to fix the TypeScript error.

const App: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState<AppState>(AppState.INITIAL);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isKeySelected, setIsKeySelected] = useState(false);

  useEffect(() => {
    // 컴포넌트가 마운트될 때 API 키가 이미 선택되었는지 확인합니다.
    const checkApiKey = async () => {
      try {
        if (window.aistudio) {
          const hasKey = await window.aistudio.hasSelectedApiKey();
          setIsKeySelected(hasKey);
        }
      } catch (e) {
        console.error("Error checking for API key:", e);
      }
    };
    checkApiKey();
  }, []);
  
  const handleSelectKey = async () => {
    try {
      if(window.aistudio) {
        await window.aistudio.openSelectKey();
        // 경쟁 상태를 피하기 위해 키 선택 대화상자가 닫힌 후 키가 선택되었다고 가정합니다.
        setIsKeySelected(true);
      }
    } catch(e) {
       console.error("Error opening select key dialog:", e);
    }
  };

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      setError("배경화면 아이디어를 입력해주세요.");
      setStatus(AppState.ERROR);
      return;
    }
    setStatus(AppState.LOADING);
    setGeneratedImage(null);
    setError(null);

    try {
      const imageUrl = await generateWallpaper(prompt);
      setGeneratedImage(imageUrl);
      setStatus(AppState.SUCCESS);
    } catch (err: any) {
      let errorMessage = "AI와 통신하는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
      // API 키 관련 오류를 감지하고 사용자에게 키를 다시 선택하도록 안내합니다.
      // FIX: Updated the error message check to align with documentation for API key errors.
      if (err.message && err.message.includes("Requested entity was not found.")) {
        errorMessage = "API 키를 찾을 수 없습니다. 다시 선택해주세요.";
        setIsKeySelected(false);
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      setStatus(AppState.ERROR);
    }
  }, [prompt]);

  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    const fileName = prompt.trim().replace(/[^a-zA-Z0-9가-힣]/g, '_').slice(0, 20) || 'ai-wallpaper';
    link.download = `${fileName}.jpeg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const reset = () => {
    setPrompt('');
    setGeneratedImage(null);
    setError(null);
    setStatus(AppState.INITIAL);
  };
  
  const renderContent = () => {
    switch (status) {
      case AppState.LOADING:
        return (
          <div className="flex flex-col items-center justify-center text-center text-white p-8 animate-fade-in">
            <div className="w-16 h-16 border-4 border-t-transparent border-blue-400 rounded-full animate-spin mb-6"></div>
            <h2 className="text-2xl font-bold mb-2">배경화면 생성 중</h2>
            <p className="text-gray-300">멋진 배경화면을 만들고 있어요. <br/> 잠시만 기다려주세요!</p>
          </div>
        );
      case AppState.SUCCESS:
        return (
          <div className="w-full flex flex-col items-center animate-fade-in px-4">
            <div className="w-full max-w-sm aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border-2 border-white/10 mb-6">
               <img src={generatedImage!} alt="생성된 배경화면" className="w-full h-full object-cover" />
            </div>
            <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                <button
                    onClick={handleDownload}
                    className="flex items-center justify-center gap-2 bg-blue-500 text-white font-bold py-3 px-4 rounded-full hover:bg-blue-600 active:scale-95 transition-all duration-200 shadow-lg"
                >
                    <DownloadIcon className="w-5 h-5" />
                    <span>다운로드</span>
                </button>
                <button
                    onClick={reset}
                    className="flex items-center justify-center gap-2 bg-gray-600 text-white font-bold py-3 px-4 rounded-full hover:bg-gray-700 active:scale-95 transition-all duration-200 shadow-lg"
                >
                     <ArrowPathIcon className="w-5 h-5"/>
                    <span>새로 만들기</span>
                </button>
            </div>
          </div>
        );
      case AppState.ERROR:
        return (
          <div className="flex flex-col items-center justify-center text-center text-white p-8 animate-fade-in">
            <ErrorIcon className="w-16 h-16 text-red-400 mb-4" />
            <h2 className="text-xl font-bold mb-2">오류 발생</h2>
            <p className="text-gray-300 mb-6 max-w-xs">{error}</p>
            <button
              onClick={status === AppState.ERROR && prompt ? handleGenerate : reset}
              className="flex items-center justify-center gap-2 bg-yellow-500 text-black font-bold py-3 px-6 rounded-full hover:bg-yellow-600 active:scale-95 transition-all duration-200 shadow-lg"
            >
              {status === AppState.ERROR && prompt ? '다시 시도' : '처음으로'}
            </button>
          </div>
        );
      case AppState.INITIAL:
      default:
        return (
          <div className="w-full px-4 flex flex-col items-center animate-fade-in">
             <div className="text-center mb-8">
                 <SparklesIcon className="w-12 h-12 text-blue-400 mx-auto mb-2"/>
                 <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">AI 배경화면 생성기</h1>
                 <p className="text-gray-300 mt-2">나만의 특별한 배경화면을 만들어보세요.</p>
            </div>
            <div className="w-full max-w-sm flex flex-col gap-4">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="예: 밤하늘을 수놓은 오로라, 판타지 스타일"
                className="w-full h-32 p-4 bg-gray-800/50 border-2 border-gray-600 rounded-2xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
              />
              <button
                onClick={handleGenerate}
                disabled={!prompt.trim()}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-lg py-4 px-6 rounded-full hover:opacity-90 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                <SparklesIcon className="w-6 h-6" />
                <span>배경화면 생성</span>
              </button>
            </div>
          </div>
        );
    }
  };

  const renderApiKeySelection = () => (
    <div className="flex flex-col items-center justify-center text-center text-white p-8 animate-fade-in">
        <SparklesIcon className="w-12 h-12 text-blue-400 mx-auto mb-4"/>
        <h1 className="text-3xl font-bold mb-4">시작하기 전에</h1>
        <p className="text-gray-300 mb-8 max-w-sm">
            AI 배경화면을 생성하려면 API 키가 필요합니다. 아래 버튼을 클릭하여 API 키를 선택하거나 생성해주세요.
        </p>
        <button
            onClick={handleSelectKey}
            className="flex items-center justify-center gap-2 bg-blue-500 text-white font-bold py-3 px-6 rounded-full hover:bg-blue-600 active:scale-95 transition-all duration-200 shadow-lg"
        >
            API 키 선택
        </button>
         <p className="text-xs text-gray-500 mt-4">
            API 사용에 대한 자세한 내용은 <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-400">결제 문서</a>를 참조하세요.
        </p>
    </div>
  );

  return (
    <main className="bg-gray-900 bg-gradient-to-br from-gray-900 via-gray-900 to-blue-900/50 min-h-screen w-full flex flex-col justify-center items-center overflow-hidden">
      <div className="w-full h-full flex flex-col items-center justify-center p-4">
        {isKeySelected ? renderContent() : renderApiKeySelection()}
      </div>
    </main>
  );
};

export default App;

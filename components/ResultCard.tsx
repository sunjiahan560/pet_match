import React, { useState } from 'react';
import { PetRecommendation } from '../types';
import { Heart, Activity, DollarSign, Award, RefreshCw, SlidersHorizontal, BookOpen, MessageCircle, Info, Sparkles, Star } from 'lucide-react';
import { Button } from './Button';
import { CareGuide } from './CareGuide';
import { ChatInterface } from './ChatInterface';

interface ResultCardProps {
  recommendations: PetRecommendation[];
  activeIndex: number;
  onSelectPet: (index: number) => void;
  imageUrl: string | null;
  onRestart: () => void;
  onRefine: () => void;
}

type TabType = 'overview' | 'care' | 'chat';

export const ResultCard: React.FC<ResultCardProps> = ({ 
  recommendations, 
  activeIndex, 
  onSelectPet,
  imageUrl, 
  onRestart, 
  onRefine 
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  
  const recommendation = recommendations[activeIndex];

  return (
    <div className="fade-in max-w-3xl mx-auto mb-10">
      
      {/* Pet Selection Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-2 no-scrollbar">
        {recommendations.map((pet, idx) => {
          const isActive = idx === activeIndex;
          return (
            <button
              key={idx}
              onClick={() => {
                onSelectPet(idx);
                setActiveTab('overview'); // Reset view to overview when switching pets
              }}
              className={`flex-shrink-0 px-5 py-3 rounded-2xl border transition-all duration-300 flex items-center gap-2 ${
                isActive 
                  ? 'bg-teal-600 text-white border-teal-600 shadow-lg shadow-teal-200 scale-105' 
                  : 'bg-white text-gray-600 border-gray-200 hover:border-teal-300 hover:bg-teal-50'
              }`}
            >
              {idx === 0 && <Star className={`w-4 h-4 ${isActive ? 'text-yellow-300 fill-yellow-300' : 'text-gray-400'}`} />}
              <span className="font-bold whitespace-nowrap">{pet.name}</span>
            </button>
          )
        })}
      </div>

      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        
        {/* Hero Image Section */}
        <div className="relative h-64 sm:h-80 bg-gray-100 group overflow-hidden">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={recommendation.name} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 animate-in fade-in duration-700"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-teal-50 text-teal-600 gap-3">
              <div className="relative">
                  <div className="absolute inset-0 bg-teal-200 rounded-full opacity-20 animate-ping"></div>
                  <div className="bg-white p-4 rounded-full shadow-sm relative">
                      <Sparkles className="w-8 h-8 animate-spin-slow" />
                  </div>
              </div>
              <p className="text-sm font-medium animate-pulse">正在为 {recommendation.name} 生成照片...</p>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-6 pointer-events-none">
            <div className="flex items-center gap-2 mb-2">
                <span className="text-teal-300 font-bold tracking-wider uppercase text-xs px-2 py-1 bg-teal-900/50 rounded-md backdrop-blur-sm">{recommendation.species}</span>
                {activeIndex === 0 && <span className="text-yellow-300 font-bold tracking-wider uppercase text-xs px-2 py-1 bg-yellow-900/50 rounded-md backdrop-blur-sm flex items-center gap-1"><Star size={10} fill="currentColor"/> 最佳推荐</span>}
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white shadow-sm tracking-tight">{recommendation.name}</h1>
          </div>
        </div>

        {/* Content Navigation Tabs */}
        <div className="flex border-b border-gray-100 bg-white sticky top-16 z-10">
          <button 
              onClick={() => setActiveTab('overview')}
              className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-colors border-b-2 ${activeTab === 'overview' ? 'border-teal-600 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
          >
              <Info size={18} />
              <span className="hidden sm:inline">匹配概览</span>
              <span className="sm:hidden">概览</span>
          </button>
          <button 
              onClick={() => setActiveTab('care')}
              className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-colors border-b-2 ${activeTab === 'care' ? 'border-teal-600 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
          >
              <BookOpen size={18} />
              <span className="hidden sm:inline">养护指南</span>
              <span className="sm:hidden">攻略</span>
          </button>
          <button 
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-colors border-b-2 ${activeTab === 'chat' ? 'border-teal-600 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
          >
              <MessageCircle size={18} />
              <span className="hidden sm:inline">AI 助手</span>
              <span className="sm:hidden">问答</span>
          </button>
        </div>

        <div className="p-6 sm:p-8 min-h-[400px]">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                  {/* Why this match */}
                  <div className="bg-gradient-to-br from-teal-50 to-white rounded-2xl p-6 border border-teal-100 shadow-sm">
                      <div className="flex items-center gap-2 mb-3 text-teal-800 font-bold text-lg">
                          <Award className="w-6 h-6 text-teal-600" />
                          <h3>为什么选择它？</h3>
                      </div>
                      <p className="text-teal-900 leading-relaxed text-base">{recommendation.matchReason}</p>
                  </div>

                  {/* Description */}
                  <div>
                      <h3 className="text-gray-900 font-bold text-lg mb-3">关于 {recommendation.name}</h3>
                      <p className="text-gray-600 leading-relaxed">{recommendation.description}</p>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="flex flex-col items-center p-5 bg-gray-50 rounded-2xl text-center border border-gray-100">
                          <Heart className="w-6 h-6 text-rose-500 mb-2" />
                          <span className="text-xs text-gray-500 uppercase font-bold tracking-wide">护理难度</span>
                          <span className="font-semibold text-gray-800 mt-1">{recommendation.careLevel}</span>
                      </div>
                      <div className="flex flex-col items-center p-5 bg-gray-50 rounded-2xl text-center border border-gray-100">
                          <Activity className="w-6 h-6 text-orange-500 mb-2" />
                          <span className="text-xs text-gray-500 uppercase font-bold tracking-wide">运动需求</span>
                          <span className="font-semibold text-gray-800 mt-1">{recommendation.exerciseNeeds}</span>
                      </div>
                      <div className="flex flex-col items-center p-5 bg-gray-50 rounded-2xl text-center border border-gray-100">
                          <DollarSign className="w-6 h-6 text-green-600 mb-2" />
                          <span className="text-xs text-gray-500 uppercase font-bold tracking-wide">预算开销</span>
                          <span className="font-semibold text-gray-800 mt-1">{recommendation.estimatedCost}</span>
                      </div>
                  </div>

                  {/* Alternatives */}
                  {recommendation.alternatives && recommendation.alternatives.length > 0 && (
                  <div className="border-t border-gray-100 pt-6">
                      <h4 className="text-gray-500 font-medium mb-4 uppercase text-xs tracking-wider">该品种的类似选择</h4>
                      <div className="grid gap-3">
                      {recommendation.alternatives.map((alt, idx) => (
                          <div key={idx} className="flex items-start gap-3 p-4 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                              <div className="bg-teal-200 rounded-full w-2 h-2 mt-2 shrink-0" />
                              <div>
                                  <span className="block font-bold text-gray-800">{alt.name}</span>
                                  <span className="text-sm text-gray-500">{alt.reason}</span>
                              </div>
                          </div>
                      ))}
                      </div>
                  </div>
                  )}
              </div>
          )}

          {/* TAB 2: CARE GUIDE */}
          {activeTab === 'care' && (
              <CareGuide guide={recommendation.careGuide} petName={recommendation.name} />
          )}

          {/* TAB 3: CHAT INTERFACE */}
          {activeTab === 'chat' && (
              <ChatInterface 
                // Force remount of chat when pet changes to reset history
                key={recommendation.name} 
                petName={recommendation.name} 
                petDescription={recommendation.description} 
              />
          )}

        </div>

        {/* Global Action Footer (Only on Overview) */}
        {activeTab === 'overview' && (
          <div className="p-6 sm:p-8 pt-0 flex flex-col sm:flex-row gap-3">
              <Button onClick={onRefine} fullWidth variant="primary" className="gap-2 flex justify-center items-center">
              <SlidersHorizontal className="w-4 h-4" />
              调整偏好
              </Button>
              <Button onClick={onRestart} fullWidth variant="secondary" className="gap-2 flex justify-center items-center">
              <RefreshCw className="w-4 h-4" />
              完全重测
              </Button>
          </div>
        )}
      </div>
    </div>
  );
};
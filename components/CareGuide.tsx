import React from 'react';
import { CareGuide as CareGuideType } from '../types';
import { Utensils, Scissors, Dumbbell, Stethoscope, GraduationCap, Clock } from 'lucide-react';

interface CareGuideProps {
  guide: CareGuideType;
  petName: string;
}

export const CareGuide: React.FC<CareGuideProps> = ({ guide, petName }) => {
  if (!guide) return <div className="p-4 text-center text-gray-500">暂无详细指南</div>;

  const items = [
    { icon: Utensils, title: "饮食建议", content: guide.diet, color: "text-orange-500", bg: "bg-orange-50" },
    { icon: Scissors, title: "日常护理", content: guide.grooming, color: "text-pink-500", bg: "bg-pink-50" },
    { icon: Dumbbell, title: "运动需求", content: guide.exercise, color: "text-blue-500", bg: "bg-blue-50" },
    { icon: Stethoscope, title: "健康关注", content: guide.health, color: "text-red-500", bg: "bg-red-50" },
    { icon: GraduationCap, title: "训练技巧", content: guide.training, color: "text-purple-500", bg: "bg-purple-50" },
    { icon: Clock, title: "每日作息", content: guide.dailySchedule, color: "text-teal-500", bg: "bg-teal-50" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-teal-50 p-4 rounded-xl border border-teal-100 mb-6">
        <h3 className="font-bold text-teal-800 text-lg mb-1">给新手的提示</h3>
        <p className="text-teal-700 text-sm">
          照顾 {petName} 需要耐心和爱心。以下是为您定制的专属养护指南。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item, idx) => (
          <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className={`flex items-center gap-3 mb-3`}>
              <div className={`p-2 rounded-lg ${item.bg}`}>
                <item.icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <h4 className="font-bold text-gray-800">{item.title}</h4>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
              {item.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
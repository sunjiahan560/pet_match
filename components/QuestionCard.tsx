import React from 'react';
import { Question, Answer } from '../types';
import { CheckCircle2 } from 'lucide-react';

interface QuestionCardProps {
  question: Question;
  onAnswer: (optionId: string, optionLabel: string) => void;
  selectedOptionId?: string;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({ question, onAnswer, selectedOptionId }) => {
  return (
    <div className="fade-in max-w-xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">{question.text}</h2>
      <div className="space-y-3">
        {question.options.map((option) => {
          const isSelected = selectedOptionId === option.id;
          return (
            <button
              key={option.id}
              onClick={() => onAnswer(option.id, option.label)}
              className={`w-full p-4 rounded-xl border-2 flex items-center justify-between text-left transition-all duration-200
                ${isSelected 
                  ? 'border-teal-500 bg-teal-50 text-teal-800' 
                  : 'border-gray-200 bg-white hover:border-teal-300 hover:bg-gray-50 text-gray-700'
                }
              `}
            >
              <span className="font-medium text-lg">{option.label}</span>
              {isSelected && <CheckCircle2 className="w-6 h-6 text-teal-600" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

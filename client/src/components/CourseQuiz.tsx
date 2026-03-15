import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, ChevronRight, ChevronLeft, Award } from 'lucide-react';

interface QuizQuestion {
  question: string;
  options: string[];
  correct_answer: string;
}

interface CourseQuizProps {
  quiz: QuizQuestion[];
  onFinish: (score: number) => void;
}

export const CourseQuiz: React.FC<CourseQuizProps> = ({ quiz, onFinish }) => {
  const { t } = useLanguage();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);

  const currentQuestion = quiz[currentQuestionIndex];
  const totalQuestions = quiz.length;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  const handleAnswerSelect = (value: string) => {
    setAnswers({ ...answers, [currentQuestionIndex]: value });
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      calculateScore();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const calculateScore = () => {
    let correctCount = 0;
    quiz.forEach((q, index) => {
      if (answers[index] === q.correct_answer) {
        correctCount++;
      }
    });
    const finalScore = (correctCount / totalQuestions) * 100;
    onFinish(finalScore);
    setShowResults(true);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm font-medium text-muted-foreground">
          <span>{t("eval_question")} {currentQuestionIndex + 1} / {totalQuestions}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Card className="border-2 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold leading-tight">
            {currentQuestion.question}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup 
            value={answers[currentQuestionIndex] || ""} 
            onValueChange={handleAnswerSelect}
            className="space-y-3"
          >
            {currentQuestion.options.map((option, idx) => (
              <div 
                key={idx} 
                className={`flex items-center space-x-3 p-4 rounded-xl border-2 transition-all cursor-pointer hover:border-primary/50 ${
                  answers[currentQuestionIndex] === option 
                    ? "border-primary bg-primary/5 shadow-sm" 
                    : "border-transparent bg-secondary/30"
                }`}
                onClick={() => handleAnswerSelect(option)}
              >
                <RadioGroupItem value={option} id={`option-${idx}`} />
                <Label 
                  htmlFor={`option-${idx}`} 
                  className="flex-1 cursor-pointer font-medium text-base py-1"
                >
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
        <CardFooter className="flex justify-between pt-6">
          <Button 
            variant="outline" 
            onClick={handlePrevious} 
            disabled={currentQuestionIndex === 0}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" /> {t("course_gen_prev_question")}
          </Button>
          <Button 
            onClick={handleNext} 
            disabled={!answers[currentQuestionIndex]}
            className="gap-2 px-8"
          >
            {currentQuestionIndex === totalQuestions - 1 ? t("course_gen_finish_quiz") : t("course_gen_next_question")}
            <ChevronRight className="w-4 h-4" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

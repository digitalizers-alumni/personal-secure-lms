import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { 
  BookOpen, BrainCircuit, ChevronLeft, 
  Loader2, Sparkles, GraduationCap,
  ArrowRight
} from 'lucide-react';
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CourseQuiz } from "@/components/CourseQuiz";
import { CourseReward } from "@/components/CourseReward";
import { getCourse } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

const CourseView = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<'lesson' | 'quiz' | 'finished'>('lesson');
  const [score, setScore] = useState<number>(0);
  const [showReward, setShowReward] = useState(false);

  useEffect(() => {
    const fetchCourse = async () => {
      if (!id) return;
      try {
        const data = await getCourse(id);
        setCourse(data);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load course");
        navigate("/courses");
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [id]);

  const handleQuizFinish = (finalScore: number) => {
    setScore(finalScore);
    if (finalScore >= 70) {
      setShowReward(true);
    } else {
      toast.info(`Score: ${Math.round(finalScore)}%. Le seuil de réussite est de 70%.`);
    }
    setStep('finished');
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[80vh]">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!course) return null;

  return (
    <DashboardLayout>
      <div className="container max-w-5xl py-8 space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/courses")} className="rounded-full">
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <div>
              <h1 className="text-3xl font-black tracking-tight">{course.title}</h1>
              <p className="text-muted-foreground font-medium">
                {course.status} • {course.quiz?.length || 0} Questions
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant={step === 'lesson' ? 'default' : 'outline'}
              onClick={() => setStep('lesson')}
              className="rounded-full px-6"
            >
              <BookOpen className="w-4 h-4 mr-2" /> {t("course_gen_lesson_tab")}
            </Button>
            <Button 
              variant={step === 'quiz' ? 'default' : 'outline'}
              onClick={() => setStep('quiz')}
              className="rounded-full px-6"
              disabled={step === 'finished' && score >= 70}
            >
              <BrainCircuit className="w-4 h-4 mr-2" /> {t("course_gen_quiz_tab")}
            </Button>
          </div>
        </div>

        {step === 'lesson' && (
          <Card className="border-2 shadow-sm overflow-hidden">
            <CardContent className="pt-8">
              <ScrollArea className="h-[600px] pr-4">
                <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-black prose-p:text-lg prose-p:leading-relaxed">
                  <ReactMarkdown>{course.lesson_content}</ReactMarkdown>
                </div>
              </ScrollArea>
              <div className="mt-8 pt-8 border-t flex justify-end">
                <Button size="lg" className="rounded-full font-bold px-8 shadow-md" onClick={() => setStep('quiz')}>
                  {t("course_gen_ready_quiz")}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 'quiz' && (
          <CourseQuiz quiz={course.quiz} onFinish={handleQuizFinish} />
        )}

        {step === 'finished' && (
          <div className="text-center py-20 space-y-6 max-w-2xl mx-auto">
            <div className={`inline-flex p-6 rounded-full ${score >= 70 ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
              <GraduationCap className="w-16 h-16" />
            </div>
            <h2 className="text-3xl font-bold">{t("eval_finish")} !</h2>
            <p className="text-2xl font-black">{t("score")} : {Math.round(score)}%</p>
            
            {score < 70 ? (
              <div className="space-y-4">
                <p className="text-muted-foreground text-lg">
                  {t("eval_fail")} {t("course_gen_score_threshold")}
                </p>
                <Button size="lg" onClick={() => setStep('lesson')} className="rounded-full px-8">
                  {t("course_gen_back_lesson")}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-muted-foreground text-lg">
                  {t("eval_success")}
                </p>
                <Button size="lg" onClick={() => setShowReward(true)} className="rounded-full px-8 bg-yellow-500 hover:bg-yellow-600 text-white font-bold">
                  {t("course_gen_reward_btn")}
                </Button>
              </div>
            )}
          </div>
        )}

        {showReward && (
          <CourseReward 
            score={score}
            title={course.reward_title}
            message={course.reward_message}
            onClose={() => {
              setShowReward(false);
              setStep('lesson');
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default CourseView;

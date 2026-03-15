import React, { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, GraduationCap, BookOpen, BrainCircuit, Sparkles, ArrowRight } from 'lucide-react';
import { toast } from "sonner";
import { CourseQuiz } from "@/components/CourseQuiz";
import { CourseReward } from "@/components/CourseReward";
import DashboardLayout from "@/components/DashboardLayout";
import { motion, AnimatePresence } from "framer-motion";
import { useDocuments } from "@/contexts/DocumentContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { generateCourse } from "@/lib/api";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, AlertTriangle, FileText as FileIconText, File as FileIconGeneric, FileSpreadsheet, Presentation } from 'lucide-react';

interface QuizQuestion {
  question: string;
  options: string[];
  correct_answer: string;
}

interface CoursePackage {
  title: string;
  lesson_content: string;
  quiz: QuizQuestion[];
  reward_title: string;
  reward_message: string;
}

const CreateCourse: React.FC = () => {
  const { documents } = useDocuments();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [course, setCourse] = useState<CoursePackage | null>(null);
  const [step, setStep] = useState<'setup' | 'lesson' | 'quiz' | 'finished'>('setup');
  const [score, setScore] = useState<number>(0);
  const [showReward, setShowReward] = useState(false);
  const [selectedDocIds, setSelectedDocIds] = useState<Set<number>>(new Set());

  // Form states
  const [topic, setTopic] = useState("");
  const [goal, setGoal] = useState("");
  const [difficulty, setDifficulty] = useState("Intermédiaire");
  const [additionalInstructions, setAdditionalInstructions] = useState("");

  // Filter indexed documents
  const readyDocs = useMemo(
    () => documents.filter((d) => d.indexStatus === "indexed" && d.backendDocId !== undefined),
    [documents]
  );

  const toggleDoc = (id: number) => {
    setSelectedDocIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedDocIds.size === readyDocs.length) {
      setSelectedDocIds(new Set());
    } else {
      setSelectedDocIds(new Set(readyDocs.map((d) => d.id)));
    }
  };

  const handleGenerate = async () => {
    if (!topic || !goal) {
      toast.error(t("ai_no_prompt_desc"));
      return;
    }

    if (selectedDocIds.size === 0) {
      toast.error(t("ai_no_docs_desc"));
      return;
    }

    setLoading(true);
    try {
      // Map selected local IDs to backendDocIds
      const selectedBackendDocIds = readyDocs
        .filter((d) => selectedDocIds.has(d.id))
        .map((d) => d.backendDocId as number);

      const data = await generateCourse({
        topic,
        learning_goal: goal,
        difficulty,
        passing_score: 70,
        doc_ids: selectedBackendDocIds,
        additional_instructions: additionalInstructions || "Create a short course with 1 complete lesson in markdown. Generate exactly 10 pedagogical questions. Each question must have exactly 4 options with only one correct answer. Return ONLY the JSON package."
      });

      setCourse(data);
      setStep('lesson');
      toast.success(t("course_gen_success"));
    } catch (error) {
      console.error(error);
      toast.error(t("course_gen_error"));
    } finally {
      setLoading(false);
    }
  };

  const handleLoadDemo = () => {
    const mockCourse: CoursePackage = {
      title: "Introduction à la Cybersécurité",
      lesson_content: "# Les Bases de la Cybersécurité\n\nBienvenue dans ce cours condensé sur la protection des données.\n\n## 1. Pourquoi la sécurité est-elle importante ?\nDans un monde hyper-connecté, nos données (PII) sont des cibles. La cybersécurité vise à garantir la **Confidentialité**, l'**Intégrité** et la **Disponibilité** (le triangle CIA).\n\n## 2. Les Menaces Communes\n- **Phishing** : Emails frauduleux pour voler des mots de passe.\n- **Ransomware** : Chiffrement de fichiers contre rançon.\n- **Social Engineering** : Manipulation psychologique.\n\n## 3. Bonnes Pratiques\n1. Utilisez des **MFA** (Authentification Multi-Facteurs).\n2. Ne réutilisez jamais les mêmes mots de passe.\n3. Soyez vigilant face aux liens suspects.",
      quiz: Array(10).fill(null).map((_, i) => ({
        question: `Question de test ${i + 1}: Quelle est la règle d'or de la cybersécurité ?`,
        options: ["Utiliser le MFA", "Cliquer sur tout", "Partager son mot de passe", "Ignorer les mises à jour"],
        correct_answer: "Utiliser le MFA"
      })),
      reward_title: "Certificat de Vigilance Numérique",
      reward_message: "Félicitations ! Vous avez les bases pour protéger vos données personnelles."
    };
    
    setCourse(mockCourse);
    setDifficulty("Intermédiaire");
    setTopic("Cybersécurité");
    setGoal("Comprendre les bases de la protection des données");
    setStep('lesson');
    toast.success("Mode démo activé !");
  };

  const handleQuizFinish = (finalScore: number) => {
    setScore(finalScore);
    if (finalScore >= 70) {
      setShowReward(true);
    } else {
      toast.info(`Score: ${Math.round(finalScore)}%. Le seuil de réussite est de 70%.`);
    }
    setStep('finished');
  };

  if (step === 'setup') {
    return (
      <DashboardLayout>
        <div className="container max-w-4xl py-12 space-y-8 animate-in fade-in duration-700">
          <div className="text-center space-y-4">
            <div className="inline-flex p-3 rounded-2xl bg-primary/10 text-primary mb-2">
              <GraduationCap className="w-10 h-10" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
              {t("course_gen_title")}
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t("course_gen_subtitle")}
            </p>
            <div className="flex justify-center gap-3">
              <Button 
                variant="outline" 
                className="rounded-full border-primary/30 text-primary hover:bg-primary/10"
                onClick={handleLoadDemo}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {t("course_gen_demo_btn")}
              </Button>
            </div>
          </div>

          <Card className="border-2 shadow-xl overflow-hidden">
            <CardHeader className="bg-muted/30 pb-8">
              <CardTitle>{t("course_gen_setup_title")}</CardTitle>
              <CardDescription>{t("course_gen_setup_desc")}</CardDescription>
            </CardHeader>
            <CardContent className="pt-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="topic">{t("course_gen_topic_label")}</Label>
                  <Input 
                    id="topic" 
                    placeholder={t("course_gen_topic_placeholder")} 
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="h-12 text-base transition-all focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="difficulty">{t("course_gen_difficulty_label")}</Label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger id="difficulty" className="h-12 text-base">
                      <SelectValue placeholder={t("select_role")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Débutant">{t("course_gen_diff_beginner")}</SelectItem>
                      <SelectItem value="Intermédiaire">{t("course_gen_diff_intermediate")}</SelectItem>
                      <SelectItem value="Avancé">{t("course_gen_diff_advanced")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal">{t("course_gen_goal_label")}</Label>
                <Input 
                  id="goal" 
                  placeholder={t("course_gen_goal_placeholder")} 
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="h-12 text-base transition-all focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="additional">{t("course_gen_additional_instructions_label")}</Label>
                <Input 
                  id="additional" 
                  placeholder={t("course_gen_additional_instructions_placeholder")} 
                  value={additionalInstructions}
                  onChange={(e) => setAdditionalInstructions(e.target.value)}
                  className="h-12 text-base transition-all focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-bold flex items-center gap-2">
                    <FileIconText className="w-5 h-5 text-primary" />
                    {t("course_gen_sources_label")} ({selectedDocIds.size}/{readyDocs.length})
                  </Label>
                  <Button variant="ghost" size="sm" onClick={toggleAll} className="h-8 text-xs hover:bg-primary/10 hover:text-primary transition-colors">
                    {selectedDocIds.size === readyDocs.length ? t("course_gen_deselect_all") : t("course_gen_select_all")}
                  </Button>
                </div>
                
                <ScrollArea className="h-[220px] rounded-xl border-2 border-dashed border-muted p-3 bg-muted/20">
                  {readyDocs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-8 text-center space-y-2">
                      <FileIconGeneric className="w-10 h-10 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground font-medium">{t("course_gen_no_docs")}</p>
                      <Button variant="link" size="sm" onClick={() => window.location.href='/documents'}>
                        {t("course_gen_go_index")}
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2">
                      {readyDocs.map((doc) => {
                        const isSelected = selectedDocIds.has(doc.id);
                        return (
                          <label
                            key={doc.id}
                            className={`flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 border-2 ${
                              isSelected 
                                ? 'bg-primary/10 border-primary shadow-sm' 
                                : 'bg-background border-transparent hover:border-muted-foreground/20 hover:bg-muted/30'
                            }`}
                          >
                            <Switch
                              checked={isSelected}
                              onCheckedChange={() => toggleDoc(doc.id)}
                              className="data-[state=checked]:bg-primary"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold truncate text-foreground">{doc.name}</p>
                              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                                {doc.type} • {doc.size}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {doc.status === "pii-found" ? (
                                <Badge variant="outline" className="text-[10px] h-5 border-orange-400 bg-orange-50 text-orange-600 px-2 font-black">PII</Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px] h-5 border-green-500 bg-green-50 text-green-600 px-2 font-black">SÛR</Badge>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
                <p className="text-[11px] text-muted-foreground text-center italic">
                  {t("course_gen_rag_hint")}
                </p>
              </div>
            </CardContent>
            <div className="px-6 pb-8">
              <Button 
                className="w-full h-14 text-lg font-bold gap-2 shadow-lg group" 
                onClick={handleGenerate}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    {t("course_gen_loading")}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6" />
                    {t("course_gen_generate_btn")}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (!course) return null;

  return (
    <DashboardLayout>
      <div className="container max-w-5xl py-8 space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight">{course.title}</h1>
            <p className="text-muted-foreground font-medium">{t("features_readonly")} • {difficulty}</p>
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
          <Card className="border-2 shadow-sm">
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
              setStep('setup');
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default CreateCourse;

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  GraduationCap, Plus, BookOpen, Trash2, 
  Calendar, Layers, ArrowRight, Loader2,
  AlertCircle
} from 'lucide-react';
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { listCourses, deleteCourse, Course } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

const Courses = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCourses = async () => {
    try {
      const data = await listCourses();
      setCourses(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm(t("confirm_delete") || "Are you sure?")) return;
    try {
      await deleteCourse(id);
      toast.success("Course deleted");
      fetchCourses();
    } catch (error) {
      toast.error("Failed to delete course");
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">{t("courses_title")}</h1>
            <p className="text-muted-foreground">{t("courses_subtitle")}</p>
          </div>
          <Button onClick={() => navigate("/create-course")} className="gap-2">
            <Plus className="w-4 h-4" /> {t("nav_create_course")}
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : courses.length === 0 ? (
          <Card className="border-2 border-dashed py-20 text-center">
            <CardContent className="space-y-4">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                <GraduationCap className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">{t("courses_empty")}</h3>
                <p className="text-muted-foreground max-w-xs mx-auto">
                  Start by generating your first AI-powered course from your documents.
                </p>
              </div>
              <Button onClick={() => navigate("/create-course")} variant="outline">
                {t("nav_create_course")}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="h-full border-2 hover:border-primary/50 transition-all group overflow-hidden flex flex-col">
                  <CardHeader className="bg-muted/30 pb-4">
                    <div className="flex justify-between items-start">
                      <Badge variant="secondary" className="mb-2">
                        {course.status}
                      </Badge>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDelete(course.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <CardTitle className="line-clamp-2 min-h-[3.5rem] leading-tight group-hover:text-primary transition-colors">
                      {course.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 flex-1">
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4 italic">
                      {course.description || "No description provided."}
                    </p>
                    <div className="flex flex-wrap gap-3 text-xs font-semibold text-muted-foreground">
                      <div className="flex items-center gap-1.5 bg-secondary/50 px-2 py-1 rounded-md">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(course.created_at).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1.5 bg-secondary/50 px-2 py-1 rounded-md">
                        <Layers className="w-3.5 h-3.5" />
                        {course.quiz?.length || 0} Questions
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0 pb-6 px-6">
                    <Button 
                      className="w-full h-12 rounded-xl font-bold gap-2 group/btn" 
                      onClick={() => navigate(`/courses/${course.id}`)}
                    >
                      {t("courses_view")}
                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Courses;

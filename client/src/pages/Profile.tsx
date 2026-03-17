import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { User, Shield, Loader2, KeyRound, Save } from "lucide-react";
import { useRole } from "@/contexts/RoleContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getMe, updateMe, updateMyPassword, type User as UserType } from "@/lib/api";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter
} from "@/components/ui/dialog";

const Profile = () => {
  const { role } = useRole();
  const { t } = useLanguage();

  const [user, setUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Profile form
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [jobFunction, setJobFunction] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password dialog
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    getMe()
      .then((data) => {
        setUser(data);
        setFirstName(data.first_name ?? "");
        setLastName(data.last_name ?? "");
        setJobFunction(data.job_function ?? "");
      })
      .catch((err) => toast({ variant: "destructive", title: t("login_error"), description: err.message }))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      const updated = await updateMe({
        first_name: firstName,
        last_name: lastName,
        job_function: jobFunction || undefined,
      });
      setUser(updated);
      toast({ title: t("profile_updated") });
    } catch (err: any) {
      toast({ variant: "destructive", title: t("login_error"), description: err.message });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSavePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: t("login_error"),
        description: t("passwords_dont_match"),
      });
      return;
    }
    if (newPassword.length < 8) {
      toast({
        variant: "destructive",
        title: t("login_error"),
        description: t("password_min_length"),
      });
      return;
    }
    setIsSavingPassword(true);
    try {
      await updateMyPassword(currentPassword, newPassword);
      setPasswordDialogOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({ title: t("password_updated") });
    } catch (err: any) {
      toast({ variant: "destructive", title: t("login_error"), description: err.message });
    } finally {
      setIsSavingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-40">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-2xl mx-auto space-y-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-foreground">{t("my_profile")}</h1>
          <p className="text-muted-foreground mt-1">
            {t("manage_personal_info")}
          </p>
        </motion.div>

        {/* Avatar + role */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-xl p-6 flex items-center gap-5"
        >
          <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
            <span className="text-xl font-bold text-primary-foreground">
              {firstName?.[0]}{lastName?.[0]}
            </span>
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground">
              {firstName} {lastName}
            </p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
              {role === "admin"
                ? <><Shield className="w-3.5 h-3.5 text-primary" /> {t("role_admin")}</>
                : <><User className="w-3.5 h-3.5" /> {t("role_user")}</>
              }
            </span>
          </div>
        </motion.div>

        {/* Profile form */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-xl p-6 space-y-5"
        >
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            {t("personal_info")}
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{t("first_name")}</label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="bg-background/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{t("last_name")}</label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="bg-background/50"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">{t("email")}</label>
            <Input
              value={user?.email ?? ""}
              disabled
              className="bg-background/30 text-muted-foreground cursor-not-allowed"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              {t("job_function_optional")}
            </label>
            <Input
              value={jobFunction}
              onChange={(e) => setJobFunction(e.target.value)}
              placeholder={t("job_function_placeholder")}
              className="bg-background/50"
            />
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleSaveProfile}
              disabled={isSavingProfile}
              className="gradient-primary text-primary-foreground gap-2"
            >
              {isSavingProfile
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Save className="w-4 h-4" />
              }
              {t("save")}
            </Button>
          </div>
        </motion.div>

        {/* Security */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-xl p-6 space-y-4"
        >
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-primary" />
            {t("security")}
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground">{t("password")}</p>
              <p className="text-xs text-muted-foreground">
                {t("change_login_password")}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setPasswordDialogOpen(true)}
              className="gap-2"
            >
              <KeyRound className="w-4 h-4" />
              {t("edit")}
            </Button>
          </div>
        </motion.div>

      </div>

      {/* Password dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="glass-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">{t("change_password")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                {t("current_password")}
              </label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="bg-background/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                {t("new_password")}
              </label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-background/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                {t("confirm_password")}
              </label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-background/50"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>
              {t("cancel")}
            </Button>
            <Button
              onClick={handleSavePassword}
              disabled={isSavingPassword || !currentPassword || !newPassword || !confirmPassword}
              className="gradient-primary text-primary-foreground gap-2"
            >
              {isSavingPassword && <Loader2 className="w-4 h-4 animate-spin" />}
              {t("edit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </DashboardLayout>
  );
};

export default Profile;
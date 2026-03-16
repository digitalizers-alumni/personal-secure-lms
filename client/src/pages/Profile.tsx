import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { User, Shield, Loader2, KeyRound, Save } from "lucide-react";
import { useRole } from "@/contexts/RoleContext";
import { getMe, updateMe, updateMyPassword, type User as UserType } from "@/lib/api";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter
} from "@/components/ui/dialog";

const Profile = () => {
  const { role } = useRole();

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
      .catch((err) => toast({ variant: "destructive", title: "Erreur", description: err.message }))
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
      toast({ title: "Profil mis à jour" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSavePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas.",
      });
      return;
    }
    if (newPassword.length < 8) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Le mot de passe doit contenir au moins 8 caractères.",
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
      toast({ title: "Mot de passe mis à jour" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
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
          <h1 className="text-3xl font-bold text-foreground">Mon profil</h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos informations personnelles
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
                ? <><Shield className="w-3.5 h-3.5 text-primary" /> Administrateur</>
                : <><User className="w-3.5 h-3.5" /> Utilisateur</>
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
            Informations personnelles
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Prénom</label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="bg-background/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Nom</label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="bg-background/50"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Email</label>
            <Input
              value={user?.email ?? ""}
              disabled
              className="bg-background/30 text-muted-foreground cursor-not-allowed"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Fonction (optionnel)
            </label>
            <Input
              value={jobFunction}
              onChange={(e) => setJobFunction(e.target.value)}
              placeholder="Ex: Développeur, Manager..."
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
              Sauvegarder
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
            Sécurité
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground">Mot de passe</p>
              <p className="text-xs text-muted-foreground">
                Modifiez votre mot de passe de connexion
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setPasswordDialogOpen(true)}
              className="gap-2"
            >
              <KeyRound className="w-4 h-4" />
              Modifier
            </Button>
          </div>
        </motion.div>

      </div>

      {/* Password dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="glass-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Modifier le mot de passe</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Mot de passe actuel
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
                Nouveau mot de passe
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
                Confirmer le mot de passe
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
              Annuler
            </Button>
            <Button
              onClick={handleSavePassword}
              disabled={isSavingPassword || !currentPassword || !newPassword || !confirmPassword}
              className="gradient-primary text-primary-foreground gap-2"
            >
              {isSavingPassword && <Loader2 className="w-4 h-4 animate-spin" />}
              Modifier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </DashboardLayout>
  );
};

export default Profile;
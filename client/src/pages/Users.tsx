import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  listUsers, updateUser, deleteUser,
  activateUser, deactivateUser, type User
} from "@/lib/api";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Users as UsersIcon,
  Shield,
  User as UserIcon,
  Trash2,
  UserCheck,
  UserX,
  Loader2,
  Search,
} from "lucide-react";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show:   { opacity: 1, y: 0 },
};

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filtered, setFiltered] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFirst, setEditFirst] = useState("");
  const [editLast, setEditLast] = useState("");
  const [editJob, setEditJob] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    listUsers()
      .then((data) => { setUsers(data); setFiltered(data); })
      .catch((err) => toast({ variant: "destructive", title: "Erreur", description: err.message }))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      users.filter((u) =>
        u.email.toLowerCase().includes(q) ||
        u.first_name.toLowerCase().includes(q) ||
        u.last_name.toLowerCase().includes(q)
      )
    );
  }, [search, users]);

  const openEdit = (user: User) => {
    setEditingUser(user);
    setEditFirst(user.first_name);
    setEditLast(user.last_name);
    setEditJob(user.job_function ?? "");
  };

  const handleSave = async () => {
    if (!editingUser) return;
    setIsSaving(true);
    try {
      const updated = await updateUser(editingUser.id, {
        first_name: editFirst,
        last_name: editLast,
        job_function: editJob || undefined,
      });
      setUsers((prev) => prev.map((u) => u.id === updated.id ? updated : u));
      setEditingUser(null);
      toast({ title: "Utilisateur mis à jour" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (userId: number) => {
    try {
      await deleteUser(userId);
      setUsers((prev) => prev.map((u) =>
        u.id === userId ? { ...u, is_deleted: true } : u
      ));
      toast({ title: "Utilisateur supprimé" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    }
  };

  const handleActivate = async (userId: number) => {
    try {
      await activateUser(userId);
      setUsers((prev) => prev.map((u) =>
        u.id === userId ? { ...u, is_active: true } : u
      ));
      toast({ title: "Utilisateur activé" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    }
  };

  const handleDeactivate = async (userId: number) => {
    try {
      await deactivateUser(userId);
      setUsers((prev) => prev.map((u) =>
        u.id === userId ? { ...u, is_active: false } : u
      ));
      toast({ title: "Utilisateur désactivé" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground">Utilisateurs</h1>
            <p className="text-muted-foreground mt-1">
              Gérez les comptes utilisateurs de l'organisation
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background/50"
          />
        </motion.div>

        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <UsersIcon className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-sm text-muted-foreground">Aucun utilisateur trouvé.</p>
          </motion.div>
        )}

        {!isLoading && filtered.length > 0 && (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="glass-card rounded-xl overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Utilisateur</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rôle</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Statut</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((user) => (
                    <motion.tr
                      key={user.id}
                      variants={item}
                      className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-primary-foreground">
                              {user.first_name[0]}{user.last_name[0]}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {user.first_name} {user.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                            {user.job_function && (
                              <p className="text-xs text-muted-foreground">{user.job_function}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="flex items-center gap-1.5 text-xs">
                          {user.user_role?.toUpperCase() === "ADMIN"
                            ? <><Shield className="w-3.5 h-3.5 text-primary" /> Admin</>
                            : <><UserIcon className="w-3.5 h-3.5 text-muted-foreground" /> Utilisateur</>
                          }
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {user.is_deleted ? (
                          <Badge variant="destructive" className="text-[10px]">Supprimé</Badge>
                        ) : user.is_active ? (
                          <Badge variant="default" className="text-[10px]">Actif</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">Inactif</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1">
                          {!user.is_deleted && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs"
                                onClick={() => openEdit(user)}
                              >
                                Modifier
                              </Button>
                              {user.is_active ? (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-muted-foreground hover:text-warning"
                                  onClick={() => handleDeactivate(user.id)}
                                >
                                  <UserX className="w-3.5 h-3.5" />
                                </Button>
                              ) : (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-muted-foreground hover:text-success"
                                  onClick={() => handleActivate(user.id)}
                                >
                                  <UserCheck className="w-3.5 h-3.5" />
                                </Button>
                              )}
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                onClick={() => handleDelete(user.id)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
          <DialogContent className="glass-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Modifier l'utilisateur</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <Input
                placeholder="Prénom"
                value={editFirst}
                onChange={(e) => setEditFirst(e.target.value)}
                className="bg-background/50"
              />
              <Input
                placeholder="Nom"
                value={editLast}
                onChange={(e) => setEditLast(e.target.value)}
                className="bg-background/50"
              />
              <Input
                placeholder="Fonction (optionnel)"
                value={editJob}
                onChange={(e) => setEditJob(e.target.value)}
                className="bg-background/50"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingUser(null)}>
                Annuler
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="gradient-primary text-primary-foreground gap-2"
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                Sauvegarder
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </DashboardLayout>
  );
};

export default Users;
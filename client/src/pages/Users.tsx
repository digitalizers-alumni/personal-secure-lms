import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  listUsers, updateUser, deleteUser,
  activateUser, deactivateUser, createUser, type User
} from "@/lib/api";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Users as UsersIcon, Shield, User as UserIcon,
  Trash2, UserCheck, UserX, Loader2, Search, Plus,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show:   { opacity: 1, y: 0 },
};

const Users = () => {
  const { t } = useLanguage();
  const [users, setUsers] = useState<User[]>([]);
  const [filtered, setFiltered] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Edit
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFirst, setEditFirst] = useState("");
  const [editLast, setEditLast] = useState("");
  const [editJob, setEditJob] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Create
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newFirst, setNewFirst] = useState("");
  const [newLast, setNewLast] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("USER");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    listUsers()
      .then((data) => { setUsers(data); setFiltered(data); })
      .catch((err) => toast({ variant: "destructive", title: t("login_error"), description: err.message }))
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
      toast({ title: t("user_updated") });
    } catch (err: any) {
      toast({ variant: "destructive", title: t("login_error"), description: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const created = await createUser({
        email: newEmail,
        password: newPassword,
        first_name: newFirst,
        last_name: newLast,
        user_role: newRole,
      });
      // Optimistically add the new user without a full refetch
      setUsers((prev) => [...prev, created]);
      setCreateDialogOpen(false);
      setNewEmail("");
      setNewFirst("");
      setNewLast("");
      setNewPassword("");
      setNewRole("USER");
      toast({ title: t("user_created") });
    } catch (err: any) {
      toast({ variant: "destructive", title: t("login_error"), description: err.message });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (userId: number) => {
    try {
      await deleteUser(userId);
      setUsers((prev) => prev.map((u) =>
        u.id === userId ? { ...u, is_deleted: true } : u
      ));
      toast({ title: t("user_deleted") });
    } catch (err: any) {
      toast({ variant: "destructive", title: t("login_error"), description: err.message });
    }
  };

  const handleActivate = async (userId: number) => {
    try {
      await activateUser(userId);
      setUsers((prev) => prev.map((u) =>
        u.id === userId ? { ...u, is_active: true } : u
      ));
      toast({ title: t("user_activated") });
    } catch (err: any) {
      toast({ variant: "destructive", title: t("login_error"), description: err.message });
    }
  };

  const handleDeactivate = async (userId: number) => {
    try {
      await deactivateUser(userId);
      setUsers((prev) => prev.map((u) =>
        u.id === userId ? { ...u, is_active: false } : u
      ));
      toast({ title: t("user_deactivated") });
    } catch (err: any) {
      toast({ variant: "destructive", title: t("login_error"), description: err.message });
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t("nav_users")}</h1>
            <p className="text-muted-foreground mt-1">
              {t("manage_user_accounts")}
            </p>
          </div>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="gradient-primary text-primary-foreground gap-2"
          >
            <Plus className="w-4 h-4" />
            {t("new_user")}
          </Button>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t("search_by_name_email")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background/50"
          />
        </motion.div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <UsersIcon className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-sm text-muted-foreground">{t("no_users_found")}</p>
          </motion.div>
        )}

        {/* Users table */}
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
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("user_label")}</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("role")}</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("status")}</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("actions")}</th>
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
                              {user.first_name?.[0]}{user.last_name?.[0]}
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
                            ? <><Shield className="w-3.5 h-3.5 text-primary" /> {t("role_admin")}</>
                            : <><UserIcon className="w-3.5 h-3.5 text-muted-foreground" /> {t("role_user")}</>
                          }
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {user.is_deleted ? (
                          <Badge variant="destructive" className="text-[10px]">{t("deleted")}</Badge>
                        ) : user.is_active ? (
                          <Badge variant="default" className="text-[10px]">{t("active_status")}</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">{t("inactive")}</Badge>
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
                                {t("edit")}
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

        {/* Edit dialog */}
        <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
          <DialogContent className="glass-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">{t("edit_user")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <Input
                placeholder={t("first_name")}
                value={editFirst}
                onChange={(e) => setEditFirst(e.target.value)}
                className="bg-background/50"
              />
              <Input
                placeholder={t("last_name")}
                value={editLast}
                onChange={(e) => setEditLast(e.target.value)}
                className="bg-background/50"
              />
              <Input
                placeholder={t("job_function_optional")}
                value={editJob}
                onChange={(e) => setEditJob(e.target.value)}
                className="bg-background/50"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingUser(null)}>
                {t("cancel")}
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="gradient-primary text-primary-foreground gap-2"
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                {t("save")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="glass-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">{t("new_user")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <Input
                placeholder={t("first_name")}
                value={newFirst}
                onChange={(e) => setNewFirst(e.target.value)}
                className="bg-background/50"
              />
              <Input
                placeholder={t("last_name")}
                value={newLast}
                onChange={(e) => setNewLast(e.target.value)}
                className="bg-background/50"
              />
              <Input
                placeholder={t("email")}
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="bg-background/50"
              />
              <Input
                placeholder={t("password")}
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-background/50"
              />
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-border bg-background/50 text-sm text-foreground"
              >
                <option value="USER">{t("role_user")}</option>
                <option value="ADMIN">{t("role_admin")}</option>
              </select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                {t("cancel")}
              </Button>
              <Button
                onClick={handleCreate}
                disabled={isCreating || !newEmail || !newPassword || !newFirst || !newLast}
                className="gradient-primary text-primary-foreground gap-2"
              >
                {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
                {t("create")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </DashboardLayout>
  );
};

export default Users;
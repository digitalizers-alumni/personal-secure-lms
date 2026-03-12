import { useState } from "react";
import { Copy, Check, Mail, UserPlus, Link2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "@/hooks/use-toast";

interface InviteDialogProps {
  trigger?: React.ReactNode;
}

const InviteDialog = ({ trigger }: InviteDialogProps) => {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState("");
  const [open, setOpen] = useState(false);

  const inviteToken = crypto.randomUUID().slice(0, 12);
  const inviteLink = `${window.location.origin}/invite/${inviteToken}`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast({ title: t("invite_copied") });
    setTimeout(() => setCopied(false), 2000);
  };

  const sendEmail = () => {
    if (!email.trim()) return;
    toast({ title: t("invite_send"), description: email });
    setEmail("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <UserPlus className="w-4 h-4" />
            {t("invite_title")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="glass-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <UserPlus className="w-5 h-5 text-primary" />
            {t("invite_title")}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {t("invite_desc")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Invite link */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Link2 className="w-4 h-4 text-muted-foreground" />
              Lien d'invitation
            </label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={inviteLink}
                className="text-xs font-mono bg-muted/50"
              />
              <Button
                onClick={copyLink}
                variant="outline"
                size="icon"
                className="flex-shrink-0"
              >
                <AnimatePresence mode="wait">
                  {copied ? (
                    <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                      <Check className="w-4 h-4 text-success" />
                    </motion.div>
                  ) : (
                    <motion.div key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                      <Copy className="w-4 h-4" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </div>
          </div>

          {/* Email invite */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              {t("invite_send")}
            </label>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder={t("invite_email_placeholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendEmail()}
              />
              <Button
                onClick={sendEmail}
                className="gradient-primary text-primary-foreground flex-shrink-0"
                disabled={!email.trim()}
              >
                {t("invite_send")}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InviteDialog;

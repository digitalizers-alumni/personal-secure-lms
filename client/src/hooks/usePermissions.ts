import { useRole, type Role } from "@/contexts/RoleContext";

interface Permissions {
  canUpload: boolean;
  canGenerateFormation: boolean;
  canEditFormation: boolean;
  canViewAnalytics: boolean;
  canInvite: boolean;
  canManageUsers: boolean;
  canUseAIChat: boolean;
  canDownloadDocs: boolean;
  canEditSettings: boolean;
  canViewActivity: boolean;
  canViewQuickActions: boolean;
  canCreateRoleplay: boolean;
  canViewEvalStats: boolean;
  isGuest: boolean;
  isAdmin: boolean;
}

const permissionsByRole: Record<Role, Permissions> = {
  admin: {
    canUpload: true,
    canGenerateFormation: true,
    canEditFormation: true,
    canViewAnalytics: true,
    canInvite: true,
    canManageUsers: true,
    canUseAIChat: true,
    canDownloadDocs: true,
    canEditSettings: true,
    canViewActivity: true,
    canViewQuickActions: true,
    canCreateRoleplay: true,
    canViewEvalStats: true,
    isGuest: false,
    isAdmin: true,
  },
  user: {
    canUpload: true,
    canGenerateFormation: false,
    canEditFormation: false,
    canViewAnalytics: true,
    canInvite: true,
    canManageUsers: false,
    canUseAIChat: true,
    canDownloadDocs: true,
    canEditSettings: true,
    canViewActivity: true,
    canViewQuickActions: true,
    canCreateRoleplay: false,
    canViewEvalStats: false,
    isGuest: false,
    isAdmin: false,
  },
  guest: {
    canUpload: false,
    canGenerateFormation: false,
    canEditFormation: false,
    canViewAnalytics: false,
    canInvite: false,
    canManageUsers: false,
    canUseAIChat: false,
    canDownloadDocs: false,
    canEditSettings: false,
    canViewActivity: false,
    canViewQuickActions: false,
    canCreateRoleplay: false,
    canViewEvalStats: false,
    isGuest: true,
    isAdmin: false,
  },
};

export const usePermissions = (): Permissions => {
  const { role } = useRole();
  return permissionsByRole[role];
};

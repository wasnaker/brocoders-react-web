export type Permission = {
  id: number;
  name: string;
  permissionKey?: string;
  description?: string;
  moduleId?: string | null;
  isActive?: boolean;
};

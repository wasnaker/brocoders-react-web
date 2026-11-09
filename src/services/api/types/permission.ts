export type Permission = {
  id: number | string;
  name: string;
  permissionKey?: string;
  description?: string;
  moduleId?: string | null;
  isActive?: boolean;
};

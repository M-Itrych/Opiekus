import { Staff, User, Group, StaffRole, UserRole } from "@prisma/client";

export type StaffWithRelations = Staff & {
  user: Pick<User, "id" | "name" | "surname" | "email" | "phone">;
  group: Pick<Group, "id" | "name"> | null;
};

export function serializeStaff(member: StaffWithRelations) {
  return {
    id: member.id,
    staffRole: member.staffRole,
    permissions: member.permissions,
    group: member.group
      ? { id: member.group.id, name: member.group.name }
      : null,
    user: {
      id: member.user.id,
      name: member.user.name,
      surname: member.user.surname,
      email: member.user.email,
      phone: member.user.phone,
    },
  };
}

export const STAFF_ROLE_TO_USER_ROLE: Record<StaffRole, UserRole> = {
  NAUCZYCIEL: "TEACHER",
  INTENDENTKA: "HEADTEACHER",
  SEKRETARKA: "HEADTEACHER",
  POMOCNIK: "TEACHER",
};


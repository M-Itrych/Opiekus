import { Room, Group } from "@prisma/client";

export type RoomWithRelations = Room & {
  groups: Array<Pick<Group, "id" | "name">>;
};

export function serializeRoom(room: RoomWithRelations) {
  const assignedGroup = room.groups[0] || null;

  return {
    id: room.id,
    name: room.name,
    capacity: room.capacity,
    status: room.status,
    description: room.description,
    group: assignedGroup
      ? {
          id: assignedGroup.id,
          name: assignedGroup.name,
        }
      : null,
  };
}


/**
 * Dungeon catalog: maps telemetry module_ids to dungeons/topics.
 * Only precise IDs (Dungeon_Type_Qn) are included. Legacy generic IDs are excluded.
 */
export const DUNGEONS = [
  {
    id: "cradle_of_silence",
    name: "The Cradle of Silence",
    topic: "Pediatrics",
    questionIds: [
      "Cradle_Sentinel_Q1",
      "Cradle_Sentinel_Q2",
      "Cradle_Sentinel_Q3",
      "Cradle_Sentinel_Q4",
      "Cradle_Paragon_Q1",
    ],
  },
  {
    id: "iron_keep",
    name: "The Iron Keep",
    topic: "Cardiology / Hemodynamics",
    questionIds: [
      "IronKeep_Q1_FlashPulmEdema",
      "IronKeep_Sentinel_Q1",
      "IronKeep_Sentinel_Q2",
      "IronKeep_Sentinel_Q3",
      "IronKeep_Arbiter_Q1",
      "IronKeep_Arbiter_Q2",
      "IronKeep_Paragon_Q1",
      "IronKeep_Trap_Q1",
    ],
  },
  {
    id: "grey_labyrinth",
    name: "The Grey Labyrinth",
    topic: "Neurology",
    questionIds: [
      "GreyLabyrinth_Sentinel_Q1",
      "GreyLabyrinth_Sentinel_Q2",
      "GreyLabyrinth_Sentinel_Q3",
      "GreyLabyrinth_Sentinel_Q4",
      "GreyLabyrinth_Arbiter_Q1",
      "GreyLabyrinth_Arbiter_Q2",
      "GreyLabyrinth_Paragon_Q1",
      "GreyLabyrinth_Trap",
    ],
  },
  {
    id: "hollow_crucible",
    name: "The Hollow Crucible",
    topic: "GI / Abdominal / Surgery",
    questionIds: [
      "HollowCrucible_Sentinel_Q1",
      "HollowCrucible_Sentinel_Q2",
      "HollowCrucible_Sentinel_Q3",
      "HollowCrucible_Sentinel_Q4",
    ],
  },
];

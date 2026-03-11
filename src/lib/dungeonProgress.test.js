import { describe, it, expect } from "vitest";
import {
  buildResidentQuestionStatus,
  getResidentDungeonProgress,
  getResidentQuestionBreakdown,
  getCohortDungeonMetrics,
} from "./dungeonProgress";
import { DUNGEONS } from "./dungeonConfig";

describe("buildResidentQuestionStatus", () => {
  it("returns empty object for null or undefined attempts", () => {
    expect(buildResidentQuestionStatus(null)).toEqual({});
    expect(buildResidentQuestionStatus(undefined)).toEqual({});
  });

  it("returns empty object for empty array", () => {
    expect(buildResidentQuestionStatus([])).toEqual({});
  });

  it("skips attempts missing resident_id or module_id", () => {
    const attempts = [
      { resident_id: "r1", outcome: "correct" },
      { module_id: "q1", outcome: "correct" },
      { resident_id: "", module_id: "q1", outcome: "correct" },
    ];
    expect(buildResidentQuestionStatus(attempts)).toEqual({});
  });

  it("aggregates correct and incorrect outcomes per resident and question", () => {
    const attempts = [
      { resident_id: "r1", module_id: "q1", outcome: "correct" },
      { resident_id: "r1", module_id: "q1", outcome: "incorrect" },
      { resident_id: "r1", module_id: "q2", outcome: "correct" },
      { resident_id: "r2", module_id: "q1", outcome: "incorrect" },
    ];
    expect(buildResidentQuestionStatus(attempts)).toEqual({
      r1: {
        q1: { hasCorrect: true, hasWrong: true },
        q2: { hasCorrect: true, hasWrong: false },
      },
      r2: {
        q1: { hasCorrect: false, hasWrong: true },
      },
    });
  });
});

describe("getResidentDungeonProgress", () => {
  const dungeons = [
    { id: "d1", name: "Dungeon 1", topic: "Topic 1", questionIds: ["q1", "q2"] },
    { id: "d2", name: "Dungeon 2", topic: "Topic 2", questionIds: ["q3"] },
  ];

  it("returns all-zero rows when no residentId and empty attempts", () => {
    const result = getResidentDungeonProgress([], dungeons);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      dungeonId: "d1",
      dungeonName: "Dungeon 1",
      topic: "Topic 1",
      totalQuestions: 2,
      completedQuestions: 0,
      wrongQuestions: 0,
      completionPct: 0,
      wrongPct: 0,
    });
  });

  it("infers residentId from attempts when omitted", () => {
    const attempts = [
      { resident_id: "r1", module_id: "q1", outcome: "correct" },
      { resident_id: "r1", module_id: "q2", outcome: "incorrect" },
    ];
    const result = getResidentDungeonProgress(attempts, dungeons);
    expect(result[0].completedQuestions).toBe(1);
    expect(result[0].wrongQuestions).toBe(1);
    expect(result[0].completionPct).toBe(50);
    expect(result[0].wrongPct).toBe(50);
  });

  it("uses explicit residentId when provided", () => {
    const attempts = [
      { resident_id: "r1", module_id: "q1", outcome: "correct" },
      { resident_id: "r2", module_id: "q1", outcome: "correct" },
    ];
    const result = getResidentDungeonProgress(attempts, dungeons, "r1");
    expect(result[0].completedQuestions).toBe(1);
    expect(result[0].completionPct).toBe(50);
  });

  it("rounds completionPct and wrongPct correctly", () => {
    const attempts = [
      { resident_id: "r1", module_id: "q1", outcome: "correct" },
    ];
    const result = getResidentDungeonProgress(attempts, dungeons, "r1");
    expect(result[0].completionPct).toBe(50);
    expect(result[0].wrongPct).toBe(0);
  });

  it("returns 0 for completionPct when total is 0", () => {
    const emptyDungeons = [
      { id: "d1", name: "D1", topic: "T1", questionIds: [] },
    ];
    const result = getResidentDungeonProgress([], emptyDungeons, "r1");
    expect(result[0].completionPct).toBe(0);
    expect(result[0].wrongPct).toBe(0);
  });
});

describe("getResidentQuestionBreakdown", () => {
  const dungeon = {
    id: "d1",
    questionIds: ["question_one", "question_two"],
  };

  it("returns breakdown with formatted labels", () => {
    const attempts = [
      { resident_id: "r1", module_id: "question_one", outcome: "correct" },
      { resident_id: "r1", module_id: "question_one", outcome: "incorrect" },
      { resident_id: "r1", module_id: "question_two", outcome: "correct" },
    ];
    const result = getResidentQuestionBreakdown(attempts, dungeon, "r1");
    expect(result).toEqual([
      { questionId: "question_one", label: "Question One", correct: 1, wrong: 1 },
      { questionId: "question_two", label: "Question Two", correct: 1, wrong: 0 },
    ]);
  });

  it("ignores attempts for other residents", () => {
    const attempts = [
      { resident_id: "r2", module_id: "question_one", outcome: "correct" },
    ];
    const result = getResidentQuestionBreakdown(attempts, dungeon, "r1");
    expect(result[0].correct).toBe(0);
    expect(result[0].wrong).toBe(0);
  });

  it("ignores module_ids not in dungeon", () => {
    const attempts = [
      { resident_id: "r1", module_id: "other_q", outcome: "correct" },
    ];
    const result = getResidentQuestionBreakdown(attempts, dungeon, "r1");
    expect(result[0].correct).toBe(0);
    expect(result[1].correct).toBe(0);
  });
});

describe("getCohortDungeonMetrics", () => {
  const dungeons = [
    { id: "d1", name: "D1", topic: "T1", questionIds: ["q1", "q2"] },
  ];

  it("returns all-zero when residentIds is empty", () => {
    const result = getCohortDungeonMetrics(new Set(), [], dungeons);
    expect(result).toEqual([
      { dungeonId: "d1", dungeonName: "D1", topic: "T1", completionPct: 0, wrongPct: 0 },
    ]);
  });

  it("aggregates across multiple residents", () => {
    const residentIds = new Set(["r1", "r2"]);
    const attempts = [
      { resident_id: "r1", module_id: "q1", outcome: "correct" },
      { resident_id: "r1", module_id: "q2", outcome: "incorrect" },
      { resident_id: "r2", module_id: "q1", outcome: "correct" },
    ];
    const result = getCohortDungeonMetrics(residentIds, attempts, dungeons);
    expect(result[0].completionPct).toBe(50);
    expect(result[0].wrongPct).toBe(25);
  });

  it("returns 0 when questionSlots is 0", () => {
    const emptyDungeons = [
      { id: "d1", name: "D1", topic: "T1", questionIds: [] },
    ];
    const result = getCohortDungeonMetrics(new Set(["r1"]), [], emptyDungeons);
    expect(result[0].completionPct).toBe(0);
    expect(result[0].wrongPct).toBe(0);
  });

  it("works with DUNGEONS from dungeonConfig", () => {
    const residentIds = new Set(["r1"]);
    const attempts = [
      {
        resident_id: "r1",
        module_id: "Cradle_Sentinel_Q1",
        outcome: "correct",
      },
    ];
    const result = getCohortDungeonMetrics(residentIds, attempts, DUNGEONS);
    expect(result.length).toBe(DUNGEONS.length);
    expect(result[0].dungeonId).toBe("cradle_of_silence");
    expect(result[0].completionPct).toBe(20);
  });
});

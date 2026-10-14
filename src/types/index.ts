export type Role = 'TEAM' | 'ADMIN';

export type RoundId = 'ROUND_1' | 'ROUND_2' | 'FINAL_VAULT';

export type CompetitionStatus = 'NOT_STARTED' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'TIME_EXPIRED';

export type TeamStatus = 'NOT_STARTED' | 'ACTIVE' | 'COMPLETED' | 'TIME_EXPIRED' | 'QUALIFIED' | 'DISQUALIFIED';

export type ChallengeCategory = 'DIGITAL' | 'ELECTRONICS' | 'CODING' | 'ENGINEERING_LOGIC' | 'HIDDEN' | 'SENSOR';

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export type QuestionType = 'TEXT' | 'NUMERICAL' | 'MCQ' | 'CODE_OUTPUT' | 'BOOLEAN' | 'MATCHSTICK';

export interface TeamMember {
  name: string;
  usn: string;
  department: string;
}

export interface Team {
  id: string;
  name: string;
  loginCode: string; // password/access code
  leaderName: string;
  leaderEmail: string;
  leaderPhone: string;
  department: string;
  college: string;
  members: TeamMember[];
  currentRound: RoundId;
  status: TeamStatus;
  score: number;
  timeBonus: number;
  penalties: number;
  startTimeRound1?: number;
  finishTimeRound1?: number;
  startTimeRound2?: number;
  finishTimeRound2?: number;
  startTimeVault?: number;
  finishTimeVault?: number;
  totalTimeSpentSeconds: number; // accumulated
  completedChallenges: string[]; // challenge IDs
  unlockedCodesRound2: { [puzzleIndex: number]: string }; // code A, B, C, D, final
  selectedDifficulties: { [challengeId: string]: Difficulty }; // for choice-based challenges
  hintsUsed: number;
  attemptsCount: number;
  nodeHintsUsed?: { [nodeId: string]: number }; // tracks which progressive hint level (1, 2, or 3) was used per node
  nodeAttempts?: { [nodeId: string]: number }; // tracks incorrect attempt count per node
  failedAttempts?: number;
  attemptPenalty?: number;
  hintPenalty?: number;
  basePoints?: number;
  netScore?: number;
  totalHintsUsed?: number;
  round2Step1Solved?: { [roomId: number]: boolean };
  round2Step2Verified?: { [roomId: number]: boolean };
  round2Step3Completed?: { [roomId: number]: boolean };
  round2RoomAttempts?: { [roomId: number]: number };
  passwordStatus?: 'LOCKED' | 'IN_PROGRESS' | 'COMPLETED';
  passwordHintsUsed?: number;
  passwordAttempts?: number;
  questionPenalties?: Record<string, number>;
  flagCollected?: boolean;
  // Round 2 Escape Room fields (isolated from Round 1)
  round2Score?: number;
  round2CurrentRoom?: number; // 1, 2, 3, 4 (or 5 when finished)
  round2CompletedRooms?: number[];
  round2SolvedPuzzles?: number[];
  round2VerifiedCodes?: { [roomId: number]: string };
  round2HintsUsed?: number;
  round2RoomHintsUsed?: { [roomId: number]: boolean };
  round2DiscoveredLetters?: string[];
  round2SolvedLetters?: string[];
  round2FoundBoxes?: number[];
  round2CollectedKeys?: string[];
  round2UnlockedDoors?: number[];
  round2FlagCollected?: boolean;
  round2HintsRevealed?: string[];
  round2StartTime?: number;
  round2FinishTime?: number;
  round2TimeSpentSeconds?: number;
  round2Status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  isQualified: boolean;
  qualified?: boolean; // alias for isQualified
  disqualifiedReason?: string;
  createdAt: number;
}

export interface Challenge {
  id: string;
  round: RoundId;
  nodeCode: string; // e.g. "NODE-01", "SECTOR-A", "SYS-01"
  title: string;
  category: ChallengeCategory;
  difficulty: Difficulty;
  points: number;
  question: string;
  systemContext?: string; // Story context for engineering realism
  codeSnippet?: string;
  diagramAscii?: string;
  questionType: QuestionType;
  options?: string[]; // For MCQ
  correctAnswer?: string; // Only on server! Stripped when sent to team
  hints?: string[]; // Progressive hints: Hint 1, Hint 2, Hint 3
  hint: string;
  hintPenaltyPoints: number;
  explanation?: string; // Hidden on client
  order: number;
  isChoiceBased?: boolean; // easy/medium/hard choices
  choiceGroup?: string; // group id if it has variations
  choiceOptions?: {
    difficulty: Difficulty;
    points: number;
    question: string;
    codeSnippet?: string;
  }[];
  rewardCode?: string; // for escape room unlocked code (e.g. "ALPHA-902")
  active: boolean;
}

export interface SubmissionLog {
  id: string;
  teamId: string;
  teamName: string;
  challengeId: string;
  round: RoundId;
  answerSubmitted: string;
  isCorrect: boolean;
  pointsAwarded: number;
  timestamp: number;
}

export interface ActivityLog {
  id: string;
  teamId?: string;
  teamName?: string;
  type: 'LOGIN' | 'REGISTRATION' | 'ANSWER_ATTEMPT' | 'HINT_USED' | 'ROUND_ADVANCED' | 'CHEAT_ALERT' | 'ADMIN_ACTION';
  message: string;
  timestamp: number;
  severity?: 'INFO' | 'WARNING' | 'ALERT';
}

export interface EventSettings {
  competitionState: CompetitionStatus;
  currentActiveRound: RoundId;
  round1DurationMinutes: number;
  round2DurationMinutes: number;
  vaultDurationMinutes: number;
  round1StartedAt?: number;
  round2StartedAt?: number;
  vaultStartedAt?: number;
  round1PausedAt?: number;
  round2PausedAt?: number;
  vaultPausedAt?: number;
  qualifyTopCount: number;
  isLeaderboardPublic: boolean;
  allowRetry: boolean;
  maxRetriesPerNode: number;
  isDemoMode: boolean;
  hintPenaltyPointsDefault: number;
  timeBonusWeight: number; // e.g. 1 point per 20 seconds remaining
}

export interface PublicLeaderboardEntry {
  rank: number;
  teamId: string;
  teamName: string;
  department: string;
  college: string;
  score: number;
  timeFormatted: string;
  timeSpentSeconds: number;
  status: TeamStatus;
  currentRound: RoundId;
  completedCount: number;
  hintsUsed: number;
  passwordStatus: 'LOCKED' | 'IN_PROGRESS' | 'COMPLETED';
  isQualified: boolean;
}

export interface EscapeRoomItem {
  roomId: number; // 1, 2, 3, 4
  roomName: string; // e.g. "The Discovery"
  roomCode: string; // e.g. "ROOM-01"
  roomMission: string;
  difficulty: string;
  points: number;
  isUnlocked: boolean;
  isSolved: boolean;
  isCompleted: boolean;
  // Step 1: Letter / Spatial Clue Puzzle
  step1Solved?: boolean;
  letterPuzzleTitle?: string;
  letterPuzzleType?: 'SPATIAL_GRID' | 'DECRYPTION_MATRIX' | 'LADDER_LOGIC' | 'ROTOR_SYNC';
  letterPuzzlePrompt?: string;
  revealedLetters?: string;
  venueLocation?: string;
  locationClueDescription?: string;
  // Step 2: Physical Key Verification
  step2Verified?: boolean;
  physicalKeyPrompt?: string;
  physicalLocationClue?: string;
  physicalCodeVerified?: boolean;
  // Step 3: Technical Challenge (Level 2)
  step3Completed?: boolean;
  techTitle?: string;
  techTopic?: string;
  techQuestion?: string;
  techCodeSnippet?: string;
  techDiagram?: string;
  techExplanation?: string;
  puzzleTitle?: string;
  puzzleQuestion?: string;
  puzzleDiagram?: string;
  puzzleCodeSnippet?: string;
  // Hint & Stats
  hintRevealed?: boolean;
  hint?: string;
  hintPenaltyPoints?: number;
  attemptsCount?: number;
}

export interface Round2LeaderboardEntry {
  rank: number;
  teamId: string;
  teamName: string;
  department: string;
  college: string;
  score: number;
  currentRoom: number; // 1, 2, 3, 4 or 5 (COMPLETED)
  currentRoomName: string;
  completedRoomsCount: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  hintsUsed: number;
  timeSpentSeconds: number;
  timeFormatted: string;
  isQualified: boolean;
}

export interface HauntedLetter {
  id: string; // e.g. "R1-L1"
  roomId: number; // 1, 2, 3, 4
  title: string;
  locationName: string; // e.g. "Antique Bookshelf", "Rolltop Desk"
  storyText: string;
  question: string;
  codeSnippet?: string;
  diagram?: string;
  hint: string;
  hintPenalty: number;
  locationClueFragment: string;
  isDiscovered: boolean;
  isSolved: boolean;
}

export interface HauntedKeyBox {
  roomId: number;
  objectName: string; // e.g. "Grandfather Clock"
  boxTitle: string;
  finalQuestion: string;
  hint: string;
  keyName: string;
  isFound: boolean;
  isUnlocked: boolean;
  isKeyCollected: boolean;
}

export interface HauntedRoomData {
  roomId: number;
  roomName: string;
  roomTheme: string;
  doorName: string;
  keyNeeded: string;
  isUnlocked: boolean;
  isCompleted: boolean;
  letters: HauntedLetter[];
  keyBox: HauntedKeyBox;
  decoyObjects: {
    id: string;
    name: string;
    message: string;
  }[];
}

export interface HauntedGameState {
  isQualified: boolean;
  currentRoom: number;
  round2Score: number;
  hintsUsed: number;
  timeRemaining: number;
  isCompleted: boolean;
  discoveredLetters: string[];
  solvedLetters: string[];
  foundBoxes: number[];
  collectedKeys: string[];
  unlockedDoors: number[];
  flagCollected: boolean;
  rooms: HauntedRoomData[];
}


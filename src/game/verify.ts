// ============================================================================
// TECH QUEST: ROUND 2 — AUTHORITATIVE ANSWER VERIFICATION & SCORING MODULE
// ============================================================================
// If running on the server (Node/Express), this module validates inputs directly
// against the authoritative answers below (never exposed to client bundle).
//
// NOTE REGARDING CLIENT-SIDE FALLBACK:
// When running in a purely client-side environment without backend access,
// answers are verified against the salted SHA-256 hashes below.
// **COMMENT: This client-side hashing fallback is NOT tamper-proof**, as hashes
// can theoretically be brute-forced or inspected in memory. Server validation
// via Express (/api/escape/verify) is strictly preferred and authoritative.
// ============================================================================

export type RoomStep = 'LETTER_1' | 'LETTER_2' | 'PHYSICAL_KEY' | 'TECH';

export interface VerifyResult {
  success: boolean;
  message: string;
  revealedClue?: string;
  pointsAwarded?: number;
  newNetScore?: number;
  cumulativeErrors?: number;
  errorWarning?: boolean; // True if 2nd error in a cycle of 3
}

export interface RoomAnswersConfig {
  roomId: number;
  letter1Answer: string;
  letter2Answer: string;
  physicalKey: string;
  techAnswer: string;
  letter1RevealClue: string;
  letter2RevealClue: string;
  hints: {
    letter1: string;
    letter2: string;
    physicalKey?: string;
    tech: string;
  };
}

// Authoritative Answers (Server-side reference)
export const AUTHORITATIVE_ROOMS: Record<number, RoomAnswersConfig> = {
  1: {
    roomId: 1,
    // Puzzle 1: 6 people handshakes = 6*5/2 = 15
    letter1Answer: '15',
    letter1RevealClue: 'Look beneath the loose red brick.',
    // Puzzle 2: A = 2B, A+B=54 => 3B=54 => B=18
    letter2Answer: '18',
    letter2RevealClue: 'The old screen still hums. Look at what it hides.',
    // Venue Physical Key
    physicalKey: 'DOOR-KEY-91',
    // Tech Q1: Consecutive prime squares (3², 5², 7², 11², 13², 17², 19², 23²) => 529
    techAnswer: '529',
    hints: {
      letter1: 'Use the combination formula: n*(n-1)/2 handshakes for n people. With 6 people: 6*5/2.',
      letter2: 'Set up an equation: Let B be x, then A is 2x. 2x + x = 54. Solve for x.',
      physicalKey: 'Locate Lab Bench 1 in the venue room to inspect the keycard tag.',
      tech: 'Each term is the square of a prime number: 3², 5², 7², 11², 13², 17², 19². Identify the next prime after 19 and compute its square.',
    },
  },
  2: {
    roomId: 2,
    // Puzzle 1: 40 + x = 2*(10 + x) => 40 + x = 20 + 2x => x = 20
    letter1Answer: '20',
    letter1RevealClue: 'Signals rest where rubber meets steel.',
    // Puzzle 2: The letter M
    letter2Answer: 'M',
    letter2RevealClue: 'The clock keeps count, but not the hours.',
    // Venue Physical Key
    physicalKey: 'DECODER-CHIP-42',
    // Tech Q2: C operator precedence: "4 -1 1 1"
    techAnswer: '4 -1 1 1',
    hints: {
      letter1: 'In x years, father will be 40+x and son 10+x. Set 40+x = 2*(10+x) and solve for x.',
      letter2: 'Look closely at the spelling of the words: "Minute" has one, "MoMent" has two, "thousand years" has none.',
      physicalKey: 'Locate Scope Station 2 near the oscilloscope rack in the venue.',
      tech: 'In C, ++a happens first (a becomes 3). (3 > 2) is true, so logical OR short-circuits, skipping the right side. Next, (a++ && --b) evaluates 3 (truthy) then increments a to 4, while --b changes b from 0 to -1 (truthy). Both truthy yields 1.',
    },
  },
  3: {
    roomId: 3,
    // Puzzle 1: Two fathers & two sons = Grandfather, father, son = 3 people
    letter1Answer: '3',
    letter1RevealClue: 'Cold air breathes where the blades stand still.',
    // Puzzle 2: Bridge crossing: 1, 2, 5, 10 min. Best strategy = 2 + 1 + 10 + 2 + 2 = 17 min
    letter2Answer: '17',
    letter2RevealClue: 'Climb above the pipes where the rope holds the dark.',
    // Venue Physical Key
    physicalKey: 'SYSTEM-RELAY-88',
    // Tech Q3: Alternating weighted cipher: NEWJERSEY
    // 14*1 + 5*2 + 23*1 + 10*2 + 5*1 + 18*2 + 19*1 + 5*2 + 25*1 = 162
    techAnswer: '162',
    hints: {
      letter1: 'Consider three generations of a family: a grandfather, his son, and his grandson.',
      letter2: 'Send the two fastest first (1 & 2 = 2 min), send 1 back (1 min), send the two slowest together (5 & 10 = 10 min), send 2 back (2 min), send 1 & 2 together (2 min). Sum the total time.',
      physicalKey: 'Locate 3D Printer Enclosure on the acrylic visor at Workbench 03 in the venue.',
      tech: 'Letter positions: N=14, E=5, W=23, J=10, E=5, R=18, S=19, E=5, Y=25. Multiply by alternating weights (1, 2, 1, 2, 1, 2, 1, 2, 1) and calculate the total sum.',
    },
  },
  4: {
    roomId: 4,
    // Puzzle 1: 3 prisoners hats: Front Black
    letter1Answer: 'FRONT BLACK',
    letter1RevealClue: 'Power never dies, it waits in the rack.',
    // Puzzle 2: Box stacking: Top box is F
    letter2Answer: 'F',
    letter2RevealClue: 'The final lock listens to the flag.',
    // Venue Physical Key
    physicalKey: 'VAULT-FLAG-777',
    // Tech Q4: Stack S = 15+22+10 = 47. S - 50 = -3.
    // -3 in 16-bit 2's complement = 1111 1111 1111 1101
    techAnswer: '1111 1111 1111 1101',
    hints: {
      letter1: 'If the front two were white, the back prisoner would immediately know he has black. Since back was silent, middle & front cannot both be white. If front was white, middle would know his must be black. Since middle was silent, front deduces his own color!',
      letter2: 'Place C at position 1 (bottom). Try the spacing constraints step-by-step: H right below B, two between A and H, three between D and B. F ends up on top.',
      physicalKey: 'Obtain the Master Key from the Chief Proctor at the Vault Control Desk in the venue.',
      tech: 'Track the stack: push(15), push(8), pop() removes 8, push(22), push(5), pop() removes 5, push(10). Remaining: [15, 22, 10], sum = 47. S - 50 = -3. Express -3 in 16-bit two\'s complement binary: invert bits of +3 and add 1.',
    },
  },
};

// Salted SHA-256 Hashes for Client-Side Offline Fallback
// NOTE: Not tamper-proof against memory/source inspection, provided as standalone fallback.
const SALT = 'TECH_QUEST_2026_SECRET_SALT_';

// Pure JavaScript synchronous SHA-256 implementation (zero external dependencies, runs in browser and node)
function sha256Sync(ascii: string): string {
  function rightRotate(value: number, amount: number): number {
    return (value >>> amount) | (value << (32 - amount));
  }
  const maxWord = Math.pow(2, 32);
  let result = '';
  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;
  const hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 0;
  const isComposite: Record<number, boolean> = {};

  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (let i = candidate * candidate; i < 312; i += candidate) {
        isComposite[i] = true;
      }
      if (primeCounter < 8) {
        hash[primeCounter] = (Math.pow(candidate, 0.5) * maxWord) | 0;
      }
      k[primeCounter] = (Math.pow(candidate, 1 / 3) * maxWord) | 0;
      primeCounter++;
    }
  }

  ascii += '\x80';
  while ((ascii.length % 64) - 56) ascii += '\x00';
  for (let i = 0; i < ascii.length; i++) {
    const j = ascii.charCodeAt(i);
    words[i >> 2] |= j << (((3 - i) % 4) * 8);
  }
  words[words.length] = (asciiBitLength / maxWord) | 0;
  words[words.length] = asciiBitLength | 0;

  for (let j = 0; j < words.length;) {
    const w = words.slice(j, (j += 16));
    const oldHash = [...hash];
    for (let i = 0; i < 64; i++) {
      const w15 = w[i - 15], w2 = w[i - 2];
      const a = hash[0], e = hash[4];
      const temp1 =
        hash[7] +
        (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
        ((e & hash[5]) ^ (~e & hash[6])) +
        k[i] +
        (w[i] =
          i < 16
            ? w[i]
            : (w[i - 16] +
                (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                w[i - 7] +
                (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
              0);
      const temp2 =
        (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
        ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
      hash[7] = hash[6];
      hash[6] = hash[5];
      hash[5] = hash[4];
      hash[4] = (hash[3] + temp1) | 0;
      hash[3] = hash[2];
      hash[2] = hash[1];
      hash[1] = hash[0];
      hash[0] = (temp1 + temp2) | 0;
    }
    for (let i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (let i = 0; i < 8; i++) {
    for (let j = 3; j >= 0; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

export function hashAnswer(raw: string): string {
  const normalized = normalizeInput(raw);
  return sha256Sync(SALT + normalized);
}

export const CLIENT_HASHES: Record<number, Record<RoomStep, string>> = {
  1: {
    LETTER_1: hashAnswer('15'),
    LETTER_2: hashAnswer('18'),
    PHYSICAL_KEY: hashAnswer('DOOR-KEY-91'),
    TECH: hashAnswer('529'),
  },
  2: {
    LETTER_1: hashAnswer('20'),
    LETTER_2: hashAnswer('M'),
    PHYSICAL_KEY: hashAnswer('DECODER-CHIP-42'),
    TECH: hashAnswer('4 -1 1 1'),
  },
  3: {
    LETTER_1: hashAnswer('3'),
    LETTER_2: hashAnswer('17'),
    PHYSICAL_KEY: hashAnswer('SYSTEM-RELAY-88'),
    TECH: hashAnswer('162'),
  },
  4: {
    LETTER_1: hashAnswer('FRONT BLACK'),
    LETTER_2: hashAnswer('F'),
    PHYSICAL_KEY: hashAnswer('VAULT-FLAG-777'),
    TECH: hashAnswer('1111111111111101'),
  },
};

// ============================================================================
// NORMALIZATION RULES (SECTION 6)
// ============================================================================
// - Trim, case-insensitive, collapse repeated whitespace.
// - Binary answers: strip all spaces before comparing.
// - Numeric answers: accept "15" and "15.0".
// - Physical keys: case-insensitive, hyphens optional.
// - Puzzle 2 in Room 4: accept "FRONT BLACK" or "BLACK FRONT".
export function normalizeInput(val: string): string {
  if (!val) return '';
  let str = val.trim().toLowerCase();

  // Remove duplicate whitespace
  str = str.replace(/\s+/g, ' ');

  // If numeric with .0, strip the trailing decimal
  if (/^-?\d+\.0$/.test(str)) {
    str = str.replace(/\.0$/, '');
  }

  return str;
}

export function isAnswerMatch(roomId: number, step: RoomStep, input: string): boolean {
  const cfg = AUTHORITATIVE_ROOMS[roomId];
  if (!cfg) return false;

  const rawInput = (input || '').trim();
  const normInput = normalizeInput(rawInput);

  if (step === 'LETTER_1') {
    if (roomId === 4) {
      // Room 4 Puzzle 1: Accept "FRONT BLACK" or "BLACK FRONT"
      return normInput === 'front black' || normInput === 'black front';
    }
    return normInput === normalizeInput(cfg.letter1Answer);
  }

  if (step === 'LETTER_2') {
    return normInput === normalizeInput(cfg.letter2Answer);
  }

  if (step === 'PHYSICAL_KEY') {
    // Physical keys: case-insensitive, hyphens optional
    const strippedInput = normInput.replace(/[-_\s]/g, '');
    const strippedExpected = normalizeInput(cfg.physicalKey).replace(/[-_\s]/g, '');
    return strippedInput === strippedExpected;
  }

  if (step === 'TECH') {
    if (roomId === 4) {
      // Binary answers: strip all spaces before comparing
      const binaryInput = normInput.replace(/\s+/g, '');
      const binaryExpected = normalizeInput(cfg.techAnswer).replace(/\s+/g, '');
      return binaryInput === binaryExpected;
    }
    if (roomId === 3) {
      // Accept 162 (exact sum 14+10+23+20+5+36+19+10+25) or 186
      return normInput === '162' || normInput === '186';
    }
    return normInput === normalizeInput(cfg.techAnswer);
  }

  return false;
}

// ============================================================================
// SCORING & PENALTIES (SECTION 7)
// ============================================================================
// - Start at 1000 points.
// - Every 3 incorrect submissions (cumulative across whole run): -15 points.
//   Show warning after 2nd wrong attempt of each set of 3.
// - Each hint unlocked: -10 points. One hint per puzzle/tech question.
export const BASE_SCORE = 1000;
export const ERROR_PENALTY_RATE = 15; // per 3 errors
export const HINT_PENALTY_RATE = 10; // per unlocked hint

export function computeNetScore(
  baseScore: number = BASE_SCORE,
  totalErrors: number = 0,
  hintsUnlockedCount: number = 0
): number {
  const errorPenalty = Math.floor(totalErrors / 3) * ERROR_PENALTY_RATE;
  const hintPenalty = hintsUnlockedCount * HINT_PENALTY_RATE;
  return Math.max(0, baseScore - errorPenalty - hintPenalty);
}

// ============================================================================
// CORE AUTHORITATIVE VERIFY FUNCTION
// ============================================================================
export function verify(
  roomId: number,
  step: RoomStep,
  input: string,
  currentCumulativeErrors: number = 0,
  currentHintsCount: number = 0
): VerifyResult {
  const cfg = AUTHORITATIVE_ROOMS[roomId];
  if (!cfg) {
    return {
      success: false,
      message: 'UNKNOWN CHAMBER: Room configuration not found.',
      cumulativeErrors: currentCumulativeErrors,
    };
  }

  const isCorrect = isAnswerMatch(roomId, step, input);

  if (isCorrect) {
    let clue: string | undefined;
    let message = 'VERIFICATION ACCEPTED.';

    if (step === 'LETTER_1') {
      clue = cfg.letter1RevealClue;
      message = `PUZZLE 1 SOLVED: Engraved code registered. Clue: "${clue}"`;
    } else if (step === 'LETTER_2') {
      clue = cfg.letter2RevealClue;
      message = `PUZZLE 2 SOLVED: Fragment captured. Clue: "${clue}"`;
    } else if (step === 'PHYSICAL_KEY') {
      message = 'PHYSICAL KEYCARD VERIFIED: Key box terminal interlock disengaged.';
    } else if (step === 'TECH') {
      message = `CHALLENGE OVERRULED: Subsystem cleared! Door to Room ${roomId < 4 ? roomId + 1 : 'EXIT'} unbolting.`;
    }

    const netScore = computeNetScore(BASE_SCORE, currentCumulativeErrors, currentHintsCount);

    return {
      success: true,
      message,
      revealedClue: clue,
      newNetScore: netScore,
      cumulativeErrors: currentCumulativeErrors,
      errorWarning: false,
    };
  } else {
    const updatedErrors = currentCumulativeErrors + 1;
    const isSecondInCycle = updatedErrors % 3 === 2;
    const penaltyApplied = updatedErrors % 3 === 0;

    let message = 'ACCESS DENIED: Verification input rejected.';
    if (penaltyApplied) {
      message += ` 3 INCORRECT ATTEMPTS: -15 PTS DEDUCTED (Total Errors: ${updatedErrors}).`;
    } else if (isSecondInCycle) {
      message += ` WARNING: 2 incorrect attempts. 1 more error will deduct 15 points!`;
    }

    const netScore = computeNetScore(BASE_SCORE, updatedErrors, currentHintsCount);

    return {
      success: false,
      message,
      newNetScore: netScore,
      cumulativeErrors: updatedErrors,
      errorWarning: isSecondInCycle,
    };
  }
}

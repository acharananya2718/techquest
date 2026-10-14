import { verify, isAnswerMatch, normalizeInput, computeNetScore } from '../src/game/verify.ts';

// ============================================================================
// UNIT TESTS: PROGRAMMATIC PUZZLE RECOMPUTATION & ANSWER VERIFICATION
// ============================================================================

console.log('------------------------------------------------------------');
console.log('RUNNING UNIT TESTS: RECOMPUTING ESCAPE ROOM ANSWERS IN CODE');
console.log('------------------------------------------------------------');

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, msg: string) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    process.exit(1);
  } else {
    passedTests++;
    console.log(`✅ PASSED: ${msg}`);
  }
}

// ----------------------------------------------------------------------------
// ROOM 1 RECOMPUTATIONS
// ----------------------------------------------------------------------------
// 1. Handshake formula: 6 people each shake hands with every other person once.
// Number of pairs = 6 choose 2 = 6 * 5 / 2 = 15.
const r1Handshakes = (6 * (6 - 1)) / 2;
assert(r1Handshakes === 15, `R1 Puzzle 1 Handshakes recomputed: ${r1Handshakes}`);
assert(isAnswerMatch(1, 'LETTER_1', String(r1Handshakes)), 'R1 Letter 1 matches 15');
assert(isAnswerMatch(1, 'LETTER_1', '15.0'), 'R1 Letter 1 accepts 15.0');

// 2. Age equation: A = 2*B, A + B = 54 => 3*B = 54 => B = 18.
let r1AgeB = 0;
for (let b = 1; b < 54; b++) {
  const a = 2 * b;
  if (a + b === 54) {
    r1AgeB = b;
    break;
  }
}
assert(r1AgeB === 18, `R1 Puzzle 2 Age B recomputed: ${r1AgeB}`);
assert(isAnswerMatch(1, 'LETTER_2', String(r1AgeB)), 'R1 Letter 2 matches 18');

// 3. Consecutive prime squares: 3², 5², 7², 11², 13², 17², 19², ?
// Primes: 3, 5, 7, 11, 13, 17, 19, 23 => 23² = 529.
function isPrime(n: number): boolean {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) {
    if (n % i === 0) return false;
  }
  return true;
}
let nextPrimeAfter19 = 20;
while (!isPrime(nextPrimeAfter19)) nextPrimeAfter19++;
const r1PrimeSquare = nextPrimeAfter19 * nextPrimeAfter19;
assert(r1PrimeSquare === 529, `R1 Tech prime square recomputed: ${r1PrimeSquare}`);
assert(isAnswerMatch(1, 'TECH', String(r1PrimeSquare)), 'R1 Tech matches 529');
assert(isAnswerMatch(1, 'PHYSICAL_KEY', 'door-key-91'), 'R1 Physical key matches DOOR-KEY-91');
assert(isAnswerMatch(1, 'PHYSICAL_KEY', 'DOOR KEY 91'), 'R1 Physical key accepts spaces');

// ----------------------------------------------------------------------------
// ROOM 2 RECOMPUTATIONS
// ----------------------------------------------------------------------------
// 1. Father 40, Son 10. In x years: 40 + x = 2*(10 + x) => x = 20.
let r2Years = 0;
for (let x = 1; x <= 100; x++) {
  if (40 + x === 2 * (10 + x)) {
    r2Years = x;
    break;
  }
}
assert(r2Years === 20, `R2 Puzzle 1 father/son years recomputed: ${r2Years}`);
assert(isAnswerMatch(2, 'LETTER_1', String(r2Years)), 'R2 Letter 1 matches 20');

// 2. Riddle: once in a minute, twice in a moment, never in a thousand years => 'M'.
const mInMinute = (('minute'.match(/m/gi) || []).length);
const mInMoment = (('moment'.match(/m/gi) || []).length);
const mInThousandYears = (('a thousand years'.match(/m/gi) || []).length);
assert(mInMinute === 1 && mInMoment === 2 && mInThousandYears === 0, 'R2 Puzzle 2 M letter counts verified');
assert(isAnswerMatch(2, 'LETTER_2', 'M'), 'R2 Letter 2 matches M');
assert(isAnswerMatch(2, 'LETTER_2', 'm'), 'R2 Letter 2 accepts lowercase m');

// 3. C operator precedence trace:
// int a = 2, b = 0;
// int c = (++a > 2) || (b++ && printf("Tech"));
// int d = (a++ && --b);
// Result: a=4, b=-1, c=1, d=1 => "4 -1 1 1".
let a = 2, b = 0;
// ++a evaluates to 3 (a becomes 3). (3 > 2) is true (1). Logical OR short-circuits. b remains 0. c = 1.
let c = (++a > 2) ? 1 : (b++, 1);
// (a++ && --b): a++ evaluates to 3 (truthy), then a becomes 4. --b decrements b from 0 to -1 (truthy). Both truthy => d = 1.
let d = (a++ !== 0 && --b !== 0) ? 1 : 0;
const r2CTrace = `${a} ${b} ${c} ${d}`;
assert(r2CTrace === '4 -1 1 1', `R2 Tech C code trace recomputed: "${r2CTrace}"`);
assert(isAnswerMatch(2, 'TECH', r2CTrace), 'R2 Tech matches "4 -1 1 1"');

// ----------------------------------------------------------------------------
// ROOM 3 RECOMPUTATIONS
// ----------------------------------------------------------------------------
// 1. Two fathers and two sons went fishing, caught 3 fish, each got 1:
// Grandfather (father to son), Father (father to grandson & son to grandfather), Grandson (son).
// Total individuals = 3.
assert(isAnswerMatch(3, 'LETTER_1', '3'), 'R3 Letter 1 matches 3');

// 2. Bridge crossing problem: Engineers A(1), B(2), C(5), D(10).
// Classic solution:
// - A & B cross -> 2 min
// - A returns -> 1 min
// - C & D cross -> 10 min
// - B returns -> 2 min
// - A & B cross -> 2 min
// Total = 2 + 1 + 10 + 2 + 2 = 17 min.
const r3BridgeTime = 2 + 1 + 10 + 2 + 2;
assert(r3BridgeTime === 17, `R3 Puzzle 2 bridge crossing recomputed: ${r3BridgeTime}`);
assert(isAnswerMatch(3, 'LETTER_2', String(r3BridgeTime)), 'R3 Letter 2 matches 17');

// 3. Weighted cipher: NEWJERSEY
// N=14, E=5, W=23, J=10, E=5, R=18, S=19, E=5, Y=25
// Alternating weights: 1, 2, 1, 2, 1, 2, 1, 2, 1
const newJerseyWeights = [1, 2, 1, 2, 1, 2, 1, 2, 1];
const newJerseyLetters = 'NEWJERSEY';
let r3CipherSum = 0;
for (let i = 0; i < newJerseyLetters.length; i++) {
  const code = newJerseyLetters.charCodeAt(i) - 64; // A=1
  const w = newJerseyWeights[i];
  r3CipherSum += code * w;
}
assert(r3CipherSum === 162, `R3 Tech NEWJERSEY cipher recomputed: ${r3CipherSum}`);
assert(isAnswerMatch(3, 'TECH', '162'), 'R3 Tech matches 162');
assert(isAnswerMatch(3, 'TECH', '186'), 'R3 Tech also accepts 186 alias');

// ----------------------------------------------------------------------------
// ROOM 4 RECOMPUTATIONS
// ----------------------------------------------------------------------------
// 1. Three prisoners with 3 black and 2 white hats.
// Back sees middle & front. If both white, back would know he has black. Back silent => not both white.
// Middle knows front cannot be white (if front were white, middle would know he must be black).
// Since middle is silent, front cannot be white.
// Therefore, front deduces his hat is BLACK!
assert(isAnswerMatch(4, 'LETTER_1', 'FRONT BLACK'), 'R4 Letter 1 matches "FRONT BLACK"');
assert(isAnswerMatch(4, 'LETTER_1', 'BLACK FRONT'), 'R4 Letter 1 accepts "BLACK FRONT"');

// 2. 8 boxes A to H stacked.
// Brute force permutation solver to verify unique solution:
const boxes = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
function permute(arr: string[]): string[][] {
  if (arr.length <= 1) return [arr];
  const res: string[][] = [];
  for (let i = 0; i < arr.length; i++) {
    const cur = arr[i];
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    for (const p of permute(rest)) {
      res.push([cur, ...p]);
    }
  }
  return res;
}

// Constraints:
// stack indexed 0 (bottom) to 7 (top) or 1 to 8.
// - C is at bottom (index 0)
// - Two boxes between A and F => |idx(A) - idx(F)| = 3
// - Two between C and G => |idx(C) - idx(G)| = 3 => since C=0, G=3
// - Three between D and B => |idx(D) - idx(B)| = 4
// - H right below B => idx(B) - idx(H) = 1
// - Two between A and H => |idx(A) - idx(H)| = 3
// - Two between E and B => |idx(E) - idx(B)| = 3
const validPermutations: string[][] = [];
// C is fixed at bottom: stack[0] = 'C'
const others = ['A', 'B', 'D', 'E', 'F', 'G', 'H'];
for (const p of permute(others)) {
  const stack = ['C', ...p]; // index 0 is C (bottom), index 7 is top
  const idx = (b: string) => stack.indexOf(b);

  if (Math.abs(idx('A') - idx('F')) !== 3) continue;
  if (Math.abs(idx('C') - idx('G')) !== 3) continue;
  if (Math.abs(idx('D') - idx('B')) !== 4) continue;
  if (idx('B') - idx('H') !== 1) continue;
  if (Math.abs(idx('A') - idx('H')) !== 3) continue;
  if (Math.abs(idx('E') - idx('B')) !== 3) continue;

  validPermutations.push(stack);
}

assert(validPermutations.length === 1, `Box stacking found exactly 1 valid solution: ${validPermutations.length}`);
const topBox = validPermutations[0][7];
assert(topBox === 'F', `Top box is F (Full order bottom to top: ${validPermutations[0].join(',')})`);
assert(isAnswerMatch(4, 'LETTER_2', 'F'), 'R4 Letter 2 matches F');
assert(isAnswerMatch(4, 'LETTER_2', 'f'), 'R4 Letter 2 accepts lowercase f');

// 3. Stack simulation and 16-bit 2's complement:
// push(15), push(8), pop(), push(22), push(5), pop(), push(10)
const stack: number[] = [];
stack.push(15);
stack.push(8);
stack.pop();
stack.push(22);
stack.push(5);
stack.pop();
stack.push(10);
const stackSum = stack.reduce((s, v) => s + v, 0);
assert(stackSum === 47, `Stack sum recomputed: ${stackSum}`);
const targetVal = stackSum - 50; // 47 - 50 = -3
assert(targetVal === -3, `Target value recomputed: ${targetVal}`);

// 16-bit Two's complement for -3:
const twoComplement16 = (65536 + targetVal).toString(2).padStart(16, '0');
const groupedNibbles = `${twoComplement16.slice(0, 4)} ${twoComplement16.slice(4, 8)} ${twoComplement16.slice(8, 12)} ${twoComplement16.slice(12, 16)}`;
assert(groupedNibbles === '1111 1111 1111 1101', `16-bit 2's complement recomputed: ${groupedNibbles}`);
assert(isAnswerMatch(4, 'TECH', groupedNibbles), 'R4 Tech matches with nibble spaces');
assert(isAnswerMatch(4, 'TECH', '1111111111111101'), 'R4 Tech matches without spaces');

// ----------------------------------------------------------------------------
// SCORING & PENALTY RECOMPUTATION
// ----------------------------------------------------------------------------
// Base score = 1000.
// Every 3 errors = -15 pts.
// 2 errors = 0 penalty. 3 errors = -15. 4 errors = -15. 5 errors = -15. 6 errors = -30.
assert(computeNetScore(1000, 0, 0) === 1000, 'Score with 0 errors = 1000');
assert(computeNetScore(1000, 2, 0) === 1000, 'Score with 2 errors = 1000 (warning only)');
assert(computeNetScore(1000, 3, 0) === 985, 'Score with 3 errors = 985 (-15 pts)');
assert(computeNetScore(1000, 5, 0) === 985, 'Score with 5 errors = 985');
assert(computeNetScore(1000, 6, 0) === 970, 'Score with 6 errors = 970 (-30 pts)');
// Each hint = -10 pts.
assert(computeNetScore(1000, 3, 2) === 965, 'Score with 3 errors and 2 hints = 965 (-15 - 20 pts)');

console.log('------------------------------------------------------------');
console.log(`ALL ${passedTests}/${totalTests} TESTS PASSED PERFECTLY! 🚀`);
console.log('------------------------------------------------------------');

// ============================================================================
// TECH QUEST: ROUND 2 — COMPLETE DATA CONFIGURATION FOR ALL 4 ROOMS
// ============================================================================

export interface RoomInteractableDef {
  id: string;
  name: string;
  prompt: string; // e.g. "[E] Search Drawer" or "[LMB] Inspect"
  category:
    | 'LETTER_1'
    | 'LETTER_2'
    | 'KEY_BOX'
    | 'TECH_TERMINAL'
    | 'CIRCUIT_PANEL'
    | 'MATCHSTICK_PANEL'
    | 'PHYSICAL_PROP'
    | 'TOOL_PICKUP'
    | 'DECOY'
    | 'EXIT_DOOR'
    | 'FLAG';
  requiredTool?: string; // e.g. "RUSTY_KNIFE" or "WOODEN_LADDER"
  position: [number, number, number];
  rotation?: [number, number, number];
  closeUpCameraPosition?: [number, number, number];
  closeUpLookAt?: [number, number, number];
  clueRevealedOnSuccess?: string;
}

export interface RoomConfig {
  roomId: number;
  roomName: string;
  subtitle: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'VERY_HARD';
  accentColor: string; // hex color for lighting & UI accents
  accentName: 'CYAN' | 'MAGENTA' | 'AMBER' | 'BLUE';
  themeDescription: string;
  roomBounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  playerSpawn: [number, number, number];

  // Hidden Letter 1
  letter1: {
    id: string;
    engravedCode: string; // "L1", "S2", "P3", "V4"
    title: string;
    storyLocation: string;
    paperText: string;
    puzzleQuestion: string;
    revealClue: string;
    hint: string;
  };

  // Hidden Letter 2
  letter2: {
    id: string;
    title: string;
    storyLocation: string;
    paperText: string;
    puzzleQuestion: string;
    revealClue: string;
    hint: string;
  };

  // Physical Keycard (Venue Mode)
  venue: {
    locationName: string;
    code: string;
    description: string;
  };

  // Key Box & Technical Question
  keyBox: {
    name: string;
    storyLocation: string;
    unlockedKeyName: string;
    techTitle: string;
    techTopic: string;
    techQuestion: string;
    techCodeSnippet?: string;
    techExplanation: string;
    techHint: string;
  };

  // Environmental Props & Pickups
  interactables: RoomInteractableDef[];
}

export const ROOMS_CONFIG: Record<number, RoomConfig> = {
  // --------------------------------------------------------------------------
  // ROOM 1: THE DISCOVERY (Detention Cell / Front Gate) - Easy - Cyan
  // --------------------------------------------------------------------------
  1: {
    roomId: 1,
    roomName: 'THE DISCOVERY',
    subtitle: 'Detention Cell / Front Gate',
    difficulty: 'EASY',
    accentColor: '#06b6d4',
    accentName: 'CYAN',
    themeDescription:
      'Damp concrete detention cell with high barred windows, iron bunk bed, rusted metal breaker box, cracked CRT monitor, and worn hemp rug.',
    roomBounds: { minX: -3.8, maxX: 3.8, minZ: -4.8, maxZ: 4.8 },
    playerSpawn: [0, 1.6, 2.5],

    letter1: {
      id: 'R1-L1',
      engravedCode: 'L1',
      title: 'Torn Inmate Note #1',
      storyLocation: 'Taped beneath the bunk bed mattress',
      paperText:
        'A yellowed parchment stamped with a faded prisoner identification mark. In the margin, the two letters "L1" are etched into the fiber.',
      puzzleQuestion:
        'If 6 people each shake hands with every other person exactly once, how many handshakes occur?',
      revealClue: 'Look beneath the loose red brick.',
      hint: 'Use the combinations formula: n*(n-1)/2 for n=6 people. 6*5/2.',
    },

    letter2: {
      id: 'R1-L2',
      title: 'Maintenance Log #2',
      storyLocation: 'Tucked beneath the loose brick on the cell floor',
      paperText:
        'A scorched electrical maintenance ticket discovered beneath the loose brick on the cell floor.',
      puzzleQuestion:
        'A is twice as old as B. Their total age is 54 years. How old is B?',
      revealClue: 'The old screen still hums. Look at what it hides.',
      hint: 'Let B be x, then A is 2x. Therefore 2x + x = 54. Solve 3x = 54.',
    },

    venue: {
      locationName: 'Lab Bench 1',
      code: 'DOOR-KEY-91',
      description: 'Physical keycard hidden at Lab Bench 1 near the intake junction.',
    },

    keyBox: {
      name: 'Sub-Panel Mechanical Key Box',
      storyLocation: 'Concealed behind the tilted CRT television',
      unlockedKeyName: 'Heavy Cell Gate Key',
      techTitle: 'Nested Square-Prime Series',
      techTopic: 'Consecutive Prime Squares',
      techQuestion:
        'Find the missing integer that replaces the question mark (?) in the series:\n9, 25, 49, 121, 169, 289, 361, ?',
      techExplanation:
        'Each number represents the square of consecutive prime numbers: 3²=9, 5²=25, 7²=49, 11²=121, 13²=169, 17²=289, 19²=361. The prime following 19 is 23. Therefore: 23² = 529.',
      techHint:
        'Notice that 9=3², 25=5², 49=7², 121=11², 169=13²... The bases 3, 5, 7, 11, 13, 17, 19 are consecutive prime numbers. Identify the next prime and square it.',
    },

    interactables: [
      {
        id: 'r1_bunk_mattress',
        name: 'Stained Bunk Mattress',
        prompt: '[E] Lift Mattress',
        category: 'PHYSICAL_PROP',
        position: [-2.5, 0.9, -2.5],
        closeUpCameraPosition: [-2.2, 1.4, -2.1],
        closeUpLookAt: [-2.5, 0.9, -2.5],
      },
      {
        id: 'r1_letter1',
        name: 'Hidden Note [L1]',
        prompt: '[LMB] Inspect Note',
        category: 'LETTER_1',
        position: [-2.5, 0.65, -2.5],
        closeUpCameraPosition: [-2.5, 1.1, -2.5],
        closeUpLookAt: [-2.5, 0.65, -2.5],
      },
      {
        id: 'r1_breaker_panel',
        name: 'Rusted Wall Breaker Box',
        prompt: '[E] Open Breaker Door',
        category: 'PHYSICAL_PROP',
        position: [3.4, 1.8, -1.0],
        closeUpCameraPosition: [2.5, 1.8, -1.0],
        closeUpLookAt: [3.4, 1.8, -1.0],
      },
      {
        id: 'r1_letter2',
        name: 'Maintenance Ticket #2',
        prompt: '[LMB] Inspect Ticket',
        category: 'LETTER_2',
        position: [1.5, 0.02, -1.72],
        closeUpCameraPosition: [1.5, 0.7, -1.3],
        closeUpLookAt: [1.5, 0.02, -1.72],
      },
      {
        id: 'r1_crt_tv',
        name: 'Flickering CRT Television',
        prompt: '[E] Tilt TV Forward',
        category: 'PHYSICAL_PROP',
        position: [2.8, 1.2, 3.2],
        closeUpCameraPosition: [2.2, 1.4, 2.7],
        closeUpLookAt: [2.8, 1.2, 3.2],
      },
      {
        id: 'r1_keybox',
        name: 'Cell Key Box Terminal',
        prompt: '[E] Access Key Box',
        category: 'KEY_BOX',
        position: [3.2, 1.1, 3.6],
        closeUpCameraPosition: [2.6, 1.3, 3.3],
        closeUpLookAt: [3.2, 1.1, 3.6],
      },
      {
        id: 'r1_rug',
        name: 'Torn Floor Rug',
        prompt: '[E] Pull Back Rug',
        category: 'PHYSICAL_PROP',
        position: [0.0, 0.05, 0.5],
      },
      {
        id: 'r1_exit_door',
        name: 'Heavy Reinforced Cell Gate',
        prompt: '[E] Unlock Gate',
        category: 'EXIT_DOOR',
        requiredTool: 'HEAVY_CELL_GATE_KEY',
        position: [0.0, 1.6, -4.6],
      },
    ],
  },

  // --------------------------------------------------------------------------
  // ROOM 2: THE DECODER (Guard Comms Station) - Medium - Magenta
  // --------------------------------------------------------------------------
  2: {
    roomId: 2,
    roomName: 'THE DECODER',
    subtitle: 'Guard Comms Station',
    difficulty: 'MEDIUM',
    accentColor: '#d946ef',
    accentName: 'MAGENTA',
    themeDescription:
      'Security checkpoint comms hub with radio receiver racks, dual-channel oscilloscope bench, wall clock, false-bottom officer desk, and wall matchstick terminal.',
    roomBounds: { minX: -4.2, maxX: 4.2, minZ: -4.8, maxZ: 4.8 },
    playerSpawn: [0, 1.6, 2.5],

    letter1: {
      id: 'R2-L1',
      engravedCode: 'S2',
      title: 'Comms Dispatch Memo [S2]',
      storyLocation: 'Concealed in the false bottom of the officer desk drawer',
      paperText:
        'An encrypted frequency memo slipped inside a wooden false bottom. The code "S2" is punched into the bottom corner.',
      puzzleQuestion:
        'A father is 40 years old and his son is 10. After how many years will the father be twice as old as his son?',
      revealClue: 'Signals rest where rubber meets steel.',
      hint: 'In x years, father will be 40+x and son 10+x. Set 40+x = 2*(10+x) and solve for x.',
    },

    letter2: {
      id: 'R2-L2',
      title: 'Scope Calibration Slip',
      storyLocation: 'Under the oscilloscope rubber insulation mat',
      paperText:
        'A carbon-copy instrument calibration sheet damp with hydraulic oil.',
      puzzleQuestion:
        'What occurs once in every minute, twice in every moment, but never in a thousand years?',
      revealClue: 'The clock keeps count, but not the hours.',
      hint: 'This is a riddle concerning letters in words: examine m-i-n-u-t-e and m-o-m-e-n-t.',
    },

    venue: {
      locationName: 'Scope Station 2',
      code: 'DECODER-CHIP-42',
      description: 'Physical card attached to Scope Station 2 near the oscilloscope rack.',
    },

    keyBox: {
      name: 'Comms Sector Lockbox',
      storyLocation: 'Hidden behind the tilted wall clock',
      unlockedKeyName: 'Utility Tunnel Passkey',
      techTitle: 'C Operator Precedence & Short-Circuit Evaluation',
      techTopic: 'Pre/Post Increment & Logical Short-Circuit',
      techQuestion:
        'What exact string is printed by this program?\n\n#include <stdio.h>\nint main() {\n    int a = 2, b = 0;\n    int c = (++a > 2) || (b++ && printf("Tech"));\n    int d = (a++ && --b);\n    printf("%d %d %d %d", a, b, c, d);\n    return 0;\n}',
      techCodeSnippet:
        '#include <stdio.h>\nint main() {\n    int a = 2, b = 0;\n    int c = (++a > 2) || (b++ && printf("Tech"));\n    int d = (a++ && --b);\n    printf("%d %d %d %d", a, b, c, d);\n    return 0;\n}',
      techExplanation:
        '1. ++a increments a to 3. (3 > 2) evaluates to true (1). Because the left operand of || is true, the right side is short-circuited (skipped), so b remains 0 and c becomes 1.\n2. In (a++ && --b): a++ evaluates to 3 (non-zero/truthy), then increments a to 4. --b decrements b from 0 to -1 (non-zero/truthy). Truthy && truthy yields 1, so d = 1.\n3. Printed output: "4 -1 1 1".',
      techHint:
        'Remember that in C, logical OR (||) short-circuits if the left operand is true. Logical AND (&&) evaluates both if the left operand is true. In C, any non-zero value is treated as true.',
    },

    interactables: [
      {
        id: 'r2_matchstick_panel',
        name: 'Wall Cypher Panel [MATCHSTICK]',
        prompt: '[E] Solve Matchstick Panel',
        category: 'MATCHSTICK_PANEL',
        position: [-3.8, 1.6, -1.2],
        closeUpCameraPosition: [-2.6, 1.6, -1.2],
        closeUpLookAt: [-3.8, 1.6, -1.2],
      },
      {
        id: 'r2_desk_drawer',
        name: 'Officer Desk Drawer',
        prompt: '[E] Slide Open Drawer',
        category: 'PHYSICAL_PROP',
        position: [2.5, 0.9, -1.5],
        closeUpCameraPosition: [2.1, 1.3, -1.2],
        closeUpLookAt: [2.5, 0.9, -1.5],
      },
      {
        id: 'r2_letter1',
        name: 'Comms Memo [S2]',
        prompt: '[LMB] Read Memo',
        category: 'LETTER_1',
        position: [2.5, 0.82, -1.5],
        closeUpCameraPosition: [2.4, 1.2, -1.5],
        closeUpLookAt: [2.5, 0.82, -1.5],
      },
      {
        id: 'r2_scope_mat',
        name: 'Oscilloscope Rubber Mat',
        prompt: '[E] Lift Rubber Mat',
        category: 'PHYSICAL_PROP',
        position: [-2.2, 1.12, 1.8],
        closeUpCameraPosition: [-1.8, 1.5, 1.6],
        closeUpLookAt: [-2.2, 1.12, 1.8],
      },
      {
        id: 'r2_letter2',
        name: 'Calibration Slip',
        prompt: '[LMB] Read Calibration Slip',
        category: 'LETTER_2',
        position: [-2.2, 1.14, 1.8],
        closeUpCameraPosition: [-2.0, 1.45, 1.8],
        closeUpLookAt: [-2.2, 1.14, 1.8],
      },
      {
        id: 'r2_wall_clock',
        name: 'Guard Station Wall Clock',
        prompt: '[E] Inspect Behind Clock',
        category: 'PHYSICAL_PROP',
        position: [0.0, 2.4, -4.5],
        closeUpCameraPosition: [0.0, 2.2, -3.2],
        closeUpLookAt: [0.0, 2.4, -4.5],
      },
      {
        id: 'r2_keybox',
        name: 'Comms Station Key Box',
        prompt: '[E] Access Key Box',
        category: 'KEY_BOX',
        position: [0.0, 1.9, -4.4],
        closeUpCameraPosition: [0.0, 1.9, -3.0],
        closeUpLookAt: [0.0, 1.9, -4.4],
      },
      {
        id: 'r2_exit_door',
        name: 'Blast Barrier to Utility Tunnels',
        prompt: '[E] Unlock Barrier',
        category: 'EXIT_DOOR',
        requiredTool: 'UTILITY_TUNNEL_PASSKEY',
        position: [3.9, 1.6, 2.2],
      },
    ],
  },

  // --------------------------------------------------------------------------
  // ROOM 3: THE SYSTEM (Utility Tunnels / PLC Relay Station) - Hard - Amber
  // --------------------------------------------------------------------------
  3: {
    roomId: 3,
    roomName: 'THE SYSTEM',
    subtitle: 'Utility Tunnels / PLC Relay Station',
    difficulty: 'HARD',
    accentColor: '#f59e0b',
    accentName: 'AMBER',
    themeDescription:
      'Cavernous utility maintenance tunnel with steam pipes, relay racks, loose floor cable duct, ventilation fan, lockers, ceiling access hatch tied with hemp rope, and a wooden ladder.',
    roomBounds: { minX: -4.5, maxX: 4.5, minZ: -5.5, maxZ: 5.5 },
    playerSpawn: [0, 1.6, 3.2],

    letter1: {
      id: 'R3-L1',
      engravedCode: 'P3',
      title: 'PLC Schematics Scrap [P3]',
      storyLocation: 'Under the loose floor cable-duct cover plate',
      paperText:
        'A scorched ladder logic diagram retrieved from the cable tray. Scratched across the copper busbar is the code "P3".',
      puzzleQuestion:
        'Two fathers and two sons went fishing. They caught 3 fish, and each person got exactly one whole fish. How many people were there in total?',
      revealClue: 'Cold air breathes where the blades stand still.',
      hint: 'Think of 3 generations of family: grandfather, father, and son.',
    },

    letter2: {
      id: 'R3-L2',
      title: 'Fan Intake Notice',
      storyLocation: 'Behind the ventilation fan guard grating',
      paperText:
        'An industrial health & safety warning card wedged behind the fan cowl.',
      puzzleQuestion:
        'Four engineers (A=1, B=2, C=5, D=10 minutes) must cross a bridge at night. One flashlight, max 2 people at a time, pair moves at the slower speed. What is the absolute minimum total time?',
      revealClue: 'Climb above the pipes where the rope holds the dark.',
      hint: 'Send the fastest pair first (A&B=2), return with A (1), send slowest pair (C&D=10), return with B (2), send A&B (2). Sum the total minutes.',
    },

    venue: {
      locationName: '3D Printer Enclosure',
      code: 'SYSTEM-RELAY-88',
      description: 'Physical tag on acrylic safety visor at Workbench 03.',
    },

    keyBox: {
      name: 'Ceiling Hatch Interlock Box',
      storyLocation: 'Mounted inside the ceiling hatch (requires ladder + knife)',
      unlockedKeyName: 'Master SCADA Vault Keycard',
      techTitle: 'Weighted Alternating Character Cipher',
      techTopic: 'Positional Character Encoding',
      techQuestion:
        'In a weighted cipher, letters map to alphabet positions (A=1 ... Z=26). Multiply each character by alternating weights (1st × 1, 2nd × 2, 3rd × 1, 4th × 2, ...) and compute the sum. Calculate the exact coded value of NEWJERSEY.',
      techExplanation:
        'Letter indices: N=14, E=5, W=23, J=10, E=5, R=18, S=19, E=5, Y=25.\nAlternating weights: (1, 2, 1, 2, 1, 2, 1, 2, 1).\nCalculations:\n14×1 = 14\n5×2 = 10\n23×1 = 23\n10×2 = 20\n5×1 = 5\n18×2 = 36\n19×1 = 19\n5×2 = 10\n25×1 = 25\nSum: 14 + 10 + 23 + 20 + 5 + 36 + 19 + 10 + 25 = 162.',
      techHint:
        'N=14, E=5, W=23, J=10, E=5, R=18, S=19, E=5, Y=25. Multiply by 1, 2, 1, 2, 1, 2, 1, 2, 1 respectively and sum all products.',
    },

    interactables: [
      {
        id: 'r3_circuit_panel',
        name: 'High-Voltage Breaker Panel',
        prompt: '[E] Route Circuit Power',
        category: 'CIRCUIT_PANEL',
        position: [-3.8, 1.8, 0.5],
        closeUpCameraPosition: [-2.6, 1.8, 0.5],
        closeUpLookAt: [-3.8, 1.8, 0.5],
      },
      {
        id: 'r3_cable_cover',
        name: 'Loose Floor Cable Duct Cover',
        prompt: '[E] Slide Cable Cover',
        category: 'PHYSICAL_PROP',
        position: [0.0, 0.05, -1.5],
        closeUpCameraPosition: [0.0, 0.8, -1.0],
        closeUpLookAt: [0.0, 0.05, -1.5],
      },
      {
        id: 'r3_letter1',
        name: 'PLC Schematic [P3]',
        prompt: '[LMB] Inspect Schematic',
        category: 'LETTER_1',
        position: [0.0, 0.08, -1.5],
        closeUpCameraPosition: [0.0, 0.7, -1.5],
        closeUpLookAt: [0.0, 0.08, -1.5],
      },
      {
        id: 'r3_fan_guard',
        name: 'Ventilation Fan Cowling',
        prompt: '[E] Open Fan Grating',
        category: 'PHYSICAL_PROP',
        position: [3.8, 1.6, -3.2],
        closeUpCameraPosition: [2.8, 1.6, -3.2],
        closeUpLookAt: [3.8, 1.6, -3.2],
      },
      {
        id: 'r3_letter2',
        name: 'Fan Intake Notice',
        prompt: '[LMB] Read Intake Notice',
        category: 'LETTER_2',
        position: [3.75, 1.5, -3.2],
        closeUpCameraPosition: [2.9, 1.5, -3.2],
        closeUpLookAt: [3.75, 1.5, -3.2],
      },
      {
        id: 'r3_locker',
        name: 'Maintenance Tool Locker',
        prompt: '[E] Search Locker',
        category: 'PHYSICAL_PROP',
        position: [-3.8, 1.2, -3.5],
        closeUpCameraPosition: [-2.6, 1.3, -3.5],
        closeUpLookAt: [-3.8, 1.2, -3.5],
      },
      {
        id: 'r3_knife_item',
        name: 'Rusty Utility Knife',
        prompt: '[E] Pick Up Knife',
        category: 'TOOL_PICKUP',
        position: [-3.6, 0.9, -3.5],
      },
      {
        id: 'r3_ladder_item',
        name: 'Heavy Wooden Ladder',
        prompt: '[E] Pick Up Ladder',
        category: 'TOOL_PICKUP',
        position: [3.2, 1.0, 2.5],
      },
      {
        id: 'r3_ceiling_hatch',
        name: 'Ceiling Hatch (Tied with Rope)',
        prompt: '[E] Access Ceiling Hatch',
        category: 'PHYSICAL_PROP',
        requiredTool: 'WOODEN_LADDER',
        position: [0.0, 3.8, 0.0],
        closeUpCameraPosition: [0.0, 2.8, 0.8],
        closeUpLookAt: [0.0, 3.8, 0.0],
      },
      {
        id: 'r3_keybox',
        name: 'Ceiling Hatch Key Box',
        prompt: '[E] Access Key Box',
        category: 'KEY_BOX',
        position: [0.0, 3.6, -0.2],
        closeUpCameraPosition: [0.0, 2.9, 0.5],
        closeUpLookAt: [0.0, 3.6, -0.2],
      },
      {
        id: 'r3_exit_door',
        name: 'Pressure Bulkhead to Master SCADA Vault',
        prompt: '[E] Unlock Bulkhead',
        category: 'EXIT_DOOR',
        requiredTool: 'MASTER_SCADA_VAULT_KEYCARD',
        position: [0.0, 1.6, -5.2],
      },
    ],
  },

  // --------------------------------------------------------------------------
  // ROOM 4: THE FINAL VAULT (Maximum Security Vault / SCADA Core) - Very Hard - Blue
  // --------------------------------------------------------------------------
  4: {
    roomId: 4,
    roomName: 'THE FINAL VAULT',
    subtitle: 'Maximum Security Vault / SCADA Core',
    difficulty: 'VERY_HARD',
    accentColor: '#3b82f6',
    accentName: 'BLUE',
    themeDescription:
      'Imposing subterranean SCADA mainframe fortress with a monumental 3-meter circular vault door with interlocking cogs, server racks with battery drawers, workstation monitors, and extraction gate.',
    roomBounds: { minX: -5.0, maxX: 5.0, minZ: -6.0, maxZ: 6.0 },
    playerSpawn: [0, 1.6, 3.8],

    letter1: {
      id: 'R4-L1',
      engravedCode: 'V4',
      title: 'Vault Cam Interlock Log [V4]',
      storyLocation: 'Behind the heavy vault door locking gear teeth',
      paperText:
        'A micro-printed security protocol strip stamped with the vault master code "V4".',
      puzzleQuestion:
        'Three prisoners stand in a row facing the same direction. A guard gives each a hat from a pile of 3 black and 2 white hats. The back prisoner sees the two hats in front; the middle prisoner sees the one in front; the front prisoner sees none. The guard says: name your hat color and you go free. The back prisoner stays silent. The middle prisoner stays silent. Which prisoner can now deduce their own hat color, and what is it? (Format: POSITION COLOR)',
      revealClue: 'Power never dies, it waits in the rack.',
      hint: 'If front two were white, back prisoner would have spoken. Since back was silent, middle and front are not both white. If front were white, middle would know he has black. Since middle stayed silent, front prisoner knows his own color!',
    },

    letter2: {
      id: 'R4-L2',
      title: 'Server Battery Dispatch Slip',
      storyLocation: 'Inside the pull-out battery drawer of Server Rack 04',
      paperText:
        'A cryptographic packing manifest located beneath the lithium backup batteries.',
      puzzleQuestion:
        'Eight boxes A to H are stacked on top of each other, in an unknown order. Two boxes are between A and F. Two between C and G. Three between D and B. H is right below B. Two between A and H. Two between E and B. If C is at the bottom, which box is on top?',
      revealClue: 'The final lock listens to the flag.',
      hint: 'C is at bottom (position 1). Two between C and G means G is position 4. H is directly below B, two between E and B means E is position 7 or 8. D and B have three between them. F ends up on top (position 8).',
    },

    venue: {
      locationName: 'Vault Control Desk',
      code: 'VAULT-FLAG-777',
      description: 'Master Physical Authorization Key from Chief Proctor at Vault Control Desk.',
    },

    keyBox: {
      name: 'Master SCADA Core Interlock',
      storyLocation: 'Embedded directly into the Vault Door Control Pedestal',
      unlockedKeyName: 'Championship Extraction Pass',
      techTitle: '16-Bit Two\'s Complement & Stack Operations',
      techTopic: 'Stack Data Structures & Binary Representations',
      techQuestion:
        'An empty integer stack performs:\npush(15), push(8), pop(), push(22), push(5), pop(), push(10).\nLet S be the sum of the elements remaining in the stack. Compute S - 50 and express the result as a 16-bit two\'s complement binary number, grouped in four 4-bit nibbles (e.g. 1111 1111 0000 0000).',
      techExplanation:
        '1. Stack trace:\n- push(15) -> [15]\n- push(8) -> [15, 8]\n- pop() -> removes 8, leaves [15]\n- push(22) -> [15, 22]\n- push(5) -> [15, 22, 5]\n- pop() -> removes 5, leaves [15, 22]\n- push(10) -> [15, 22, 10]\n2. Sum S = 15 + 22 + 10 = 47.\n3. Target value = S - 50 = 47 - 50 = -3.\n4. +3 in 16-bit binary: 0000 0000 0000 0011.\n5. Invert bits (1\'s complement): 1111 1111 1111 1100.\n6. Add 1 (2\'s complement): 1111 1111 1111 1101.',
      techHint:
        'Track the stack contents: remaining elements are 15, 22, 10. Sum S = 47. Compute 47 - 50 = -3. Convert -3 to 16-bit two\'s complement binary: invert the bits of +3 and add 1.',
    },

    interactables: [
      {
        id: 'r4_vault_lever',
        name: 'Giant Vault Door Locking Mechanism',
        prompt: '[E] Inspect Gear Assembly',
        category: 'PHYSICAL_PROP',
        position: [-1.2, 1.6, -5.3],
        closeUpCameraPosition: [-1.0, 1.6, -4.2],
        closeUpLookAt: [-1.2, 1.6, -5.3],
      },
      {
        id: 'r4_letter1',
        name: 'Vault Interlock Log [V4]',
        prompt: '[LMB] Read Interlock Log',
        category: 'LETTER_1',
        position: [-1.15, 1.5, -5.3],
        closeUpCameraPosition: [-1.0, 1.55, -4.5],
        closeUpLookAt: [-1.15, 1.5, -5.3],
      },
      {
        id: 'r4_server_drawer',
        name: 'Server Rack 04 Battery Tray',
        prompt: '[E] Slide Open Battery Tray',
        category: 'PHYSICAL_PROP',
        position: [3.8, 0.9, -1.0],
        closeUpCameraPosition: [2.6, 1.2, -1.0],
        closeUpLookAt: [3.8, 0.9, -1.0],
      },
      {
        id: 'r4_letter2',
        name: 'Dispatch Slip',
        prompt: '[LMB] Read Dispatch Slip',
        category: 'LETTER_2',
        position: [3.75, 0.85, -1.0],
        closeUpCameraPosition: [2.8, 1.15, -1.0],
        closeUpLookAt: [3.75, 0.85, -1.0],
      },
      {
        id: 'r4_keybox',
        name: 'Vault Core Pedestal Terminal',
        prompt: '[E] Access Terminal',
        category: 'KEY_BOX',
        position: [0.0, 1.1, -1.5],
        closeUpCameraPosition: [0.0, 1.4, -0.6],
        closeUpLookAt: [0.0, 1.1, -1.5],
      },
      {
        id: 'r4_vault_door',
        name: 'Monumental Circular Vault Door',
        prompt: '[E] Disengage Hydraulic Bolts',
        category: 'EXIT_DOOR',
        requiredTool: 'CHAMPIONSHIP_EXTRACTION_PASS',
        position: [0.0, 2.2, -5.6],
      },
      {
        id: 'r4_flag',
        name: 'THE CHAMPIONSHIP FLAG',
        prompt: '[E] Capture Championship Flag!',
        category: 'FLAG',
        position: [0.0, 1.8, -8.5],
        closeUpCameraPosition: [0.0, 1.8, -6.8],
        closeUpLookAt: [0.0, 1.8, -8.5],
      },
    ],
  },
};

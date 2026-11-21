// Concept X-Ray — syllabus data: Class 10 Physics (Electricity + Light)
// Concept graph, misconception taxonomy and question bank.

window.XR = window.XR || {};

XR.CONCEPTS = [
  // Electricity
  { id: "charge",     name: "Electric Charge",        short: "Charge",      chapter: "Electricity", x: 90,  y: 70,  desc: "Charge (Q) is measured in coulombs. Current is the rate of flow of charge." },
  { id: "potdiff",    name: "Potential Difference",   short: "Voltage",     chapter: "Electricity", x: 90,  y: 200, desc: "Work done per unit charge between two points: V = W / Q." },
  { id: "current",    name: "Electric Current",       short: "Current",     chapter: "Electricity", x: 250, y: 70,  desc: "I = Q / t. Current is the same at every point in a series path — it is not used up." },
  { id: "ohm",        name: "Ohm's Law",              short: "Ohm's Law",   chapter: "Electricity", x: 250, y: 200, desc: "V = I × R at constant temperature." },
  { id: "resistivity",name: "Resistance & Resistivity",short: "Resistivity",chapter: "Electricity", x: 250, y: 330, desc: "R = ρL / A. Longer wire → more resistance; thicker wire → less." },
  { id: "series",     name: "Resistors in Series",    short: "Series",      chapter: "Electricity", x: 410, y: 130, desc: "R = R1 + R2 + …; same current, voltage divides." },
  { id: "parallel",   name: "Resistors in Parallel",  short: "Parallel",    chapter: "Electricity", x: 410, y: 260, desc: "1/R = 1/R1 + 1/R2 + …; same voltage, current divides. R is less than the smallest resistor." },
  { id: "power",      name: "Electric Power",         short: "Power",       chapter: "Electricity", x: 560, y: 130, desc: "P = VI = I²R = V²/R. 1 kWh = 3.6 × 10⁶ J is energy, not power." },
  { id: "heating",    name: "Heating Effect (Joule)", short: "Joule Heat",  chapter: "Electricity", x: 560, y: 260, desc: "H = I²Rt. Doubling current gives four times the heat." },
  // Light
  { id: "reflection", name: "Reflection of Light",    short: "Reflection",  chapter: "Light", x: 720, y: 70,  desc: "Angle of incidence = angle of reflection. Plane-mirror image is the same size as the object." },
  { id: "signconv",   name: "Sign Convention",        short: "Sign Conv.",  chapter: "Light", x: 720, y: 200, desc: "New Cartesian convention: distances measured from the pole/optical centre; against incident light = negative." },
  { id: "mirror",     name: "Spherical Mirrors",      short: "Mirrors",     chapter: "Light", x: 880, y: 130, desc: "1/v + 1/u = 1/f; m = −v/u. Concave f is negative." },
  { id: "refraction", name: "Refraction",             short: "Refraction",  chapter: "Light", x: 720, y: 330, desc: "Entering a denser medium, light slows and bends TOWARDS the normal. n = c / v." },
  { id: "lens",       name: "Lens Formula",           short: "Lenses",      chapter: "Light", x: 880, y: 260, desc: "1/v − 1/u = 1/f; m = v/u. Convex f is positive." },
  { id: "lenspower",  name: "Power of a Lens",        short: "Lens Power",  chapter: "Light", x: 880, y: 390, desc: "P = 1/f with f in METRES. Unit: dioptre (D)." },
];

// prerequisite edges: [from (prerequisite), to (depends on it)]
XR.EDGES = [
  ["charge", "current"], ["potdiff", "ohm"], ["current", "ohm"], ["ohm", "resistivity"],
  ["ohm", "series"], ["ohm", "parallel"], ["series", "parallel"], ["ohm", "power"],
  ["power", "heating"],
  ["reflection", "mirror"], ["signconv", "mirror"], ["signconv", "lens"], ["refraction", "lens"], ["lens", "lenspower"],
];

XR.MISCONCEPTIONS = {
  M_PAR_ADD:   { label: "Adds parallel resistances like series", concept: "parallel", fix: "In parallel, add the reciprocals: 1/R = 1/R₁ + 1/R₂. The total is always SMALLER than the smallest resistor — more paths, easier flow.", rx: [/parallel.*(add|sum|plus|\+|total is \d+ ?\+)/i, /(add|sum|plus).*parallel/i, /\b\d+\s*\+\s*\d+\s*=\s*\d+.*parallel/i] },
  M_CUR_USED:  { label: "Believes current is 'used up' along a circuit", concept: "current", fix: "Charge is conserved. In a series path the SAME current flows through every component; energy is transferred, not current.", rx: [/\b(use[sd]?|using) up\b/i, /consum(e|ed|es) (the )?current/i, /current (is )?(less|lower|decreas).*(after|second|next|later)/i, /current gets (lost|used)/i] },
  M_OHM_INV:   { label: "Inverts Ohm's law (V = I/R or I = R/V)", concept: "ohm", fix: "V = I × R. Check with units: volts = amperes × ohms. Rearranged: I = V/R.", rx: [/v\s*=\s*i\s*\/\s*r/i, /i\s*=\s*r\s*\/\s*v/i, /divide current by resistance/i] },
  M_LEN_INV:   { label: "Thinks a longer wire has less resistance", concept: "resistivity", fix: "R = ρL/A — resistance is directly proportional to length. A longer wire is a longer obstacle course for electrons.", rx: [/long(er)? wire.*(less|lower|decreas)/i, /length.*inversely/i, /(more|increase).*length.*(less|decrease).*resist/i] },
  M_KWH_POW:   { label: "Confuses kWh (energy) with kW (power)", concept: "power", fix: "kW is a RATE (power). kWh is power × time = ENERGY. 1 kWh = 3.6 × 10⁶ J.", rx: [/kwh.*(power|rate)/i, /power.*kwh/i, /unit of power is kwh/i] },
  M_HEAT_LIN:  { label: "Thinks heat ∝ I (ignores the square)", concept: "heating", fix: "H = I²Rt. Doubling current → 2² = 4× the heat. Halving current → ¼ the heat.", rx: [/(double|twice).*(heat|h).*(double|twice)/i, /heat.*directly proportional to (current|i)\b/i, /h\s*=\s*irt/i] },
  M_SER_V:     { label: "Thinks voltage is the same across series resistors", concept: "series", fix: "In series the CURRENT is common; the voltage divides in proportion to resistance (V₁ = IR₁).", rx: [/series.*(same|equal) (voltage|potential)/i, /(voltage|potential).*same.*series/i] },
  M_SIGN:      { label: "Ignores the New Cartesian sign convention", concept: "signconv", fix: "Measure from the pole/optical centre. Object distance u is NEGATIVE (object on the left). Concave mirror f is negative; convex lens f positive.", rx: [/(u|object distance).*(positive|\+)/i, /ignore.*sign/i, /no (need|sign)/i, /signs? (don'?t|do not) matter/i] },
  M_REF_AWAY:  { label: "Thinks light bends away from the normal entering a denser medium", concept: "refraction", fix: "Denser medium → light slows → bends TOWARDS the normal. Rarer medium → speeds up → bends away.", rx: [/denser.*(away from|away)/i, /(glass|water).*bends? away/i, /speed(s)? up in (glass|water|denser)/i] },
  M_POW_CM:    { label: "Uses focal length in cm in P = 1/f", concept: "lenspower", fix: "P = 1/f only works with f in METRES. f = 25 cm → 0.25 m → P = +4 D (not 0.04 D).", rx: [/1\s*\/\s*(25|50|20|10)\b/i, /cm.*(power|dioptre)/i, /(power|p)\s*=\s*0\.0\d/i] },
  M_MIR_SIZE:  { label: "Thinks plane-mirror image shrinks with distance", concept: "reflection", fix: "A plane mirror always forms an image the SAME size as the object. It only LOOKS smaller from far away (perspective).", rx: [/(image|it).*(smaller|shrink).*(far|distance|move away)/i, /farther.*smaller image/i] },
  M_MAG_SIGN:  { label: "Mixes up the mirror and lens magnification formulas", concept: "mirror", fix: "Mirror: m = −v/u. Lens: m = +v/u. Negative m means real & inverted.", rx: [/m\s*=\s*v\s*\/\s*u.*mirror/i, /mirror.*m\s*=\s*v\s*\/\s*u/i] },
};

// Question bank. diff: 1 easy, 2 medium, 3 hard. mis: option index → misconception id.
XR.QUESTIONS = [
  // --- Diagnostic set (diag: true) ---
  { id: "d1", diag: true, concept: "current", diff: 1, text: "Two identical bulbs are in series with a battery. The ammeter before bulb 1 reads 0.5 A. What does an ammeter between bulb 1 and bulb 2 read?",
    options: ["0.25 A", "0.5 A", "1.0 A", "0 A"], answer: 1, mis: { 0: "M_CUR_USED" },
    sample: "The first bulb uses up some of the current to glow, so only half is left, 0.25 A.",
    explain: "Current is the same everywhere in a single loop. Bulbs transfer energy, they don't consume charge." },
  { id: "d2", diag: true, concept: "ohm", diff: 1, text: "A 6 V battery is connected across a 3 Ω resistor. What current flows?",
    options: ["18 A", "0.5 A", "2 A", "9 A"], answer: 2, mis: { 1: "M_OHM_INV", 0: "M_OHM_INV" },
    explain: "I = V / R = 6 / 3 = 2 A." },
  { id: "d3", diag: true, concept: "parallel", diff: 2, text: "Two 6 Ω resistors are connected in parallel. What is the equivalent resistance?",
    options: ["12 Ω", "3 Ω", "6 Ω", "36 Ω"], answer: 1, mis: { 0: "M_PAR_ADD" },
    sample: "In parallel we just add them, 6 + 6 = 12 ohm total.",
    explain: "1/R = 1/6 + 1/6 = 2/6 → R = 3 Ω. Parallel always reduces the total." },
  { id: "d4", diag: true, concept: "resistivity", diff: 1, text: "A wire is stretched to twice its length (same material, same area for simplicity). Its resistance becomes:",
    options: ["Half", "Unchanged", "Double", "One-fourth"], answer: 2, mis: { 0: "M_LEN_INV", 3: "M_LEN_INV" },
    explain: "R = ρL/A, so R ∝ L. Doubling L doubles R." },
  { id: "d5", diag: true, concept: "power", diff: 2, text: "Which of these is the commercial unit of electrical ENERGY?",
    options: ["kW", "kWh", "Watt", "Volt-ampere"], answer: 1, mis: { 0: "M_KWH_POW" },
    explain: "kWh = kilowatt × hour = energy. 1 kWh = 3.6 × 10⁶ J." },
  { id: "d6", diag: true, concept: "heating", diff: 2, text: "The current through a heater coil is doubled (R and t unchanged). The heat produced becomes:",
    options: ["Same", "2 times", "4 times", "Half"], answer: 2, mis: { 1: "M_HEAT_LIN" },
    sample: "Heat is directly proportional to current, so double current gives double heat.",
    explain: "H = I²Rt. (2I)² = 4I² → 4 times." },
  { id: "d7", diag: true, concept: "refraction", diff: 1, text: "A ray of light enters glass from air at an angle. It bends:",
    options: ["Away from the normal", "Towards the normal", "Does not bend", "Along the surface"], answer: 1, mis: { 0: "M_REF_AWAY" },
    explain: "Glass is optically denser; light slows down and bends towards the normal." },
  { id: "d8", diag: true, concept: "lenspower", diff: 2, text: "A convex lens has a focal length of 25 cm. Its power is:",
    options: ["+0.04 D", "+4 D", "−4 D", "+25 D"], answer: 1, mis: { 0: "M_POW_CM", 3: "M_POW_CM" },
    sample: "P = 1/f = 1/25 = 0.04 dioptre.",
    explain: "f = 0.25 m → P = 1/0.25 = +4 D." },
  { id: "d9", diag: true, concept: "mirror", diff: 3, text: "An object is 30 cm in front of a concave mirror with f = 15 cm. Where is the image? (use sign convention)",
    options: ["v = +30 cm", "v = −30 cm", "v = −10 cm", "v = +10 cm"], answer: 1, mis: { 0: "M_SIGN", 3: "M_SIGN" },
    explain: "u = −30, f = −15. 1/v = 1/f − 1/u = −1/15 + 1/30 = −1/30 → v = −30 cm (real, in front)." },
  { id: "d10", diag: true, concept: "series", diff: 2, text: "A 2 Ω and a 4 Ω resistor are in series across 12 V. The voltage across the 4 Ω resistor is:",
    options: ["12 V", "6 V", "8 V", "4 V"], answer: 2, mis: { 0: "M_SER_V", 1: "M_SER_V" },
    explain: "I = 12/6 = 2 A. V₄ = 2 × 4 = 8 V." },

  // --- Practice bank ---
  { id: "p1", concept: "charge", diff: 1, text: "How many coulombs pass a point if 2 A flows for 5 s?", options: ["0.4 C", "10 C", "7 C", "2.5 C"], answer: 1, mis: {}, explain: "Q = I × t = 2 × 5 = 10 C." },
  { id: "p2", concept: "potdiff", diff: 1, text: "12 J of work moves 3 C of charge between two points. The potential difference is:", options: ["36 V", "4 V", "0.25 V", "15 V"], answer: 1, mis: {}, explain: "V = W/Q = 12/3 = 4 V." },
  { id: "p3", concept: "current", diff: 2, text: "In a series circuit with a bulb and a buzzer, the current through the buzzer compared with the bulb is:", options: ["Less", "More", "Same", "Zero"], answer: 2, mis: { 0: "M_CUR_USED" }, explain: "One loop → one current." },
  { id: "p4", concept: "ohm", diff: 2, text: "A resistor carries 0.2 A when 4 V is applied. Its resistance is:", options: ["0.8 Ω", "20 Ω", "0.05 Ω", "4.2 Ω"], answer: 1, mis: { 0: "M_OHM_INV", 2: "M_OHM_INV" }, explain: "R = V/I = 4/0.2 = 20 Ω." },
  { id: "p5", concept: "ohm", diff: 3, text: "Voltage across a resistor is tripled, temperature constant. The current:", options: ["Becomes one-third", "Triples", "Stays the same", "Becomes 9 times"], answer: 1, mis: { 0: "M_OHM_INV" }, explain: "I = V/R; R fixed → I ∝ V." },
  { id: "p6", concept: "parallel", diff: 1, text: "Adding one more resistor in parallel to a circuit makes the total resistance:", options: ["Increase", "Decrease", "Stay same", "Become zero"], answer: 1, mis: { 0: "M_PAR_ADD" }, explain: "Another path → easier flow → lower R." },
  { id: "p7", concept: "parallel", diff: 3, text: "3 Ω, 6 Ω and 2 Ω are in parallel. The equivalent resistance is:", options: ["11 Ω", "1 Ω", "2 Ω", "0.5 Ω"], answer: 1, mis: { 0: "M_PAR_ADD" }, explain: "1/R = 1/3 + 1/6 + 1/2 = 1 → R = 1 Ω." },
  { id: "p8", concept: "parallel", diff: 2, text: "Household appliances are connected in parallel mainly because:", options: ["It increases total resistance", "Each gets full mains voltage independently", "It uses less wire", "Current is the same in each"], answer: 1, mis: { 3: "M_SER_V" }, explain: "Parallel: same voltage across each, independent switching." },
  { id: "p9", concept: "resistivity", diff: 2, text: "Which wire of the same metal has the LEAST resistance?", options: ["Long and thin", "Short and thick", "Long and thick", "Short and thin"], answer: 1, mis: { 0: "M_LEN_INV", 2: "M_LEN_INV" }, explain: "R ∝ L/A → short and thick." },
  { id: "p10", concept: "resistivity", diff: 3, text: "Wire A has twice the length and twice the area of wire B (same metal). R_A / R_B is:", options: ["4", "1", "1/4", "2"], answer: 1, mis: { 2: "M_LEN_INV" }, explain: "R ∝ L/A = 2/2 = 1." },
  { id: "p11", concept: "series", diff: 1, text: "Three 2 Ω resistors in series give a total of:", options: ["2/3 Ω", "6 Ω", "8 Ω", "2 Ω"], answer: 1, mis: {}, explain: "R = 2 + 2 + 2 = 6 Ω." },
  { id: "p12", concept: "series", diff: 3, text: "5 Ω and 10 Ω in series across 30 V. Voltage across 5 Ω is:", options: ["30 V", "15 V", "10 V", "20 V"], answer: 2, mis: { 0: "M_SER_V", 1: "M_SER_V" }, explain: "I = 30/15 = 2 A → V = 2 × 5 = 10 V." },
  { id: "p13", concept: "power", diff: 1, text: "A 220 V bulb draws 0.5 A. Its power is:", options: ["440 W", "110 W", "220.5 W", "0.0023 W"], answer: 1, mis: {}, explain: "P = VI = 220 × 0.5 = 110 W." },
  { id: "p14", concept: "power", diff: 3, text: "A 2 kW geyser runs 1.5 h daily for 30 days. Energy used is:", options: ["3 kW", "90 kWh", "60 kWh", "45 kWh"], answer: 1, mis: { 0: "M_KWH_POW" }, explain: "E = 2 × 1.5 × 30 = 90 kWh." },
  { id: "p15", concept: "heating", diff: 1, text: "The heating element of an iron is made of a material with:", options: ["Low resistivity, low melting point", "High resistivity, high melting point", "Zero resistance", "High conductivity"], answer: 1, mis: {}, explain: "High ρ for heat, high melting point to survive it." },
  { id: "p16", concept: "heating", diff: 3, text: "If current is halved, the heat produced in the same time becomes:", options: ["Half", "One-fourth", "Same", "Double"], answer: 1, mis: { 0: "M_HEAT_LIN" }, explain: "H ∝ I² → (½)² = ¼." },
  { id: "p17", concept: "reflection", diff: 1, text: "You walk away from a plane mirror. Your image:", options: ["Gets smaller", "Stays the same size", "Gets larger", "Becomes inverted"], answer: 1, mis: { 0: "M_MIR_SIZE" }, explain: "Plane mirror: magnification is always 1." },
  { id: "p18", concept: "signconv", diff: 2, text: "In the New Cartesian convention, the object distance u for a real object is usually:", options: ["Positive", "Negative", "Zero", "Depends on the mirror"], answer: 1, mis: { 0: "M_SIGN" }, explain: "The object sits to the left of the pole, opposite to the direction of incident light, so u is negative." },
  { id: "p19", concept: "signconv", diff: 1, text: "The focal length of a concave mirror is taken as:", options: ["Positive", "Negative", "Infinite", "Zero"], answer: 1, mis: { 0: "M_SIGN" }, explain: "Focus lies in front (left) → negative." },
  { id: "p20", concept: "mirror", diff: 2, text: "The magnification formula for a spherical mirror is:", options: ["m = v/u", "m = −v/u", "m = u/v", "m = −u/v"], answer: 1, mis: { 0: "M_MAG_SIGN" }, explain: "Mirror: m = −v/u. Lens: m = v/u." },
  { id: "p21", concept: "refraction", diff: 2, text: "Light travels from glass (n = 1.5) into air. It:", options: ["Slows and bends towards normal", "Speeds up and bends away from normal", "Slows and bends away", "Goes straight always"], answer: 1, mis: { 0: "M_REF_AWAY", 2: "M_REF_AWAY" }, explain: "Into a rarer medium → faster → away from normal." },
  { id: "p22", concept: "refraction", diff: 3, text: "Speed of light in a medium of refractive index 1.5 is:", options: ["4.5 × 10⁸ m/s", "2 × 10⁸ m/s", "3 × 10⁸ m/s", "1.5 × 10⁸ m/s"], answer: 1, mis: { 0: "M_REF_AWAY" }, explain: "v = c/n = 3×10⁸/1.5 = 2×10⁸ m/s." },
  { id: "p23", concept: "lens", diff: 2, text: "An object is 20 cm from a convex lens of f = +10 cm. The image distance v is:", options: ["−20 cm", "+20 cm", "+6.7 cm", "−6.7 cm"], answer: 1, mis: { 0: "M_SIGN", 3: "M_SIGN" }, explain: "1/v = 1/f + 1/u = 1/10 − 1/20 = 1/20 → v = +20 cm." },
  { id: "p24", concept: "lens", diff: 3, text: "For the lens above (u = −20, v = +20), the magnification is:", options: ["+1", "−1", "+2", "−2"], answer: 1, mis: { 0: "M_MAG_SIGN" }, explain: "Lens: m = v/u = 20/−20 = −1 (real, inverted, same size)." },
  { id: "p25", concept: "lenspower", diff: 1, text: "A lens has power −2 D. It is a:", options: ["Convex lens, f = 50 cm", "Concave lens, f = 50 cm", "Concave lens, f = 2 m", "Convex lens, f = 2 cm"], answer: 1, mis: { 2: "M_POW_CM", 3: "M_POW_CM" }, explain: "Negative power → concave. f = 1/2 m = 50 cm." },
  { id: "p26", concept: "lenspower", diff: 3, text: "Lenses of +2 D and +3 D are placed in contact. The combined focal length is:", options: ["5 cm", "20 cm", "50 cm", "1.2 m"], answer: 1, mis: { 0: "M_POW_CM" }, explain: "P = +5 D → f = 1/5 m = 20 cm." },
];

XR.conceptById = Object.fromEntries(XR.CONCEPTS.map(c => [c.id, c]));
XR.questionById = Object.fromEntries(XR.QUESTIONS.map(q => [q.id, q]));
XR.prereqsOf = id => XR.EDGES.filter(e => e[1] === id).map(e => e[0]);

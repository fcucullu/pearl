/**
 * Cycle prediction engine.
 * Given a list of logged periods (start + end), estimates:
 * - average cycle length
 * - average period duration
 * - predicted next period start
 * - current phase & phase boundaries for a given date
 */

export interface Period {
  id: string;
  start_date: string; // YYYY-MM-DD
  end_date: string | null;
}

export type Phase = "menstrual" | "follicular" | "ovulation" | "luteal";

export interface PhaseInfo {
  phase: Phase;
  dayInPhase: number;
  totalDaysInPhase: number;
  nextPeriodStart: string | null;
  daysUntilNextPeriod: number | null;
}

export interface CycleStats {
  avgCycleLength: number;
  avgPeriodDuration: number;
  cycleCount: number;
}

const DEFAULT_CYCLE_LENGTH = 28;
const DEFAULT_PERIOD_DURATION = 5;

function daysBetween(a: string, b: string): number {
  const msPerDay = 86400000;
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / msPerDay);
}

function addDays(date: string, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export function computeStats(periods: Period[]): CycleStats {
  const sorted = [...periods]
    .filter((p) => p.start_date)
    .sort((a, b) => a.start_date.localeCompare(b.start_date));

  if (sorted.length === 0) {
    return { avgCycleLength: DEFAULT_CYCLE_LENGTH, avgPeriodDuration: DEFAULT_PERIOD_DURATION, cycleCount: 0 };
  }

  // Period durations
  const durations = sorted
    .filter((p) => p.end_date)
    .map((p) => daysBetween(p.start_date, p.end_date!) + 1);

  const avgPeriodDuration =
    durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : DEFAULT_PERIOD_DURATION;

  // Cycle lengths (start-to-start)
  const cycleLengths: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const len = daysBetween(sorted[i - 1].start_date, sorted[i].start_date);
    if (len > 15 && len < 60) cycleLengths.push(len); // sanity filter
  }

  const avgCycleLength =
    cycleLengths.length > 0
      ? Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length)
      : DEFAULT_CYCLE_LENGTH;

  return { avgCycleLength, avgPeriodDuration, cycleCount: sorted.length };
}

export function predictNextPeriod(periods: Period[], stats: CycleStats): string | null {
  const sorted = [...periods].sort((a, b) => a.start_date.localeCompare(b.start_date));
  if (sorted.length === 0) return null;
  const lastStart = sorted[sorted.length - 1].start_date;
  return addDays(lastStart, stats.avgCycleLength);
}

export function getPhaseForDate(
  date: string,
  periods: Period[],
  stats: CycleStats
): PhaseInfo {
  const { avgCycleLength, avgPeriodDuration } = stats;
  const nextPeriodStart = predictNextPeriod(periods, stats);

  // Phase durations within a cycle
  const menstrualDays = avgPeriodDuration;
  const ovulationDay = Math.round(avgCycleLength / 2) - 1; // ~day 13-15
  const ovulationDays = 3;
  const follicularDays = ovulationDay - menstrualDays;
  const lutealDays = avgCycleLength - ovulationDay - ovulationDays;

  // Find which cycle day we're on
  const sorted = [...periods].sort((a, b) => a.start_date.localeCompare(b.start_date));
  if (sorted.length === 0) {
    return { phase: "follicular", dayInPhase: 1, totalDaysInPhase: 14, nextPeriodStart: null, daysUntilNextPeriod: null };
  }

  // Find the most recent period start that is <= date
  let cycleStart = sorted[0].start_date;
  for (const p of sorted) {
    if (p.start_date <= date) cycleStart = p.start_date;
    else break;
  }

  let cycleDay = daysBetween(cycleStart, date);

  // If date is before the first logged period, project backwards
  if (cycleDay < 0) {
    cycleDay = ((cycleDay % avgCycleLength) + avgCycleLength) % avgCycleLength;
  }
  // Wrap around for future predictions
  if (cycleDay >= avgCycleLength) {
    cycleDay = cycleDay % avgCycleLength;
  }

  let phase: Phase;
  let dayInPhase: number;
  let totalDaysInPhase: number;

  if (cycleDay < menstrualDays) {
    phase = "menstrual";
    dayInPhase = cycleDay + 1;
    totalDaysInPhase = menstrualDays;
  } else if (cycleDay < menstrualDays + follicularDays) {
    phase = "follicular";
    dayInPhase = cycleDay - menstrualDays + 1;
    totalDaysInPhase = follicularDays;
  } else if (cycleDay < menstrualDays + follicularDays + ovulationDays) {
    phase = "ovulation";
    dayInPhase = cycleDay - menstrualDays - follicularDays + 1;
    totalDaysInPhase = ovulationDays;
  } else {
    phase = "luteal";
    dayInPhase = cycleDay - menstrualDays - follicularDays - ovulationDays + 1;
    totalDaysInPhase = lutealDays;
  }

  const daysUntilNextPeriod = nextPeriodStart ? daysBetween(date, nextPeriodStart) : null;

  return { phase, dayInPhase, totalDaysInPhase, nextPeriodStart, daysUntilNextPeriod };
}

export function getPhaseColor(phase: Phase): string {
  switch (phase) {
    case "menstrual": return "#E84057";    // rose/red
    case "follicular": return "#60B5A0";   // teal/green
    case "ovulation": return "#A78BFA";    // violet/purple
    case "luteal": return "#F5A623";       // amber/gold
  }
}

export function getPhaseName(phase: Phase): string {
  switch (phase) {
    case "menstrual": return "Menstrual";
    case "follicular": return "Follicular";
    case "ovulation": return "Ovulation";
    case "luteal": return "Luteal";
  }
}

export function getPhaseEmoji(phase: Phase): string {
  switch (phase) {
    case "menstrual": return "🌙";
    case "follicular": return "🌱";
    case "ovulation": return "🌸";
    case "luteal": return "🍂";
  }
}

export interface PhaseRecommendation {
  title: string;
  body: string;
  tips: string[];
}

export function getPhaseRecommendation(phase: Phase): PhaseRecommendation {
  switch (phase) {
    case "menstrual":
      return {
        title: "Rest & Restore",
        body: "Your body is shedding its uterine lining. Energy levels tend to be lower, and you may feel more introspective. This is your body's natural reset — honor it.",
        tips: [
          "Prioritize rest and gentle movement like yoga or walks",
          "Stay hydrated and eat iron-rich foods",
          "Use a heat pad for cramps",
          "It's okay to say no and take time for yourself",
        ],
      };
    case "follicular":
      return {
        title: "Rising Energy",
        body: "Estrogen is climbing and so is your energy! You'll likely feel more creative, social, and motivated. This is a great time to start new projects or try new things.",
        tips: [
          "Take on new challenges — your brain is primed for learning",
          "Try higher intensity workouts",
          "Plan social activities and dates",
          "Eat fresh, light meals with plenty of vegetables",
        ],
      };
    case "ovulation":
      return {
        title: "Peak Energy",
        body: "You're at your most fertile and likely feeling confident and communicative. Estrogen and testosterone peak, giving you a natural glow and social magnetism.",
        tips: [
          "Great time for important conversations and presentations",
          "Enjoy high-energy activities and workouts",
          "Your skin may look its best — enjoy it!",
          "Stay connected with your partner",
        ],
      };
    case "luteal":
      return {
        title: "Wind Down",
        body: "Progesterone rises and you may start to feel more inward-focused. PMS symptoms can appear in the later days. Be gentle with yourself as your body prepares for the next cycle.",
        tips: [
          "Reduce caffeine and sugar to ease PMS symptoms",
          "Opt for comfort foods rich in complex carbs and magnesium",
          "Switch to moderate exercise like swimming or pilates",
          "Journal or meditate to manage mood shifts",
        ],
      };
  }
}

export function getPartnerRecommendation(phase: Phase): string {
  switch (phase) {
    case "menstrual":
      return "She's in her menstrual phase. She may feel more tired and need extra comfort. Be patient, offer to help with tasks, bring her tea or a heat pad, and don't take it personally if she needs alone time.";
    case "follicular":
      return "She's in her follicular phase — energy is rising! She'll likely be more social and adventurous. Great time to plan fun activities together, try a new restaurant, or go on a date.";
    case "ovulation":
      return "She's ovulating — peak energy and confidence! She'll be communicative and social. Enjoy quality time together, have meaningful conversations, and appreciate her natural glow.";
    case "luteal":
      return "She's in her luteal phase. She may experience mood swings or PMS symptoms toward the end. Be extra supportive, avoid unnecessary conflicts, offer comfort food, and give her space when needed.";
  }
}

/** Alerts for unusual cycle patterns */
export interface CycleAlert {
  type: "long_period" | "short_cycle" | "long_cycle" | "irregular";
  message: string;
  severity: "info" | "warning";
}

export function getCycleAlerts(periods: Period[], stats: CycleStats): CycleAlert[] {
  const alerts: CycleAlert[] = [];
  const sorted = [...periods]
    .filter((p) => p.start_date && p.end_date)
    .sort((a, b) => a.start_date.localeCompare(b.start_date));

  // Check latest period duration
  if (sorted.length > 0) {
    const latest = sorted[sorted.length - 1];
    const duration = daysBetween(latest.start_date, latest.end_date!) + 1;
    if (duration > 8) {
      alerts.push({
        type: "long_period",
        message: `Your last period lasted ${duration} days. Periods longer than 8 days may be worth discussing with your doctor.`,
        severity: "warning",
      });
    }
  }

  // Check latest cycle length
  if (sorted.length >= 2) {
    const last = sorted[sorted.length - 1];
    const prev = sorted[sorted.length - 2];
    const cycleLen = daysBetween(prev.start_date, last.start_date);

    if (cycleLen < 21) {
      alerts.push({
        type: "short_cycle",
        message: `Your last cycle was ${cycleLen} days. Cycles shorter than 21 days are considered short — consider mentioning it to your doctor.`,
        severity: "warning",
      });
    } else if (cycleLen > 35) {
      alerts.push({
        type: "long_cycle",
        message: `Your last cycle was ${cycleLen} days. Cycles longer than 35 days are considered long — this can be normal but worth monitoring.`,
        severity: "info",
      });
    }

    // Check irregularity vs average
    if (stats.cycleCount >= 3) {
      const diff = Math.abs(cycleLen - stats.avgCycleLength);
      if (diff > 7) {
        alerts.push({
          type: "irregular",
          message: `Your last cycle (${cycleLen} days) was ${diff} days ${cycleLen > stats.avgCycleLength ? "longer" : "shorter"} than your average (${stats.avgCycleLength} days).`,
          severity: "info",
        });
      }
    }
  }

  // Check for ongoing period that's too long
  const activePeriod = periods.find((p) => p.start_date && !p.end_date);
  if (activePeriod) {
    const today = new Date().toISOString().split("T")[0];
    const ongoingDays = daysBetween(activePeriod.start_date, today) + 1;
    if (ongoingDays > 10) {
      alerts.push({
        type: "long_period",
        message: `Your current period has been going for ${ongoingDays} days. Did you forget to mark it as ended?`,
        severity: "warning",
      });
    }
  }

  return alerts;
}

/** Get phase for each day in a month, used for calendar coloring */
export function getMonthPhases(
  year: number,
  month: number, // 0-indexed
  periods: Period[],
  stats: CycleStats
): Map<number, Phase> {
  const map = new Map<number, Phase>();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const info = getPhaseForDate(dateStr, periods, stats);
    map.set(day, info.phase);
  }
  return map;
}

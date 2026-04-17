"use client";

import type { CycleStats, Period, Phase } from "@/lib/cycle";
import { getPhaseForDate, getPhaseColor, getPhaseEmoji, getPhaseName } from "@/lib/cycle";

interface DailyInsightProps {
  periods: Period[];
  stats: CycleStats;
  date?: string | null; // YYYY-MM-DD, defaults to today
  ttcMode?: boolean;
}

interface HormoneLevel {
  name: string;
  level: "very low" | "low" | "rising" | "moderate" | "high" | "peak" | "falling";
  emoji: string;
}

interface DayInsight {
  title: string;
  body: string;
  hormones: HormoneLevel[];
  tips: string[];
}

function getDayInsight(dayInCycle: number, cycleLength: number, phase: Phase): DayInsight {
  const periodEnd = Math.round((cycleLength * 5) / 28);
  const ovulationDay = Math.round(cycleLength * 0.5);
  const lutealStart = ovulationDay + 2;

  // Determine hormone states based on day position
  let estrogen: HormoneLevel["level"];
  let progesterone: HormoneLevel["level"];
  let fsh: HormoneLevel["level"];
  let lh: HormoneLevel["level"];

  if (dayInCycle <= 2) {
    // Early menstrual
    estrogen = "very low"; progesterone = "very low"; fsh = "rising"; lh = "low";
  } else if (dayInCycle <= periodEnd) {
    // Late menstrual
    estrogen = "low"; progesterone = "very low"; fsh = "moderate"; lh = "low";
  } else if (dayInCycle <= ovulationDay - 5) {
    // Early follicular
    estrogen = "rising"; progesterone = "low"; fsh = "moderate"; lh = "low";
  } else if (dayInCycle <= ovulationDay - 2) {
    // Late follicular
    estrogen = "high"; progesterone = "low"; fsh = "falling"; lh = "rising";
  } else if (dayInCycle <= ovulationDay) {
    // Ovulation
    estrogen = "peak"; progesterone = "rising"; fsh = "low"; lh = "peak";
  } else if (dayInCycle <= ovulationDay + 2) {
    // Post-ovulation
    estrogen = "falling"; progesterone = "rising"; fsh = "low"; lh = "falling";
  } else if (dayInCycle <= lutealStart + 5) {
    // Early luteal
    estrogen = "moderate"; progesterone = "high"; fsh = "low"; lh = "low";
  } else if (dayInCycle <= cycleLength - 5) {
    // Mid luteal
    estrogen = "moderate"; progesterone = "peak"; fsh = "low"; lh = "low";
  } else {
    // Late luteal (pre-menstrual)
    estrogen = "falling"; progesterone = "falling"; fsh = "rising"; lh = "low";
  }

  const hormones: HormoneLevel[] = [
    { name: "Estrogen", level: estrogen, emoji: "💜" },
    { name: "Progesterone", level: progesterone, emoji: "🧡" },
    { name: "FSH", level: fsh, emoji: "💙" },
    { name: "LH", level: lh, emoji: "❤️" },
  ];

  // Generate personalized insight based on phase and day position
  const insights = getInsightForDay(dayInCycle, cycleLength, phase, estrogen, progesterone);

  return {
    title: insights.title,
    body: insights.body,
    hormones,
    tips: insights.tips,
  };
}

function getInsightForDay(
  day: number,
  cycleLength: number,
  phase: Phase,
  estrogen: HormoneLevel["level"],
  progesterone: HormoneLevel["level"]
): { title: string; body: string; tips: string[] } {
  const periodEnd = Math.round((cycleLength * 5) / 28);
  const ovulationDay = Math.round(cycleLength * 0.5);

  if (phase === "menstrual") {
    if (day <= 2) {
      return {
        title: "Rest & renew",
        body: "Your hormone levels are at their lowest. Your body is shedding the uterine lining. It's completely normal to feel tired, have cramps, or feel more emotional. This is your body's natural reset — honor it.",
        tips: ["Warm drinks & comfort food", "Gentle stretching or yoga", "Extra sleep if you can"],
      };
    }
    return {
      title: "Energy returning",
      body: "Your period is winding down and estrogen is starting to rise again. You may notice your energy slowly coming back. The heaviest days are behind you.",
      tips: ["Light walks help with cramps", "Iron-rich foods to replenish", "Start planning the week ahead"],
    };
  }

  if (phase === "follicular") {
    if (day <= periodEnd + 3) {
      return {
        title: "Fresh start energy",
        body: "Estrogen is climbing and you're likely feeling a wave of renewed energy and optimism. Your brain is sharper, creativity flows more easily, and you may feel more social. This is a great time to start new projects.",
        tips: ["Great day for brainstorming", "Try something new", "Social plans feel easier now"],
      };
    }
    return {
      title: "Building momentum",
      body: "Estrogen continues to rise steadily. You're in your power zone — confidence, focus, and motivation are at their best. Your skin may look clearer and you might feel more attractive.",
      tips: ["Tackle challenging tasks", "High-intensity workouts feel great", "Good time for important conversations"],
    };
  }

  if (phase === "ovulation") {
    if (day === ovulationDay) {
      return {
        title: "Peak day",
        body: "LH has surged and ovulation is happening. Estrogen is at its peak. You're likely feeling your most confident, communicative, and energetic. Your senses are heightened and you may feel a natural glow.",
        tips: ["Peak fertility window", "Great for presentations & social events", "You may feel warmer than usual"],
      };
    }
    return {
      title: "Radiant energy",
      body: "You're in or near your ovulation window. Estrogen and testosterone are both elevated, giving you a natural confidence boost. Your verbal skills and social magnetism are heightened.",
      tips: ["Important meetings go well now", "Libido may be at its highest", "Stay hydrated — body temp rises slightly"],
    };
  }

  // Luteal phase
  if (day <= ovulationDay + 4) {
    return {
      title: "Gentle shift",
      body: "Progesterone is rising as your body enters the luteal phase. You might start feeling a subtle shift — a desire to slow down slightly. Estrogen dips briefly before a small secondary rise.",
      tips: ["Transition to moderate exercise", "Nourishing, warm meals help", "Journaling can feel satisfying"],
    };
  }
  if (day <= cycleLength - 7) {
    return {
      title: "Nesting mode",
      body: "Progesterone is at its peak, making you feel more inward-focused and calm. You may crave comfort, routine, and familiar things. Your body is preparing — this is your time to organize, complete tasks, and take care of details.",
      tips: ["Great for finishing projects", "Comfort food cravings are normal", "Organize & declutter"],
    };
  }
  if (day <= cycleLength - 3) {
    return {
      title: "Pre-menstrual awareness",
      body: "Both estrogen and progesterone are dropping. You may start noticing PMS symptoms: bloating, mood shifts, tender breasts, or food cravings. This is temporary — your hormones are resetting for the next cycle.",
      tips: ["Reduce caffeine & salt", "Magnesium-rich foods help", "Be gentle with yourself"],
    };
  }
  return {
    title: "Cycle closing",
    body: "Hormones are at their lowest point before your next period. You might feel more sensitive or tired. This is your body's signal to slow down and prepare for renewal. Your period will likely start in the next few days.",
    tips: ["Stock up on period supplies", "Prioritize rest tonight", "Light movement over intense workouts"],
  };
}

function getTTCInsightForDay(
  day: number,
  cycleLength: number,
  phase: Phase,
): { title: string; body: string; tips: string[] } {
  const periodEnd = Math.round((cycleLength * 5) / 28);
  const ovulationDay = Math.round(cycleLength * 0.5);

  if (phase === "menstrual") {
    if (day <= 2) {
      return {
        title: "Cycle reset — preparing for a new opportunity",
        body: "A new cycle begins, which means a new chance. Your body is clearing the uterine lining and getting ready to build a fresh, nutrient-rich environment. Rest well — this foundation matters.",
        tips: ["Take folic acid and prenatal vitamins daily", "Stay hydrated and eat iron-rich foods", "Rest is productive — your body is preparing"],
      };
    }
    return {
      title: "Building the foundation",
      body: "Your period is winding down and your body is already beginning to prepare for the next ovulation. Estrogen will start rising soon, stimulating follicle growth.",
      tips: ["Continue prenatal vitamins", "Gentle movement supports blood flow to the uterus", "Eat leafy greens and lean protein"],
    };
  }

  if (phase === "follicular") {
    if (day <= periodEnd + 3) {
      return {
        title: "Your body is preparing the next egg",
        body: "FSH is stimulating your ovaries to develop follicles. One will become the dominant egg. Estrogen is rising, thickening the uterine lining to create the perfect environment for implantation.",
        tips: ["Eat antioxidant-rich foods (berries, nuts)", "Stay active — moderate exercise supports fertility", "Track cervical mucus changes"],
      };
    }
    return {
      title: "Fertility is building — estrogen is creating the perfect environment",
      body: "Estrogen continues to climb, building a thick, receptive uterine lining. Your cervical mucus may become more watery and clear. The dominant follicle is maturing rapidly.",
      tips: ["Watch for egg-white cervical mucus — fertility is near", "Consider starting ovulation test strips", "Keep stress low — cortisol can delay ovulation"],
    };
  }

  if (phase === "ovulation") {
    if (day === ovulationDay) {
      return {
        title: "Peak fertility! This is the best time to try",
        body: "LH has surged and the egg is being released. This is your most fertile moment — the egg lives for 12-24 hours, but sperm can survive up to 5 days. Today and tomorrow are your best window.",
        tips: ["Have intercourse today or tomorrow", "Use ovulation tests to confirm the LH surge", "Stay relaxed — stress can affect conception"],
      };
    }
    return {
      title: "High fertility window",
      body: "You're in or very near ovulation. Estrogen and LH are elevated. The egg may be released any moment. This is prime time for conception — sperm that arrive now can be waiting when the egg is released.",
      tips: ["Have intercourse today or tomorrow", "Lie down for 10-15 minutes afterwards", "Avoid lubricants that may hinder sperm motility"],
    };
  }

  // Luteal phase — TTC-specific
  if (day <= ovulationDay + 4) {
    return {
      title: "The TWW begins — the egg may be fertilizing",
      body: "The two-week wait has started. If the egg was fertilized, it's now traveling down the fallopian tube. Progesterone is rising to maintain the uterine lining and support a potential pregnancy.",
      tips: ["Avoid alcohol and heavy exercise", "Start folic acid if not already", "Stay hydrated and eat whole foods"],
    };
  }
  if (day <= ovulationDay + 8) {
    return {
      title: "Implantation window — take it easy",
      body: "Around days 6-10 after ovulation, a fertilized egg may implant into the uterine lining. Some people experience light spotting (implantation bleeding) or mild cramping. These are potentially positive signs.",
      tips: ["Avoid alcohol and heavy exercise", "Light spotting could be implantation", "Keep taking prenatal vitamins"],
    };
  }
  if (day <= cycleLength - 5) {
    return {
      title: "If conceived, the embryo is settling in",
      body: "Progesterone is at its peak, keeping the uterine lining thick and nourishing. If implantation occurred, hCG production is beginning. You may start to notice very early pregnancy symptoms like breast tenderness or fatigue.",
      tips: ["Avoid hot tubs and saunas", "Continue prenatal vitamins", "Try not to symptom-spot — it's still early"],
    };
  }
  return {
    title: "Testing window approaching — stay patient",
    body: "You're nearing the end of the two-week wait. If you conceived, hCG levels may be high enough to detect on a home pregnancy test in the coming days. Try to wait until the day of your expected period for the most accurate result.",
    tips: ["Test with first morning urine for best accuracy", "A negative test may still be too early — wait 2 days and retest", "Whatever the result, you've done everything right"],
  };
}

const levelColors: Record<HormoneLevel["level"], string> = {
  "very low": "bg-neutral-200 text-neutral-500",
  low: "bg-blue-100 text-blue-600",
  rising: "bg-emerald-100 text-emerald-600",
  moderate: "bg-indigo-100 text-indigo-600",
  high: "bg-purple-100 text-purple-600",
  peak: "bg-pink-100 text-pink-600",
  falling: "bg-amber-100 text-amber-600",
};

export function DailyInsight({ periods, stats, date, ttcMode }: DailyInsightProps) {
  const cycleLength = stats.avgCycleLength || 28;

  const targetDate = date || new Date().toISOString().split("T")[0];
  const isToday = !date || date === new Date().toISOString().split("T")[0];
  const phaseInfo = getPhaseForDate(targetDate, periods, stats);

  // Calculate day in cycle
  const sorted = [...periods].sort((a, b) => a.start_date.localeCompare(b.start_date));
  const lastPeriod = sorted[sorted.length - 1];
  let dayInCycle = 1;
  if (lastPeriod) {
    const diffMs = new Date(targetDate).getTime() - new Date(lastPeriod.start_date).getTime();
    dayInCycle = Math.max(1, ((Math.floor(diffMs / 86400000) % cycleLength) + cycleLength) % cycleLength + 1);
  }

  // Format selected date for display
  const dateLabel = isToday
    ? "Today"
    : new Date(targetDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  const baseInsight = getDayInsight(dayInCycle, cycleLength, phaseInfo.phase);
  const ttcOverride = ttcMode ? getTTCInsightForDay(dayInCycle, cycleLength, phaseInfo.phase) : null;
  const insight = {
    ...baseInsight,
    ...(ttcOverride ?? {}),
  };
  const phaseColor = getPhaseColor(phaseInfo.phase);

  return (
    <div
      className="bg-surface rounded-2xl p-4 shadow-sm border border-border"
      style={{ borderLeftWidth: 3, borderLeftColor: phaseColor }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getPhaseEmoji(phaseInfo.phase)}</span>
          <div>
            <p className="text-xs text-muted">
              {dateLabel} · Day {dayInCycle} of {cycleLength} · {getPhaseName(phaseInfo.phase)} phase
            </p>
          <h3 className="text-sm font-semibold" style={{ color: phaseColor }}>
            {insight.title}
          </h3>
          </div>
        </div>
        <span className="text-[9px] font-semibold uppercase tracking-wider text-pearl bg-pearl/10 px-2 py-1 rounded-full whitespace-nowrap">
          {ttcMode ? "Fertility tip" : "Tip of the day"}
        </span>
      </div>

      <p className="text-xs text-muted leading-relaxed mb-3">{insight.body}</p>

      {/* Hormone levels */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {insight.hormones.map((h) => (
          <span
            key={h.name}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium ${levelColors[h.level]}`}
          >
            {h.emoji} {h.name}: {h.level}
          </span>
        ))}
      </div>

      {/* Tips */}
      <div className="space-y-1">
        {insight.tips.map((tip, i) => (
          <p key={i} className="text-[11px] text-muted flex items-start gap-1.5">
            <span className="text-pearl mt-0.5">✦</span>
            {tip}
          </p>
        ))}
      </div>
    </div>
  );
}

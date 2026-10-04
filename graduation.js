// Shared by the injected UI and regression tests; the Vue bundle stays untouched.
(function (root) {
  const target = 3;
  function monthIndex(key) {
    const match = /^(\d{4})-(\d{1,2})$/.exec(key);
    if (!match || +match[2] < 1 || +match[2] > 12) return null;
    return +match[1] * 12 + +match[2] - 1;
  }
  function evaluate(previous, settings, expenses, now = new Date()) {
    const score = previous && typeof previous === 'object' ? previous : {};
    const history = score.history && typeof score.history === 'object' ? {...score.history} : {};
    settings = settings && typeof settings === 'object' ? settings : {};
    expenses = Array.isArray(expenses) ? expenses : [];
    const current = now.getFullYear() * 12 + now.getMonth();
    const indices = [...Object.keys(history), ...Object.keys(settings)]
      .map(monthIndex).filter(i => i !== null && i < current);
    let streak = 0, totalSuccess = 0, awardMonth = null;
    if (indices.length) {
      for (let i = Math.min(...indices); i < current; i++) {
        const year = Math.floor(i / 12), month = i % 12 + 1, key = year + '-' + month;
        if (history[key] === undefined) {
          const goal = Number(settings[key]?.goalAmount);
          const records = expenses.filter(e => e && +e.year === year && +e.month === month && Number(e.cost) > 0);
          // Missing goals or unrecorded months cannot establish a consumption habit.
          if (Number.isFinite(goal) && goal > 0) {
            const spent = records.reduce((sum, e) => sum + Number(e.cost), 0);
            history[key] = records.length > 0 && spent <= goal;
          }
        }
        if (history[key] === true) { streak++; totalSuccess++; }
        else streak = 0;
        if (streak >= target && !awardMonth) awardMonth = key;
      }
    }
    const newlyGraduated = !score.graduated && awardMonth !== null;
    return {
      ...score, history, streak, totalSuccess,
      graduated: !!score.graduated || newlyGraduated,
      graduatedAt: score.graduatedAt || (newlyGraduated ? now.toISOString() : null),
      graduateCount: Number(score.graduateCount) || (score.graduated ? 1 : 0),
      graduationStreak: Number(score.graduationStreak) || (score.graduated ? 6 : newlyGraduated ? target : 0),
      ...(newlyGraduated ? {graduateCount: (Number(score.graduateCount) || 0) + 1, graduationMonth: awardMonth} : {}),
      newlyGraduated
    };
  }
  const api = {target, evaluate};
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.DoniGraduation = api;
})(typeof window === 'object' ? window : globalThis);

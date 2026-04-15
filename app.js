const indoorButton = document.getElementById("indoorButton");
const outdoorButton = document.getElementById("outdoorButton");
const modeButtons = [indoorButton, outdoorButton];
const selectorPanel = document.getElementById("selectorPanel");
const conditionsPanel = document.getElementById("conditionsPanel");
const scorePanel = document.getElementById("scorePanel");
const modeEyebrow = document.getElementById("modeEyebrow");
const modeTitle = document.getElementById("modeTitle");
const modeSummary = document.getElementById("modeSummary");
const resetButton = document.getElementById("resetButton");
const changeModeButton = document.getElementById("changeModeButton");
const indoorForm = document.getElementById("indoorForm");
const outdoorForm = document.getElementById("outdoorForm");
const scoreValue = document.getElementById("scoreValue");
const scoreMeta = document.getElementById("scoreMeta");
const bandLabel = document.getElementById("bandLabel");
const bandDescription = document.getElementById("bandDescription");
const whyList = document.getElementById("whyList");
const trainingNote = document.getElementById("trainingNote");
const scoreRing = document.querySelector(".score-ring");
const animatedPanels = [conditionsPanel, scorePanel];

let currentMode = null;

function clamp(number, min, max) {
  return Math.min(max, Math.max(min, number));
}

const models = {
  indoor: {
    eyebrow: "Indoor Model",
    title: "Describe the indoor search space",
    summary: "Raw score from six indoor categories. More indoor factors can be added later.",
    form: indoorForm,
    scoreMeta: "Raw indoor score (6-18)",
    bands: [
      {
        max: 8,
        label: "Beginner",
        description: "This indoor setup should feel clear and contained for the dog.",
        note: "Best for confidence building, new rooms, and simple odor commitment.",
        color: "#7ba05b",
      },
      {
        max: 11,
        label: "Intermediate",
        description: "This indoor setup adds some challenge while still keeping the scent picture manageable.",
        note: "Useful for pattern building and helping the dog stay thoughtful without overload.",
        color: "#d4a73d",
      },
      {
        max: 14,
        label: "Advanced",
        description: "This indoor setup is likely to create a more layered scent picture for the dog.",
        note: "Good for stronger problem-solving around odor movement, commitment, and persistence.",
        color: "#cc6b2c",
      },
      {
        max: Infinity,
        label: "Pro",
        description: "This indoor setup stacks multiple difficult scent variables at the same time.",
        note: "Best used intentionally when you want high-level problem-solving and careful source work.",
        color: "#9f3d2c",
      },
    ],
    getScore(factors) {
      return factors.reduce((total, factor) => total + factor.value, 0);
    },
    getPercent(score) {
      return clamp(Math.round(((score - 6) / 12) * 100), 0, 100);
    },
    getDrivers(factors) {
      return factors
        .filter((factor) => factor.impact > 0)
        .sort((a, b) => b.impact - a.impact || b.value - a.value || a.label.localeCompare(b.label))
        .slice(0, 3);
    },
    emptyDrivers: "All indoor factors are at their easiest level.",
  },
  outdoor: {
    eyebrow: "Outdoor Model",
    title: "Describe the outdoor search picture",
    summary: "Weighted and normalized score based on the outdoor variables that shape scent the most.",
    form: outdoorForm,
    scoreMeta: "Normalized outdoor score (0-100)",
    bands: [
      {
        max: 25,
        label: "Beginner",
        description: "This outdoor setup should feel fairly stable and readable for the dog.",
        note: "Best for building confidence when you want the outdoor scent picture to stay honest.",
        color: "#7ba05b",
      },
      {
        max: 45,
        label: "Intermediate",
        description: "This outdoor setup adds enough movement and variability to ask for more decision-making.",
        note: "Useful for general outdoor training when you want a challenge without stacking too many stressors.",
        color: "#d4a73d",
      },
      {
        max: 65,
        label: "Advanced",
        description: "This outdoor setup is likely to produce a more changeable and layered scent picture.",
        note: "Good when you want the dog solving displacement, drift, and less obvious source behavior.",
        color: "#cc6b2c",
      },
      {
        max: Infinity,
        label: "Pro",
        description: "This outdoor setup stacks major scent disruptors and can shift quickly during the search.",
        note: "Best saved for intentional high-level work where independence and clear observation matter a lot.",
        color: "#9f3d2c",
      },
    ],
    getScore(factors) {
      const weightedTotal = factors.reduce((total, factor) => total + factor.value * factor.weight, 0);
      const minScore = factors.reduce((total, factor) => total + factor.weight, 0);
      const maxScore = factors.reduce((total, factor) => total + factor.weight * 3, 0);

      return clamp(Math.round(((weightedTotal - minScore) / (maxScore - minScore)) * 100), 0, 100);
    },
    getPercent(score) {
      return score;
    },
    getDrivers(factors) {
      return factors
        .filter((factor) => factor.impact > 0)
        .sort((a, b) => b.impact - a.impact || b.weight - a.weight || a.label.localeCompare(b.label))
        .slice(0, 4);
    },
    emptyDrivers: "All outdoor factors are at their easiest level.",
  },
};

// Planned later: surface condition modifier and surrounding surface influence.

function collectFactors(form) {
  return Array.from(form.querySelectorAll("select")).map((select) => {
    const option = select.options[select.selectedIndex];
    const value = Number(option.value);
    const weight = Number(select.dataset.weight || 1);

    return {
      key: select.name,
      label: select.dataset.label,
      choice: option.textContent.trim(),
      value,
      weight,
      impact: (value - 1) * weight,
    };
  });
}

function animatePanelsIn() {
  animatedPanels.forEach((panel, index) => {
    panel.hidden = false;
    panel.style.setProperty("--enter-delay", `${index * 70}ms`);
    panel.classList.remove("is-entered");
    panel.classList.add("is-entering");

    window.requestAnimationFrame(() => {
      panel.classList.add("is-entered");
    });

    window.setTimeout(() => {
      panel.classList.remove("is-entering");
    }, 420 + index * 70);
  });
}

function resetPanelAnimation() {
  animatedPanels.forEach((panel) => {
    panel.hidden = true;
    panel.classList.remove("is-entering", "is-entered");
    panel.style.removeProperty("--enter-delay");
  });
}

function getBand(model, score) {
  return model.bands.find((band) => score <= band.max) ?? model.bands[model.bands.length - 1];
}

function renderWhyList(model, factors) {
  const drivers = model.getDrivers(factors);
  whyList.innerHTML = "";

  if (drivers.length === 0) {
    const item = document.createElement("li");
    item.textContent = model.emptyDrivers;
    whyList.appendChild(item);
    return;
  }

  drivers.forEach((factor) => {
    const item = document.createElement("li");
    item.textContent = `${factor.label}: ${factor.choice}.`;
    whyList.appendChild(item);
  });
}

function updateScore() {
  if (!currentMode) {
    return;
  }

  const model = models[currentMode];
  const factors = collectFactors(model.form);
  const score = model.getScore(factors);
  const band = getBand(model, score);

  scoreValue.textContent = String(score);
  scoreMeta.textContent = model.scoreMeta;
  bandLabel.textContent = band.label;
  bandDescription.textContent = `${band.description} The list below shows the factors pushing difficulty highest right now.`;
  trainingNote.textContent = band.note;
  scoreRing.style.setProperty("--score", model.getPercent(score));
  scoreRing.style.setProperty("--ring-color", band.color);

  renderWhyList(model, factors);
}

function setMode(mode) {
  currentMode = mode;

  modeButtons.forEach((button) => {
    const isActive = button.dataset.mode === mode;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  Object.entries(models).forEach(([key, model]) => {
    model.form.hidden = key !== mode;
  });

  const model = models[mode];
  modeEyebrow.textContent = model.eyebrow;
  modeTitle.textContent = model.title;
  modeSummary.textContent = model.summary;
  animatePanelsIn();

  updateScore();
}

function showSetupChooser() {
  currentMode = null;
  selectorPanel.hidden = false;
  selectorPanel.classList.remove("is-exiting");
  selectorPanel.classList.add("is-returning");
  resetPanelAnimation();

  modeButtons.forEach((button) => {
    button.classList.remove("is-active");
    button.setAttribute("aria-pressed", "false");
  });

  window.setTimeout(() => {
    selectorPanel.classList.remove("is-returning");
  }, 320);
}

modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectorPanel.classList.add("is-exiting");
    window.setTimeout(() => {
      selectorPanel.hidden = true;
      selectorPanel.classList.remove("is-exiting");
      setMode(button.dataset.mode);
    }, 220);
  });
});

[indoorForm, outdoorForm].forEach((form) => {
  form.addEventListener("input", () => {
    if (form.hidden) {
      return;
    }

    updateScore();
  });
});

resetButton.addEventListener("click", () => {
  if (!currentMode) {
    return;
  }

  models[currentMode].form.reset();
  updateScore();
});

changeModeButton.addEventListener("click", () => {
  showSetupChooser();
});

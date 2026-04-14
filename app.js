const form = document.getElementById("difficultyForm");
const resetButton = document.getElementById("resetButton");
const scoreValue = document.getElementById("scoreValue");
const bandLabel = document.getElementById("bandLabel");
const bandDescription = document.getElementById("bandDescription");
const topFactors = document.getElementById("topFactors");
const trainingNote = document.getElementById("trainingNote");
const scoreRing = document.querySelector(".score-ring");

const factorLabels = {
  spaceSize: "Space size",
  layoutType: "Layout type",
  verticalComplexity: "Vertical complexity",
  airflowComplexity: "Airflow complexity",
  cornersEdges: "Corners and edges",
  surfaceMaterial: "Surface and material",
};

const trainingBands = [
  {
    max: 6,
    label: "Beginner",
    description: "This setup gives the dog a cleaner indoor scent picture with fewer competing scent effects.",
    note: "Best for confidence building, clear odor commitment, and teaching the dog that scent has value.",
    color: "#7ba05b",
  },
  {
    max: 12,
    label: "Advanced",
    description: "This setup asks the dog to work through a more layered indoor scent picture and solve odor displacement.",
    note: "Useful when you want more search strategy, persistence, and thoughtful source commitment from the dog.",
    color: "#cc6b2c",
  },
  {
    max: Infinity,
    label: "Pro",
    description: "This setup stacks difficult indoor variables, so the dog may need real problem-solving around source versus odor.",
    note: "Best used intentionally when you want strong independence and careful discrimination from the dog.",
    color: "#9f3d2c",
  },
];

// Planned later: surface condition modifier and surrounding surface influence.

function getBand(score) {
  return trainingBands.find((band) => score <= band.max) ?? trainingBands[trainingBands.length - 1];
}

function collectValues() {
  return Array.from(form.elements)
    .filter((element) => element.name)
    .map((element) => {
      const selectedOption = element.options[element.selectedIndex];

      return {
        key: element.name,
        label: factorLabels[element.name],
        value: Number(selectedOption.value),
        choice: selectedOption.textContent.trim(),
        summary: selectedOption.dataset.summary,
      };
    });
}

function buildSpecificExplanation(band, factors) {
  const higherDifficultyFactors = factors.filter((factor) => factor.value > 1).slice(0, 3);

  if (higherDifficultyFactors.length === 0) {
    return `${band.description} Right now every category is set to its easiest indoor level.`;
  }

  const summaries = higherDifficultyFactors.map((factor) => factor.summary);
  const list = new Intl.ListFormat("en", { style: "long", type: "conjunction" }).format(summaries);

  return `${band.description} The main drivers here are ${list}.`;
}

function updateScore() {
  const factors = collectValues().sort((a, b) => b.value - a.value);
  const score = factors.reduce((total, factor) => total + factor.value, 0);
  const band = getBand(score);
  const topThree = factors.filter((factor) => factor.value > 1).slice(0, 3);
  const ringScore = Math.round((score / 18) * 100);

  scoreValue.textContent = String(score);
  bandLabel.textContent = band.label;
  bandDescription.textContent = buildSpecificExplanation(band, factors);
  trainingNote.textContent = band.note;
  scoreRing.style.setProperty("--score", ringScore);
  scoreRing.style.setProperty("--ring-color", band.color);

  topFactors.innerHTML = "";
  if (topThree.length === 0) {
    const item = document.createElement("li");
    item.textContent = "All categories are at beginner level";
    topFactors.appendChild(item);
    return;
  }

  topThree.forEach((factor) => {
    const item = document.createElement("li");
    item.textContent = `${factor.label}: ${factor.choice}`;
    topFactors.appendChild(item);
  });
}

form.addEventListener("input", updateScore);
resetButton.addEventListener("click", () => {
  form.reset();
  updateScore();
});

updateScore();

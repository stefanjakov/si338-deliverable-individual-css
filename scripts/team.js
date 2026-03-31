let athletesData = null;

function timeToSeconds(value) {
  if (!value || value === "N/A") {
    // just return biggest num
    return Number.POSITIVE_INFINITY;
  }

  const cleaned = value.replace("PR", "").trim();
  const parts = cleaned.split(":");
  if (parts.length !== 2) {
    return Number.POSITIVE_INFINITY;
  }

  const minutes = Number(parts[0]);
  const seconds = Number(parts[1]);

  if (Number.isNaN(minutes) || Number.isNaN(seconds)) {
    return Number.POSITIVE_INFINITY;
  }

  return minutes * 60 + seconds;
}

function compareValues(a, b, sortBy) {
  if (sortBy === "name") {
    return a.name.localeCompare(b.name);
  }

  if (sortBy === "grade") {
    return a.grade - b.grade;
  }

  if (sortBy === "season-record") {
    return a.sr - b.sr;
  }

  if (sortBy === "personal-record") {
    return a.pr - b.pr;
  }

  return 0;
}

function sortRoster(sortBy) {
  const roster = document.getElementById("athlete-roster");
  if (!roster) {
    return;
  }

  const heading = roster.querySelector("h3");
  const cards = Array.from(roster.querySelectorAll(".athlete-card"));

  const data = cards.map((card) => ({
    element: card,
    name: (card.dataset.name || "").trim(),
    grade: Number(card.dataset.grade) || Number.POSITIVE_INFINITY,
    sr: timeToSeconds(card.dataset.sr),
    pr: timeToSeconds(card.dataset.pr),
  }));

  data.sort((a, b) => compareValues(a, b, sortBy));

  const fragment = document.createDocumentFragment();
  if (heading) {
    fragment.appendChild(heading);
  }

  data.forEach((item) => fragment.appendChild(item.element));

  roster.innerHTML = "";
  roster.appendChild(fragment);
}

async function loadAthleteData() {
  try {
    const response = await fetch("data/athletes.json");
    if (!response.ok) {
      return;
    }
    athletesData = await response.json();
  } catch (error) {
    athletesData = null;
  }
}

function buildComparisonHtml(a, b) {
  const sharedMeets = Object.keys(a.meets || {})
    .filter((meet) => meet in (b.meets || {}))
    .sort((left, right) => left.localeCompare(right));

  const sharedRows = sharedMeets
    .map(
      (meet) =>
        "<tr>" +
        `<td>${meet}</td>` +
        `<td>${a.meets[meet]}</td>` +
        `<td>${b.meets[meet]}</td>` +
        "</tr>"
    )
    .join("");

  const sharedHtml = sharedRows
    ? `
      <h3>Shared Meets</h3>
      <div class="shared-meets" tabindex="0" role="region" aria-label="Shared meets comparison table">
        <table>
          <thead>
            <tr>
              <th>Meet</th>
              <th>${a.name} Place</th>
              <th>${b.name} Place</th>
            </tr>
          </thead>
          <tbody>
            ${sharedRows}
          </tbody>
        </table>
      </div>
    `
    : "";

  return `
    <div class="comparison-cards">
      <div class="comparison-card">
        <img src="${a.profile_pic}" alt="${a.name} profile picture" />
        <h3>${a.name}</h3>
        <p>Grade: ${a.grade}</p>
        <p>Season Record: ${a.sr}</p>
        <p>Personal Record: ${a.pr}</p>
        <p>Meets Competed: ${a.meet_count}</p>
      </div>

      <div class="comparison-card">
        <img src="${b.profile_pic}" alt="${b.name} profile picture" />
        <h3>${b.name}</h3>
        <p>Grade: ${b.grade}</p>
        <p>Season Record: ${b.sr}</p>
        <p>Personal Record: ${b.pr}</p>
        <p>Meets Competed: ${b.meet_count}</p>
      </div>
    </div>

    ${sharedHtml}
  `;
}

function updateComparison() {
  const output = document.getElementById("comparison-output");
  if (!output || !athletesData) {
    return;
  }

  const selectA = document.getElementById("athlete-a");
  const selectB = document.getElementById("athlete-b");
  if (!selectA || !selectB) {
    return;
  }

  const athleteA = athletesData[selectA.value];
  const athleteB = athletesData[selectB.value];

  output.innerHTML = buildComparisonHtml(athleteA, athleteB);
}

document.addEventListener("DOMContentLoaded", () => {
  const select = document.getElementById("sort-by");
  if (!select) {
    return;
  }

  select.addEventListener("change", (event) => {
    sortRoster(event.target.value);
  });

  const compareButton = document.getElementById("compare-button");
  if (compareButton) {
    compareButton.addEventListener("click", updateComparison);
  }

  loadAthleteData().then(() => {
    updateComparison();
  });
});

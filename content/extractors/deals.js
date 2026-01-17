function extractDeals() {
  const deals = [];

  let currentGroup = "Ungrouped";
  const elements = document.querySelectorAll(
    '[data-testid*="group"], [data-testid*="item"]',
  );
  elements.forEach((el) => {
    let text = el.innerText.replace(/\s+/g, " ").trim();
    if (!text) return;

    // Group
    if (
      !text.includes("@") &&
      !/\d{4}/.test(text) &&
      !text.includes("$") &&
      !text.match(/\d{4,}/)
    ) {
      currentGroup = text.split(" ")[0];

      return;
    }

    const dateMatch = text.match(
      /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},\s+\d{4}\b/i,
    );
    if (!dateMatch) return;

    const closeDate = dateMatch[0];
    text = text.replace(closeDate, "").trim();

    // Probability
    let probability = null;

    const probMatch = text.match(/\b(\d{1,3})\s*%?\b/);
    if (probMatch) {
      const p = parseInt(probMatch[1], 10);
      if (p >= 0 && p <= 100) {
        probability = p;
        text = text.replace(probMatch[0], "").trim();
      }
    }

    //Stage
    const stages = ["Working on it", "Done", "Stuck"];
    let stage = "";

    stages.forEach((s) => {
      if (text.includes(s)) {
        stage = s;
        text = text.replace(s, "").trim();
      }
    });

    // Value
    const valueMatch = text.match(/\$?\s*([\d,]{4,})/);
    const value = valueMatch
      ? parseInt(valueMatch[1].replace(/,/g, ""), 10)
      : 0;
    if (valueMatch) text = text.replace(valueMatch[0], "").trim();

    // Deal and Owner
    const words = text.split(" ").filter(Boolean);

    let owner = "";
    let deal = "";

    if (words.length >= 3) {
      owner = words.slice(-2).join(" ");
      deal = words.slice(0, -2).join(" ");
    } else if (words.length === 2) {
      deal = words[0];
      owner = words[1];
    } else {
      deal = words.join(" ");
    }

    if (deal.split(" ").length > 1 && owner) {
      const ownerFirstName = owner.split(" ")[0];
      if (deal.endsWith(ownerFirstName)) {
        deal = deal.replace(new RegExp(`\\s?${ownerFirstName}$`), "");
      }
    }

    deal = deal.trim();
    owner = owner.trim();

    if (!deal) return;

    deals.push({
      id: generateId(el),
      deal,
      value,
      stage,
      probability,
      closeDate,
      owner,
      group: currentGroup,
    });
  });

  return deals;
}

window.extractDeals = extractDeals;

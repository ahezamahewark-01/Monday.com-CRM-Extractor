function extractActivities() {
  const activities = [];

  const items = document.querySelectorAll('[data-testid*="item"]');

  items.forEach((item) => {
    let text = item.innerText.replace(/\s+/g, " ").trim();

    if (
      ["activities", "contacts", "deals", "leads"].includes(text.toLowerCase())
    )
      return;

    // Extract Date
    const dateMatch = text.match(
      /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},\s+\d{4}\b/i,
    );
    if (!dateMatch) return;

    const date = dateMatch[0];
    text = text.replace(date, "").trim();

    // Extract Contact
    const phoneMatches = text.match(/(\+?\d[\d\s\-()]{6,})/g);
    const associatedContact = phoneMatches
      ? phoneMatches[phoneMatches.length - 1].trim()
      : "";

    if (associatedContact) {
      text = text.replace(associatedContact, "").trim();
    }

    text = text.replace(/^\d+\s*/, "");

    // Split remaining text
    const words = text.split(" ").filter(Boolean);

    // Subject
    let subject = "";
    let activityType = "";

    if (words.length >= 4) {
      subject = words.slice(-2).join(" ");
      activityType = words.slice(0, -2).join(" ");
    } else if (words.length === 3) {
      subject = words.slice(-2).join(" ");
      activityType = words.slice(0, 1).join(" ");
    } else {
      subject = words[words.length - 1];
      activityType = words.slice(0, -1).join(" ");
    }

    activityType = activityType.trim();
    subject = subject.trim();

    if (!activityType || !subject) return;

    activities.push({
      id: generateId(item),
      activityType,
      subject,
      date,
      associatedContact,
    });
  });

  return activities;
}

window.extractActivities = extractActivities;

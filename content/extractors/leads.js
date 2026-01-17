function extractLeads() {
  const leads = [];

  const items = document.querySelectorAll('[data-testid*="item"]');

  items.forEach((item) => {
    let text = item.innerText.replace(/\s+/g, " ").trim();

    if (
      ["leads", "contacts", "deals", "activities"].includes(text.toLowerCase())
    )
      return;

    if (!text.includes("@") && !/\d{7,}/.test(text)) return;

    // Email
    const emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    const email = emailMatch ? emailMatch[0] : "";
    if (email) text = text.replace(email, "").trim();

    // Phone
    const phoneMatches = text.match(/(\+?\d[\d\s\-()]{6,})/g);
    const phone = phoneMatches
      ? phoneMatches[phoneMatches.length - 1].trim()
      : "";
    if (phone) text = text.replace(phone, "").trim();

    // Status
    const statuses = ["Working on it", "Done", "Stuck"];
    let status = "";
    statuses.forEach((s) => {
      if (text.includes(s)) {
        status = s;
        text = text.replace(s, "").trim();
      }
    });

    // Owner
    const parts = text.split(" ").filter(Boolean);
    if (parts.length < 2) return;

    const owner = parts.pop();
    text = parts.join(" ").trim();

    // Lead name and Company
    const remaining = text.split(" ").filter(Boolean);

    const name = remaining.slice(0, 2).join(" ");
    const company = remaining.slice(2).join(" ") || "";

    if (!name) return;

    leads.push({
      id: generateId(item),
      name,
      company,
      status,
      email,
      phone,
      owner,
    });
  });

  return leads;
}

window.extractLeads = extractLeads;

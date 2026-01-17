function extractContacts() {
  const contacts = [];

  const items = document.querySelectorAll('[data-testid*="item"]');

  items.forEach((item) => {
    const rawText = item.innerText.replace(/\s+/g, " ").trim();

    if (
      ["contacts", "leads", "deals", "activities"].includes(
        rawText.toLowerCase(),
      )
    )
      return;

    // Must contain at least name + one field
    if (!rawText.includes("@") && !/\d{7,}/.test(rawText)) return;

    // Extract Fields
    const emailMatch = rawText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    const phoneMatch = rawText.match(/(\+?\d[\d\s\-()]{7,})/);

    const email = emailMatch?.[0] || "";
    const phone = phoneMatch?.[0] || "";

    // Name
    let name = rawText;
    if (email) name = name.replace(email, "");
    if (phone) name = name.replace(phone, "");
    name = name.split(" ").slice(0, 3).join(" ").trim();

    // Company & Title
    const tail = rawText
      .replace(name, "")
      .replace(email, "")
      .replace(phone, "")
      .trim();

    const parts = tail.split(" ");
    const title = parts.pop() || "";
    const company = parts.join(" ").trim();

    if (!name) return;

    contacts.push({
      id: generateId(item),
      name,
      phone,
      email,
      company,
      title,
    });
  });

  return contacts;
}

window.extractContacts = extractContacts;

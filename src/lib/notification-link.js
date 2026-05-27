function stripHtmlTags(value = "") {
  return String(value).replace(/<[^>]*>/g, " ");
}

function normalizeText(value = "") {
  return stripHtmlTags(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function normalizeLink(link) {
  if (!link || typeof link !== "string") return null;
  const trimmed = link.trim();
  return trimmed.length ? trimmed : null;
}

export function getNotificationDestination(notification) {
  const explicitLink = normalizeLink(notification?.link);
  if (explicitLink) return explicitLink;

  const sourceType = normalizeText(notification?.sourceType || "");
  const notificationType = normalizeText(notification?.notificationType || "");
  const content = normalizeText(
    `${notification?.title || ""} ${notification?.message || ""}`,
  );

  const haystack = `${sourceType} ${notificationType} ${content}`;

  if (/(onboarding|hoi nhap|hoi nhap nhan su)/.test(haystack)) {
    return "/onboardings/employee";
  }

  if (/(phan ca|ca lam|lich ca|shift)/.test(haystack)) {
    return "/shifts/personal";
  }

  if (/(hop dong|contract)/.test(haystack)) {
    return "/settings/general#my-contracts";
  }

  return null;
}

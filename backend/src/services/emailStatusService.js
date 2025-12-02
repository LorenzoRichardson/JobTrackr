// Map of phrases → application statuses
const STATUS_PATTERNS = [
  {
    status: 'Applied',
    patterns: [
      /thank you for applying/i,
      /we received your application/i,
      /your application has been received/i,
    ],
  },
  {
    status: 'OA', // Online Assessment
    patterns: [
      /online assessment/i,
      /coding challenge/i,
      /hackerrank/i,
      /codility/i,
      /take-home assignment/i,
    ],
  },
  {
    status: 'Interview',
    patterns: [
      /we would like to invite you/i,
      /we'd like to invite you/i,
      /interview/i,
      /phone screen/i,
      /technical screen/i,
      /onsite/i,
    ],
  },
  {
    status: 'Offer',
    patterns: [
      /we are pleased to offer/i,
      /we are excited to offer/i,
      /offer of employment/i,
      /offer letter/i,
    ],
  },
  {
    status: 'Rejected',
    patterns: [
      /we regret to inform you/i,
      /unfortunately/i,
      /we are unable to move forward/i,
      /we have decided not to move forward/i,
      /we will not be proceeding/i,
    ],
  },
];

// Decide which status this email implies (or null if unknown)
export function inferStatusFromEmail(subject, bodySnippet = '') {
  const text = `${subject || ''} ${bodySnippet || ''}`.toLowerCase();

  for (const entry of STATUS_PATTERNS) {
    for (const regex of entry.patterns) {
      if (regex.test(text)) {
        return entry.status;
      }
    }
  }

  // No clear match
  return null;
}

// Very naive company extractor: try to guess from subject
export function inferCompanyFromSubject(subject = '') {
  if (!subject) return null;

  // Split on common separators: "Google: Thank you...", "Application Update - Microsoft"
  const parts = subject.split(/[-–:|]/).map((p) => p.trim());

  for (const part of parts) {
    // Skip generic phrases
    if (
      /thank you for applying|application update|interview|assessment|online assessment/i.test(
        part
      )
    ) {
      continue;
    }

    const words = part.split(/\s+/);
    if (words.length >= 1 && words.length <= 4) {
      const hasCapitalized = words.some((w) =>
        /^[A-Z][a-zA-Z0-9]+$/.test(w)
      );
      if (hasCapitalized) {
        return part;
      }
    }
  }

  return null;
}

// Build a human-readable note explaining what happened
export function buildNoteFromEmail(status, subject, snippet = '') {
  if (!status) {
    return `Email processed but no clear status detected. Subject: "${subject}"`;
  }

  const shortSnippet = snippet.length > 80 ? snippet.slice(0, 77) + '…' : snippet;

  return `Status updated to ${status} based on email: "${subject}" — ${shortSnippet}`;
}

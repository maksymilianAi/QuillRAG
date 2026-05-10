/**
 * Edge-compatible RAG retrieval — keyword scoring over an inlined knowledge base.
 * No file system access, no external APIs. Safe for Vercel Edge Runtime.
 */

interface KnowledgeDoc {
  id: string;
  text: string;
  category: string;
}

const KNOWLEDGE_BASE: KnowledgeDoc[] = [
  // ── Core rules ─────────────────────────────────────────────────────────────
  {
    id: "core-1",
    category: "core",
    text: "Source of truth priority: Style rules in this prompt always win. Canonical vocabulary (brand glossary) wins over invented alternatives. Existing copy examples are structural reference only — anti-patterns must never be imitated, they must be flagged and corrected.",
  },
  {
    id: "core-2",
    category: "core",
    text: "Voice & tone: Direct, factual, human. Respect the user's time. No hype, no filler, no emotional padding. Contrast: 'Easily manage your expenses' → 'Manage your expenses'. 'Effortlessly upload files by simply scanning' → 'Scan the QR code to upload files'. 'Great news! Accounts linked' → 'Additional accounts linked to your login'.",
  },
  {
    id: "core-3",
    category: "core",
    text: "General writing rules: Active voice only. Oxford comma in lists. Use 'including' to enumerate sub-items. No exclamation marks in functional copy. No ellipses ('…') in functional copy. Em-dash (—) for separating clauses, never hyphen (-). No marketing filler: powerful, seamlessly, robust, comprehensive, streamline, effortlessly, simply, easily, just, unlock, empower, elevate, amazing, delightful, friendly reminder, great news, don't forget.",
  },
  {
    id: "core-4",
    category: "core",
    text: "Capitalization — Book Style (title case): Capitalize all words except prepositions ≤4 letters (at, by, of, in, on, to, for, from, with), conjunctions (and, or, but, nor, yet, so), and articles (a, an, the). Always capitalize first and last word. Use for: page titles, modal/dialog titles, section headings, column headers, buttons, email headlines, CTA links.",
  },
  {
    id: "core-5",
    category: "core",
    text: "Capitalization — Sentence style: Capitalize only the first word and proper names/brands/products (HSA, IRS, Reimburse Me). Use for: field labels, tooltips, descriptive text, support text, dropdown options, error messages, warning messages, pop-up notifications, checkbox confirmations, body copy.",
  },
  {
    id: "core-6",
    category: "core",
    text: "Writing patterns to follow: Verb-first in actions — View / Track / Manage / Reconcile / Submit / Review / Scan / Finish. Lists use 'including': 'including claims, contributions, and fees'. 1 sentence preferred, 2 max for support text. Technical terms used as-is: HSA, HRA, notional accounts, forfeitures, COBRA. HSA exceptions always called out separately from other account types.",
  },

  // ── Vocabulary ──────────────────────────────────────────────────────────────
  {
    id: "vocab-1",
    category: "vocabulary",
    text: "Canonical vocabulary — use these exact terms: HSA (not 'HSA account'), HRA (not 'HRA account'), FSA / HCFSA (not 'flex account'), COBRA as-is, EOB (not 'benefits statement'), Reimburse Me (product feature name), Pay a Bill (product feature name), Plan year (not 'benefit year'), Spend period (not 'spending window'), Payroll contributions (not 'salary contributions'), Notional accounts as-is, Forfeitures (not 'lost funds'), Excess contributions (not 'overpayments'), Excess earnings (not 'bonus earnings'), IRS limit (not 'government limit'), Plan enrollment (not 'plan registration'), Participant (not 'member' or 'beneficiary'), Benefit card (not 'debit card' or 'HSA card').",
  },
  {
    id: "vocab-2",
    category: "vocabulary",
    text: "Anti-patterns — flag and correct: 'Effortlessly upload files by simply scanning' → 'Scan the QR code to upload files.' | 'Easily track enrollment details' → 'Track enrollment details, fund movements, and related information.' | 'Great news! Additional accounts have been linked' → 'Additional accounts linked to your login.' | 'You're almost there... Finish registration' → 'Verify your email to finish registration.' | 'Don't Forget to Finish Your Account Verification' → 'Finish Your Account Verification' | 'Friendly reminder — you have an uncashed check' → 'You have an uncashed check waiting.' | 'Just a reminder that you have a contribution scheduled' → 'A contribution of $[amount] is scheduled'.",
  },
  {
    id: "vocab-3",
    category: "vocabulary",
    text: "More anti-patterns: 'Congratulations on Your Benefits Enrollment!' → 'Your Benefits Enrollment Is Confirmed' | 'Your Statement is Now Available!' → 'Your Statement Is Now Available' | 'Expense Activity Update - Action Required' → 'Expense Activity Update — Action Required' (em-dash not hyphen) | 'Unfortunately, the payment was unable to be processed' → 'The payment didn't go through' | 'This may effect your tax filing' → 'This may affect your tax filing' | Never use 'members' or 'beneficiaries' — always 'participants'.",
  },

  // ── Buttons ─────────────────────────────────────────────────────────────────
  {
    id: "btn-1",
    category: "element-buttons",
    text: "Button copy rules: Always Book Style (title case). Structure: action verb + noun — 'Submit Request', 'Change Refund Method', 'Log In', 'Reset Password', 'View Order Details'. Never use verb-only labels like 'Submit', 'Continue', 'OK' — always pair with a noun that tells the user what they're acting on.",
  },
  {
    id: "btn-2",
    category: "element-buttons",
    text: "Primary CTA rules: Only one primary CTA per screen or email. Must be unique — if the page already has 'Submit Claim', the next primary action cannot also be generic. Preferred verbs: View, Track, Submit, Manage, Upload, Verify, Reset, Register, Log In, Finish, Apply, Add, Remove, Confirm.",
  },
  {
    id: "btn-3",
    category: "element-buttons",
    text: "Button copy examples from the product: 'Log In' | 'Register' | 'Verify' | 'Reset Password' | 'Submit Request' | 'Submit Claim' | 'Upload a New Document' | 'View Order Details' | 'Track Your Order' | 'Go to Payout Definitions' | 'Go to Services' | 'Got it' (acceptable in modal confirmation only) | 'Skip Sync (2/3)' (step progress in multi-step flow) | 'Apply Changes' | 'Add Bank Account' | 'Remove Card'.",
  },
  {
    id: "btn-4",
    category: "element-buttons",
    text: "Secondary and destructive buttons: Secondary CTA uses outline or ghost style, still Book Style, noun-paired: 'Go to Services', 'View Details', 'Cancel Request'. Destructive actions must be explicit: 'Remove Card', 'Delete Account', 'Cancel Enrollment' — never just 'Remove' or 'Delete'.",
  },

  // ── Headings ────────────────────────────────────────────────────────────────
  {
    id: "hdg-1",
    category: "element-headings",
    text: "Page titles: Book Style, descriptive noun phrase, 2–6 words. No generic labels like 'Settings', 'Details', 'Overview'. Must identify what the page is, not just that it exists. Examples: 'Claim Summary' (not 'Expense Details'), 'Payroll Contributions', 'Health Plan Enrollment', 'Account Deadline Alert'.",
  },
  {
    id: "hdg-2",
    category: "element-headings",
    text: "Modal and dialog titles: Book Style, concise noun phrase, max 5 words. Must describe the action or content, not the UI pattern. 'Request Excess Contribution Withdraw' ✓ | 'Sync Updates Across Organizations' ✓ | 'Confirm' ✗ (too generic) | 'Are You Sure?' ✗ (question format, too conversational for modal title).",
  },
  {
    id: "hdg-3",
    category: "element-headings",
    text: "Section headings: Book Style, 2–5 words, noun phrase or verb-noun. 'LLM Settings', 'Copy Variants', 'Grammar & Style Fixes', 'Account Activity', 'Plan Enrollment Details'. No punctuation at end of headings.",
  },
  {
    id: "hdg-4",
    category: "element-headings",
    text: "Empty state headings: Sentence style, explain what will appear here or what the user can do. 'No claims yet' | 'Your claims will appear here' | 'No transactions this period'. Paired with a verb-first CTA: 'Submit a Claim', 'Add a Bank Account'. Never just 'Nothing here' or 'Empty'.",
  },
  {
    id: "hdg-5",
    category: "element-headings",
    text: "Status and confirmation headings: Book Style, past tense for completed actions, present for active states. 'Mental Health Service Created' ✓ | 'Your Benefits Enrollment Is Confirmed' ✓ | 'Payment Processed' ✓ | 'Mental Health service created!' ✗ (sentence case + exclamation mark).",
  },

  // ── Modals ──────────────────────────────────────────────────────────────────
  {
    id: "modal-1",
    category: "element-modals",
    text: "Modal copy structure: Title (Book Style, ≤5 words, noun phrase) → Body (sentence style, 1–3 sentences, user-centered) → Optional warning/notice → CTAs (Book Style, primary first). Body must start from the user's perspective, not system state: 'You've made changes that can be applied…' not 'We detected updates to properties…'.",
  },
  {
    id: "modal-2",
    category: "element-modals",
    text: "Confirmation modal patterns: Title describes the completed action in Book Style. Body provides next steps or what the user should know. CTA is contextual ('Got it' is acceptable here). Checkboxes use sentence style, no period: 'I understand the above rules'. Warning blocks use sentence style with period.",
  },
  {
    id: "modal-3",
    category: "element-modals",
    text: "Modal — Sync Updates Across Organizations: Anti-pattern title: 'Select updates to push to lower-level organizations' → Correct: 'Sync Updates Across Organizations'. Body: 'You've made changes that can be applied to lower-level organizations. Select which updates you'd like to apply across all lower-level organizations.' Conditional note: 'If no updates are selected, changes will only apply to this organization and any future lower-level organizations.' CTA with step context: 'Skip Sync (2/3)'.",
  },
  {
    id: "modal-4",
    category: "element-modals",
    text: "Modal — Request Excess Contribution Withdraw: Title: 'Request Excess Contribution Withdraw' | Description: 'Excess contributions are amounts you put into your HSA beyond the IRS annual limit, which must be corrected to avoid taxes and penalties.' | Label: 'Amount entered will be debited from your HSA.' | Warning title: 'Excess contribution correction withdrawal' | Checkbox: 'I understand the above rules'.",
  },
  {
    id: "modal-5",
    category: "element-modals",
    text: "Modal — ER Reactivation (in-progress action): Use present progressive for actions in progress. 'Reactivating [Employer 1]' (not '[ER] has been reactivated'). Body: '[Employer 1] and any selected plans are being reactivated using their previous settings.' Numbered step headings have no period — only description body beneath each step does. Do not embed inline navigation links inside step description text.",
  },

  // ── Emails ──────────────────────────────────────────────────────────────────
  {
    id: "email-1",
    category: "element-emails",
    text: "Email structure rules: Headlines use Book Style, 4–6 words (up to 8 when context requires). No exclamation marks. One CTA button per email. Sign-off always: 'The {partner name} Team'. Fallback link always: 'Button above doesn't work? Try this link:'. Footer asterisk for balance dates: '* Balance as of MM/DD/YYYY'. Checklist items end with period. HSA exceptions always called out separately.",
  },
  {
    id: "email-2",
    category: "element-emails",
    text: "Email CTA buttons: Book Style, verb-first: 'Log In', 'Register', 'Verify', 'Reset Password'. Body paragraphs: 2–3 sentences max, direct and informative, no marketing language.",
  },
  {
    id: "email-3",
    category: "element-emails",
    text: "Email headlines — Account & onboarding: 'Your Benefits Enrollment Is Confirmed' | 'Finish Your Account Verification' | 'Complete Your Registration' | 'Additional Accounts Added to Your Login'. Welcome body: 'Take full advantage of your benefits with [Partner Name]. Here you can access your [account names].'",
  },
  {
    id: "email-4",
    category: "element-emails",
    text: "Email headlines — Security & access: 'Reset Your Password' | 'Your Contact Information Has Been Updated'. Warning block: 'Do not share this email with anyone. Customer service representatives will never ask you for this information.' Body pattern for changes: 'Your {field} has been updated to {new value}. If you didn't make this change, contact us immediately.'",
  },
  {
    id: "email-5",
    category: "element-emails",
    text: "Email headlines — Contributions & investments: 'Your Contribution Has Processed' | 'Upcoming Contribution to Your Account' | 'Problem Processing Your Contribution' | 'Investment Purchase Initiated'. Body for problem: 'The payment didn't go through. To reapply it, create another contribution request with updated banking information.'",
  },
  {
    id: "email-6",
    category: "element-emails",
    text: "Email headlines — Claims & payments: 'Expense Activity Update — Action Required' (em-dash) | 'Expense Activity Update — No Action Required' | 'Action Required: Problem Processing Your Payment' | 'Payment Method Updated' | 'Your Check Is Waiting' | 'Check Expired: Money Returned to Your Account'. Body for payment method: 'Your changes are saved for future Reimburse Me requests.'",
  },
  {
    id: "email-7",
    category: "element-emails",
    text: "Email headlines — Account status & alerts: 'Card Is [Active/Locked/Closed/Out for Delivery]' | 'New Bank Account Added' | 'Your Statement Is Now Available' | 'Account Deadline Alert' | 'Your Account Expires Soon' | 'You've Met Your [Trigger Type]'. Body for deadline: 'Your plan year is coming to an end. Check your account deadlines so you don't lose any money.' HSA exception: 'Your HSA money never expires. There are no deadlines to use your money.'",
  },

  // ── Labels & errors ─────────────────────────────────────────────────────────
  {
    id: "label-1",
    category: "element-labels",
    text: "Field labels: Sentence style, 1–3 words, no punctuation. Noun-first: 'First name', 'Account number', 'Plan year', 'Service date'. Never verb-first for labels. No colons after labels.",
  },
  {
    id: "label-2",
    category: "element-labels",
    text: "Support text (helper text under fields): Sentence style, noun-first or verb-first, no period unless 2 sentences. 'Amount entered will be debited from your HSA.' | 'Must match the name on your bank account.' | 'Your employer may cover part of this cost.'",
  },
  {
    id: "label-3",
    category: "element-labels",
    text: "Tooltips: Sentence style, full sentences, period at end, factual and neutral. Pattern: 'Limits the [what] that can be [action] [scope].' Examples: 'Limits the total amount that can be spent across the plan within the designated spend period, regardless of individual participants.' | 'Limits the amount that can be spent per person within the plan during the designated spend period.'",
  },
  {
    id: "label-4",
    category: "element-labels",
    text: "Dropdown options: Sentence style, noun phrases, parallel structure within the same dropdown. Examples from plan settings: 'Total plan limit', 'IRS limit', 'Person spend limit', 'Spend category spend limit', 'Unlimited', 'Monthly', 'Plan year'.",
  },
  {
    id: "label-5",
    category: "element-labels",
    text: "Error messages: Sentence style, period at end, action-oriented — tell the user what to do, not just what went wrong. Avoid blame ('You entered' → 'Enter'). Examples: 'Enter a valid email address.' | 'The payment didn't go through. Create another contribution request with updated banking information.' | 'This field is required.' (not 'You forgot to fill this in.')",
  },
  {
    id: "label-6",
    category: "element-labels",
    text: "Warning and inline alert messages: Sentence style, period at end. Lead with user benefit or consequence before the action. 'To receive your money faster, upload a clearer photo or a different document including the missing details.' Not: 'A clearer photo will let us try again to find the information.' Inline alert heading can use question format: 'Are the missing details on your document?'",
  },
  {
    id: "label-7",
    category: "element-labels",
    text: "Notification copy (pop-ups, toasts): Sentence style, brief, factual. 'Additional accounts linked to your login.' | 'Your payment method has been updated.' | 'Claim submitted.' No exclamation marks, no 'Great news!', no 'Done!'.",
  },
  {
    id: "label-8",
    category: "element-labels",
    text: "Checkbox confirmations: Sentence style, short, no period. 'I understand the above rules' | 'I agree to the terms and conditions' | 'Send me account updates by email'. Never title case for checkboxes.",
  },
  {
    id: "label-9",
    category: "element-labels",
    text: "Contextual links: Sentence style, question or conditional format. 'Have a bill you haven't paid yet? Send your payment directly to the provider here – Pay a Bill.' | 'Why Does It Matter?' (Book Style when used as standalone CTA link).",
  },

  // ── Examples ────────────────────────────────────────────────────────────────
  {
    id: "ex-1",
    category: "example",
    text: "Reports section card descriptions: Prefund Invoice — 'View prefunding invoice details, including plan enrollments, policy election amounts, and funding calculations.' | Contribution Invoice — 'Reconcile contribution invoicing and view invoice details. This report is limited to contribution funded accounts.' | Replenishment Invoice — 'Replenishment invoices fund payments and reimbursements. Reconcile invoices and view details.' | Health Plan Enrollment — 'View employee health plan deductible enrollments, coverage details, and HRA status.' | Participant Account Activity — 'View participant account activity, including claims, contributions, fees, balances, and enrollment details.' | Claim Activity — 'Track participant claims, including submissions, statuses, payments, and plan year data.' | Payroll Contributions — 'View payroll contribution details for HSA and notional accounts.'",
  },
  {
    id: "ex-2",
    category: "example",
    text: "Page copy — Reimbursement flow (Let's Find Your Receipt): Page title: 'Let's Find Your Receipt' | Body: 'Let's start by adding your documentation. This could be a receipt, bill, or an EOB. We'll be able to pull some details from the document automatically.' | Contextual link: 'Have a bill you haven't paid yet? Send your payment directly to the provider here – Pay a Bill.' | Upload area: 'Drag or browse a picture of your receipt' | QR description: 'Scan the QR code with your device's camera to upload files.' (not 'Effortlessly upload files by simply scanning…').",
  },
  {
    id: "ex-3",
    category: "example",
    text: "Plan settings — Spend limits (Healthcare FSA) tooltips: Total plan limit: 'Limits the total amount that can be spent across the plan within the designated spend period, regardless of individual participants.' Person spend limit: 'Limits the amount that can be spent per person within the plan during the designated spend period.' Dropdown options: 'Total plan limit', 'IRS limit', 'Person spend limit', 'Spend category spend limit', 'Unlimited', 'Monthly', 'Plan year'.",
  },
  {
    id: "ex-4",
    category: "example",
    text: "Page copy — Claim Summary (Reimburse Myself flow): Page title: 'Claim Summary' (not 'Expense Details' — use canonical term). Body: 'Review the details we pulled from your document, add any missing details, and choose your payment preferences before submitting.' Warning lead: 'To receive your money faster, upload a clearer photo or a different document including the missing details.' Inline alert heading: 'Are the missing details on your document?' Fallback body: 'If you do not have another document, you can add the missing details below.' CTAs: 'Upload a New Document', 'Why Does It Matter?' Field labels: 'Service For', 'Service Description'.",
  },
  {
    id: "ex-5",
    category: "example",
    text: "Modal copy — ER Reactivation next steps: 1. Review employer and plan settings — 'All previously saved settings have been saved. Verify these settings and add any additional plans being offered.' 2. Load updated census — 'Employment statuses may have been updated during the termination process and will not be automatically reverted.' 3. Load enrollment — 'Previous enrollment will not be automatically reactivated even if the plan was reactivated. Employees must be re-enrolled into each account.' 4. Add or reactivate admin contacts — 'Previous admin access was removed at the time of termination.' 5. Review payroll calendars — 'If your plans support scheduled contributions, review any supported payroll calendars.'",
  },
  {
    id: "ex-6",
    category: "example",
    text: "Onboarding email checklist items (all end with period): 'View your account balance and manage expenses.' | 'Request payments to your provider or reimburse yourself.' | 'Activate and manage your benefit card.' | Pattern: verb-first, concise, 1 action per item, Oxford comma in list context.",
  },
];

const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
  "has", "have", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "can", "that", "this", "it", "its", "i",
  "you", "we", "they", "not", "no", "as", "up", "if", "so", "than",
  "into", "about", "what", "how", "which", "when", "my", "your", "our",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\s\W]+/)
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));
}

/**
 * Retrieve the top-K most relevant knowledge base snippets for a given query.
 * Uses keyword overlap scoring — no external APIs, no file system.
 */
export function retrieve(query: string, topK = 5): string[] {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];

  const scored = KNOWLEDGE_BASE.map((doc) => {
    const docTokens = new Set(tokenize(doc.text));
    const overlap = queryTokens.filter((t) => docTokens.has(t)).length;
    // Boost exact substring matches for short domain terms (HSA, button, tooltip, etc.)
    const queryLower = query.toLowerCase();
    const bonus = doc.text.toLowerCase().includes(queryLower.slice(0, 20)) ? 2 : 0;
    return { text: doc.text, score: overlap + bonus };
  });

  return scored
    .filter((d) => d.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((d) => d.text);
}

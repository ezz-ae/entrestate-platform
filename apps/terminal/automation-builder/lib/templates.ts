import type { AutomationTemplate } from "./automation-types"

export const automationTemplates: AutomationTemplate[] = [
  {
    id: "template_lead_qualifier",
    name: "Lead Qualifier",
    description: "Qualify incoming leads with clear questions and a clean summary for the team.",
    role: "lead_qualifier",
    defaultDefinition: {
      market: "UAE",
      companyType: "broker",
      inputs: {
        fields: [
          {
            id: "full_name",
            label: "Full name",
            type: "text",
            required: true,
            question: "May I have your full name?",
          },
          {
            id: "phone",
            label: "Phone number",
            type: "phone",
            required: true,
            question: "Best number to reach you on WhatsApp?",
          },
          {
            id: "budget_range",
            label: "Budget range (AED)",
            type: "currency",
            required: true,
            question: "What budget range should I keep in mind?",
          },
          {
            id: "preferred_area",
            label: "Preferred area",
            type: "text",
            required: true,
            question: "Which area or community do you prefer?",
          },
          {
            id: "timeline",
            label: "Move timeline",
            type: "select",
            required: true,
            options: ["0-3 months", "3-6 months", "6-12 months", "Just exploring"],
            question: "When are you looking to move?",
          },
          {
            id: "contact_consent",
            label: "Contact consent",
            type: "select",
            required: true,
            options: ["Yes", "No"],
            question: "Do we have your permission to follow up by phone or WhatsApp?",
          },
        ],
      },
      rules: {
        strictMode: true,
        toggles: [
          {
            id: "require_budget",
            label: "Budget is required before matching",
            description: "Ask for a budget range before showing any listings.",
            enabled: true,
            constraint: "require_budget",
          },
          {
            id: "consent_required",
            label: "Confirm contact consent",
            description: "Confirm permission to follow up by phone or WhatsApp.",
            enabled: true,
            constraint: "consent_required",
          },
        ],
      },
      outputs: {
        channels: ["whatsapp", "crm_summary"],
        tone: "friendly",
        summaryStyle: "balanced",
      },
      connectors: {
        listings: true,
        projects: true,
        marketIntel: true,
        crm: true,
      },
    },
    sampleConversation: [
      { role: "user", message: "Hi, I want to buy in Dubai." },
      { role: "agent", message: "Great. Which area do you prefer and what budget range should I keep in mind?" },
      { role: "user", message: "Dubai Hills, around 2M." },
    ],
    sampleOutput: {
      whatsapp:
        "Thanks for the details. I will share options in Dubai Hills around 2M AED. Any bedroom preference?",
      crm_summary: "Lead wants Dubai Hills around 2M AED. Needs bedroom preference and timeline.",
    },
  },
  {
    id: "template_buyer_matcher",
    name: "Buyer Matcher",
    description: "Match buyers to listings with clear fit notes and next steps.",
    role: "buyer_matcher",
    defaultDefinition: {
      market: "UAE",
      companyType: "broker",
      inputs: {
        fields: [
          {
            id: "budget",
            label: "Budget (AED)",
            type: "currency",
            required: true,
            question: "What is your budget range?",
          },
          {
            id: "bedrooms",
            label: "Bedrooms",
            type: "select",
            required: true,
            options: ["Studio", "1BR", "2BR", "3BR+"],
            question: "How many bedrooms do you need?",
          },
          {
            id: "area",
            label: "Preferred area",
            type: "text",
            required: true,
            question: "Which area feels right for you?",
          },
          {
            id: "ready",
            label: "Ready to buy",
            type: "select",
            required: true,
            options: ["Ready now", "3-6 months", "6-12 months"],
            question: "When are you ready to buy?",
          },
        ],
      },
      rules: {
        strictMode: true,
        toggles: [
          {
            id: "prioritize_ready",
            label: "Prioritize ready buyers",
            description: "Surface ready inventory first for buyers who can move now.",
            enabled: true,
            constraint: "prioritize_ready",
          },
          {
            id: "strict_inventory_only",
            label: "Only show verified inventory",
            description: "Use internal listings only. No invented availability.",
            enabled: true,
            constraint: "strict_inventory_only",
          },
        ],
      },
      outputs: {
        channels: ["whatsapp", "call_script", "crm_summary"],
        tone: "direct",
        summaryStyle: "balanced",
      },
      connectors: {
        listings: true,
        projects: true,
        marketIntel: true,
        crm: true,
      },
    },
    sampleConversation: [
      { role: "user", message: "Need a 2BR in Marina around 2.4M." },
      { role: "agent", message: "Noted. When would you like to move, and do you prefer ready or off-plan?" },
    ],
    sampleOutput: {
      whatsapp: "I have a few verified 2BR options in Marina around 2.4M. Ready or off-plan?",
      crm_summary: "Buyer looking for 2BR in Dubai Marina, budget 2.4M AED. Timeline pending.",
    },
  },
  {
    id: "template_investor_advisor",
    name: "Investor Advisor",
    description: "Create a one-page investor memo with strategy, timing, and risk notes.",
    role: "investor_advisor",
    defaultDefinition: {
      market: "UAE",
      companyType: "investment",
      inputs: {
        fields: [
          {
            id: "budget_tier",
            label: "Budget tier",
            type: "select",
            required: true,
            options: ["< 1M", "1-2M", "2-5M", "5M+"],
            question: "Which budget tier should we work with?",
          },
          {
            id: "horizon",
            label: "Holding horizon",
            type: "select",
            required: true,
            options: ["0-2 years", "2-4 years", "4-6 years"],
            question: "What is your holding horizon?",
          },
          {
            id: "risk_tolerance",
            label: "Risk tolerance",
            type: "select",
            required: true,
            options: ["Conservative", "Balanced", "Aggressive"],
            question: "How do you feel about risk?",
          },
          {
            id: "liquidity",
            label: "Liquidity preference",
            type: "select",
            required: true,
            options: ["Need quick resale", "Flexible", "Long hold is fine"],
            question: "Do you need quick resale or long hold is fine?",
          },
        ],
      },
      rules: {
        strictMode: true,
        toggles: [
          {
            id: "avoid_speculative",
            label: "Avoid speculative inventory",
            description: "Stay within verified delivery and pricing signals.",
            enabled: true,
            constraint: "avoid_speculative",
          },
          {
            id: "require_timeline",
            label: "Timeline required for memo",
            description: "Ask for a holding horizon before giving a recommendation.",
            enabled: true,
            constraint: "require_timeline",
          },
        ],
      },
      outputs: {
        channels: ["investor_memo", "crm_summary"],
        tone: "executive",
        summaryStyle: "detailed",
      },
      connectors: {
        listings: true,
        projects: true,
        marketIntel: true,
        crm: false,
      },
    },
    sampleConversation: [
      { role: "user", message: "I want a safe investment around 3M AED." },
      { role: "agent", message: "Noted. What is your holding horizon and risk tolerance?" },
    ],
    sampleOutput: {
      investor_memo:
        "Strategy: focus on ready inventory with stable pricing. Timing: 12-24 months. Risks: supply spikes in fringe areas.",
      crm_summary: "Investor budget 3M AED. Needs horizon and risk tolerance.",
    },
  },
]

export const agentTemplates = automationTemplates

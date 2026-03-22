export const FRAMEWORK_PHASES = [
  {
    id: 1,
    name: 'Market & Niche',
    steps: [
      {
        number: 1,
        name: 'Start with a sub-niche inside a big market',
        why: 'Beachheading in a large market prevents commoditization and lets you dominate a focused audience before expanding horizontally.',
      },
      {
        number: 2,
        name: 'Map their daily workflow end-to-end',
        why: 'Understanding the full workflow reveals friction points that create revenue, not just isolated pain points that look like solutions but solve nothing.',
      },
      {
        number: 3,
        name: 'Identify where money changes hands',
        why: 'Revenue flows where real value exchange happens; identify that moment and you know your addressable market size and how much users will pay.',
      },
      {
        number: 4,
        name: 'Spot the repetitive mechanical steps',
        why: 'Agents automate repetition; identifying which steps waste time daily determines the economic model and the scale of your market.',
      },
      {
        number: 5,
        name: 'Quantify the cost of those steps',
        why: 'Put a number on the cost (hours/month × hourly rate = annual waste) — founders guessing at unit economics lose to founders who know the number.',
      },
    ],
  },
  {
    id: 2,
    name: 'Content & Distribution Validation',
    steps: [
      {
        number: 6,
        name: 'Create scroll-stopping content around that workflow',
        why: 'Content proves you understand the niche deeply and attracts your first users organically; it is free customer research disguised as education.',
      },
      {
        number: 7,
        name: 'Study which posts get saves, replies, and DMs',
        why: 'Saves > likes > comments > DMs — track this funnel to find the angle that converts interest into qualified leads without paid ads.',
      },
      {
        number: 8,
        name: 'Double down on the organic angles that convert',
        why: 'Organic traction on the right message lets you raise money, build in public, and attract co-founders — paid ads amplify a weak message and waste cash.',
      },
      {
        number: 9,
        name: 'Run paid ads on proven organic winners',
        why: 'Testing paid ads on unproven angles burns budget; testing only on content that already converts organically gives you ROI clarity and CAC data.',
      },
      {
        number: 10,
        name: 'Capture emails from day one',
        why: 'Email lists are the only audience you own; platforms change algorithms and silence you overnight, but an email list survives any distribution shift.',
      },
    ],
  },
  {
    id: 3,
    name: 'Product & Agent Architecture',
    steps: [
      {
        number: 11,
        name: 'Manually perform the workflow yourself',
        why: 'Building what you do not understand produces brittle systems; manual mastery exposes edge cases and reveals the true order of operations.',
      },
      {
        number: 12,
        name: 'Document every step precisely',
        why: 'Agents need deterministic instruction; vague process documentation means agents hallucinate and fail in production.',
      },
      {
        number: 13,
        name: 'Separate judgment tasks from mechanical tasks',
        why: 'Agents cannot judge; automating judgment tasks produces liability; judgment stays with humans, mechanical tasks go to agents.',
      },
      {
        number: 14,
        name: 'Turn mechanical tasks into structured agent workflows',
        why: 'Structuring tasks with clear inputs, outputs, and decision trees lets agents work reliably; unstructured tasks drown agents in hallucinations.',
      },
      {
        number: 15,
        name: 'Design agents to complete full tasks, not suggestions',
        why: 'Users want completion and accountability; agents that complete tasks and take responsibility drive retention and referrals.',
      },
      {
        number: 16,
        name: 'Connect to real tools: email, Slack, Notion, CRM, Stripe',
        why: 'Agents connected to real systems that actually send emails, book meetings, and charge cards create workflow integration and switching costs.',
      },
      {
        number: 17,
        name: 'Add orchestration, retries, and verification checks',
        why: 'Systems break; silent failures and customer data loss create liability and churn — orchestration prevents both.',
      },
      {
        number: 18,
        name: 'Store user preferences + long-term memory',
        why: 'Stateless agents reset after each call; memory of preferences and past decisions reduces repetition and creates personalized, sticky experiences.',
      },
      {
        number: 19,
        name: 'Launch narrow with high-touch onboarding',
        why: 'High-touch onboarding proves the workflow works and builds customer loyalty before competitive pressure forces commoditization.',
      },
      {
        number: 20,
        name: 'Publish measurable proof: revenue, hours saved, errors reduced',
        why: 'Investors and customers believe numbers, not claims; demonstrable ROI disarms skepticism and drives growth.',
      },
    ],
  },
  {
    id: 4,
    name: 'Pricing & Moat',
    steps: [
      {
        number: 21,
        name: 'Move pricing from per-seat to per-task',
        why: 'Per-seat pricing creates churn pressure from unused seats and budget cuts; per-task pricing aligns revenue to usage and makes unit economics visible.',
      },
      {
        number: 22,
        name: 'Shift to outcome pricing tied to revenue created',
        why: 'Per-task pricing plateaus; outcome pricing (percentage of revenue your agent creates) creates alignment and lets you capture upside as customers succeed.',
      },
      {
        number: 23,
        name: 'Increase pricing as value compounds',
        why: 'Agents improve with data and feedback; raising prices as value increases prevents commoditization and captures the economic value you have created.',
      },
      {
        number: 24,
        name: 'Expand into adjacent workflows within the same niche',
        why: 'Customers hire you for one job; expanding into related workflows deepens the relationship, multiplies revenue per customer, and prevents competition.',
      },
      {
        number: 25,
        name: 'Orchestrate multiple agents across the full lifecycle',
        why: 'One agent in one workflow is vulnerable to disruption; multiple agents across the full customer lifecycle create a moat of integration and switching costs.',
      },
      {
        number: 26,
        name: 'Build switching costs through data + memory',
        why: 'Customer data, agent memory, and integration depth make replacing you expensive — this is the real moat.',
      },
      {
        number: 27,
        name: 'Turn power users into public case studies',
        why: 'Public case studies showing real revenue, hours, and error metrics for real customers drive inbound sales and partner referrals.',
      },
      {
        number: 28,
        name: 'Hire operators from inside the niche',
        why: 'Operators who lived the workflow before automation reach deep product-market fit faster than founders building from the outside in.',
      },
      {
        number: 29,
        name: 'Reinvest profits into distribution + product depth',
        why: 'Compounding in SaaS means improving the product, deepening the moat, expanding distribution, and increasing pricing — repeat until defensible.',
      },
      {
        number: 30,
        name: 'Become the default execution layer for that sub-niche',
        why: '"Default" means 70%+ wallet share, inbound recruitment, and exit valuations at 10x revenue multiples.',
      },
    ],
  },
]

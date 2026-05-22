import { Request, Response } from 'express';
import { db } from '../db';
import {
  seoKeywords, seoAuditIssues, seoContentBriefs, seoBriefs,
  workspaces, clients
} from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { AppError, asyncHandler } from '../utils/errors';

const safeJsonParse = (
  str: string | null, fallback: any = []) => {
  if (!str) return fallback;
  try { return JSON.parse(str); }
  catch { return fallback; }
};

const getDemoKeywords = (domain: string) => ([
  {
    id:'dk-1', keyword:'digital marketing agency',
    domain, currentRank:8, previousRank:12,
    bestRank:6, searchVolume:18100, difficulty:67,
    cpc:8.50, intent:'commercial',
    cluster:'Agency Services',
    rankChange:4, isTracked:true,
    device:'desktop', country:'US',
    lastChecked:new Date().toISOString(),
  },
  {
    id:'dk-2', keyword:'social media marketing',
    domain, currentRank:15, previousRank:18,
    bestRank:11, searchVolume:49500, difficulty:72,
    cpc:6.20, intent:'informational',
    cluster:'Social Media',
    rankChange:3, isTracked:true,
    device:'desktop', country:'US',
    lastChecked:new Date().toISOString(),
  },
  {
    id:'dk-3', keyword:'seo services for businesses',
    domain, currentRank:23, previousRank:19,
    bestRank:18, searchVolume:8100, difficulty:58,
    cpc:12.40, intent:'commercial',
    cluster:'SEO Services',
    rankChange:-4, isTracked:true,
    device:'desktop', country:'US',
    lastChecked:new Date().toISOString(),
  },
  {
    id:'dk-4', keyword:'marketing automation tools',
    domain, currentRank:4, previousRank:7,
    bestRank:3, searchVolume:27100, difficulty:65,
    cpc:9.80, intent:'commercial',
    cluster:'Marketing Tools',
    rankChange:3, isTracked:true,
    device:'desktop', country:'US',
    lastChecked:new Date().toISOString(),
  },
  {
    id:'dk-5', keyword:'ad campaign management',
    domain, currentRank:11, previousRank:11,
    bestRank:9, searchVolume:12400, difficulty:61,
    cpc:7.60, intent:'transactional',
    cluster:'Campaign Management',
    rankChange:0, isTracked:true,
    device:'desktop', country:'US',
    lastChecked:new Date().toISOString(),
  },
  {
    id:'dk-6', keyword:'best marketing dashboard',
    domain, currentRank:6, previousRank:9,
    bestRank:4, searchVolume:5400, difficulty:52,
    cpc:11.20, intent:'commercial',
    cluster:'Marketing Tools',
    rankChange:3, isTracked:true,
    device:'desktop', country:'US',
    lastChecked:new Date().toISOString(),
  },
  {
    id:'dk-7', keyword:'ppc management agency',
    domain, currentRank:31, previousRank:28,
    bestRank:24, searchVolume:9900, difficulty:70,
    cpc:15.30, intent:'commercial',
    cluster:'Agency Services',
    rankChange:-3, isTracked:true,
    device:'desktop', country:'US',
    lastChecked:new Date().toISOString(),
  },
  {
    id:'dk-8', keyword:'content marketing strategy',
    domain, currentRank:19, previousRank:22,
    bestRank:15, searchVolume:33100, difficulty:68,
    cpc:5.90, intent:'informational',
    cluster:'Content Marketing',
    rankChange:3, isTracked:true,
    device:'desktop', country:'US',
    lastChecked:new Date().toISOString(),
  },
]);

const getDemoAuditIssues = (domain: string) => ([
  {
    id:'ai-1', domain,
    issueType:'missing_meta',
    severity:'high',
    url:`https://${domain}/about`,
    description:'Page is missing meta description tag.',
    recommendation:'Add a compelling meta description between 120-160 characters that includes target keyword.',
    isFixed:false,
    auditDate:new Date().toISOString(),
  },
  {
    id:'ai-2', domain,
    issueType:'slow_page',
    severity:'critical',
    url:`https://${domain}/services`,
    description:'Page load time is 4.8 seconds — well above the 2.5s threshold.',
    recommendation:'Optimize images, enable compression, and use a CDN to reduce load time below 2.5s.',
    isFixed:false,
    auditDate:new Date().toISOString(),
  },
  {
    id:'ai-3', domain,
    issueType:'broken_link',
    severity:'high',
    url:`https://${domain}/blog/old-post`,
    description:'Internal link returns 404 error.',
    recommendation:'Update or remove the broken internal link. Set up a 301 redirect if page was moved.',
    isFixed:false,
    auditDate:new Date().toISOString(),
  },
  {
    id:'ai-4', domain,
    issueType:'missing_alt',
    severity:'medium',
    url:`https://${domain}/`,
    description:'3 images on homepage are missing alt text attributes.',
    recommendation:'Add descriptive alt text to all images including target keywords where relevant.',
    isFixed:false,
    auditDate:new Date().toISOString(),
  },
  {
    id:'ai-5', domain,
    issueType:'core_web_vitals',
    severity:'critical',
    url:`https://${domain}/pricing`,
    description:'Cumulative Layout Shift (CLS) score is 0.28 — above the 0.1 threshold.',
    recommendation:'Reserve space for dynamic content, avoid inserting content above existing content.',
    isFixed:true,
    auditDate:new Date().toISOString(),
  },
  {
    id:'ai-6', domain,
    issueType:'missing_h1',
    severity:'medium',
    url:`https://${domain}/contact`,
    description:'Contact page is missing an H1 heading tag.',
    recommendation:'Add a clear H1 heading that includes your brand name and primary service.',
    isFixed:false,
    auditDate:new Date().toISOString(),
  },
  {
    id:'ai-7', domain,
    issueType:'duplicate_content',
    severity:'high',
    url:`https://${domain}/services/seo`,
    description:'Similar content found on multiple pages — potential duplicate content penalty.',
    recommendation:'Use canonical tags to indicate the preferred version of duplicate pages.',
    isFixed:false,
    auditDate:new Date().toISOString(),
  },
]);

const getDemoContentBriefs = () => ([
  {
    id:'cb-1',
    targetKeyword:'digital marketing agency guide',
    title:'The Complete Guide to Choosing a Digital Marketing Agency in 2026',
    suggestedWordCount:2500,
    headings:[
      'What is a Digital Marketing Agency?',
      'Types of Digital Marketing Agencies',
      'How to Evaluate Agency Performance',
      'Questions to Ask Before Hiring',
      'Red Flags to Watch Out For',
      'How to Measure ROI from Your Agency',
      'Top Agency Pricing Models Explained',
    ],
    keywords:[
      'digital marketing agency',
      'marketing agency services',
      'hire marketing agency',
      'agency ROI',
      'marketing partner',
    ],
    competitors:[
      'hubspot.com/marketing/digital-agency',
      'semrush.com/blog/digital-agency',
      'wordstream.com/digital-marketing-agency',
    ],
    searchVolume:18100,
    difficulty:67,
    intent:'informational',
    status:'draft',
  },
  {
    id:'cb-2',
    targetKeyword:'marketing automation tools comparison',
    title:'Best Marketing Automation Tools in 2026: Complete Comparison',
    suggestedWordCount:3000,
    headings:[
      'What is Marketing Automation?',
      'Top 10 Marketing Automation Platforms',
      'Feature Comparison Table',
      'Pricing Breakdown by Platform',
      'Best for Small Agencies vs Enterprise',
      'How to Choose the Right Platform',
      'Migration Tips and Best Practices',
    ],
    keywords:[
      'marketing automation tools',
      'automation platform comparison',
      'best marketing software',
      'email automation',
      'workflow automation',
    ],
    competitors:[
      'g2.com/categories/marketing-automation',
      'capterra.com/marketing-automation-software',
    ],
    searchVolume:27100,
    difficulty:65,
    intent:'commercial',
    status:'in_progress',
  },
]);

const getDemoCompetitorGap = (domain: string) => ({
  domain,
  competitors: [
    {
      domain: 'competitor1.com',
      overlapKeywords: 45,
      gapKeywords: 128,
      theirRanking: 'Better',
      topGapKeywords: [
        { keyword:'email marketing automation',
          theirRank:3, yourRank:null,
          volume:22000 },
        { keyword:'marketing analytics platform',
          theirRank:6, yourRank:null,
          volume:14800 },
        { keyword:'crm for marketing agencies',
          theirRank:4, yourRank:null,
          volume:9900 },
      ]
    },
    {
      domain: 'competitor2.com',
      overlapKeywords: 32,
      gapKeywords: 89,
      theirRanking: 'Similar',
      topGapKeywords: [
        { keyword:'social media scheduling tool',
          theirRank:5, yourRank:null,
          volume:18600 },
        { keyword:'instagram marketing tools',
          theirRank:8, yourRank:null,
          volume:12400 },
      ]
    },
  ],
  opportunities: [
    { keyword:'all in one marketing platform',
      volume:8100, difficulty:54,
      opportunity:'High' },
    { keyword:'agency client reporting tool',
      volume:6600, difficulty:48,
      opportunity:'High' },
    { keyword:'white label marketing software',
      volume:4400, difficulty:43,
      opportunity:'Medium' },
    { keyword:'marketing dashboard for agencies',
      volume:3600, difficulty:39,
      opportunity:'High' },
    { keyword:'marketing roi tracking tool',
      volume:5400, difficulty:51,
      opportunity:'Medium' },
  ]
});

export const getKeywords = asyncHandler(
  async (req: any, res: Response) => {
  const { tenantId } = req.user;
  const { clientId, domain } = req.query;

  try {
    const rows = await db
      .select()
      .from(seoKeywords)
      .where(eq(seoKeywords.tenantId, tenantId))
      .orderBy(seoKeywords.currentRank);

    if (rows.length === 0) {
      const useDomain = (domain as string)
        || 'yourdomain.com';
      return res.json({
        success: true,
        data: getDemoKeywords(useDomain),
        source: 'demo'
      });
    }

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[SEO] getKeywords error:', err);
    res.json({
      success: true,
      data: getDemoKeywords(
        (domain as string) || 'yourdomain.com'),
      source: 'demo'
    });
  }
});

export const addKeyword = asyncHandler(
  async (req: any, res: Response) => {
  const { tenantId } = req.user;
  const {
    keyword, domain, clientId,
    device, country, cluster, intent
  } = req.body;

  if (!keyword?.trim()) {
    throw new AppError('Keyword is required', 400);
  }

  let workspaceId = req.user.workspaceId;
  if (!workspaceId) {
    try {
      const ws = await db.select().from(workspaces).where(eq(workspaces.tenantId, tenantId)).limit(1);
      if (ws.length > 0) workspaceId = ws[0].id;
    } catch (err) {}
  }

  if (!workspaceId) {
    throw new AppError('No active workspace found for this tenant.', 400);
  }

  const existing = await db.select().from(seoKeywords)
    .where(and(
      eq(seoKeywords.workspaceId, workspaceId),
      eq(seoKeywords.keyword, keyword.trim())
    )).limit(1);
    
  if (existing.length > 0) {
    throw new AppError('Keyword already tracked in this workspace', 400);
  }

  // Simulate rank data
  const simulatedRank = Math.floor(
    Math.random() * 50) + 1;
  const simulatedVolume = Math.floor(
    Math.random() * 50000) + 1000;
  const simulatedDifficulty = Math.floor(
    Math.random() * 40) + 30;

  const id = uuidv4();
  const now = new Date().toISOString();

  await db.insert(seoKeywords).values({
    id,
    tenantId,
    workspaceId,
    clientId: clientId?.trim() || null,
    keyword: keyword.trim(),
    domain: domain?.trim() || null,
    currentRank: simulatedRank,
    previousRank: simulatedRank + Math.floor(
      Math.random() * 5) - 2,
    bestRank: Math.max(1, simulatedRank - 3),
    searchVolume: simulatedVolume,
    difficulty: simulatedDifficulty,
    cpc: parseFloat((Math.random() * 15 + 2)
      .toFixed(2)),
    intent: intent || 'informational',
    cluster: cluster?.trim() || null,
    rankChange: Math.floor(Math.random() * 7) - 3,
    isTracked: 1,
    device: device || 'desktop',
    country: country || 'US',
    lastChecked: now,
    createdAt: now,
    updatedAt: now,
  });

  const created = await db.select().from(seoKeywords)
    .where(eq(seoKeywords.id, id)).limit(1);

  res.status(201).json({
    success: true,
    data: created[0]
  });
});

export const deleteKeyword = asyncHandler(
  async (req: any, res: Response) => {
  const { tenantId } = req.user;
  const { id } = req.params;

  await db.delete(seoKeywords)
    .where(and(
      eq(seoKeywords.id, id),
      eq(seoKeywords.tenantId, tenantId)
    ));

  res.json({
    success: true,
    message: 'Keyword removed from tracking'
  });
});

export const runSiteAudit = asyncHandler(
  async (req: any, res: Response) => {
  const { tenantId } = req.user;
  const { domain, clientId } = req.body;

  if (!domain?.trim()) {
    throw new AppError('Domain is required', 400);
  }

  let workspaceId = req.user.workspaceId;
  if (!workspaceId) {
    try {
      const ws = await db.select().from(workspaces).where(eq(workspaces.tenantId, tenantId)).limit(1);
      if (ws.length > 0) workspaceId = ws[0].id;
    } catch (err) {}
  }

  if (!workspaceId) {
    throw new AppError('No active workspace found for this tenant.', 400);
  }

  const demoIssues = getDemoAuditIssues(
    domain.trim());
  const now = new Date().toISOString();

  // Save audit issues to DB
  try {
    for (const issue of demoIssues) {
      await db.insert(seoAuditIssues).values({
        id: uuidv4(),
        tenantId,
        workspaceId,
        clientId: clientId?.trim() || null,
        domain: domain.trim(),
        issueType: issue.issueType,
        severity: issue.severity,
        url: issue.url,
        description: issue.description || null,
        recommendation: issue.recommendation || null,
        isFixed: 0,
        auditDate: now,
        createdAt: now,
      });
    }
  } catch (dbErr) {
    console.error('[SEO] Audit save error:', dbErr);
  }

  // Calculate scores
  const critical = demoIssues.filter(
    i => i.severity === 'critical').length;
  const high = demoIssues.filter(
    i => i.severity === 'high').length;
  const medium = demoIssues.filter(
    i => i.severity === 'medium').length;

  const score = Math.max(0, 100 - 
    (critical * 15) - (high * 8) - (medium * 3));

  res.json({
    success: true,
    data: {
      domain: domain.trim(),
      score,
      totalIssues: demoIssues.length,
      critical,
      high,
      medium,
      low: demoIssues.filter(
        i => i.severity === 'low').length,
      issues: demoIssues,
      auditDate: now,
      metrics: {
        pageSpeed: 67,
        mobileScore: 78,
        lcp: '3.2s',
        fid: '45ms',
        cls: 0.18,
        ttfb: '0.8s',
      }
    }
  });
});

export const getAuditIssues = asyncHandler(
  async (req: any, res: Response) => {
  const { tenantId } = req.user;
  const { domain } = req.query;

  try {
    const rows = await db
      .select()
      .from(seoAuditIssues)
      .where(eq(seoAuditIssues.tenantId, tenantId))
      .orderBy(desc(seoAuditIssues.createdAt));

    if (rows.length === 0) {
      return res.json({
        success: true,
        data: getDemoAuditIssues(
          (domain as string) || 'yourdomain.com'),
        source: 'demo'
      });
    }

    res.json({ success: true, data: rows });
  } catch (err) {
    res.json({
      success: true,
      data: getDemoAuditIssues(
        (domain as string) || 'yourdomain.com'),
      source: 'demo'
    });
  }
});

export const generateContentBrief = asyncHandler(
  async (req: any, res: Response) => {
  const { tenantId } = req.user;
  const { keyword, domain, clientId } = req.body;

  if (!keyword?.trim()) {
    throw new AppError('Target keyword is required', 400);
  }

  let workspaceId = req.user.workspaceId;
  if (!workspaceId) {
    try {
      const ws = await db.select().from(workspaces).where(eq(workspaces.tenantId, tenantId)).limit(1);
      if (ws.length > 0) workspaceId = ws[0].id;
    } catch (err) {}
  }

  if (!workspaceId) {
    throw new AppError('No active workspace found for this tenant.', 400);
  }

  // Generate content brief data
  const kw = keyword.trim();
  const wordCount = kw.split(' ').length > 3
    ? 2000 : 1500;

  const brief = {
    targetKeyword: kw,
    title: `The Complete Guide to ${
      kw.charAt(0).toUpperCase() + kw.slice(1)
    } in 2026`,
    suggestedWordCount: wordCount,
    headings: [
      `What is ${kw}?`,
      `Why ${kw} Matters for Your Business`,
      `Best Practices for ${kw}`,
      `Top Tools and Resources`,
      `Common Mistakes to Avoid`,
      `How to Measure Success`,
      `Next Steps and Action Plan`,
    ],
    keywords: [
      kw,
      `best ${kw}`,
      `${kw} guide`,
      `${kw} tips`,
      `${kw} strategy`,
    ],
    competitors: [
      `competitor1.com/${kw.replace(/\s+/g, '-')}`,
      `competitor2.com/blog/${
        kw.replace(/\s+/g, '-')}`,
    ],
    searchVolume: Math.floor(
      Math.random() * 20000) + 2000,
    difficulty: Math.floor(
      Math.random() * 30) + 40,
    intent: 'informational',
    status: 'draft',
  };

  const id = uuidv4();
  const now = new Date().toISOString();

  try {
    await db.insert(seoContentBriefs).values({
      id,
      tenantId,
      workspaceId,
      clientId: clientId?.trim() || null,
      targetKeyword: brief.targetKeyword,
      title: brief.title,
      suggestedWordCount: brief.suggestedWordCount,
      headings: JSON.stringify(brief.headings),
      keywords: JSON.stringify(brief.keywords),
      competitors: JSON.stringify(brief.competitors),
      searchVolume: brief.searchVolume,
      difficulty: brief.difficulty,
      intent: brief.intent,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    });
  } catch (dbErr) {
    console.error('[SEO] Brief save error:', dbErr);
  }

  res.json({
    success: true,
    data: { id, ...brief }
  });
});

export const getContentBriefs = asyncHandler(
  async (req: any, res: Response) => {
  const { tenantId } = req.user;

  try {
    const rows = await db
      .select()
      .from(seoContentBriefs)
      .where(eq(seoContentBriefs.tenantId, tenantId))
      .orderBy(desc(seoContentBriefs.createdAt));

    if (rows.length === 0) {
      return res.json({
        success: true,
        data: getDemoContentBriefs(),
        source: 'demo'
      });
    }

    const formatted = rows.map(r => ({
      ...r,
      headings:    safeJsonParse(r.headings, []),
      keywords:    safeJsonParse(r.keywords, []),
      competitors: safeJsonParse(r.competitors, []),
    }));

    res.json({ success: true, data: formatted });
  } catch (err) {
    res.json({
      success: true,
      data: getDemoContentBriefs(),
      source: 'demo'
    });
  }
});

export const getCompetitorGap = asyncHandler(
  async (req: any, res: Response) => {
  const { tenantId } = req.user;
  const { domain } = req.query;

  res.json({
    success: true,
    data: getDemoCompetitorGap(
      (domain as string) || 'yourdomain.com')
  });
});

export const getSEOStats = asyncHandler(
  async (req: any, res: Response) => {
  const { tenantId } = req.user;

  try {
    const keywords = await db
      .select()
      .from(seoKeywords)
      .where(eq(seoKeywords.tenantId, tenantId));

    const issues = await db
      .select()
      .from(seoAuditIssues)
      .where(eq(seoAuditIssues.tenantId, tenantId));

    if (keywords.length === 0) {
      return res.json({
        success: true,
        data: {
          totalKeywords:     8,
          top10Keywords:     3,
          avgRank:           14.6,
          rankingImproved:   5,
          rankingDeclined:   2,
          totalIssues:       7,
          criticalIssues:    2,
          siteScore:         62,
          totalBriefs:       2,
        },
        source: 'demo'
      });
    }

    const top10 = keywords.filter(
      k => (k.currentRank||0) <= 10).length;
    const improved = keywords.filter(
      k => (k.rankChange||0) > 0).length;
    const declined = keywords.filter(
      k => (k.rankChange||0) < 0).length;
    const avgRank = keywords.length > 0
      ? parseFloat((keywords.reduce(
          (s,k) => s + (k.currentRank||0), 0
        ) / keywords.length).toFixed(1))
      : 0;
    const critical = issues.filter(
      i => i.severity === 'critical' &&
           i.isFixed === 0).length;
    const totalIssues = issues.filter(
      i => i.isFixed === 0).length;
    const score = Math.max(0,
      100 - (critical * 15) - (totalIssues * 3));

    res.json({
      success: true,
      data: {
        totalKeywords:   keywords.length,
        top10Keywords:   top10,
        avgRank,
        rankingImproved: improved,
        rankingDeclined: declined,
        totalIssues,
        criticalIssues:  critical,
        siteScore:       score,
        totalBriefs:     0,
      }
    });
  } catch (err) {
    res.json({
      success: true,
      data: {
        totalKeywords:  8,
        top10Keywords:  3,
        avgRank:        14.6,
        rankingImproved:5,
        rankingDeclined:2,
        totalIssues:    7,
        criticalIssues: 2,
        siteScore:      62,
        totalBriefs:    2,
      },
      source: 'demo'
    });
  }
});

// New SEO Brief Controllers matching the updated specification
export const generateBrief = asyncHandler(
  async (req: any, res: Response) => {
  const { tenantId } = req.user;
  const { target_keyword } = req.body;

  if (!target_keyword?.trim()) {
    throw new AppError('Target keyword is required', 400);
  }

  let workspaceId = req.user.workspaceId;
  if (!workspaceId) {
    try {
      const ws = await db.select().from(workspaces).where(eq(workspaces.tenantId, tenantId)).limit(1);
      if (ws.length > 0) workspaceId = ws[0].id;
    } catch (err) {}
  }

  if (!workspaceId) {
    throw new AppError('No active workspace found for this tenant.', 400);
  }

  const kw = target_keyword.trim();
  const kwCapitalized = kw.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const title = `Ultimate Guide to ${kwCapitalized}: Strategy, Best Practices & Tools`;
  const metaDescription = `Learn how to master ${kw} with our complete, step-by-step framework. Discover expert tips, top tools, and common mistakes to avoid.`;
  const searchIntent = 'informational';
  const recommendedWordCount = kw.split(' ').length > 3 ? 2200 : 1600;

  const primaryKeywords = JSON.stringify([kw, `what is ${kw}`, `${kw} guide`, `${kw} strategy`]);
  const secondaryKeywords = JSON.stringify([`${kw} tips`, `best ${kw} tools`, `how to use ${kw}`, `${kw} examples`, `${kw} for beginners`]);
  
  const headings = JSON.stringify([
    `H1: The Ultimate Guide to ${kwCapitalized} in 2026`,
    `H2: What is ${kwCapitalized} and Why Does It Matter?`,
    `H2: Core Benefits of a Strong ${kwCapitalized} Strategy`,
    `H2: Step-by-Step Guide to Implementing ${kwCapitalized}`,
    `H3: Phase 1: Planning and Research`,
    `H3: Phase 2: Execution and Optimization`,
    `H3: Phase 3: Measurement and Analysis`,
    `H2: Top Tools to Streamline Your ${kwCapitalized} Workflow`,
    `H2: Common Pitfalls in ${kwCapitalized} & How to Avoid Them`,
    `H2: Summary and Next Steps`
  ]);

  const outline = `
### H1: The Ultimate Guide to ${kwCapitalized} in 2026
Introduction: Brief overview of ${kw} and why it is critical for modern digital presence. Target reader persona is decision-makers and marketing practitioners.

### H2: What is ${kwCapitalized} and Why Does It Matter?
- Definition of ${kw} in simple, actionable terms.
- Historical context and its evolution to current trends.

### H2: Core Benefits of a Strong ${kwCapitalized} Strategy
- Increased visibility and brand authority.
- Growth in organic traffic and target audience acquisition.
- Improved user experience and conversion potential.

### H2: Step-by-Step Guide to Implementing ${kwCapitalized}
#### H3: Phase 1: Planning and Research
- Identify key goals, target audience segments, and competitor baselines.
#### H3: Phase 2: Execution and Optimization
- Standard protocols for day-to-day management and best practices.
#### H3: Phase 3: Measurement and Analysis
- Define primary metrics, tracking intervals, and reporting frameworks.

### H2: Top Tools to Streamline Your ${kwCapitalized} Workflow
- Recommendations for both premium enterprise solutions and budget-friendly starter options.

### H2: Common Pitfalls in ${kwCapitalized} & How to Avoid Them
- Addressing key misunderstandings, configuration errors, and execution bottlenecks.

### H2: Summary and Next Steps
- Final thoughts and actionable checklist to begin.
  `.trim();

  const competitorNotes = `
- **Competitor A (high authority)**: Ranks #1 with a comprehensive, visual guide. Uses interactive widgets.
- **Competitor B (medium authority)**: Emphasizes a "quick setup" approach with templates.
- **Competitor C (agency blog)**: Very structured H2 hierarchy, but lacks deep analysis. Focuses heavily on sales copy.
- **Our Opportunity**: We can win by combining a deeply researched, comprehensive framework with actionable templates and step-by-step H3 breakdowns.
  `.trim();

  const contentRecommendations = `
- **Tone & Voice**: Authoritative, friendly, highly analytical, and concise. Avoid fluff.
- **Formatting**: Keep paragraphs short (2-3 sentences max). Use bolding for key terms, bullet points for lists, and callout boxes for tips.
- **Visuals**: Include at least 3 custom diagrams, 2 table comparisons, and 4 high-quality screenshots to support technical steps.
- **Internal Linking**: Link to "attribution-models" guide and "workflow-automation" dashboard overview.
- **FAQ Suggestions**:
  1. *How long does it take to see results with ${kw}?* (Typically 3 to 6 months depending on authority and competition).
  2. *Can small teams implement ${kw} effectively?* (Yes, by starting with free tools and focusing on high-impact channels first).
  3. *What is the most common mistake when starting ${kw}?* (Failing to establish a baseline measure before execution).
  `.trim();

  const id = uuidv4();
  const now = new Date().toISOString();

  await db.insert(seoBriefs).values({
    id,
    tenantId,
    workspaceId,
    targetKeyword: kw,
    title,
    metaDescription,
    searchIntent,
    recommendedWordCount,
    primaryKeywords,
    secondaryKeywords,
    headings,
    outline,
    competitorNotes,
    contentRecommendations,
    status: 'draft',
    createdAt: now,
    updatedAt: now,
  });

  const created = await db.select().from(seoBriefs).where(eq(seoBriefs.id, id)).limit(1);

  res.status(201).json({
    success: true,
    data: created[0]
  });
});

export const getBriefs = asyncHandler(
  async (req: any, res: Response) => {
  const { tenantId } = req.user;

  try {
    const rows = await db
      .select()
      .from(seoBriefs)
      .where(eq(seoBriefs.tenantId, tenantId))
      .orderBy(desc(seoBriefs.createdAt));

    const formatted = rows.map(r => ({
      ...r,
      primaryKeywords: safeJsonParse(r.primaryKeywords, []),
      secondaryKeywords: safeJsonParse(r.secondaryKeywords, []),
      headings: safeJsonParse(r.headings, []),
    }));

    res.json({ success: true, data: formatted });
  } catch (err) {
    console.error('[SEO] getBriefs error:', err);
    res.json({ success: true, data: [] });
  }
});

export const deleteBrief = asyncHandler(
  async (req: any, res: Response) => {
  const { tenantId } = req.user;
  const { id } = req.params;

  await db.delete(seoBriefs)
    .where(and(
      eq(seoBriefs.id, id),
      eq(seoBriefs.tenantId, tenantId)
    ));

  res.json({
    success: true,
    message: 'SEO brief deleted successfully'
  });
});

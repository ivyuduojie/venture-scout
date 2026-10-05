import type { Assessment, Criterion, Startup } from './schemas'

export const BANK_NAME = 'X Bank'

export const defaultCriteria: Criterion[] = [
  { id: 'business', name: 'Business strength', description: 'Funding and runway, revenue model, leadership quality and financial durability as a bank supplier.', weight: 4 },
  { id: 'traction', name: 'Customer traction', description: 'Paying customers, especially US banks and credit unions; references, retention and production deployments.', weight: 4 },
  { id: 'technical', name: 'Technical capability', description: 'Product maturity, scalability, integration with core banking (Fiserv, FIS, Jack Henry) and payment rails (ACH, RTP, FedNow, card), API quality, deployment options.', weight: 5 },
  { id: 'compliance', name: 'Compliance', description: 'Fit with US banking regulation: Interagency Third-Party Risk Guidance, FFIEC, SR 11-7 model risk, BSA/AML and OFAC, GLBA, NYDFS Part 500, state licensing, PCI DSS.', weight: 5 },
  { id: 'legal', name: 'Legal considerations', description: 'IP ownership, litigation exposure, contract terms, data use rights, state privacy laws (e.g. CCPA), exit and termination rights.', weight: 3 },
  { id: 'security', name: 'Security', description: 'SOC 2 Type II / ISO 27001, penetration testing, encryption, access control, US data residency, incident history.', weight: 5 },
]

export const sampleStartup: Startup = {
  name: 'Kyvra',
  website: 'kyvra.ai',
  stage: 'Series A',
  headquarters: 'New York, NY',
  category: 'Fraud & financial crime',
  description:
    'Kyvra detects authorized push payment (scam) fraud and money-mule activity in real time using graph machine learning over payment and device data. Scores Zelle, RTP and FedNow payments in under 50 ms via REST and ISO 20022 APIs. Deployed as SaaS on AWS us-east-1 or inside the customer VPC.',
  evidence:
    'Pitch deck (Feb): $15M Series A led by a NYC fintech VC, ~28 months runway claimed. 9 paying customers: 2 US regional banks, 1 credit union, 6 payment processors. No top-20 US bank in production. One regional bank reference offered. Claims 41% reduction in scam fraud losses at a regional bank (case study, not independently verified). SOC 2 Type II report (Nov) available under NDA. ISO 27001 certification in progress, audit planned Q4. Annual third-party pen test; summary letter shared. Model documentation available; no prior SR 11-7 model risk validation by a bank. Sub-processor list provided (AWS, Snowflake, Datadog), all US-hosted. Technology vendor; does not hold money transmitter licenses. 46 staff, all in US.',
}

export const sampleAssessment: Assessment = {
  fit: {
    verdict: 'partial',
    summary:
      'Kyvra has a credible, focused proposition for real-time scam and mule detection on instant payment rails, which maps directly to rising fraud losses on Zelle, RTP and FedNow. Suitability is limited by the absence of top-20 US bank deployments, unverified performance claims and no prior SR 11-7 model validation.',
  },
  useCases: [
    {
      businessUnit: 'Consumer Payments',
      title: 'Real-time scam fraud scoring on Zelle, RTP and FedNow',
      valueHypothesis: 'Reduce scam fraud losses and customer reimbursements on instant payments while keeping false-positive friction low.',
      fit: 'strong',
      rationale: 'Core product, sub-50 ms scoring and ISO 20022 support fit an inline payment decision; regional bank case study is directly comparable.',
    },
    {
      businessUnit: 'Financial Crimes Compliance',
      title: 'Inbound money-mule account detection',
      valueHypothesis: 'Identify mule accounts earlier to cut onward fraud and strengthen SAR filings under BSA/AML.',
      fit: 'moderate',
      rationale: 'Graph-based mule detection is claimed, but no evidence of deployment at a receiving bank at our scale.',
    },
    {
      businessUnit: 'BSA/AML Operations',
      title: 'Transaction monitoring alert triage',
      valueHypothesis: 'Lower investigator workload by prioritizing high-risk transaction monitoring alerts.',
      fit: 'weak',
      rationale: 'Not a core product capability; would require integration with our existing AML platform and separate model validation.',
    },
  ],
  criteria: [
    {
      criterionId: 'business',
      score: 3,
      confidence: 'medium',
      rationale: 'Recent Series A and focused team are positive, but runway is self-reported and revenue is concentrated in a few customers.',
      evidence: [
        { statement: '$15M Series A led by a NYC fintech VC', basis: 'provided', sourceId: null },
        { statement: '~28 months runway', basis: 'claimed', sourceId: null },
        { statement: '46 staff, all US-based', basis: 'claimed', sourceId: null },
      ],
    },
    {
      criterionId: 'traction',
      score: 3,
      confidence: 'medium',
      rationale: 'Regulated US customers exist, but no top-20 bank in production and only one reference offered.',
      evidence: [
        { statement: '9 paying customers incl. 2 US regional banks and 1 credit union', basis: 'claimed', sourceId: null },
        { statement: 'One regional bank reference offered', basis: 'provided', sourceId: null },
        { statement: '41% reduction in scam fraud losses at a regional bank', basis: 'claimed', sourceId: null },
      ],
    },
    {
      criterionId: 'technical',
      score: 4,
      confidence: 'medium',
      rationale: 'Latency, API standards and VPC deployment suit inline instant-payment use; scale at large-bank volumes is unproven.',
      evidence: [
        { statement: 'Sub-50 ms scoring via REST and ISO 20022 APIs', basis: 'claimed', sourceId: null },
        { statement: 'SaaS on AWS us-east-1 or customer VPC deployment', basis: 'claimed', sourceId: null },
        { statement: 'Graph ML approach should benefit from our larger payment network', basis: 'inferred', sourceId: null },
      ],
    },
    {
      criterionId: 'compliance',
      score: 2,
      confidence: 'low',
      rationale: 'Sub-processors are disclosed and US-hosted, but there is no prior SR 11-7 model validation or evidence of readiness for interagency third-party risk due diligence.',
      evidence: [
        { statement: 'Sub-processor list provided (AWS, Snowflake, Datadog), US-hosted', basis: 'provided', sourceId: null },
        { statement: 'Model documentation available', basis: 'claimed', sourceId: null },
      ],
    },
    {
      criterionId: 'legal',
      score: 2,
      confidence: 'low',
      rationale: 'No information on IP ownership of models trained on customer data, liability caps or termination provisions.',
      evidence: [{ statement: 'Technology vendor; holds no money transmitter licenses', basis: 'provided', sourceId: null }],
    },
    {
      criterionId: 'security',
      score: 4,
      confidence: 'medium',
      rationale: 'SOC 2 Type II and annual pen testing are strong for the stage; ISO 27001 is still pending.',
      evidence: [
        { statement: 'SOC 2 Type II report available under NDA', basis: 'provided', sourceId: null },
        { statement: 'Annual third-party pen test; summary letter shared', basis: 'provided', sourceId: null },
        { statement: 'ISO 27001 audit planned Q4', basis: 'claimed', sourceId: null },
      ],
    },
  ],
  gaps: [
    { area: 'Model risk', description: 'Model has not been through an SR 11-7 validation at a bank; performance claims are unverified.', validationStep: 'Run a back-test on 6 months of anonymized Zelle and RTP data and submit model documentation to Model Risk Management.', priority: 'high', owner: 'risk' },
    { area: 'Third-party risk', description: 'No evidence of readiness for interagency third-party risk due diligence, business continuity testing or incident notification SLAs.', validationStep: 'Issue the third-party risk questionnaire covering BCP/DR, concentration, subcontractors and exit strategy.', priority: 'high', owner: 'risk' },
    { area: 'Legal', description: 'IP ownership of models trained on bank data, GLBA data-use limits and liability terms are unknown.', validationStep: 'Legal review of MSA, data use and model/data IP clauses before the PoC agreement.', priority: 'high', owner: 'legal' },
    { area: 'Commercial', description: 'PoC pricing and production pricing model are not provided.', validationStep: 'Request a PoC proposal and indicative volume-based pricing for vendor onboarding.', priority: 'medium', owner: 'procurement' },
    { area: 'Financial health', description: 'Runway is self-reported; no financial statements shared.', validationStep: 'Obtain latest financial statements and run a supplier financial health check.', priority: 'medium', owner: 'procurement' },
    { area: 'References', description: 'Only one bank reference offered; no large-bank comparables.', validationStep: 'Complete the regional bank reference call and request one additional US bank reference.', priority: 'medium', owner: 'partnerships' },
  ],
  risks: [
    { title: 'Customer friction from false positives', category: 'Customer', severity: 'medium', mitigation: 'Run the PoC in shadow mode before any payment intervention.', owner: 'partnerships' },
    { title: 'Concentration on an early-stage supplier', category: 'Third-party', severity: 'high', mitigation: 'Require an exit plan, data portability and source-code escrow in the contract.', owner: 'risk' },
    { title: 'Bank customer data used to train shared models', category: 'Data privacy (GLBA)', severity: 'high', mitigation: 'Contractually restrict model training to a bank-specific tenancy and prohibit secondary data use.', owner: 'legal' },
    { title: 'Vendor onboarding delays PoC start', category: 'Commercial', severity: 'low', mitigation: 'Use a time-boxed PoC agreement with a capped fee.', owner: 'procurement' },
  ],
}

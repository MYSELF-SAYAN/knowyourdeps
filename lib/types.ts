export type Ecosystem = 'npm' | 'pypi';

export type TabType =
  | 'overview'
  | 'history'
  | 'security'
  | 'dependencies'
  | 'alternatives'
  | 'health'
  | 'compare';

export interface PackageOverview {
  name: string;
  ecosystem: Ecosystem;
  description: string;
  latestVersion: string;
  license: string;
  homepage?: string;
  repository?: string;
  author?: string;
  maintainers: string[];
  keywords: string[];
  publishedAt?: string;
  updatedAt?: string;
  isDeprecated?: boolean;
  deprecationReason?: string;
  installCommand: string;
  totalDownloadsWeekly?: number;
  openIssuesCount?: number;
  starsCount?: number;
  forksCount?: number;
  watchersCount?: number;
  dependenciesCount?: number;
  securityStatus: 'safe' | 'vulnerable' | 'unavailable';
  vulnerabilitiesCount: number;
  // Deep telemetry & geometry stats
  unpackedSize?: number; // in bytes
  fileCount?: number;
  hasTypeDefinitions?: boolean;
  typeDefinitionsType?: string; // e.g. "TypeScript (bundled)", "PEP 561 (py.typed)"
  totalReleases?: number;
  requiresRuntime?: string; // e.g. "Node.js >= 18" or "Python >= 3.9"
}

export interface DownloadPoint {
  date: string;
  downloads: number;
}

export interface AnalyticsData {
  ecosystem: Ecosystem;
  packageName: string;
  period: string; // '7d' | '30d' | '90d' | '365d'
  totalDownloads: number;
  dailyAverage: number;
  growthRatePercent?: number;
  peakDay?: { date: string; downloads: number };
  estimatedMonthly?: number;
  annualizedRunRate?: number;
  history: DownloadPoint[];
  source: string;
  note: string;
}

export interface VersionInfo {
  version: string;
  publishedAt: string;
  isLatest: boolean;
  isDeprecated?: boolean;
  license?: string;
  securityAdvisoriesCount?: number;
}

export interface SecurityAdvisory {
  id: string; // GHSA or CVE or OSV id
  title: string;
  aliases: string[];
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';
  cvssScore?: number;
  cwe?: string;
  affectedRange: string;
  fixedVersion?: string;
  publishedAt: string;
  summary: string;
  details?: string;
  sourceUrl: string;
  nvdUrl?: string;
  githubUrl?: string;
  affectsSelectedVersion?: boolean;
  component?: string;
  componentType?: 'direct' | 'parent-ecosystem' | 'dependency';
}

export interface SecurityData {
  status: 'safe' | 'vulnerable' | 'unavailable';
  summaryMessage: string;
  checkedVersion: string;
  source: string;
  advisories: SecurityAdvisory[];
  allHistoricalAdvisories?: SecurityAdvisory[];
  parentEcosystemAdvisories?: SecurityAdvisory[];
  dependencyAdvisories?: SecurityAdvisory[];
  totalHistoricalCount?: number;
  activeCount?: number;
  sourcesUsed?: string[];
  auditedComponents?: { name: string; type: 'direct' | 'parent-ecosystem' | 'dependency'; count: number }[];
}

export interface DependencyRequirement {
  name: string;
  constraint: string;
  ecosystem?: Ecosystem;
  isDev?: boolean;
}

export interface DependencyNode {
  name: string;
  version: string;
  relation: string; // 'DIRECT' | 'INDIRECT' | 'UNKNOWN'
  errors?: string[];
}

export interface DependencyData {
  requirements: DependencyRequirement[];
  resolvedGraph: DependencyNode[];
  totalDirect: number;
  totalTransitive: number;
  ecosystem: Ecosystem;
  version: string;
  source: string;
  note: string;
}

export interface AlternativePackage {
  name: string;
  ecosystem: Ecosystem;
  description: string;
  weeklyDownloads: number;
  starsCount?: number;
  stars?: number;
  license?: string;
  matchScore?: number;
  matchType?: string;
  reason?: string;
  latestVersion?: string;
  pros?: string[];
  cons?: string[];
}

export interface RepositoryHealthSignal {
  label: string;
  value: string;
  status: 'good' | 'warning' | 'critical';
}

export interface RepositoryHealth {
  repoUrl: string;
  stars?: number;
  forks?: number;
  openIssues?: number;
  watchers?: number;
  license?: string;
  scorecardScore?: number;
  scorecardUrl?: string;
  lastCommitDate?: string;
  signals?: RepositoryHealthSignal[];
}

export interface HealthMetric {
  category: 'maintenance' | 'community' | 'security' | 'licensing';
  name: string;
  score: number; // 0 to 10
  status: 'good' | 'warning' | 'critical';
  description: string;
}

export interface HealthData {
  packageName: string;
  ecosystem: Ecosystem;
  overallScore: number; // 0 to 100
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  metrics: HealthMetric[];
  scorecardUrl?: string;
  githubUrl?: string;
}

export interface SearchResultItem {
  name: string;
  ecosystem: Ecosystem;
  description: string;
  version: string;
  keywords?: string[];
}

export interface ReadmeData {
  ecosystem: Ecosystem;
  name: string;
  version: string;
  content: string; // raw markdown / rst string
  contentType: string; // e.g. "text/markdown", "text/x-rst", "text/plain"
  source: string;
  error?: string;
}

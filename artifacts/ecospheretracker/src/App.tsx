import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Link, Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import {
  Activity, ArrowDownRight, ArrowUpRight, Bell, CalendarDays, Check, ChevronRight,
  Cloud, Download, ExternalLink, Leaf, Search, Sprout, Trees, Wind, Zap,
} from 'lucide-react';
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import {
  useGetEcoDashboard, getGetEcoDashboardQueryKey,
  useGetEcoRegions, getGetEcoRegionsQueryKey,
  useGetEcoTrends, getGetEcoTrendsQueryKey,
  useGetEcoWorkloads, getGetEcoWorkloadsQueryKey,
} from '@workspace/api-client-react';
import type { CloudRegion, CloudWorkload } from '@workspace/api-client-react';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();
type Range = '7d' | '30d' | '90d';
const ranges: Range[] = ['7d', '30d', '90d'];
const number = (value?: number) => Number(value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 1 });
const dateLabel = (value?: string) => value ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—';
const providerShort = (provider: string) => provider === 'Google Cloud' ? 'G' : provider === 'Azure' ? 'A' : 'a';
const statusClass = (status: string) => status === 'high' ? 'high' : status === 'moderate' || status === 'improving' ? 'moderate' : '';
const statusLabel = (status: string) => status === 'efficient' || status === 'clean' ? 'Efficient' : status === 'moderate' || status === 'improving' ? 'Improving' : 'High impact';

function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const nav = [
    { href: '/', label: 'Overview', icon: Activity },
    { href: '/history', label: 'Workload history', icon: CalendarDays },
  ];
  return <div className="app-shell">
    <aside className="sidebar">
      <Link href="/" className="brand" data-testid="link-brand"><span className="brand-mark"><Leaf size={19} /></span><span>EcoSphere</span></Link>
      <div className="nav-label">Workspace</div>
      {nav.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={`nav-link ${location === href ? 'active' : ''}`} data-testid={`link-${label.toLowerCase().replaceAll(' ', '-')}`}><Icon size={17} /><span>{label}</span>{href === '/history' && <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: .5 }} />}</Link>)}
      <div className="sidebar-bottom">
        <div className="earth-card"><strong>Small shifts, real change</strong><p>Cleaner regions are a few thoughtful choices away.</p></div>
        <div className="user-row"><div className="avatar">OR</div><div><strong>Olive Ridge</strong><small>Sustainability team</small></div></div>
      </div>
    </aside>
    <main className="main-area">
      <header className="topbar"><div className="crumb"><span>Workspace</span><ChevronRight size={13} /><strong>{location === '/history' ? 'Workload history' : 'Overview'}</strong></div><div className="top-actions"><div style={{ position: 'relative' }}><button className="icon-btn" aria-label="Notifications" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen(value => !value)} data-testid="button-notifications"><Bell size={16} /></button>{notificationsOpen && <div className="notice-popover" role="status" data-testid="notification-panel"><strong>All caught up</strong><span>Your cloud signals were refreshed today.</span></div>}</div><div className="soft-btn" data-testid="status-systems"><span style={{ width: 7, height: 7, background: '#38a763', borderRadius: 99 }} /> All systems healthy</div></div></header>
      {children}
    </main>
    <nav className="mobile-nav">{nav.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={`nav-link ${location === href ? 'active' : ''}`} data-testid={`mobile-link-${href === '/' ? 'overview' : 'history'}`}><Icon /><span>{href === '/' ? 'Overview' : 'History'}</span></Link>)}</nav>
  </div>;
}

function LoadingCards() {
  return <div className="grid metrics-grid">{[1,2,3,4].map(x => <div key={x} className="card skeleton skeleton-card" />)}</div>;
}
function QueryError({ retry, text = 'We couldn’t load this data just now.' }: { retry: () => void; text?: string }) {
  return <div className="error-state"><div className="empty-icon"><Wind size={21} /></div><strong>Taking a little breather</strong><div>{text}</div><button onClick={retry} data-testid="button-retry">Try again</button></div>;
}
function RangeControl({ value, onChange }: { value: Range; onChange: (value: Range) => void }) {
  return <div className="segmented" role="group" aria-label="Trend date range" data-testid="control-date-range">{ranges.map(range => <button key={range} className={`segment ${value === range ? 'selected' : ''}`} onClick={() => onChange(range)} aria-pressed={value === range} data-testid={`button-range-${range}`}>{range}</button>)}</div>;
}

function MetricCard({ label, value, unit, icon, foot, meter, testId }: { label: string; value: string; unit: string; icon: ReactNode; foot: ReactNode; meter?: number; testId: string }) {
  const progress = Math.max(0, Math.min(100, meter ?? 0));
  return <section className="card metric-card fade-in" data-testid={testId}><div className="metric-top"><span className="metric-label">{label}</span><span className={`metric-icon ${meter !== undefined ? 'metric-gauge' : ''}`} role={meter !== undefined ? 'img' : undefined} aria-label={meter !== undefined ? `${label}: ${Math.round(progress)} percent` : undefined} title={meter !== undefined ? `${Math.round(progress)}% indicator` : undefined}>{meter !== undefined && <svg className="gauge-ring" viewBox="0 0 36 36" aria-hidden="true"><circle className="gauge-track" cx="18" cy="18" r="15.5" pathLength="100" /><circle className="gauge-value" cx="18" cy="18" r="15.5" pathLength="100" style={{ '--gauge-progress': `${progress}` } as React.CSSProperties} /></svg>}{icon}</span></div><div className="metric-number"><strong>{value}</strong><span>{unit}</span></div><div className="metric-foot">{foot}</div></section>;
}
function TrendChart({ range, onRangeChange }: { range: Range; onRangeChange: (value: Range) => void }) {
  const params = { range };
  const trends = useGetEcoTrends(params, { query: { queryKey: getGetEcoTrendsQueryKey(params) } });
  const points = trends.data ?? [];
  return <section className="card panel" data-testid="panel-emissions-trend">
    <div className="panel-head"><div><h2 className="panel-title">Your footprint, in motion</h2><p className="panel-subtitle">Daily carbon emissions and energy use</p></div><RangeControl value={range} onChange={onRangeChange} /></div>
    {trends.isLoading ? <div className="skeleton" style={{ height: 220 }} /> : trends.isError ? <QueryError retry={() => void trends.refetch()} /> : points.length === 0 ? <div className="empty-state"><div className="empty-icon"><Activity size={20} /></div><strong>Your trend is taking shape</strong><span>There isn’t enough activity in this range yet.</span></div> :
      <><div className="chart-legend"><span><i className="legend-dot" style={{ background: '#22a35d' }} />Carbon (kg)</span><span><i className="legend-dot" style={{ background: '#6bbfdb' }} />Energy (kWh)</span></div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><LineChart data={points} margin={{ left: -21, right: 8, top: 12, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="#edf3ed" strokeDasharray="3 4" /><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#97a79b', fontSize: 9 }} dy={8} /><YAxis yAxisId="carbon" axisLine={false} tickLine={false} tick={{ fill: '#9aa99e', fontSize: 9 }} /><YAxis yAxisId="energy" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#9aa99e', fontSize: 9 }} />
        <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e4eee5', fontSize: 11, boxShadow: '0 8px 22px #315c3b12' }} /><Line yAxisId="carbon" type="monotone" dataKey="emissionsKg" name="Carbon (kg)" stroke="#22a35d" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} /><Line yAxisId="energy" type="monotone" dataKey="energyKwh" name="Energy (kWh)" stroke="#6bbfdb" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
      </LineChart></ResponsiveContainer></div></>}
  </section>;
}

function RegionMap({ regions }: { regions: CloudRegion[] }) {
  const [selected, setSelected] = useState<CloudRegion | null>(null);
  const cleanCount = regions.filter(r => r.status === 'clean').length;
  return <section className="card panel map-panel" data-testid="panel-region-map">
    <div className="panel-head"><div><h2 className="panel-title">Find your greener cloud</h2><p className="panel-subtitle">Live signal across {regions.length} cloud regions</p></div><button className="icon-btn" aria-label="Explore regions" onClick={() => regions[0] && setSelected(regions[0])} data-testid="button-explore-regions"><ExternalLink size={15} /></button></div>
    <div className="map-canvas" data-testid="visual-region-map"><div className="map-orbit" /><div className="map-land land-a" /><div className="map-land land-b" /><div className="map-land land-c" /><div className="map-land land-d" />
      <div className="region-tooltip"><strong>{selected?.name ?? 'Cleaner regions, at a glance'}</strong>{selected ? `${selected.provider} · ${selected.renewablePercent}% renewable` : 'Tap a signal to explore'}</div>
      {regions.map(region => {
        const left = Math.min(91, Math.max(8, ((region.longitude + 180) / 360) * 100));
        const top = Math.min(83, Math.max(18, ((80 - region.latitude) / 150) * 100));
        return <button key={region.id} aria-label={`${region.name}, ${region.carbonIntensity} grams per kilowatt hour`} title={`${region.name} · ${region.renewablePercent}% renewable`} onClick={() => setSelected(region)} className="region-dot" style={{ left: `${left}%`, top: `${top}%`, background: region.status === 'high' ? '#e4ba47' : '#1b9d5c' }} data-testid={`button-region-${region.id}`} />;
      })}
    </div>
    <div className="map-footer"><span>{cleanCount} clean regions available</span><div className="map-key"><span><i className="key-dot" />Cleaner</span><span><i className="key-dot amber" />Higher impact</span></div></div>
    <div className="region-list">{regions.slice(0, 3).map(region => <div className="region-row" key={region.id} data-testid={`region-row-${region.id}`}><span className="provider-mark">{providerShort(region.provider)}</span><span className="region-info"><strong>{region.name}</strong><small>{region.provider} · {region.country}</small></span><span className="region-percent">{number(region.renewablePercent)}%</span></div>)}</div>
  </section>;
}

function RegionComparison({ regions }: { regions: CloudRegion[] }) {
  const data = [...regions].sort((a, b) => a.carbonIntensity - b.carbonIntensity);
  const regionColor = (status: CloudRegion['status']) => status === 'clean' ? '#2eaa68' : status === 'improving' ? '#68b8cf' : '#e2b842';
  return <section className="card panel comparison-panel" data-testid="panel-region-comparison">
    <div className="panel-head"><div><h2 className="panel-title">Regional carbon intensity</h2><p className="panel-subtitle">Compare grid emissions across your cloud regions · lower is cleaner</p></div></div>
    {data.length === 0 ? <div className="empty-state"><div className="empty-icon"><Cloud size={20} /></div><strong>No region signals yet</strong><span>Region comparisons will appear when data is available.</span></div> :
      <div className="region-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={data} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 8 }}>
        <CartesianGrid horizontal={false} stroke="#edf3ed" strokeDasharray="3 4" /><XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#97a79b', fontSize: 9 }} unit=" g" /><YAxis type="category" dataKey="name" width={145} axisLine={false} tickLine={false} tick={{ fill: '#6e8776', fontSize: 9 }} /><Tooltip formatter={(value) => [`${value} gCO₂e/kWh`, 'Carbon intensity']} contentStyle={{ borderRadius: 12, border: '1px solid #e4eee5', fontSize: 11 }} />
        <Bar dataKey="carbonIntensity" name="Carbon intensity" radius={[0, 6, 6, 0]} barSize={12}>{data.map((region) => <Cell key={region.id} fill={regionColor(region.status)} />)}</Bar>
      </BarChart></ResponsiveContainer></div>}
    <div className="comparison-legend"><span><i className="legend-dot" style={{ background: '#2eaa68' }} />Clean energy</span><span><i className="legend-dot" style={{ background: '#68b8cf' }} />Improving</span><span><i className="legend-dot" style={{ background: '#e2b842' }} />Higher intensity</span></div>
  </section>;
}

function WorkloadRows({ workloads }: { workloads: CloudWorkload[] }) {
  return <div className="workload-list">{workloads.slice(0, 4).map(item => <div className="workload-line" key={item.id} data-testid={`workload-row-${item.id}`}><div className="workload-name"><span className="provider-mark">{providerShort(item.provider)}</span><span style={{ minWidth: 0 }}><strong>{item.workloadName}</strong><small>{item.provider} · {item.region}</small></span></div><span className="workload-carbon">{number(item.carbonKg)} kg CO₂e</span><span className={`status-tag ${statusClass(item.status)}`}><i className="status-dot" />{statusLabel(item.status)}</span></div>)}</div>;
}

function Overview() {
  const [range, setRange] = useState<Range>('30d');
  const dashboard = useGetEcoDashboard({ query: { queryKey: getGetEcoDashboardQueryKey() } });
  const regionsQuery = useGetEcoRegions({ query: { queryKey: getGetEcoRegionsQueryKey() } });
  const workloadQuery = useGetEcoWorkloads(undefined, { query: { queryKey: getGetEcoWorkloadsQueryKey() } });
  const data = dashboard.data;
  const updated = data?.updatedAt ? new Date(data.updatedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'recently';
  return <div className="content fade-in">
    <div className="page-intro"><div><div className="eyebrow"><Sprout size={13} /> Your cloud, a little greener</div><h1>Good things are growing.</h1><p className="subtitle">A clear view of the footprint your workloads leave behind.</p></div><div className="date-pill"><span className="key-dot" /> Updated {updated}</div></div>
    {dashboard.isLoading ? <LoadingCards /> : dashboard.isError || !data ? <div className="card"><QueryError retry={() => void dashboard.refetch()} text="Your sustainability snapshot is temporarily unavailable." /></div> : <>
      <div className="grid metrics-grid">
        <MetricCard testId="metric-footprint" label="Cloud footprint" value={number(data.footprintKg)} unit="kg CO₂e" icon={<Cloud size={16} />} foot={<><span className={data.previousPeriodDelta <= 0 ? 'trend-good' : ''}>{data.previousPeriodDelta <= 0 ? <ArrowDownRight size={13} /> : <ArrowUpRight size={13} />}{number(Math.abs(data.previousPeriodDelta))}%</span> vs. previous period</>} />
        <MetricCard testId="metric-saved" label="Emissions avoided" value={number(data.emissionsSavedKg)} unit="kg CO₂e" icon={<Leaf size={16} />} meter={data.emissionsSavedKg / (data.emissionsSavedKg + data.footprintKg) * 100} foot={<><Check size={12} className="trend-good" /> By choosing cleaner regions</>} />
        <MetricCard testId="metric-renewable" label="Renewable energy" value={number(data.renewablePercent)} unit="%" icon={<Zap size={16} />} meter={data.renewablePercent} foot={<><span className="trend-good">↑ Growing</span> across your cloud mix</>} />
        <MetricCard testId="metric-trees" label="Nature equivalent" value={number(data.treesEquivalent)} unit="trees" icon={<Trees size={16} />} meter={data.treesEquivalent / 10 * 100} foot={<>The annual work of a small grove 🌳</>} />
      </div>
      <div className="grid main-grid"><TrendChart range={range} onRangeChange={setRange} /><div>{regionsQuery.isLoading ? <div className="card skeleton skeleton-card" style={{ height: 450 }} /> : regionsQuery.isError ? <div className="card"><QueryError retry={() => void regionsQuery.refetch()} text="Region signals are taking a moment to return." /></div> : <RegionMap regions={regionsQuery.data ?? []} />}</div></div>
      {regionsQuery.data && <RegionComparison regions={regionsQuery.data} />}
      <div className="grid lower-grid">
        <section className="card panel" data-testid="panel-recent-workloads"><div className="panel-head"><div><h2 className="panel-title">Recent workload activity</h2><p className="panel-subtitle">{number(data.totalWorkloads)} workloads in your footprint</p></div><Link href="/history" className="soft-btn" data-testid="link-view-history">View history <ChevronRight size={13} /></Link></div>
          {workloadQuery.isLoading ? <div>{[1,2,3].map(n => <div className="skeleton skeleton-row" key={n} />)}</div> : workloadQuery.isError ? <QueryError retry={() => void workloadQuery.refetch()} /> : (workloadQuery.data?.length ?? 0) === 0 ? <div className="empty-state"><div className="empty-icon"><Cloud size={20} /></div><strong>No workloads to show yet</strong><span>Your cloud activity will find its way here.</span></div> : <WorkloadRows workloads={workloadQuery.data ?? []} />}
        </section>
        <section className="card impact-card" data-testid="panel-nature-impact"><div className="impact-heading"><span>🌱</span> A brighter footprint</div><div className="impact-number">{number(data.emissionsSavedKg)} kg</div><p className="impact-copy">of carbon avoided so far by running workloads on cleaner energy.</p><span className="impact-pill">One cleaner choice at a time</span></section>
      </div>
    </>}
  </div>;
}

function History() {
  const [provider, setProvider] = useState<'' | 'AWS' | 'Google Cloud' | 'Azure'>('');
  const [region, setRegion] = useState('');
  const [search, setSearch] = useState('');
  const params = useMemo(() => ({ ...(provider ? { provider } : {}), ...(region ? { region } : {}), ...(search.trim() ? { search: search.trim() } : {}) }), [provider, region, search]);
  const workloads = useGetEcoWorkloads(params, { query: { queryKey: getGetEcoWorkloadsQueryKey(params) } });
  const regionsQuery = useGetEcoRegions({ query: { queryKey: getGetEcoRegionsQueryKey() } });
  const rows = workloads.data ?? [];
  const exportCsv = () => {
    const headers = ['Workload', 'Provider', 'Region', 'Started at', 'Runtime (min)', 'Energy (kWh)', 'Carbon (kg CO2e)', 'Status'];
    const quote = (cell: string | number) => `"${String(cell).replaceAll('"', '""')}"`;
    const content = [headers, ...rows.map(row => [row.workloadName, row.provider, row.region, row.startedAt, row.runtimeMinutes, row.energyKwh, row.carbonKg, row.status])].map(row => row.map(quote).join(',')).join('\n');
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = 'ecosphere-workload-history.csv'; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <div className="content fade-in">
    <div className="page-intro"><div><div className="eyebrow"><Activity size={13} /> The details behind the difference</div><h1>Workload history</h1><p className="subtitle">Explore what’s running, where it lives, and what it emits.</p></div><div className="date-pill"><CalendarDays size={14} /> All recorded activity</div></div>
    <div className="history-toolbar">
      <div className="search-wrap"><Search size={15} /><input className="search-input" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search workloads or regions" aria-label="Search workloads or regions" data-testid="input-workload-search" /></div>
      <select className="filter-select" value={provider} onChange={event => setProvider(event.target.value as typeof provider)} aria-label="Filter by cloud provider" data-testid="select-provider"><option value="">All providers</option><option value="AWS">AWS</option><option value="Google Cloud">Google Cloud</option><option value="Azure">Azure</option></select>
      <select className="filter-select" value={region} onChange={event => setRegion(event.target.value)} aria-label="Filter by region" data-testid="select-region"><option value="">All regions</option>{(regionsQuery.data ?? []).map(item => <option value={item.name} key={item.id}>{item.name}</option>)}</select>
      <button className="download-btn" onClick={exportCsv} disabled={!rows.length || workloads.isLoading} data-testid="button-download-csv"><Download size={15} /> Download CSV</button>
    </div>
    <div className="card table-card" data-testid="table-workload-history">
      {workloads.isLoading ? <div className="loading-state">{[1,2,3,4,5].map(n => <div className="skeleton skeleton-row" key={n} />)}</div> : workloads.isError ? <QueryError retry={() => void workloads.refetch()} text="The workload ledger couldn’t load. Your filters are safe." /> : rows.length === 0 ? <div className="empty-state"><div className="empty-icon"><Search size={19} /></div><strong>No workloads match this view</strong><span>Try another provider, region, or search term.</span></div> :
        <><div className="table-scroll"><table><thead><tr><th>Workload</th><th>Cloud / region</th><th>Started</th><th>Runtime</th><th>Energy</th><th>Carbon impact</th><th>Status</th></tr></thead><tbody>{rows.map(row => <tr key={row.id} data-testid={`table-row-${row.id}`}><td><div className="table-workload"><span className="provider-mark">{providerShort(row.provider)}</span><span><strong>{row.workloadName}</strong><small>Workload ID · {row.id}</small></span></div></td><td><div className="table-meta">{row.provider}</div><div className="table-meta">{row.region}</div></td><td className="table-meta">{dateLabel(row.startedAt)}<br />{new Date(row.startedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</td><td className="table-meta">{number(row.runtimeMinutes)} min</td><td className="table-meta">{number(row.energyKwh)} kWh</td><td><strong style={{ color: '#365b43' }}>{number(row.carbonKg)} kg</strong><div className="table-meta">CO₂e</div></td><td><span className={`status-tag ${statusClass(row.status)}`}><i className="status-dot" />{statusLabel(row.status)}</span></td></tr>)}</tbody></table></div><div className="pagination-note"><span data-testid="text-visible-results">{rows.length} {rows.length === 1 ? 'workload' : 'workloads'} shown</span><span>Filtered to your current view</span></div></>}
    </div>
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: '#92a398', fontSize: 10, margin: '14px 4px' }}><Leaf size={13} color="#54a570" /> Every workload tells a story. Cleaner energy is a good next chapter.</div>
  </div>;
}

function Router() {
  return <Shell><Switch><Route path="/" component={Overview} /><Route path="/history" component={History} /><Route component={NotFound} /></Switch></Shell>;
}

function App() {
  return <QueryClientProvider client={queryClient}><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter></QueryClientProvider>;
}

export default App;

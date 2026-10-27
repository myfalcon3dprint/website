'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuthUser } from '@/lib/supabase/auth';
import { formatINR } from '@/lib/money';
import { 
  BarChart3, Download, Calendar, DollarSign, 
  TrendingUp, RefreshCw, AlertCircle, ShoppingBag, 
  Layers, Package, Printer, FileSpreadsheet, CheckCircle2
} from 'lucide-react';

interface ReportData {
  range: string;
  financials: {
    grossSalesPaise: number;
    paymentsReceivedPaise: number;
    refundsPaise: number;
    pendingBalancePaise: number;
    totalOrdersCount: number;
    avgOrderValuePaise: number;
  };
  topSellingProducts: {
    title: string;
    sku: string;
    unitsSold: number;
    revenuePaise: number;
  }[];
  inventorySummary: {
    totalPhysicalStock: number;
    lowStockCount: number;
    totalCatalogProducts: number;
  };
  productionSummary: {
    totalJobsCount: number;
    completedJobsCount: number;
    reprintRatePercent: number;
    activePrintersCount: number;
  };
}

export default function AdminReportsPage() {
  const { profile } = useAuthUser();
  const [range, setRange] = useState<'today' | '7d' | '30d' | 'all'>('30d');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/admin/reports?range=${range}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate reports');

      setReportData(data);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error generating reports');
    } finally {
      setIsLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleExportCSV = (reportType: 'sales' | 'products' | 'production') => {
    window.location.href = `/api/admin/reports?range=${range}&format=csv&report=${reportType}`;
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ padding: '0.5rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', color: '#3B82F6' }}>
              <BarChart3 size={24} />
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, letterSpacing: '-0.025em' }}>
              Operational Reports & Financials
            </h1>
          </div>
          <p style={{ color: '#475569', margin: 0, fontSize: '0.95rem' }}>
            Accurate, database-backed sales totals, production turnaround rates, and downloadable CSV exports.
          </p>
        </div>

        {/* Date Range Selector */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {(['today', '7d', '30d', 'all'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: range === r ? '1px solid #C2410C' : '1px solid #64748B',
                background: range === r ? '#FFF7ED' : '#FFFFFF',
                color: range === r ? '#9A3412' : '#0F172A',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {r === 'today' ? 'Today' : r === '7d' ? 'Last 7 Days' : r === '30d' ? 'Last 30 Days' : 'All Time'}
            </button>
          ))}

          <button
            onClick={fetchReports}
            style={{
              padding: '0.5rem 0.75rem',
              borderRadius: '8px',
              border: '1px solid #64748B',
              background: '#FFFFFF',
              color: '#0F172A',
              cursor: 'pointer',
              marginLeft: '0.5rem',
            }}
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {errorMsg && (
        <div style={{
          padding: '1rem',
          background: '#FEF2F2',
          border: '1px solid #FECACA',
          borderRadius: '8px',
          color: '#B91C1C',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}>
          <AlertCircle size={20} />
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{errorMsg}</span>
        </div>
      )}

      {/* CSV Export Bar */}
      <div style={{
        padding: '1.25rem 1.5rem',
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
        marginBottom: '2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <FileSpreadsheet size={22} color="#047857" />
          <div>
            <div style={{ fontWeight: 700, color: '#0F172A' }}>Export Filtered Ledger Data</div>
            <div style={{ fontSize: '0.8rem', color: '#475569' }}>Download standard CSV sheets compatible with Excel, Tally & Zoho Books.</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleExportCSV('sales')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: '#EFF6FF',
              border: '1px solid #BFDBFE',
              borderRadius: '8px',
              color: '#1D4ED8',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <Download size={14} />
            Export Orders CSV
          </button>

          <button
            onClick={() => handleExportCSV('products')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: '#F5F3FF',
              border: '1px solid #DDD6FE',
              borderRadius: '8px',
              color: '#6D28D9',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <Download size={14} />
            Export Products CSV
          </button>

          <button
            onClick={() => handleExportCSV('production')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: '#ECFDF5',
              border: '1px solid #A7F3D0',
              borderRadius: '8px',
              color: '#047857',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <Download size={14} />
            Export Turnaround CSV
          </button>
        </div>
      </div>

      {reportData && (
        <>
          {/* Financial Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {/* Gross Sales */}
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
              padding: '1.25rem',
            }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>
                Gross Sales Value
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.25rem' }}>
                {formatINR(reportData.financials.grossSalesPaise)}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#15803D', fontWeight: 600 }}>
                {reportData.financials.totalOrdersCount} orders booked in this period
              </div>
            </div>

            {/* Payments Received */}
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
              padding: '1.25rem',
            }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>
                Payments Received (Captured)
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#15803D', marginBottom: '0.25rem' }}>
                {formatINR(reportData.financials.paymentsReceivedPaise)}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#475569' }}>
                Verified via Razorpay / Direct UPI
              </div>
            </div>

            {/* Pending Balances */}
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
              padding: '1.25rem',
            }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>
                Outstanding / COD Due
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#B45309', marginBottom: '0.25rem' }}>
                {formatINR(reportData.financials.pendingBalancePaise)}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#475569' }}>
                Due on local dispatch or delivery
              </div>
            </div>

            {/* Refunds Completed */}
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
              padding: '1.25rem',
            }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>
                Refunds Processed
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#DC2626', marginBottom: '0.25rem' }}>
                {formatINR(reportData.financials.refundsPaise)}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#475569' }}>
                Owner-approved reconciliations
              </div>
            </div>

            {/* Average Order Value */}
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
              padding: '1.25rem',
            }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>
                Average Order Value (AOV)
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0369A1', marginBottom: '0.25rem' }}>
                {formatINR(reportData.financials.avgOrderValuePaise)}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#475569' }}>
                Per confirmed transaction
              </div>
            </div>
          </div>

          {/* Turnaround & Operational Diagnostics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            {/* Production Turnaround */}
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
              padding: '1.5rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <Printer size={20} color="#047857" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Workshop Production Turnaround
                </h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ padding: '1rem', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 600 }}>Total Production Jobs</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A' }}>{reportData.productionSummary.totalJobsCount}</div>
                </div>

                <div style={{ padding: '1rem', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 600 }}>Completed & Packed</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#15803D' }}>{reportData.productionSummary.completedJobsCount}</div>
                </div>

                <div style={{ padding: '1rem', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 600 }}>QC Defect / Reprint Rate</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: reportData.productionSummary.reprintRatePercent > 10 ? '#DC2626' : '#15803D' }}>
                    {reportData.productionSummary.reprintRatePercent}%
                  </div>
                </div>

                <div style={{ padding: '1rem', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 600 }}>Active Printing Equipment</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1D4ED8' }}>{reportData.productionSummary.activePrintersCount} Units</div>
                </div>
              </div>
            </div>

            {/* Inventory Movements */}
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
              padding: '1.5rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <Package size={20} color="#C2410C" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Catalog & Physical Inventory
                </h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ padding: '1rem', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 600 }}>Total Physical Stock</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A' }}>{reportData.inventorySummary.totalPhysicalStock} Units</div>
                </div>

                <div style={{ padding: '1rem', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 600 }}>Low-Stock Alerts (≤5)</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: reportData.inventorySummary.lowStockCount > 0 ? '#B45309' : '#15803D' }}>
                    {reportData.inventorySummary.lowStockCount} Variants
                  </div>
                </div>

                <div style={{ padding: '1rem', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', gridColumn: 'span 2' }}>
                  <div style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 600 }}>Total Published Products</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0369A1' }}>{reportData.inventorySummary.totalCatalogProducts} Active Models</div>
                </div>
              </div>
            </div>
          </div>

          {/* Top Selling Products */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
            overflow: 'hidden',
          }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E2E8F0' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.25rem 0' }}>
                Top Performing Products & SKUs
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#475569' }}>
                Ranked by gross sales volume and units fulfilled in the selected timeframe.
              </p>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '0.875rem 1.25rem', color: '#475569', fontWeight: 600 }}>Product Title</th>
                  <th style={{ padding: '0.875rem 1.25rem', color: '#475569', fontWeight: 600 }}>Variant SKU</th>
                  <th style={{ padding: '0.875rem 1.25rem', color: '#475569', fontWeight: 600 }}>Units Sold</th>
                  <th style={{ padding: '0.875rem 1.25rem', color: '#475569', fontWeight: 600, textAlign: 'right' }}>Total Revenue</th>
                </tr>
              </thead>
              <tbody>
                {reportData.topSellingProducts.map((p, idx) => (
                  <tr key={`${p.sku}-${idx}`} style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '1rem 1.25rem', fontWeight: 700, color: '#0F172A' }}>
                      {p.title}
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <span style={{
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        background: '#F1F5F9',
                        border: '1px solid #CBD5E1',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        color: '#0F172A',
                      }}>
                        {p.sku}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', color: '#0F172A', fontWeight: 600 }}>
                      {p.unitsSold} units
                    </td>
                    <td style={{ padding: '1rem 1.25rem', textAlign: 'right', fontWeight: 700, color: '#15803D' }}>
                      {formatINR(p.revenuePaise)}
                    </td>
                  </tr>
                ))}

                {reportData.topSellingProducts.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
                      No product sales recorded for this date range.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

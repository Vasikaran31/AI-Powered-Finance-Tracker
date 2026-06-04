import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { downloadMonthlyReport, getMonthlyReport } from '../services/reportService'
import { formatCurrency, formatDate } from '../utils/format'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

function Reports() {
  const now = new Date()
  const [period, setPeriod] = useState({
    month: now.getMonth() + 1,
    year: now.getFullYear()
  })
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const params = useMemo(() => ({ ...period }), [period])

  useEffect(() => {
    setLoading(true)
    setError('')
    getMonthlyReport(params)
      .then((res) => setReport(res.data.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load report'))
      .finally(() => setLoading(false))
  }, [params])

  const exportPdf = async () => {
    try {
      const res = await downloadMonthlyReport(period)
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `finance-report-${period.year}-${String(period.month).padStart(2, '0')}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch {
      setError('Failed to export PDF')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
          <p className="text-gray-500 text-sm mt-1">Monthly financial summary and export</p>
        </div>
        <button
          onClick={exportPdf}
          disabled={loading || !report}
          className="px-4 py-2 bg-secondary text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-60"
        >
          Export PDF
        </button>
      </div>

      <section className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-3">
          <select
            value={period.month}
            onChange={(e) => setPeriod({ ...period, month: Number(e.target.value) })}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
          >
            {MONTH_NAMES.map((name, i) => (
              <option key={i} value={i + 1}>
                {name}
              </option>
            ))}
          </select>
          <input
            type="number"
            min="2000"
            max="2099"
            value={period.year}
            onChange={(e) => setPeriod({ ...period, year: Number(e.target.value) })}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
          />
        </div>
      </section>

      {loading && (
        <div className="flex items-center justify-center h-32 text-gray-500">
          Loading report...
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {report && !loading && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-lg border p-5 shadow-sm border-emerald-200 bg-emerald-50 text-emerald-900">
              <p className="text-sm font-medium opacity-70">Income</p>
              <p className="mt-3 text-2xl font-bold">{formatCurrency(report.totalIncome)}</p>
            </div>
            <div className="rounded-lg border p-5 shadow-sm border-rose-200 bg-rose-50 text-rose-900">
              <p className="text-sm font-medium opacity-70">Expense</p>
              <p className="mt-3 text-2xl font-bold">{formatCurrency(report.totalExpense)}</p>
            </div>
            <div className="rounded-lg border p-5 shadow-sm border-sky-200 bg-sky-50 text-sky-900">
              <p className="text-sm font-medium opacity-70">Savings</p>
              <p className="mt-3 text-2xl font-bold">{formatCurrency(report.savings)}</p>
            </div>
            <div className="rounded-lg border p-5 shadow-sm bg-white">
              <p className="text-sm font-medium opacity-70">Remaining</p>
              <p className="mt-3 text-2xl font-bold">{formatCurrency(report.budgetRemaining)}</p>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <section className="rounded-lg border bg-white p-5 shadow-sm xl:col-span-2">
              <h2 className="text-base font-semibold text-gray-800">Category Analytics</h2>
              <div className="mt-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={report.categoryBreakdown || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(val) => formatCurrency(val)} />
                    <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="rounded-lg border bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-gray-800">Transactions</h2>
              <div className="mt-4 max-h-72 space-y-3 overflow-auto">
                {report.transactions?.length > 0 ? (
                  report.transactions.map((t) => (
                    <div key={t._id} className="flex items-center justify-between py-1">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{t.title}</p>
                        <p className="text-xs text-gray-500">
                          {t.category} • {formatDate(t.transactionDate)}
                        </p>
                      </div>
                      <span
                        className={`text-sm font-semibold ${
                          t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {t.type === 'income' ? '+' : '-'}
                        {formatCurrency(t.amount)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-400 text-center py-4">
                    No transactions for this period.
                  </p>
                )}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  )
}

export default Reports
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchBudget, saveBudget } from '../redux/slices/budgetSlice'
import { getDashboardSummary } from '../services/dashboardService'
import { categories, formatCurrency } from '../utils/format'

function Budget() {
  const dispatch = useDispatch()
  const budget = useSelector((state) => state.budget)

  const [monthlyBudget, setMonthlyBudget] = useState(0)
  const [categoryBudgets, setCategoryBudgets] = useState([])
  const [summary, setSummary] = useState(null)
  const [message, setMessage] = useState('')

  // Fetch budget and dashboard summary on mount
  useEffect(() => {
    dispatch(fetchBudget())
    getDashboardSummary()
      .then((res) => setSummary(res.data.data))
      .catch(() => {})
  }, [dispatch])

  // Sync local state when redux budget changes
  useEffect(() => {
    setMonthlyBudget(budget.monthlyBudget || 0)
    setCategoryBudgets(budget.categories || [])
  }, [budget.monthlyBudget, budget.categories])

  const addCategory = () => {
    setCategoryBudgets([...categoryBudgets, { category: categories[0], limit: 0 }])
  }

  const updateCategory = (i, field, value) => {
    const updated = categoryBudgets.map((item, idx) =>
      idx === i ? { ...item, [field]: value } : item
    )
    setCategoryBudgets(updated)
  }

  const removeCategory = (i) => {
    setCategoryBudgets(categoryBudgets.filter((_, idx) => idx !== i))
  }

  const save = async (e) => {
    e.preventDefault()
    const result = await dispatch(
      saveBudget({
        monthlyBudget: Number(monthlyBudget),
        categoryBudgets: categoryBudgets.map((cb) => ({
          category: cb.category,
          limit: Number(cb.limit)
        }))
      })
    )
    if (saveBudget.fulfilled.match(result)) {
      // Refresh summary after saving
      getDashboardSummary()
        .then((res) => setSummary(res.data.data))
        .catch(() => {})
      setMessage('Budget saved successfully!')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const totalExpense = summary?.totalExpense || 0
  const remaining = Number(monthlyBudget) - totalExpense
  const usedPercent = monthlyBudget > 0 ? Math.min(100, (totalExpense / monthlyBudget) * 100) : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Budget</h1>
        <p className="text-gray-500 text-sm mt-1">Set monthly and category-level spending limits</p>
      </div>

      {message && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
          {message}
        </div>
      )}
      {budget.error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {budget.error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Budget form */}
        <section className="rounded-lg border bg-white p-5 shadow-sm xl:col-span-2">
          <form onSubmit={save} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monthly Budget (₹)
              </label>
              <input
                type="number"
                min="0"
                value={monthlyBudget}
                onChange={(e) => setMonthlyBudget(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
              />
            </div>

            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-800">Category Budgets</h2>
              <button
                type="button"
                onClick={addCategory}
                className="text-sm px-3 py-1.5 bg-secondary text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                + Add Category
              </button>
            </div>

            <div className="space-y-3">
              {categoryBudgets.map((item, i) => {
                const spent =
                  summary?.categoryBreakdown?.find((c) => c.category === item.category)?.amount ||
                  0
                const limit = Number(item.limit) || 0
                const percent = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0

                return (
                  <div key={i} className="rounded-lg border border-gray-100 p-4 bg-slate-50">
                    <div className="flex items-center gap-3 mb-3">
                      <select
                        value={item.category}
                        onChange={(e) => updateCategory(i, 'category', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-secondary"
                      >
                        {categories.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="0"
                        placeholder="Limit ₹"
                        value={item.limit}
                        onChange={(e) => updateCategory(i, 'limit', e.target.value)}
                        className="w-32 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-secondary"
                      />
                      <button
                        type="button"
                        onClick={() => removeCategory(i)}
                        className="text-red-400 hover:text-red-600 text-lg leading-none"
                      >
                        ×
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>
                        Spent: {formatCurrency(spent)} / {formatCurrency(limit)}
                      </span>
                      <span className={percent >= 100 ? 'text-red-600 font-semibold' : ''}>
                        {Math.round(percent)}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          percent >= 100 ? 'bg-red-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                )
              })}

              {categoryBudgets.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">
                  No category budgets added yet. Click "+ Add Category" to start.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={budget.loading}
              className="w-full py-2.5 bg-secondary text-white rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-60"
            >
              {budget.loading ? 'Saving...' : 'Save Budget'}
            </button>
          </form>
        </section>

        {/* Monthly Progress */}
        <section className="rounded-lg border bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800">Monthly Progress</h2>
          <div className="mt-5 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Spent</span>
              <span className="text-sm font-semibold text-gray-800">
                {formatCurrency(totalExpense)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Remaining</span>
              <span
                className={`text-sm font-semibold ${
                  remaining < 0 ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                {formatCurrency(remaining)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Budget</span>
              <span className="text-sm font-semibold text-gray-800">
                {formatCurrency(monthlyBudget)}
              </span>
            </div>

            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Used</span>
                <span>{Math.round(usedPercent)}%</span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    usedPercent >= 100 ? 'bg-red-500' : 'bg-sky-500'
                  }`}
                  style={{ width: `${usedPercent}%` }}
                />
              </div>
            </div>

            {remaining < 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                ⚠ You have overspent your monthly budget by{' '}
                <strong>{formatCurrency(Math.abs(remaining))}</strong>.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

export default Budget
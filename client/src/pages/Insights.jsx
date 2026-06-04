import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchInsights, fetchPrediction } from '../redux/slices/insightSlice'
import { formatCurrency } from '../utils/format'

function Insights() {
  const dispatch = useDispatch()
  const { insights, predictions, provider, loading, error } = useSelector(
    (state) => state.insights
  )

  useEffect(() => {
    dispatch(fetchInsights())
    dispatch(fetchPrediction())
  }, [dispatch])

  const refresh = () => {
    dispatch(fetchInsights())
    dispatch(fetchPrediction())
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">AI Insights</h1>
          <p className="text-gray-500 text-sm mt-1">
            Personalized recommendations powered by your transaction data
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="px-4 py-2 bg-secondary text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-60"
        >
          {loading ? 'Refreshing...' : 'Refresh Insights'}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Insights list */}
        <section className="rounded-lg border bg-white p-5 shadow-sm xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-800">Recommendations</h2>
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-medium">
              {provider || 'heuristic'}
            </span>
          </div>

          {loading ? (
            <p className="text-sm text-gray-400 py-8 text-center">Generating insights...</p>
          ) : insights && insights.length > 0 ? (
            <div className="space-y-3">
              {insights.map((insight, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-4 rounded-lg bg-slate-50 border border-slate-100"
                >
                  <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-white text-xs font-semibold shrink-0">
                    {i + 1}
                  </span>
                  <p className="text-sm text-gray-700 leading-relaxed">{insight}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 py-8 text-center">
              Add transactions to generate insights.
            </p>
          )}
        </section>

        {/* Spending Prediction */}
        <section className="rounded-lg border bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800">Spending Prediction</h2>
          <div className="mt-5 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Predicted Expense</span>
              <span className="text-lg font-bold text-gray-800">
                {formatCurrency(predictions?.predictedExpense || 0)}
              </span>
            </div>

            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Confidence</span>
                <span>{Math.round(predictions?.confidence || 0)}%</span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-secondary transition-all"
                  style={{ width: `${predictions?.confidence || 0}%` }}
                />
              </div>
            </div>

            {predictions?.budgetRisk && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                ⚠ Predicted spending is above your monthly budget. Consider reducing discretionary
                expenses.
              </div>
            )}

            {predictions?.recommendations?.length > 0 && (
              <div className="pt-2 space-y-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Tips
                </h3>
                {predictions.recommendations.map((tip, i) => (
                  <p key={i} className="text-xs text-gray-600 leading-relaxed">
                    • {tip}
                  </p>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

export default Insights
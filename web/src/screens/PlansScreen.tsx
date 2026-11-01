import { STYLE_META, deriveMetrics, walkPercent, yuan } from '../format'
import type { GenerateResponse } from '../types'

interface PlansScreenProps {
  result: GenerateResponse
  onBack: () => void
  onOpen: (index: number) => void
}

export function PlansScreen({ result, onBack, onOpen }: PlansScreenProps): React.ReactElement {
  const sample = result.plans[0]
  return (
    <div className="page">
      <header className="nav">
        <button type="button" className="nav-btn" onClick={onBack}>
          返回
        </button>
        <h1>三套攻略</h1>
        <span />
      </header>
      <div className="scroll choices">
        {sample ? (
          <p className="hint pad">
            {sample.city} · {sample.days}天 · {sample.people}人 · 预算 {yuan(sample.budget_total)}
          </p>
        ) : null}
        {result.plans.map((plan, index) => {
          const metrics = deriveMetrics(plan)
          const meta = STYLE_META[plan.style]
          return (
            <article key={plan.trip_id} className={`choice ${plan.style}`}>
              <header>
                <b>{meta?.name ?? plan.style}</b>
                <span>{meta?.line}</span>
              </header>
              <dl>
                <div>
                  <dd>{metrics.stop_count}</dd>
                  <dt>去几处</dt>
                </div>
                <div>
                  <dd>{metrics.transit_min}分</dd>
                  <dt>路上</dt>
                </div>
                <div>
                  <dd>{yuan(metrics.ticket_total)}</dd>
                  <dt>门票</dt>
                </div>
                <div>
                  <dd>{walkPercent(metrics.walk_ratio)}</dd>
                  <dt>步行</dt>
                </div>
              </dl>
              <button type="button" onClick={() => onOpen(index)}>
                查看这套攻略
              </button>
            </article>
          )
        })}
      </div>
    </div>
  )
}

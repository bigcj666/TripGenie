import { STYLE_META, deriveMetrics, presentWarning, walkPercent, warningsFor, yuan } from '../format'
import type { GenerateResponse, TravelStyle } from '../types'

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
        <h1>三套行程</h1>
        <span />
      </header>
      <div className="scroll choices">
        <p className="hint pad">三套都按同一条件排出，用数字对比后再选一套。</p>
        <p className="banner">{result.engine === 'mock' ? fallbackLine() : successLine()}</p>
        {sample ? (
          <p className="hint pad">
            {sample.city} · {sample.days}天 · {sample.people}人 · 预算 {yuan(sample.budget_total)}
          </p>
        ) : (
          <EmptyPlans />
        )}
        {result.plans.map((plan, index) => {
          const metrics = deriveMetrics(plan)
          const meta = STYLE_META[plan.style]
          const warnings = unique(warningsFor(result.warnings, plan.style).map(presentWarning))
          return (
            <article key={plan.trip_id} className={`choice ${plan.style}`}>
              <header>
                <b>{meta?.name ?? plan.style}</b>
                <span>{meta?.line}</span>
              </header>
              {meta ? <span className="tag">{meta.tag}</span> : null}
              <dl>
                <div>
                  <dt>行程站点数</dt>
                  <dd>{metrics.stop_count}</dd>
                </div>
                <div>
                  <dt>市内移动</dt>
                  <dd>{metrics.transit_min}分钟</dd>
                </div>
                <div>
                  <dt>门票合计</dt>
                  <dd>{yuan(metrics.ticket_total)}</dd>
                </div>
                <div>
                  <dt>步行衔接</dt>
                  <dd>{walkPercent(metrics.walk_ratio)}</dd>
                </div>
              </dl>
              <button type="button" onClick={() => onOpen(index)}>
                查看这套行程
              </button>
              {plan.route_rationale ? <p className="hint">{plan.route_rationale}</p> : null}
              {warnings.length > 0 ? (
                <ul className="warn-list">
                  {warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              ) : null}
            </article>
          )
        })}
      </div>
    </div>
  )
}

function successLine(): string {
  return '已为你生成三套可对照的行程。'
}

function fallbackLine(): string {
  return '行程已用备用方案生成，地点和花费仍按既定规则计算，可以照常对比。'
}

function EmptyPlans(): React.ReactElement {
  return <p className="muted pad">这次没有生成成功，请检查条件后重试。</p>
}

function unique(items: string[]): string[] {
  return [...new Set(items)]
}

export type { TravelStyle }

import { STYLE_META, deriveMetrics, walkPercent, warningsFor, yuan } from '../format'
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
        <h1>{result.plans.length > 1 ? '三套攻略' : '攻略'}</h1>
        <span />
      </header>
      <div className="scroll choices">
        <p className="banner">{engineLine(result.engine)}</p>
        {sample ? (
          <p className="hint pad">
            {sample.city} · {sample.days}天 · {sample.people}人 · 预算 {yuan(sample.budget_total)}
          </p>
        ) : (
          <p className="muted pad">没有生成出攻略。</p>
        )}
        {result.plans.map((plan, index) => {
          const metrics = deriveMetrics(plan)
          const meta = STYLE_META[plan.style]
          const warnings = warningsFor(result.warnings, plan.style)
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
              {warnings.length > 0 ? (
                <ul className="warn-list">
                  {warnings.map((warning, warningIndex) => (
                    <li key={`${plan.trip_id}-${warningIndex}`}>{warning}</li>
                  ))}
                </ul>
              ) : null}
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

function engineLine(engine: string): string {
  if (engine === 'mock') return '演示引擎：没有大模型密钥，这套行程来自杭州、成都、西安的内置数据。'
  if (engine === 'deepseek') return '由 DeepSeek 写成。点位仍以返回的行程为准。'
  if (engine === 'glm') return '由智谱写成。点位仍以返回的行程为准。'
  return '行程已生成。'
}

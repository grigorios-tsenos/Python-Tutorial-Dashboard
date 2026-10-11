import type { ReactNode } from 'react'
import type { CommandCard, UnitCommands } from '../content/commands'

/** `backticks` become <code>; everything else stays plain text. */
function inline(text: string): ReactNode[] {
  return text.split('`').map((part, i) => (i % 2 ? <code key={i}>{part}</code> : part))
}

function Card({ card, open }: { card: CommandCard; open: boolean }) {
  return (
    <details className="command-card" open={open}>
      <summary><code>{card.name}</code><span className="command-kind">{card.kind}</span></summary>
      <p className="command-signature"><code>{card.signature}</code></p>
      <p>{inline(card.summary)}</p>
      {card.params.length > 0 && (
        <dl className="command-params">
          {card.params.map(param => <div key={param.name}><dt><code>{param.name}</code></dt><dd>{inline(param.text)}</dd></div>)}
        </dl>
      )}
      {card.returns && <p><strong>Returns</strong> {inline(card.returns)}</p>}
    </details>
  )
}

/** Reference cards for the commands a step or line uses: new ones open, ones met before folded into a refresher. */
export function CommandCards({ commands, unit }: { commands: UnitCommands; unit: 'step' | 'line' }) {
  const { fresh, known } = commands
  if (!fresh.length && !known.length) return null
  return (
    <section className="command-cards" aria-label={`Commands in this ${unit}`}>
      {fresh.length > 0 && (
        <>
          <h3>New in this {unit}</h3>
          <p className="small dim">Reference only: what each command is and what it takes. Working out how to use it is your part.</p>
          {fresh.map(card => <Card key={card.name} card={card} open={fresh.length <= 2} />)}
        </>
      )}
      {known.length > 0 && (
        <details className="command-refresher">
          <summary>Refresher: {known.map((card, i) => <span key={card.name}>{i > 0 && ', '}<code>{card.name}</code></span>)}</summary>
          {known.map(card => <Card key={card.name} card={card} open={false} />)}
        </details>
      )}
    </section>
  )
}

import { useEffect, useRef, useState } from 'react'

type PaymentMethod = 'PIX' | 'CARD' | 'BOLETO'
type PaymentClass = { name: string; modality: string; instructor: string; days: string; timeRange: string; price: number }
type Props = {
  item: PaymentClass
  onBack: () => void
  onConfirm: () => Promise<{ id: number }>
}

const methods: { value: PaymentMethod; label: string; description: string }[] = [
  { value: 'PIX', label: 'Pix', description: 'Aprovação simulada na hora' },
  { value: 'CARD', label: 'Cartão', description: 'Cartão de teste, sem dados reais' },
  { value: 'BOLETO', label: 'Boleto', description: 'Confirmação demonstrativa' },
]

export default function PaymentDemo({ item, onBack, onConfirm }: Props) {
  const [method, setMethod] = useState<PaymentMethod>('PIX')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [enrollmentId, setEnrollmentId] = useState<number | null>(null)
  const submitting = useRef(false)
  const title = useRef<HTMLHeadingElement>(null)
  const price = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)

  useEffect(() => { title.current?.focus() }, [enrollmentId])

  const confirm = async () => {
    if (submitting.current || enrollmentId !== null) return
    submitting.current = true
    setBusy(true)
    setError('')
    try {
      const enrollment = await onConfirm()
      setEnrollmentId(enrollment.id)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível confirmar sua inscrição. Tente novamente.')
    } finally {
      submitting.current = false
      setBusy(false)
    }
  }

  if (enrollmentId !== null) return <section className="panel payment-success" aria-labelledby="payment-title">
    <span className="demo-badge">Demonstração acadêmica</span>
    <div className="success-icon" aria-hidden="true">✓</div>
    <h2 id="payment-title" ref={title} tabIndex={-1}>Inscrição confirmada!</h2>
    <p>O pagamento foi simulado e sua inscrição em <strong>{item.name}</strong> foi registrada.</p>
    <dl className="payment-receipt">
      <div><dt>Inscrição</dt><dd>#{enrollmentId}</dd></div>
      <div><dt>Forma simulada</dt><dd>{methods.find(option => option.value === method)?.label}</dd></div>
      <div><dt>Valor demonstrativo</dt><dd>{price}</dd></div>
      <div><dt>Valor cobrado</dt><dd>R$ 0,00</dd></div>
    </dl>
    <p className="payment-disclaimer">Nenhuma cobrança foi realizada. Esta confirmação é apenas para demonstrar o fluxo do projeto.</p>
    <button className="btn btn-primary" onClick={onBack}>Ver minha agenda →</button>
  </section>

  return <section className="panel checkout" aria-labelledby="payment-title">
    <button className="back-checkout" onClick={onBack} disabled={busy}>← Voltar às turmas</button>
    <div className="checkout-heading"><div><span className="section-label">Finalize sua inscrição</span><h2 id="payment-title" ref={title} tabIndex={-1}>Pagamento demonstrativo</h2></div><span className="demo-badge">Sem cobrança real</span></div>
    <ol className="checkout-steps" aria-label="Etapas da inscrição"><li>1. Escolha da turma</li><li aria-current="step">2. Pagamento simulado</li><li>3. Confirmação</li></ol>
    <div className="demo-notice" role="note"><strong>Este é um ambiente de demonstração.</strong><p>Não faça transferências nem informe dados bancários. Basta escolher uma forma de pagamento e confirmar a simulação.</p></div>
    <div className="checkout-grid">
      <div>
        <fieldset className="payment-methods" disabled={busy}><legend>Como você gostaria de simular o pagamento?</legend>
          {methods.map(option => <label className={method === option.value ? 'payment-option selected' : 'payment-option'} key={option.value}>
            <input type="radio" name="paymentMethod" value={option.value} checked={method === option.value} onChange={() => setMethod(option.value)} />
            <span><strong>{option.label}</strong><small>{option.description}</small></span>
          </label>)}
        </fieldset>
        <div className="payment-preview" aria-live="polite">
          {method === 'PIX' && <><span className="payment-symbol" aria-hidden="true">◇</span><strong>Pix de demonstração</strong><p>Nenhuma chave ou QR Code real é necessário. A confirmação é feita pelo botão abaixo.</p></>}
          {method === 'CARD' && <><span className="payment-symbol" aria-hidden="true">▣</span><strong>Cartão de teste •••• 4242</strong><p>Cartão fictício já selecionado. Não é necessário informar número, validade ou código de segurança.</p></>}
          {method === 'BOLETO' && <><div className="demo-barcode" aria-hidden="true"/><strong>Boleto sem valor financeiro</strong><p>Não existe boleto para pagar. A simulação será confirmada imediatamente.</p></>}
        </div>
      </div>
      <aside className="checkout-summary" aria-label="Resumo da inscrição"><span className="section-label">Sua turma</span><h3>{item.name}</h3>
        <dl><div><dt>Modalidade</dt><dd>{item.modality}</dd></div><div><dt>Professor</dt><dd>{item.instructor}</dd></div><div><dt>Dias</dt><dd>{item.days}</dd></div><div><dt>Horário</dt><dd>{item.timeRange}</dd></div></dl>
        <div className="checkout-total"><span>Mensalidade demonstrativa</span><strong>{price}</strong></div>
        <p>Valor cobrado nesta demonstração: <b>R$ 0,00</b></p>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="btn btn-primary full" disabled={busy} onClick={() => { void confirm() }}>{busy ? 'Confirmando inscrição...' : 'Confirmar pagamento simulado'}</button>
        <small className="payment-disclaimer">Sua inscrição será registrada após a confirmação. Nenhum pagamento real será processado.</small>
      </aside>
    </div>
  </section>
}

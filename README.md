# XLocalizador — SaaS para Representantes

Site de vendas e onboarding do Localizador de Farmácias Parceiras, oferecido como serviço para representantes de outras regiões.

🔗 **Site no ar:** https://xlocalizador.vercel.app/
(espelho: https://rodrigoharrop.github.io/localizador-farmacias-saas/)

## Páginas

- `index.html` — Proposta comercial e preços
- `cadastro.html` — Captura de lead (nome, WhatsApp, email) + escolha de plano + pagamento
- `farmacias.html` — Formulário para o representante cadastrar as farmácias parceiras da região dele (upload de CSV/Excel ou preenchimento manual)
- `assets/logo/` — Identidade visual XLocalizador (ícone, wordmark, showcase)

## Fluxo

`index.html` → `cadastro.html` (dados + pagamento) → `farmacias.html`

## Preços

| Item | Valor |
|---|---|
| Ativação (pagamento único, inclui a 1ª mensalidade) | R$ 197,00 |
| Plano Mensal (a partir do 2º mês, sem fidelidade) | R$ 127,00/mês |
| Plano Anual (a partir do 2º mês, fidelidade 12 meses) | R$ 97,00/mês |
| Plano Anual à Vista (opcional, -20% Pix) | R$ 931,20 |

## Pagamento (Asaas)

- **Ativação:** link de pagamento avulso conectado → https://www.asaas.com/c/0cwnnhv5zbdtf1qt
- **Anual à Vista:** link de pagamento avulso conectado → https://www.asaas.com/c/d3kdb6m7nvcj8yzk
- **Mensal / Anual recorrente:** sem link fixo — assinatura criada manualmente no painel do Asaas após o pagamento da ativação, com base no plano informado via WhatsApp (1º vencimento 30 dias após a ativação)

## Próximos passos

- Automatizar criação da Assinatura no Asaas via webhook (hoje é manual)
- Automatizar recebimento dos leads (hoje via WhatsApp/wa.me)

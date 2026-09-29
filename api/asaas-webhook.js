// Webhook do Asaas: recebe eventos de TODAS as cobranças da conta (inclusive de
// outros projetos que também usam Asaas). Este endpoint filtra e só reage às
// cobranças que pertencem ao XLocalizador, ignorando (200 OK, sem ação) tudo o
// resto silenciosamente para não interferir em nenhum outro sistema.

const DESTINATARIO = 'xdigital.ag@gmail.com';
const REMETENTE = process.env.RESEND_FROM || 'XLocalizador <notificacoes@form.agenciaxdigital.com.br>';

// Eventos que representam pagamento confirmado de verdade (dinheiro recebido/garantido)
const EVENTOS_CONFIRMACAO = ['PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED'];

// Como identificamos que a cobrança é do XLocalizador (e não de outro projeto
// que compartilha a mesma conta Asaas): pela descrição do link de pagamento
// (defina "XLocalizador" na descrição de cada produto no Asaas) e, como
// reforço, pelos valores conhecidos dos nossos produtos.
const VALORES_CONHECIDOS = [197.0, 1028.2];

function pertenceAoXLocalizador(payment) {
  const descricao = (payment.description || '').toLowerCase();
  if (descricao.includes('xlocalizador')) return true;
  return VALORES_CONHECIDOS.includes(payment.value);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Valida que a chamada realmente veio do Asaas, usando o token configurado
  // no painel (Integrações > Webhooks > Token de acesso), comparado com a
  // env var ASAAS_WEBHOOK_TOKEN configurada na Vercel.
  const tokenRecebido = req.headers['asaas-access-token'];
  if (process.env.ASAAS_WEBHOOK_TOKEN && tokenRecebido !== process.env.ASAAS_WEBHOOK_TOKEN) {
    console.error('Webhook Asaas: token de acesso inválido.');
    return res.status(401).json({ error: 'Token inválido' });
  }

  const { event, payment } = req.body || {};

  // Sempre responde 200 rápido para o Asaas não ficar reenviando o evento,
  // mesmo quando a gente decide não fazer nada com ele.
  if (!event || !payment) {
    return res.status(200).json({ ok: true, ignorado: 'payload sem event/payment' });
  }

  if (!EVENTOS_CONFIRMACAO.includes(event)) {
    return res.status(200).json({ ok: true, ignorado: `evento ${event} não é de confirmação` });
  }

  if (!pertenceAoXLocalizador(payment)) {
    return res.status(200).json({ ok: true, ignorado: 'cobrança não pertence ao XLocalizador' });
  }

  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY não configurada nas variáveis de ambiente da Vercel.');
    return res.status(200).json({ ok: true, erro: 'Resend não configurado' });
  }

  try {
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: REMETENTE,
        to: DESTINATARIO,
        subject: `Pagamento confirmado no XLocalizador: R$ ${payment.value}`,
        html: `
          <h2>✅ Pagamento confirmado</h2>
          <p><strong>Valor:</strong> R$ ${payment.value}</p>
          <p><strong>Descrição:</strong> ${escapeHtml(payment.description || '-')}</p>
          <p><strong>Forma de pagamento:</strong> ${escapeHtml(payment.billingType || '-')}</p>
          <p><strong>Cliente (Asaas):</strong> ${escapeHtml(payment.customer || '-')}</p>
          <p><strong>ID da cobrança:</strong> ${escapeHtml(payment.id || '-')}</p>
          <p><strong>Evento:</strong> ${escapeHtml(event)}</p>
        `,
      }),
    });

    if (!resendResponse.ok) {
      console.error('Erro da API do Resend:', await resendResponse.text());
    }
  } catch (err) {
    console.error('Erro ao enviar email de confirmação de pagamento:', err);
  }

  return res.status(200).json({ ok: true });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

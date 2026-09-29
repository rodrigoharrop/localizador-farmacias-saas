// Função serverless (Vercel) que notifica por email um novo interessado no XLocalizador.
// Usa a API do Resend — variável de ambiente RESEND_API_KEY precisa estar configurada
// no projeto na Vercel (Settings > Environment Variables).

const DESTINATARIO = 'xdigital.ag@gmail.com';
const REMETENTE = process.env.RESEND_FROM || 'XLocalizador <notificacoes@form.agenciaxdigital.com.br>';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { nome, whatsapp, email, regiao, evento, plano } = req.body || {};

  if (!nome) {
    return res.status(400).json({ error: 'Dados incompletos (nome é obrigatório)' });
  }

  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY não configurada nas variáveis de ambiente da Vercel.');
    return res.status(500).json({ error: 'Serviço de email não configurado' });
  }

  const ehPagamento = evento === 'pagamento_iniciado';
  const subject = ehPagamento
    ? `Pagamento iniciado no XLocalizador: ${nome}`
    : `Novo interessado no XLocalizador: ${nome}`;
  const html = ehPagamento
    ? `
      <h2>💳 Pagamento iniciado</h2>
      <p><strong>Nome:</strong> ${escapeHtml(nome)}</p>
      <p><strong>WhatsApp:</strong> ${escapeHtml(whatsapp || '-')}</p>
      <p><strong>Email:</strong> ${escapeHtml(email || '-')}</p>
      <p><strong>Plano escolhido:</strong> ${escapeHtml(plano || '-')}</p>
    `
    : `
      <h2>🆕 Novo interessado no XLocalizador</h2>
      <p><strong>Nome:</strong> ${escapeHtml(nome)}</p>
      <p><strong>WhatsApp:</strong> ${escapeHtml(whatsapp || '-')}</p>
      <p><strong>Email:</strong> ${escapeHtml(email || '-')}</p>
      <p><strong>Região:</strong> ${escapeHtml(regiao || '-')}</p>
    `;

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
        subject,
        html,
      }),
    });

    if (!resendResponse.ok) {
      const errText = await resendResponse.text();
      console.error('Erro da API do Resend:', errText);
      return res.status(502).json({ error: 'Falha ao enviar email de notificação' });
    }

    const resendData = await resendResponse.json();
    console.log('Email enviado via Resend, id:', resendData.id);
    return res.status(200).json({ ok: true, resendId: resendData.id });
  } catch (err) {
    console.error('Erro ao enviar email de notificação:', err);
    return res.status(500).json({ error: 'Erro interno ao enviar notificação' });
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

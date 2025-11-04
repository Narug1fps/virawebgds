# Configuração do Stripe Webhook

Para que o sistema de upgrade funcione corretamente em produção, você precisa configurar o webhook do Stripe.

## Passos para Configuração:

### 1. Acesse o Dashboard do Stripe
- Vá para: https://dashboard.stripe.com/webhooks
- Clique em "Add endpoint"

### 2. Configure o Endpoint
- **URL do Endpoint**: `https://seu-dominio.com/api/webhooks/stripe`
- **Descrição**: "ViraWeb Subscription Webhooks"

### 3. Selecione os Eventos
Marque os seguintes eventos para escutar:
- ✅ `checkout.session.completed`
- ✅ `invoice.payment_succeeded`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`

### 4. Obtenha o Signing Secret
Após criar o webhook, copie o **Signing Secret** (começa com `whsec_...`)

### 5. Adicione a Variável de Ambiente
No Vercel ou em seu `.env.local`:

\`\`\`env
STRIPE_WEBHOOK_SECRET=whsec_seu_secret_aqui
\`\`\`

### 6. Teste o Webhook
Use o Stripe CLI para testar localmente:

\`\`\`bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
stripe trigger checkout.session.completed
\`\`\`

## Fluxo de Pagamento

1. **Usuário clica em "Fazer Upgrade"**
   - Sistema cria sessão de checkout no Stripe
   - Usuário é redirecionado para página de pagamento

2. **Usuário completa o pagamento**
   - Stripe processa o pagamento
   - Stripe envia webhook `checkout.session.completed`

3. **Sistema recebe webhook**
   - Verifica assinatura do webhook
   - Atualiza plano no banco de dados
   - Ativa ViraBot AI se aplicável
   - Atualiza limites de uso

4. **Usuário é redirecionado**
   - Página de sucesso confirma upgrade
   - Dashboard atualiza automaticamente

## Segurança

- ✅ Webhook signature verification implementada
- ✅ Metadata validation (user_id, plan_type)
- ✅ Idempotency handling
- ✅ Error logging

## Troubleshooting

Se o webhook não funcionar:
1. Verifique se `STRIPE_WEBHOOK_SECRET` está configurado
2. Confirme que a URL do webhook está correta
3. Verifique os logs no Stripe Dashboard
4. Use `console.log(" ...")` para debug

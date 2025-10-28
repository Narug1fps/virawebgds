export function mapDbErrorToUserMessage(raw: string | undefined | null) {
  if (!raw) return "Ocorreu um erro no servidor. Tente novamente mais tarde."
  const message = String(raw)

  // Common DB / PostgREST errors
  if (/cpf|duplicate|unique|constraint/i.test(message)) {
    return "Erro: o CPF informado é inválido ou já cadastrado. Você pode deixar o CPF em branco.";
  }
  if (/Could not find the 'birthday' column|PGRST204/i.test(message)) {
    return "Erro no servidor: campo de aniversário não encontrado. Tente salvar sem preencher a data de aniversário ou atualize o banco de dados.";
  }
  if (/policy .* already exists|42710/i.test(message)) {
    return "Erro no servidor: uma política já existe. Execute as migrações atualizadas novamente (idempotentes).";
  }
  if (/permission denied|forbidden/i.test(message)) {
    return "Permissão negada para essa operação. Verifique suas credenciais ou permissões.";
  }

  // Fallback: return a cleaned message without internal codes
  return message.replace(/\s+\|\s+/g, ' - ')
}

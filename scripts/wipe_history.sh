#!/usr/bin/env bash
set -euo pipefail

# wipe_history.sh - Reescreve o histórico do branch main mantendo apenas 1 commit inicial.
# USO:
#   HIST_CLEAN_CONFIRM=YES ./scripts/wipe_history.sh "mensagem do commit inicial"
# Pré-requisitos:
#   - working tree limpo (sem mudanças pendentes)
#   - remoto 'origin' apontando para o repositório correto
#   - branch atual pode ser qualquer um; script trabalhará no estado atual do filesystem
# O que faz:
#   1. Cria branch órfão temp-clean
#   2. Adiciona todos os arquivos versionáveis
#   3. Faz 1 commit
#   4. Substitui branch main antigo
#   5. Push forçado para origin main
# Proteções:
#   - Exige variável HIST_CLEAN_CONFIRM=YES
#   - Aborta se houver mudanças não commitadas
#   - Aborta se não houver remoto origin configurado

CONFIRM="${HIST_CLEAN_CONFIRM:-NO}"
MSG="${1:-init}"

if [[ "$CONFIRM" != "YES" ]]; then
  echo "[ERRO] Confirmação ausente. Use HIST_CLEAN_CONFIRM=YES antes do comando." >&2
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "[ERRO] Working tree sujo. Faça commit/stash antes." >&2
  exit 1
fi

if ! git remote get-url origin >/dev/null 2>&1; then
  echo "[ERRO] Remoto 'origin' não configurado." >&2
  exit 1
fi

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "Branch atual: $CURRENT_BRANCH"

echo "Criando branch órfão temp-clean..."
git checkout --orphan temp-clean

echo "Reset index (garantindo estado limpo de staging)..."
git reset --mixed

echo "Adicionando arquivos..."
git add .

echo "Criando commit inicial..."
git commit -m "$MSG"

echo "Deletando branch main antigo (se existir)..."
if git show-ref --verify --quiet refs/heads/main; then
  git branch -D main
fi

echo "Renomeando temp-clean -> main..."
git branch -m main

echo "Forçando push para origin main..."
git push -f origin main

echo "Limpeza de refs remotas órfãs..."
git remote prune origin || true

echo "Histórico reescrito com sucesso. Novo log:"
git log --oneline --decorate --graph -n 5

echo "IMPORTANTE: Commits antigos ainda podem existir em clones anteriores."

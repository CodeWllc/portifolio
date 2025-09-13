#!/usr/bin/env bash
set -euo pipefail

# wipe_history_keep.sh - Reescreve histórico preservando granularidade mínima (2 ou 3 commits).
# USO:
#   HIST_CLEAN_CONFIRM=YES ./scripts/wipe_history_keep.sh 2
#   HIST_CLEAN_CONFIRM=YES ./scripts/wipe_history_keep.sh 3
# Caso não informe número, padrão = 2.
# Estratégia:
#   Commit 1: Base do site (html, css, js, assets estáticos)
#   Commit 2: Documentação (README, LICENSE, robots, markdown)
#   Commit 3 (opcional): Scripts utilitários (scripts/*.sh)
# Reescreve branch main via orphan + push -f (como wipe_history.sh), mas cria camadas.

CONFIRM="${HIST_CLEAN_CONFIRM:-NO}"
COUNT="${1:-2}"

if [[ "$CONFIRM" != "YES" ]]; then
  echo "[ERRO] Confirmação ausente. Use HIST_CLEAN_CONFIRM=YES." >&2
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

if [[ "$COUNT" != "2" && "$COUNT" != "3" ]]; then
  echo "[ERRO] Valor inválido. Use 2 ou 3." >&2
  exit 1
fi

echo "Criando branch órfão temp-keep..."
git checkout --orphan temp-keep

echo "Limpando index..."
git reset --mixed

# Commit 1: Base
echo "Preparando commit 1 (base do site)..."
# Seleciona arquivos base
BASE_FILES=()
while IFS= read -r -d '' f; do BASE_FILES+=("$f"); done < <(find . -maxdepth 1 -type f \( -name '*.html' -o -name '*.css' -o -name '*.js' \) -print0)
# Pastas essenciais
[[ -d ./assets ]] && BASE_FILES+=(assets)
[[ -d ./js ]] && BASE_FILES+=(js)
[[ -d ./partials ]] && BASE_FILES+=(partials)

# Adiciona garantindo não incluir doc/ scripts aqui
for f in "${BASE_FILES[@]}"; do
  git add "$f" 2>/dev/null || true
done

git commit -m "base: estrutura inicial do site"

# Commit 2: Documentação
echo "Preparando commit 2 (documentação)..."
git add README.md || true
git add LICENSE 2>/dev/null || true
git add robots.txt 2>/dev/null || true
git add *.md 2>/dev/null || true

git commit -m "docs: documentação e metadados"

if [[ "$COUNT" == "3" ]]; then
  echo "Preparando commit 3 (scripts utilitários)..."
  if [[ -d scripts ]]; then
    git add scripts/*.sh 2>/dev/null || true
    git commit -m "chore: scripts utilitários"
  else
    echo "[AVISO] Pasta scripts não encontrada; pulando commit 3." >&2
  fi
fi

echo "Removendo main antiga (se existir)..."
if git show-ref --verify --quiet refs/heads/main; then
  git branch -D main
fi

echo "Renomeando temp-keep -> main..."
git branch -m main

echo "Push forçado..."
git push -f origin main

echo "Novo log (topo):"
git log --oneline --decorate --graph -n 6

echo "Concluído."

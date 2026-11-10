# Fase 2 · Claude Code (skills, rules, agents, hooks)

**Peças e o problema que cada uma resolve**
- `CLAUDE.md`: contexto curto que aponta para as fontes de verdade (não duplica a Constitution).
- *Skills*: procedimentos que o Claude carrega quando a tarefa pede (requisitos, ADR, fluxo SDD, escrita, testes, descoberta).
- *Rules* (`.claude/rules`): regras por caminho; só aparecem quando se mexe naqueles arquivos.
- *Agents* somente leitura: `spec-reviewer` (olhar novo sobre a spec), `verifier` (confere código × spec), `drift-auditor` (varre divergências). Não editam; quem decide é o dono.
- *Hooks*: automatismos determinísticos. Aqui só protegem (pedem confirmação ao editar Constitution/ADR aceito ou rodar comando destrutivo) e lembram (impacto da edição; validações ao parar). Não bloqueiam trabalho legítimo.

**Princípio:** instrução em texto é pedido; hook e CI são garantia. O único gate coercitivo é o CI.

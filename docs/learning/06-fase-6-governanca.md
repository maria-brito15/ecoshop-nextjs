# Fase 6 · Governança contra drift

**Mecanismos:** `npm run sdd:check` no CI (bloqueante); `impact-map --exige-adr` falha o PR que muda caminho sensível sem citar o ADR; template de PR com trilha, capacidades, REQs e ADRs; workflow mensal `sdd-drift` que abre uma issue com `trace-check --stale`; `CODEOWNERS` (troque `@DONO`).

**Ideia central:** drift não se evita com documentação melhor; evita-se tornando parte da spec executável e fazendo um detector confrontar o resto com o código.

**O que continua humano:** aprovar spec e plano, decidir se a divergência é bug ou spec velha, emendar a Constitution.

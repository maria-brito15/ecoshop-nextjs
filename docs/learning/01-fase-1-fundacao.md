# Fase 1 · Fundação

**O que foi feito:** Constitution (16 artigos), ADRs (0001–0017), documentos de produto e arquitetura, template de PR, ESLint 9 + Prettier, CI reescrito.

**Conceitos**
- *Constitution*: poucas regras estáveis que valem para toda mudança. Resolve o problema de cada decisão recomeçar do zero. Fica em `.specify/memory/`; as specs não a repetem, apontam para ela.
- *ADR*: registro de uma decisão com alternativas. Resolve "por que é assim?" meses depois. Os ADRs 0003–0014 são *inferidos* do código: dizem o que o código já faz, não o que alguém decidiu conscientemente — por isso há uma coluna de confiança.
- *Duas camadas de spec* (ADR-0001): spec viva (como o sistema é hoje) e spec de mudança (como ele vai mudar). Sem a viva, ninguém sabe a verdade atual; sem a de mudança, não há registro do porquê.

**Lição do EcoShop:** o CI nunca passava porque o lint interativo do Next pedia configuração. Um gate que nunca roda não protege nada. Corrigir isso foi pré-requisito para qualquer governança.

**Ferramenta:** o Spec Kit não pôde ser instalado neste ambiente; `.specify/` foi escrito à mão (ADR-0002). Quando possível, rode `specify init` e reconcilie.

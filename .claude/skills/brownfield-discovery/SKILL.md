---
name: brownfield-discovery
description: Use para entender código existente sem spec: levantar o comportamento real, separar fato de inferência e transformar em spec viva com status honesto.
---

# Descoberta em código existente

1. Percorra pelo mapa de `sdd.config.json`: rotas, services, schema, testes, docs.
2. Para cada capacidade, liste comportamentos com `arquivo:linha`. Rode o código ou um teste quando puder; sem execução, é inferência.
3. Compare com README e docs: divergência vira item "❌ ou ❔" na spec, não ajuste silencioso.
4. Escreva REQs descrevendo o comportamento desejado, com status pelo que o código faz hoje.
5. Defeitos: caracterize com teste `todo` antes de corrigir.
6. Dúvidas de negócio vão para "Perguntas abertas"; não invente intenção.
7. Registre o retrato datado em `docs/discovery/AAAA-MM-<nome>/` (congelado) e aponte a spec viva como verdade atual.

# Changelog

---

# Versão 3.5-alpha – Fase 1.8E – Plataforma ContadJus, Autenticação e Motor de Correção Monetária (03/08/2026)

## Resumo da Versão

Esta versão consolida a conclusão da Fase 1.8E, abrangendo dois marcos relevantes do projeto:

### Plataforma ContadJus

- Implantação da infraestrutura inicial da plataforma ContadJus.
- Registro e configuração do domínio oficial `contadjus.com.br`.
- Implementação da autenticação de usuários utilizando Supabase Auth.
- Criação da primeira camada de controle de acesso ao sistema.

### Motor de Correção Monetária

- Consolidação da infraestrutura da Guia 5.
- Implementação operacional da UFIR.
- Separação entre UFIR operacional e UFIR histórica.
- Validação da linha de correção monetária perante sistemas de referência.
- Implementação da competência especial de transição entre UFIR e IPCA-E.
- Conclusão da primeira versão funcional do motor de atualização monetária.

---

## Fase 1.8E – Implementação e Homologação da UFIR (03/08/2026)

### Adicionado

- Implementado o índice operacional **UFIR (Índice de Correção)**.
- Implementado o índice histórico **UFIR_NOMINAL (Auditoria)**.
- Criada separação definitiva entre:
  - índice utilizado nos cálculos;
  - valores históricos utilizados para auditoria.
- Implementada integração da UFIR à base de atualização monetária.
- Implementada exibição diferenciada da UFIR operacional e da UFIR histórica nos componentes administrativos.

### Alterado

- A UFIR passou a possuir tratamento próprio na base de indexadores.
- A atualização monetária passou a utilizar fatores mensais específicos para UFIR.
- Eliminada a dependência de conversão automática dos valores nominais históricos.
- Preservada integralmente a base histórica de rastreabilidade em:
  - `UFIR_NOMINAL`.

### Implementação da Transição UFIR → IPCA-E (04/08/2026)

Durante os testes comparativos foram identificadas divergências entre os coeficientes produzidos pelo ContadJus e aqueles observados em sistemas de referência para competências históricas próximas da extinção da UFIR.

A análise do Manual de Cálculos da Justiça Federal indicou a existência da seguinte observação:

> "O percentual a ser utilizado em janeiro de 2001 deverá ser o IPCA-E acumulado no período de janeiro a dezembro de 2000. A partir de janeiro de 2001 deverá ser utilizado o IPCA-E mensal."

Para permitir a reprodução de metodologias observadas em sistemas de cálculo judiciais, foi criado o índice especial:

  - `IPCAE_CJF_2000`
  
  destinado exclusivamente à competência:
  
  - `12/2000`

Esse índice representa uma alternativa de transição entre a UFIR e o IPCA-E mensal, preservando simultaneamente a série histórica original do IPCA-E.

A utilização do índice é opcional e depende do encadeamento escolhido pelo usuário.

  Exemplo:
  
  ```text
  UFIR
  ↓
  IPCAE_CJF_2000
  ↓
  IPCA-E
```

### Testes e Validação

Foram realizados testes comparativos utilizando:

- Manual de Cálculos da Justiça Federal (edição 2022);
- Sistema ProjefWeb;
- Planilhas da Fábrica de Cálculos.

## Resultado dos Testes

### Competências a partir de 07/1994

  ✅ Coeficientes compatíveis com os sistemas de referência.
  ✅ Valores finais coincidentes com ProjefWeb.
  ✅ Valores finais coincidentes com Fábrica de Cálculos.
  ✅ Resultados compatíveis com a linha de correção monetária do Manual de Cálculos.
  ✅ Linha considerada operacionalmente válida para utilização prática.

### Comparações com a Fábrica de Cálculos

Após a implementação da competência especial de transição IPCAE_CJF_2000, os coeficientes calculados pelo ContadJus passaram a apresentar aderência muito elevada aos coeficientes produzidos pela Fábrica de Cálculos.
As diferenças remanescentes ficaram limitadas a valores residuais, compatíveis com:

  - critérios distintos de arredondamento;
  - quantidade de casas decimais utilizadas internamente;
  - formas de acumulação e truncamento adotadas pelos sistemas comparados.
  Não foi identificado impacto material nos resultados finais decorrente dessas diferenças residuais.
  Competências anteriores a 07/1994
  Foi identificada divergência residual em relação aos coeficientes esperados do Manual.

### Observações:

  - A divergência restringe-se ao período compreendido entre 01/1992 e 06/1994.
  - O período posterior a 07/1994 encontra-se validado.
  - A divergência não interfere na utilização operacional da funcionalidade.
  - O trecho permanecerá registrado para futura validação histórica.
  - A ocorrência prática desse intervalo é extremamente reduzida na rotina atual da Contadoria Judicial.
  Homologação

Após testes comparativos realizados com o Manual de Cálculos da Justiça Federal (2022), ProjefWeb e Fábrica de Cálculos, a implementação da UFIR apresentou aderência prática aos sistemas de referência para competências a partir de 07/1994.
Status atual

  ✅ Funcional para competências a partir de 07/1994.
  ✅ Integrada ao motor de atualização monetária.
  ✅ Disponível para utilização em encadeamentos.
  ✅ Testada mediante comparação com ProjefWeb.
  ✅ Testada mediante comparação com Fábrica de Cálculos.
  ✅ Compatível com a linha de correção monetária utilizada nos cenários homologados.
  ✅ Compatível com a alternativa de transição UFIR → IPCAE_CJF_2000 → IPCA-E.
  ⚠️ A implementação ainda não pode ser considerada integralmente concluída para a série normativa completa da UFIR.
  ⚠️ O Manual de Cálculos estabelece a utilização da UFIR no período compreendido entre 01/1992 e 12/2000.
  ⚠️ O trecho compreendido entre 01/1992 e 06/1994 permanece registrado para validação histórica complementar.

### Conclusão

A implementação encontra-se homologada para utilização operacional em competências a partir de 07/1994.
Os resultados produzidos pelo ContadJus apresentam coincidência prática com ProjefWeb e Fábrica de Cálculos nos cenários testados.
A criação do índice especial IPCAE_CJF_2000 permitiu reproduzir metodologias de transição observadas em sistemas de referência, sem alterar a série mensal original do IPCA-E.
Permanece pendente apenas a validação histórica específica do período compreendido entre 01/1992 e 06/1994, necessária para considerar totalmente encerrada a implementação normativa da UFIR no intervalo integral previsto pelo Manual de Cálculos da Justiça Federal.


---

## Fase 1.8E – Autenticação, Domínio Próprio e Infraestrutura Inicial da Plataforma ContadJus (02/08/2026)

### Adicionado

- Implementada autenticação de usuários utilizando **Supabase Auth**.
- Criado sistema de proteção de acesso ao LiquidaCalc por meio de overlay de autenticação.
- Criado o arquivo:
  - `js/auth.js`.
- Criado o arquivo:
  - `js/supabase.js`.
- Criado o arquivo:
  - `css/auth.css`.
- Implementado suporte a:
  - login;
  - logout;
  - persistência automática de sessão;
  - recuperação de senha;
  - monitoramento de autenticação (`onAuthStateChange`).
- Implementado botão flutuante de logout.
- Criado namespace global:
  - `CONTADJUS`.
- Iniciada a infraestrutura institucional da plataforma ContadJus.

### Alterado

- Atualizado o `index.html` para integração da camada de autenticação.
- Integrada a biblioteca oficial do Supabase.
- Implementado carregamento dos módulos:
  - `js/auth.js`;
  - `js/supabase.js`;
  - `css/auth.css`.
- Padronizada a comunicação utilizando:
  - `CONTADJUS.supabase`.
- Traduzidas mensagens técnicas para mensagens amigáveis em português.
- Mantida total independência do motor de cálculos.

### Corrigido

- Corrigido erro:
  - `ReferenceError: supabaseClient is not defined`.
- Corrigida a ordem de carregamento dos scripts.
- Corrigida a persistência de sessão.
- Corrigido o fluxo de logout.
- Corrigida a inicialização do cliente Supabase.

### Infraestrutura

- Registrado o domínio oficial:

  `contadjus.com.br`

- Configurada hospedagem através do GitHub Pages.
- Configurado domínio personalizado da plataforma.
- Mantida arquitetura totalmente estática.
- Mantido processamento integral dos cálculos no navegador do usuário.

### Preservado

- Nenhuma alteração no motor previdenciário.
- Nenhuma alteração nas regras de negócio.
- Nenhuma alteração nas Guias 1 a 7.
- Nenhuma alteração em:
  - `core.js`;
  - `app.js`;
  - `motor-evolucao.js`;
  - `beneficios-recebidos.js`;
  - `diferencas.js`;
  - `json.js`;
  - `relatorios.js`;
  - `data/indices.js`.

### Homologação

Testes aprovados:

- Login funcional.
- Logout funcional.
- Persistência de sessão funcional.
- Recuperação de senha funcional.
- Compatibilidade preservada com GitHub Pages.
- Compatibilidade preservada com LiquidaCalc.
- Overlay de autenticação sem interferência no sistema.
- Domínio personalizado funcionando corretamente.

### Marco Institucional

Esta versão representa a transição formal do projeto LiquidaCalc para a infraestrutura inicial da plataforma ContadJus.

Principais marcos:

- criação da identidade institucional da plataforma;
- aquisição do domínio próprio;
- autenticação de usuários;
- preparação para gerenciamento de contas;
- preparação para futuros módulos;
- manutenção da independência do motor de cálculos.

O LiquidaCalc permanece como núcleo de cálculos previdenciários da plataforma ContadJus, agora operando sobre infraestrutura própria de autenticação, domínio e expansão futura.

---

## Versão 3.4-alpha – Fase 1.8D – Espelho das Diferenças da Guia 4 na Guia 5 (30/07/2026)

### Adicionado
- Criada, na **Guia 5 – Atualização**, a seção **Diferenças da Guia 4**.
- Adicionado o botão **Importar Diferenças da Guia 4**.
- Criada a variável global:
  - `window.diferencasAtualizacaoAtual`.
- Criadas funções auxiliares para a Fase 1.8D:
  - `formatarMoedaAtualizacao()`;
  - `renderizarDiferencasAtualizacao()`;
  - `importarDiferencasGuia4ParaAtualizacao()`;
  - `limparDiferencasAtualizacao()`.
- Implementada renderização, na Guia 5, de tabela com:
  - Competência;
  - Diferença Original.
- Implementada importação manual das diferenças apuradas na Guia 4 por meio da função já existente:
  - `coletarDiferencasParaAtualizacao()`.
- Exposta globalmente a função:
  - `window.importarDiferencasGuia4ParaAtualizacao`.
- Exposta globalmente a função:
  - `window.limparDiferencasAtualizacao`.

### Alterado
- Reordenada a **Guia 5 – Atualização** para a seguinte sequência:
  1. Datas de Referência;
  2. Parâmetros de Correção Monetária;
  3. Parâmetros de Juros de Mora;
  4. Diferenças da Guia 4;
  5. Aviso de módulo em construção.
- A seção **Diferenças da Guia 4** passou a exibir as competências e diferenças originais importadas da Guia 4.
- Implementado reset automático das diferenças importadas quando houver alteração de dados nas Guias 1, 3 ou 4.
- O reset automático limpa apenas as diferenças importadas, preservando:
  - `window.parametrosCorrecaoAtual`;
  - `window.parametrosJurosAtual`;
  - `window.parametrosSelicAtual`;
  - `statusCorrecao`;
  - `statusJuros`;
  - JSONs de parâmetros já carregados na Guia 5.
- A mensagem de reset passou a informar:
  - `Diferenças não importadas após alteração dos dados. Reimporte a Guia 4. Parâmetros de correção e juros mantidos.`
- Ajustado o visual das competências no formato `13º/AAAA`, mantendo apenas o texto da competência em azul/negrito.
- Adicionada zebra discreta à tabela de diferenças importadas na Guia 5.
- Mantida a intercalação visual normal das linhas na Guia 4, inclusive nas competências `13º/AAAA`.

### Corrigido
- Corrigido o comportamento em que diferenças antigas permaneciam visíveis na Guia 5 após alteração dos dados de origem.
- Corrigida a mensagem exibida ao tentar importar diferenças sem dados calculados na Guia 4.
- Corrigido destaque visual indevido das linhas de `13º/AAAA`, removendo fundo, bordas e faixa de linha inteira.
- Corrigido efeito visual em que linhas de `13º/AAAA` ficavam brancas e quebravam a zebra da tabela.
- Corrigida a tabela da Guia 5 para exibir zebra discreta em branco/cinza claro.
- Preservado o destaque visual apenas no texto da competência `13º/AAAA`.
- Preservada a funcionalidade de importação de diferenças após alteração dos dados e novo cálculo.

### Preservado
- Nenhuma alteração em `data/indexadores.js`.
- Nenhuma alteração em `data/indices.js`.
- Nenhuma alteração em `js/diferencas.js`.
- Nenhuma alteração em `js/app.js`.
- Nenhuma alteração em `js/json.js`.
- Nenhuma alteração em `js/motor-evolucao.js`.
- Nenhuma alteração na lógica de cálculo das diferenças da Guia 4.
- Nenhuma alteração no motor previdenciário.
- Nenhuma alteração na estrutura do JSON do caso.
- Nenhuma implementação de correção monetária.
- Nenhuma implementação de juros de mora.
- Nenhuma implementação de SELIC.
- Nenhuma implementação de taxa legal.
- Nenhuma implementação de fator acumulado.
- Nenhuma implementação de valor atualizado final.
- A função `adminImportarJSON(json)` permanece sem chamada final a `adminAtualizarSelectsIndice()`.

### Homologação

Testes aprovados:

- Sistema abriu sem erro crítico no Console.
- Guia 5 exibiu a seção **Diferenças da Guia 4**.
- A ordem da Guia 5 ficou:
  - Datas de Referência;
  - Parâmetros de Correção Monetária;
  - Parâmetros de Juros de Mora;
  - Diferenças da Guia 4;
  - Aviso de módulo em construção.
- Botão **Importar Diferenças da Guia 4** apareceu corretamente.
- Ao clicar em **Importar Diferenças da Guia 4** sem dados na Guia 4, o sistema exibiu aviso adequado.
- Após calcular a Guia 4, a Guia 5 importou as competências e diferenças originais.
- Competências mensais foram importadas corretamente.
- Competências `13º/AAAA` foram importadas corretamente.
- O texto da competência `13º/AAAA` ficou azul/negrito, sem destaque de linha inteira.
- A Guia 4 manteve a zebra visual normal nas linhas mensais e nas linhas de `13º/AAAA`.
- A Guia 5 passou a exibir zebra discreta na tabela de diferenças importadas.
- Ao alterar dados nas Guias 1, 3 ou 4, as diferenças importadas na Guia 5 foram limpas automaticamente.
- O reset automático preservou os parâmetros de correção monetária e juros já carregados.
- `window.diferencasAtualizacaoAtual` foi limpo e recriado corretamente conforme nova importação.
- Reimportar as diferenças após alteração dos dados trouxe a nova quantidade correta de competências.
- Botões **Carregar JSON de Correção** e **Carregar JSON de Juros** continuaram funcionando.
- Modal administrativo continuou abrindo por `CTRL + SHIFT + E`.
- Importação e exportação do JSON do caso continuaram funcionando.
- Guia 4 permaneceu funcional.
- Motor de evolução previdenciária permaneceu funcional.
- Nenhum cálculo financeiro foi implementado nesta fase.

### Observação Técnica
Esta fase criou apenas o espelho das diferenças apuradas na Guia 4 dentro da Guia 5.  
A Guia 5 ainda não realiza atualização monetária, juros de mora, SELIC, taxa legal, fator acumulado ou cálculo financeiro.

As diferenças importadas em `window.diferencasAtualizacaoAtual` servem como base preparatória para fase futura de atualização monetária.  
Quando dados de origem são alterados nas Guias 1, 3 ou 4, apenas as diferenças importadas são invalidadas, mantendo preservados os parâmetros de correção monetária e juros já carregados.

A melhoria visual de separadores anuais, linhas de grade discretas, controle de fonte, contraste e modal de preferências de exibição foi registrada para fase futura de UX, sem implementação nesta fase.

---

## Versão 3.4-alpha – Fase 1.8C – Integração da Tela Administrativa com a Base de Indexadores (30/07/2026)

### Adicionado
- Integrada a tela administrativa de parâmetros com `window.INDEXADORES_ATUALIZACAO`.
- Criadas funções auxiliares para consulta e validação dos indexadores:
  - `adminObterIndicesDisponiveisPorTipo()`;
  - `adminIndiceExisteNaBase()`;
  - `adminIndiceCompativelComTipo()`.
- Implementado preenchimento dinâmico dos selects de índices a partir de `data/indexadores.js`.
- Implementada diferenciação entre uso manual e importação de JSON para tratamento de índices incompatíveis.
- Implementada preservação de índices inexistentes na base durante importação de JSON.
- Implementada preservação de índices incompatíveis durante importação de JSON, para fins de auditoria.
- Criado tutorial administrativo:
  - `TUTORIAL_ADMIN_PARAMETROS.md`.

### Alterado
- Removida a dependência de listas fixas de índices dentro de `js/admin-encadeamentos.js`.
- A tela administrativa passou a consultar dinamicamente os índices disponíveis em `window.INDEXADORES_ATUALIZACAO`.
- O modal administrativo passou a listar índices conforme o tipo do parâmetro:
  - `correcao_monetaria`;
  - `juros_mora`;
  - `selic`, reservado para fase futura;
  - `taxa_legal`, reservado para fase futura.
- O texto exibido nos selects passou a mostrar nome amigável e código técnico do índice.
- O valor gravado nos JSONs de parâmetros permanece sendo o código técnico do índice, como:
  - `INPC`;
  - `IPCAE`;
  - `JUROS_MORA_1_AM`;
  - `POUPANCA`.
- Ajustado o comportamento da importação de JSON para preservar códigos técnicos antigos ou inconsistentes, quando necessário.
- Ajustada a lógica de atualização dos selects ao trocar manualmente o tipo do parâmetro.

### Corrigido
- Corrigida a exibição de índices incompatíveis no uso manual da tela administrativa.
- Impedido que índices de correção monetária apareçam em encadeamentos de juros de mora.
- Impedido que índices de juros de mora apareçam em encadeamentos de correção monetária.
- Corrigido o comportamento ao mudar manualmente o tipo do parâmetro:
  - índice incompatível existente na base é substituído por índice compatível.
- Corrigida a importação de JSON antigo ou inconsistente:
  - índice inexistente é preservado com aviso;
  - índice incompatível é preservado com aviso;
  - exportação posterior mantém o código técnico original.
- Removida chamada indevida a `adminAtualizarSelectsIndice()` ao final da importação de JSON, evitando substituição silenciosa de índices importados.
- Corrigido erro de sintaxe em `js/admin-encadeamentos.js` após ajuste manual da função `adminImportarJSON(json)`.
- Restaurada a abertura do modal administrativo após correção da sintaxe.

### Preservado
- Nenhuma alteração em `data/indexadores.js`.
- Nenhuma alteração em `data/indices.js`.
- Nenhuma alteração em `js/diferencas.js`.
- Nenhuma alteração em `js/app.js`.
- Nenhuma alteração em `js/json.js`.
- Nenhuma alteração em `js/motor-evolucao.js`.
- Nenhuma alteração em `js/beneficios-recebidos.js`.
- Nenhuma alteração em `js/relatorios.js`.
- Nenhuma alteração em `css/styles.css`.
- Nenhuma alteração na estrutura do JSON do caso.
- Nenhuma alteração no motor previdenciário.
- Nenhum cálculo financeiro implementado nesta fase.
- Guia 5 continua apenas carregando parâmetros, sem realizar atualização monetária, juros, SELIC ou taxa legal.

### Homologação

Testes aprovados:

- Sistema abriu sem erro crítico no Console após correção de sintaxe.
- `window.INDEXADORES_ATUALIZACAO` permaneceu acessível no Console.
- Modal administrativo abriu por `CTRL + SHIFT + E`.
- Correção Monetária listou apenas índices de correção monetária.
- Juros de Mora listou apenas índices de juros de mora.
- Índices de juros não apareceram no tipo Correção Monetária.
- Índices de correção não apareceram no tipo Juros de Mora.
- JSON de correção carregado no campo de juros foi rejeitado corretamente.
- JSON de juros carregado no campo de correção foi rejeitado corretamente.
- JSON com índice inexistente `XYZ` foi carregado com aviso.
- JSON com índice inexistente `XYZ` foi preservado sem substituição automática.
- JSON com índice incompatível `INPC` em parâmetro `juros_mora` foi importado com aviso.
- Índice incompatível importado foi preservado no modal como:
  `INPC (incompatível com juros_mora)`.
- Exportação posterior manteve o código técnico original:
  `"indice": "INPC"`.
- Guia 5 continuou carregando JSONs de correção monetária e juros de mora.
- Importação e exportação do JSON do caso continuaram funcionando.
- Guia 4 permaneceu preservada.
- Motor de evolução previdenciária permaneceu funcional.
- Nenhum cálculo financeiro foi implementado nesta fase.

### Observação Técnica
Esta fase integrou a tela administrativa à base de indexadores criada na Fase 1.8B.  
A partir desta fase, os selects de índices deixam de depender de listas fixas internas e passam a consultar `window.INDEXADORES_ATUALIZACAO`.

A tela administrativa diferencia dois fluxos:

- No uso manual, índices incompatíveis com o tipo selecionado são substituídos por índices compatíveis.
- Na importação de JSON, índices inexistentes ou incompatíveis são preservados com aviso, para evitar alteração silenciosa de arquivos antigos ou inconsistentes.

A Guia 5 ainda não realiza cálculo de correção monetária, juros, SELIC ou taxa legal.  
A próxima etapa recomendada é a Fase 1.8D, destinada a espelhar as diferenças da Guia 4 na Guia 5.
## Versão 3.4-alpha – Fase 1.8B – Base de Indexadores de Atualização (29/07/2026)

### Adicionado
- Criado o arquivo `data/indexadores.js`.
- Criada a base compacta `BASE_INDEXADORES_ATUALIZACAO`.
- Criado o catálogo de metadados `CATALOGO_INDEXADORES_ATUALIZACAO`.
- Criada a função `montarIndexadoresAtualizacao()`.
- Criada a estrutura final `INDEXADORES_ATUALIZACAO`.
- Exposição global das estruturas:
  - `window.BASE_INDEXADORES_ATUALIZACAO`;
  - `window.CATALOGO_INDEXADORES_ATUALIZACAO`;
  - `window.INDEXADORES_ATUALIZACAO`.
- Incluídos dados iniciais de indexadores de correção monetária:
  - INPC;
  - IPCA-E;
  - IPCA.
- Incluídos indexadores vazios para expansão futura:
  - IGP-DI;
  - IGP-M;
  - TR;
  - IPC-R;
  - IRSM;
  - URV;
  - OTN;
  - ORTN;
  - BTN;
  - Juros de Mora 1% a.m.;
  - Juros de Mora 0,5% a.m.;
  - Poupança;
  - Taxa Legal;
  - SELIC.
- Incluída chamada ao script `data/indexadores.js` no `index.html`, logo após `data/indices.js`.

### Alterado
- A base de indexadores foi estruturada em modelo híbrido:
  - dados mensais concentrados em base compacta;
  - metadados separados em catálogo;
  - estrutura final montada automaticamente.
- Mantida compatibilidade futura com acesso no formato:
  `window.INDEXADORES_ATUALIZACAO.INPC.dados`.
- Preservada a semelhança visual e lógica com a organização da base interna de reajustes previdenciários.
- Mantida a separação entre:
  - `data/indices.js`, destinado aos reajustes previdenciários, salário mínimo e teto;
  - `data/indexadores.js`, destinado à atualização monetária, juros de mora, SELIC e taxa legal.

### Preservado
- Nenhuma alteração em `data/indices.js`.
- Nenhuma alteração no motor previdenciário.
- Nenhuma alteração na Guia 4.
- Nenhuma alteração no JSON do caso.
- Nenhuma alteração na tela administrativa da Fase 1.8A.
- Nenhum cálculo financeiro implementado nesta fase.
- Guia 5 continua apenas carregando parâmetros, sem realizar atualização monetária, juros, SELIC ou taxa legal.

### Homologação

Testes aprovados:

- Sistema abriu sem erro crítico no Console.
- `window.BASE_INDEXADORES_ATUALIZACAO` retornou a base compacta.
- `window.CATALOGO_INDEXADORES_ATUALIZACAO` retornou os metadados.
- `window.INDEXADORES_ATUALIZACAO` retornou a estrutura final completa.
- Dados de INPC ficaram acessíveis por:
  - `window.BASE_INDEXADORES_ATUALIZACAO.INPC`;
  - `window.INDEXADORES_ATUALIZACAO.INPC.dados`.
- Dados de IPCA-E ficaram acessíveis pela estrutura global.
- Dados de IPCA ficaram acessíveis pela estrutura global.
- Índices vazios foram preservados para expansão futura.
- `window.INDEXADORES_ATUALIZACAO.SELIC.dados` retornou objeto vazio.
- Importação e exportação do JSON do caso continuaram funcionando.
- Guia 5 continuou carregando JSON de correção monetária e JSON de juros.
- Tela administrativa continuou abrindo por `CTRL + SHIFT + E`.
- Motor de evolução previdenciária permaneceu funcional.
- Nenhum cálculo financeiro foi implementado nesta fase.

### Observação Técnica
Esta fase criou a base estrutural dos indexadores de atualização, ainda sem integração automática com a tela administrativa e sem motor de cálculo.  
A base foi preparada para permitir que, em fase posterior, os encadeamentos carregados na Guia 5 consultem os índices disponíveis em `INDEXADORES_ATUALIZACAO`.

---

## Versão 3.4-alpha – Fase 1.8A – Infraestrutura de Parâmetros de Atualização (29/07/2026)

### Adicionado
- Criada a infraestrutura inicial da **Guia 5 – Atualização**.
- Criada tela administrativa oculta para gerenciamento de parâmetros de atualização.
- Implementado acesso à tela administrativa por atalho:
  `CTRL + SHIFT + E`.
- Implementado módulo `js/admin-encadeamentos.js`.
- Implementada criação de JSONs independentes de parâmetros de atualização.
- Implementado suporte à criação de parâmetros de:
  - Correção monetária;
  - Juros de mora.
- Implementada seleção do tipo de parâmetro na tela administrativa:
  - `correcao_monetaria`;
  - `juros_mora`;
  - `selic` reservado para fase futura;
  - `taxa_legal` reservado para fase futura.
- Implementada tela administrativa com:
  - Nome do encadeamento;
  - Descrição;
  - Tipo do parâmetro;
  - Tabela de períodos;
  - Índice;
  - Data inicial;
  - Data final;
  - Adição e remoção de linhas;
  - Validação do encadeamento;
  - Exportação de JSON;
  - Importação de JSON.
- Implementado carregamento de JSON de correção monetária na Guia 5.
- Implementado carregamento de JSON de juros de mora na Guia 5.
- Implementada exibição, na Guia 5, dos dados do parâmetro carregado:
  - Nome;
  - Descrição;
  - Índices utilizados;
  - Quantidade de períodos.
- Criadas variáveis globais para uso futuro:
  - `window.parametrosCorrecaoAtual`;
  - `window.parametrosJurosAtual`;
  - `window.parametrosSelicAtual`.
- Criada função preparatória `coletarDiferencasParaAtualizacao()`, destinada à futura integração da Guia 5 com a Guia 4.
- Implementada sincronização inicial entre os campos da Guia 1 e da Guia 5:
  - Data de Atualização;
  - Início dos Juros.

### Alterado
- Reestruturada a apresentação inicial da **Guia 5 – Atualização**.
- Substituídos os antigos campos visuais de critério de correção e critério de juros por botões de carregamento de JSON:
  - **Carregar JSON de Correção**;
  - **Carregar JSON de Juros**.
- Mantidos os campos `criterioCorrecao` e `criterioJuros` como campos ocultos para preservar compatibilidade com a exportação/importação do JSON do caso.
- Ajustado o layout da Guia 5 para separar:
  - Datas de referência;
  - Parâmetros de correção monetária;
  - Parâmetros de juros de mora;
  - Aviso de módulo em construção.
- Padronizada a largura dos botões de carregamento de JSON na Guia 5.
- Adicionado estilo para exibição dos status de parâmetros carregados:
  - `#statusCorrecao`;
  - `#statusJuros`.

### Corrigido
- Corrigida incompatibilidade causada pela remoção dos antigos campos `criterioCorrecao` e `criterioJuros`, que eram utilizados por `js/json.js`.
- Eliminado erro na importação de JSON do caso:
  `Cannot set properties of null (setting 'value')`.
- Restaurado o funcionamento do botão **Exportar Dados do Caso** após inclusão dos campos ocultos de compatibilidade.
- Corrigido o carregamento dos botões da Guia 5:
  - `btnCarregarCorrecao`;
  - `btnCarregarJuros`.
- Corrigida a abertura da tela administrativa via `CTRL + SHIFT + E`.
- Corrigida a criação dinâmica do modal administrativo.
- Corrigido conflito potencial com função existente na Guia 4, evitando recriação global de `converterCompetenciaParaNumero`.
- Criada função própria `adminCompetenciaParaNumero()` para uso exclusivo da administração de encadeamentos.
- Corrigido o parse de valores brasileiros na função preparatória `coletarDiferencasParaAtualizacao()`.
- Corrigida a validação de períodos para impedir sobreposição.
- Corrigida a validação de períodos abertos, permitindo no máximo um período sem data final.
- Corrigida a coleta de linhas da tabela administrativa para não ignorar linhas incompletas.
- Evitada duplicação de eventos ao abrir e fechar o modal administrativo repetidas vezes.

### Homologação

Testes aprovados:

- Importação de JSON do caso sem erro.
- Exportação de JSON do caso funcionando.
- Guia 5 aberta corretamente.
- Botão **Carregar JSON de Correção** funcionando.
- Botão **Carregar JSON de Juros** funcionando.
- Tela administrativa aberta por `CTRL + SHIFT + E`.
- Criação de encadeamento de correção monetária pela tela administrativa.
- Validação de sobreposição entre períodos.
- Rejeição de período sobreposto:
  - Exemplo: `IPCAE 01/2000 a 12/2025` com `INPC 01/2025 aberto`.
- Validação positiva de períodos encadeados:
  - Exemplo: `IPCAE 01/2000 a 12/2025` e `INPC 01/2026 aberto`.
- Exportação de JSON de correção monetária.
- Carregamento de JSON de correção monetária na Guia 5.
- Exibição correta do parâmetro de correção carregado:
  - Nome;
  - Descrição;
  - Índices;
  - Quantidade de períodos.
- Rejeição de JSON de juros quando carregado no campo de correção.
- Rejeição de JSON de correção quando carregado no campo de juros.
- Exportação de JSON de juros de mora.
- Carregamento de JSON de juros de mora na Guia 5.
- Preservação da Guia 4.
- Preservação do motor de evolução previdenciária.
- Nenhum cálculo financeiro implementado nesta fase.

### Observação Técnica
Esta fase implementa apenas a infraestrutura de parâmetros da atualização monetária e dos juros de mora.  
A Guia 5 ainda não realiza cálculo de correção monetária, juros, SELIC ou taxa legal.  
O cálculo financeiro será implementado em fase posterior, a partir dos parâmetros carregados e das diferenças apuradas na Guia 4.

---

## Versão 3.3 – Fase 1.7D2 (28/07/2026)

### Adicionado
- Implementado cálculo do Abono Anual (13º) na Guia 4.
- Inclusão automática de competências no formato `13º/AAAA`.
- Implementada função de cálculo de avos com regra dos 15 dias.
- Implementado suporte ao primeiro 13º de benefícios previdenciários comuns.
- Implementado suporte ao cálculo de 13º para benefícios baseados em salário mínimo.
- Adicionada opção **"Incluir 13º proporcional no ano final aberto"** na Guia 1.
- Implementada persistência da opção em exportação/importação JSON.
- Implementado cálculo individualizado do 13º para benefício devido e benefícios recebidos.

### Alterado
- Guia 4 passou a calcular o 13º utilizando a mesma base exibida nas competências da tabela (`obterValorIntegral()`).
- Reestruturada a lógica de geração da linha `13º/AAAA` para o ano final.
- Ajustada a memória da Guia 3 para exibir apenas a evolução mensal do benefício recebido.
- Re-renderização da memória da Guia 3 após recálculo.
- Ajustado o destaque visual das linhas de 13º para um modelo mais discreto e uniforme entre Chrome e Edge.
- Removido destaque visual excessivo (fundo azul e bordas fortes) da linha de 13º.
- Mantido apenas o texto da competência em azul/negrito.

### Corrigido
- Corrigido o cálculo do primeiro 13º quando a memória do benefício possuía apenas competências de reajuste.
- Corrigida a obtenção da base de cálculo do 13º para memórias resumidas.
- Corrigido o comportamento do ano final aberto.
- Corrigido o cálculo proporcional do 13º do benefício devido até a Data Final.
- Corrigido o cálculo do 13º dos benefícios recebidos com DCB dentro do período.
- Corrigida a limitação do 13º dos recebidos quando a DCB ocorre após a Data Final.
- Impedido que a DIP do benefício devido seja interpretada como DCB.
- Corrigida a restauração de competências de 13º na Central de Alterações Manuais.
- Corrigida a funcionalidade "Restaurar Todas".
- Corrigida recursão infinita em `relatorios.js`.
- Eliminado erro:
  `Maximum call stack size exceeded`.
- Restaurada a exibição da Central de Competências Modificadas após edição manual.
- Corrigida compatibilidade da importação JSON após inclusão do módulo de 13º.

### Homologação
Testes aprovados:

- Ano final aberto sem DCB e opção desmarcada.
- Ano final aberto com opção marcada.
- Benefício recebido com DCB dentro do período.
- Benefício recebido com DCB posterior à Data Final.
- Ano final completo em dezembro.
- DIP do devido sem efeito de DCB.
- Edição e restauração de competências.
- Importação e exportação JSON.
- Compatibilidade visual entre Chrome e Edge.

# ContadJus

## LiquidaCalc, módulo de cálculos previdenciários RGPS/INSS

**Versão do arquivo de caso:** 3.3  
**Marco funcional:** Fase 1.8F-B4  
**Status:** Em desenvolvimento, com as fases 1.8E, 1.8F-A, 1.8F-A2 e 1.8F-B1 a B4 homologadas  
**Última atualização:** 06/08/2026

## Visão geral

O **ContadJus** é uma plataforma de cálculos judiciais executada no navegador. O **LiquidaCalc** é o primeiro módulo da plataforma e está voltado à evolução de benefícios do RGPS/INSS, apuração de diferenças, correção monetária e juros de mora.

O projeto prioriza:

- rastreabilidade da memória de cálculo;
- auditabilidade dos critérios aplicados;
- separação entre motores matemáticos e parâmetros jurídicos;
- compatibilidade com casos e encadeamentos antigos;
- execução local da lógica de cálculo;
- interface responsiva e organizada por guias;
- evolução incremental com testes de aceitação por fase.

A autenticação utiliza **Supabase Auth**. O Supabase controla o acesso, mas não participa dos cálculos.

> **Aviso:** o sistema permanece em desenvolvimento. Os resultados devem ser conferidos por profissional habilitado antes de qualquer utilização processual, administrativa ou financeira.

---

## Princípio arquitetural

O ContadJus adota a seguinte arquitetura:

```text
Motor genérico
+
Encadeamento administrativo
=
Critério aplicável
```

O código não deve incorporar regras rígidas com base no nome de um manual, pacote ou caso. Diferentes critérios são representados por encadeamentos com índices e períodos próprios, interpretados pelos mesmos motores genéricos.

Exemplos de práticas evitadas:

```javascript
calcularMC2022();
calcularMC2026();
```

```javascript
if (parametros.nome === 'MC 2026') {
    // regra específica
}
```

Os nomes dos encadeamentos servem para identificação e auditoria. A matemática depende dos índices, períodos e datas informados.

---

## Funcionalidades por guia

### Guia 1: Entradas

- dados processuais, autor, réu, CPF, vara e processo;
- tipo de ação;
- datas processuais e de atualização;
- início dos juros;
- parâmetros de prescrição;
- termo inicial das diferenças, automático ou manual;
- dados do benefício devido;
- DIB e DIP;
- RMI, transformação, cotas e adicionais;
- benefício baseado em salário mínimo;
- abono anual;
- opção de 13º proporcional no ano final aberto;
- exportação e importação do caso completo.

### Guia 2: Evolução devida

- evolução da renda mensal do benefício devido;
- reajustes integrais e proporcionais;
- aplicação de piso e teto;
- evolução por salário mínimo, quando aplicável;
- memória de cálculo e resumo executivo;
- Renda Mensal Atualizada;
- impressão pelo navegador.

A memória da Guia 2 permanece focada na evolução mensal, sem intercalar linhas do 13º.

### Guia 3: Benefícios recebidos

- cadastro de múltiplos benefícios recebidos;
- evolução independente por benefício;
- DIB, DIP e DCB individuais;
- RMI, abono anual e salário mínimo;
- modos de tratamento da DIP;
- cálculo individual ou em lote;
- re-renderização da memória após recálculo.

### Guia 4: Diferenças

- grade contínua de competências mensais;
- linhas próprias para `13º/AAAA`;
- benefício devido e benefícios recebidos;
- total recebido e diferença devida;
- limitação ao valor devido ou permissão de diferença negativa;
- cálculo do abono anual pela regra dos 15 dias;
- edição manual de valores;
- justificativas internas e externas;
- restauração individual ou geral;
- central de competências modificadas;
- cabeçalho fixo durante a rolagem;
- preparação das diferenças para a Guia 5.

### Guia 5: Atualização

A Guia 5 está funcional para correção monetária e juros determinísticos.

#### Datas de referência

- Data de Atualização;
- Início dos Juros;
- Observações.

O campo **Início dos Juros** é genérico. Pode representar citação, vencimento, evento danoso ou outro marco definido no processo.

#### Parâmetros

- carregamento independente dos parâmetros de correção monetária;
- pacote unificado de Juros e SELIC;
- visualização dos índices, quantidades e intervalos;
- cartões de status responsivos e ampliados;
- nomes amigáveis dos indexadores;
- compatibilidade com formatos antigos em JSON.

#### Memória de atualização

A tabela apresenta:

1. Competência;
2. Diferença Original;
3. Índice ou Critério;
4. Coeficiente;
5. Valor Corrigido;
6. % Juros antes da SELIC;
7. Taxa Legal;
8. % Juros até a atualização;
9. Juros de Mora em reais.

O resumo apresenta:

- Total original;
- Total corrigido;
- Total dos Juros de Mora.

#### Corte temporal

Somente parcelas com competência igual ou anterior à Data de Atualização participam da memória e dos totais. As diferenças importadas permanecem preservadas, mas parcelas posteriores à data da conta são desconsideradas na atualização.

### Guia 6: Acordo e renúncia

Estrutura visual preparada. A implementação matemática e jurídica permanece planejada para fase posterior.

### Guia 7: Relatórios

- relatório interno de alterações;
- relatório externo com justificativas autorizadas;
- pré-visualização em HTML;
- impressão e geração de PDF pelo navegador.

---

## Correção monetária

O motor genérico de correção monetária está homologado.

### Funcionamento

- leitura de encadeamentos do tipo `correcao_monetaria`;
- localização do período aplicável por competência;
- utilização de fatores mensais;
- multiplicação sucessiva dos fatores;
- preservação do critério utilizado em cada parcela;
- suporte ao índice `SEM_CORRECAO`;
- erro explícito para competência sem período ou sem índice cadastrado.

A correção utiliza fatores mensais, por exemplo:

```javascript
1.0061
```

Esse valor representa um fator, não uma taxa percentual direta.

---

## Juros de mora determinísticos

Os seguintes critérios estão implementados e homologados:

```text
SEM_JUROS
JUROS_05_AM
JUROS_1_AM
JUROS_2_AA_EC136
```

### Regras matemáticas

- juros simples;
- incidência sobre o valor corrigido da parcela;
- exclusão do mês de início;
- inclusão do mês da conta;
- contagem mensal, sem proporcionalidade diária nesta fase;
- repetição do percentual para parcelas vencidas antes ou na competência do início da mora;
- redução mensal do percentual para parcelas posteriores;
- erro explícito para lacunas no encadeamento.

Para cada parcela:

```text
Início efetivo = maior entre:
- competência da parcela;
- Início dos Juros.
```

O cálculo monetário utiliza:

```text
Juros de Mora = Valor Corrigido × Percentual Acumulado ÷ 100
```

### Taxas homologadas

```text
SEM_JUROS        = 0% ao mês
JUROS_05_AM      = 0,5% ao mês
JUROS_1_AM       = 1% ao mês
JUROS_2_AA_EC136 = 2% ao ano ÷ 12, de forma linear
```

A taxa de 2% ao ano não utiliza equivalência composta.

### Exemplo de contagem

Com início dos juros em `01/2020` e conta em `12/2021`:

```text
12/2019 → 23 meses → 11,5% a 0,5% ao mês
01/2020 → 23 meses → 11,5%
02/2020 → 22 meses → 11,0%
11/2021 →  1 mês   →  0,5%
12/2021 →  0 meses →  0,0%
```

---

## Juros e SELIC ainda não implementados

Os registros e a infraestrutura existem, mas os seguintes motores permanecem pendentes:

```text
JUROS_POUPANCA
TAXA_LEGAL
TAXA_LEGAL_PREVIDENCIARIA
SELIC
```

Também permanecem pendentes:

- não cumulação entre juros e SELIC;
- valor da SELIC por parcela;
- total da SELIC;
- integração da Taxa Legal;
- total geral da condenação;
- integração completa com relatórios.

A coluna **Taxa Legal** já existe na memória e permanece com `-` enquanto o motor correspondente não estiver implementado.

---

## Encadeamentos administrativos

O modal administrativo é aberto por:

```text
Ctrl + Shift + E
```

Tipos principais:

```text
Correção Monetária
Juros e SELIC
```

O pacote de Juros e SELIC possui tabelas internas independentes:

```text
Encadeamento de Juros de Mora
Encadeamento SELIC
```

### Combinações permitidas

- somente Juros;
- somente SELIC;
- Juros e SELIC.

Um pacote totalmente vazio é bloqueado.

### Estrutura do pacote

```json
{
  "tipoArquivo": "parametros_juros_selic",
  "tipoParametro": "juros_selic",
  "versao": "1.0",
  "nome": "NOME DO PACOTE",
  "descricao": "",
  "dataCriacao": "DD/MM/AAAA",
  "juros": {
    "tipoParametro": "juros_mora",
    "indicesUtilizados": [],
    "periodos": []
  },
  "selic": {
    "tipoParametro": "selic",
    "indicesUtilizados": [],
    "periodos": []
  }
}
```

### Variáveis globais

```javascript
window.parametrosCorrecaoAtual
window.parametrosJurosAtual
window.parametrosSelicAtual
```

A interface e o arquivo administrativo são unificados, mas Juros e SELIC permanecem separados internamente.

---

## Formatos de arquivo

O conteúdo dos arquivos continua sendo JSON, mesmo quando a extensão é personalizada.

### Correção monetária

```text
CORRE-NOME.corr
```

### Juros e SELIC

```text
JUROS-NOME.jur
```

### Caso completo

```text
DADOS-AUTOR-IDENTIFICADOR.contadjus
```

Exemplo:

```text
DADOS-JOAO-DA-SILVA-001234.contadjus
```

### Identificador do processo

Para o processo:

```text
0001234-56.2022.4.05.8300
```

é utilizado o primeiro bloco antes do hífen, considerando seus últimos seis algarismos:

```text
0001234 → 001234
```

### Compatibilidade

Continuam aceitos:

```text
.json
.corr
.jur
.contadjus
```

O reconhecimento ocorre pelo conteúdo interno, por meio de campos como:

```text
tipoArquivo
tipoParametro
versao
periodos
```

---

## Persistência do caso

O caso completo utiliza a versão `3.3` e preserva:

- entradas;
- benefícios recebidos;
- diferenças e alterações manuais;
- parâmetros de atualização;
- acordo e renúncia;
- parâmetros de correção, Juros e SELIC.

Estrutura dos parâmetros:

```json
{
  "parametros": {
    "correcao": {},
    "juros": {},
    "selic": {}
  }
}
```

A importação suporta as versões:

```text
3.1
3.2
3.3
```

Casos antigos continuam recebendo valores padrão para campos introduzidos posteriormente.

---

## Estrutura principal do projeto

```text
/
├── index.html
├── README.md
├── css/
│   ├── styles.css
│   └── auth.css
├── data/
│   ├── indices.js
│   ├── indexadores.js
│   └── indexadores-juros.js
└── js/
    ├── app.js
    ├── auth.js
    ├── beneficios-recebidos.js
    ├── core.js
    ├── diferencas.js
    ├── json.js
    ├── motor-evolucao.js
    ├── relatorios.js
    ├── admin-encadeamentos.js
    └── supabase.js
```

### Responsabilidades principais

- `index.html`: estrutura das guias, tabelas, formulários e modais;
- `css/styles.css`: estilos gerais, tabelas, impressão e elementos visuais;
- `css/auth.css`: interface de autenticação;
- `data/indices.js`: bases previdenciárias e vigências;
- `data/indexadores.js`: catálogo e bases de correção monetária;
- `data/indexadores-juros.js`: catálogo e bases de Juros e SELIC;
- `js/core.js`: máscaras, datas, valores e funções compartilhadas;
- `js/motor-evolucao.js`: evolução do benefício devido;
- `js/beneficios-recebidos.js`: Guia 3;
- `js/diferencas.js`: Guia 4, 13º, compensações e auditoria;
- `js/admin-encadeamentos.js`: encadeamentos, Guia 5, correção e juros;
- `js/json.js`: persistência e compatibilidade dos casos;
- `js/relatorios.js`: relatórios internos e externos;
- `js/app.js`: navegação, eventos e integração da interface;
- `js/supabase.js` e `js/auth.js`: configuração e autenticação.

---

## Como utilizar

1. Acesse o ContadJus em navegador moderno.
2. Efetue a autenticação.
3. Preencha a Guia 1.
4. Calcule a evolução do benefício devido.
5. Cadastre e calcule os benefícios recebidos na Guia 3.
6. Confira as diferenças na Guia 4.
7. Se necessário, edite, justifique ou restaure competências.
8. Na Guia 5, informe a Data de Atualização e o Início dos Juros.
9. Carregue os parâmetros de correção.
10. Carregue os parâmetros de Juros e SELIC, quando aplicável.
11. Importe as diferenças da Guia 4.
12. Clique em **Calcular Atualização**.
13. Confira coeficientes, percentuais, valores e totais.
14. Exporte o caso completo para preservação e futura importação.

---

## Regras de negócio relevantes

### Proporcionalidade mensal

- mês comercial de 30 dias nas competências mensais;
- dia 31 tratado internamente como dia 30, preservando a exibição;
- DIP do benefício devido como marco financeiro, quando aplicável;
- DIP não tratada como DCB.

### Abono anual

- camada derivada da evolução mensal;
- linha própria na Guia 4;
- regra dos 15 dias para contagem de avos;
- calendário real, inclusive anos bissextos;
- DIB e DCB consideradas na contagem;
- DIP não interfere nos avos;
- base obtida da última competência ativa do exercício;
- suporte ao ano final aberto e a DCB real de benefício recebido.

### Edições manuais

- registro por competência e coluna;
- justificativa estruturada;
- indicação de inclusão no relatório externo;
- restauração individual ou global;
- compatibilidade com justificativas antigas em texto.

### Atualização

- correção por fatores mensais;
- juros determinísticos simples;
- base dos juros no valor corrigido;
- corte pela Data de Atualização;
- erro para lacunas de período;
- distinção entre ausência de período e `SEM_JUROS`.

---

## Tecnologias

- HTML5;
- Tailwind CSS via CDN;
- CSS3;
- JavaScript puro;
- Supabase Auth;
- impressão nativa do navegador.

---

## Compatibilidade

### Navegadores

- Microsoft Edge recente;
- Google Chrome recente;
- Mozilla Firefox recente;
- Safari recente.

### Arquivos

- casos 3.1, 3.2 e 3.3;
- parâmetros administrativos antigos em `.json`;
- correção em `.corr` ou `.json`;
- Juros e SELIC em `.jur` ou `.json`;
- casos em `.contadjus` ou `.json`.

---

## Marcos homologados

```text
Fase 1.7D2   Abono anual, Guia 4 e ano final aberto       HOMOLOGADA
Fase 1.8E    Motor genérico de correção monetária         HOMOLOGADA
Fase 1.8F-A  Infraestrutura de Juros e SELIC              HOMOLOGADA
Fase 1.8F-A2 Pacote unificado de Juros e SELIC            HOMOLOGADA
Fase 1.8F-B1 Motor de juros determinísticos               HOMOLOGADA
Fase 1.8F-B2 Exibição auditável dos juros                 HOMOLOGADA
Fase 1.8F-B3 Corte temporal pela data da conta            HOMOLOGADA
Fase 1.8F-B4 Nomes, extensões e status detalhados         HOMOLOGADA
```

---

## Roadmap

### Próximas fases da Guia 5

- juros da Poupança;
- SELIC;
- Taxa Legal;
- Taxa Legal Previdenciária;
- transições e não cumulação;
- total da SELIC;
- total geral;
- integração com relatórios.

### Outras áreas

- implementação da Guia 6;
- relatórios avançados;
- parâmetros de exibição das tabelas;
- aprimoramentos de impressão e exportação;
- expansão futura para ações condenatórias e tributárias.

---

## Manutenção e extensibilidade

- preservar a separação entre motor e encadeamento;
- evitar regras baseadas no nome do pacote;
- manter compatibilidade com arquivos antigos;
- alterar apenas os arquivos necessários em cada fase;
- validar JavaScript antes da publicação;
- executar testes de regressão da correção monetária;
- homologar cada novo motor com memória externa confiável;
- manter precisão interna e arredondar apenas na exibição ou no ponto definido pela regra.

---

## Uso e responsabilidade

O ContadJus é uma ferramenta profissional de apoio. O uso dos resultados exige conferência dos parâmetros, das datas, dos índices, das regras jurídicas aplicáveis e da memória final.

O sistema não substitui a análise do processo, da decisão judicial, do título executivo ou da legislação aplicável.

---

## Licença

Uso profissional interno no âmbito de cálculos judiciais e administrativos. A redistribuição depende de autorização do responsável pelo projeto.

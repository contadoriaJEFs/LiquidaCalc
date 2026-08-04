Roadmap ContadJus – Pós-Homologação da Correção Monetária
Situação Atual
Fase 1.8E – Motor de Correção Monetária

Status:

✅ MC 2022 homologado

✅ MC 2026 homologado

✅ Encadeamentos parametrizados funcionando

✅ Guia 5 operacional

✅ UFIR integrada

✅ IPCAE_CJF_2000 implementado

✅ Comparação com ProjefWeb realizada

✅ Comparação com Fábrica de Cálculos realizada

✅ Compatibilidade prática comprovada a partir de 07/1994

⚠️ Validação histórica complementar pendente para 01/1992 a 06/1994

Fase 1.8E – Encerramento
Pendências Técnicas
Homologação histórica

Prioridade: Baixa

Revisar UFIR de 01/1992 a 06/1994.
Revisar coeficientes históricos do Manual.
Verificar eventual diferença metodológica anterior ao Plano Real.
Documentar conclusão definitiva.
Pendências de UX

Prioridade: Média

Encadeamentos
Exibir indexador antes do período.
Substituir nomes técnicos:
IPC_R → IPC-R
IGPDI → IGP-DI
SEM_CORRECAO → Sem Correção
Painel Verde

Transformar:

Índices: IPC_R, INPC, IGPDI
Períodos: 7


em:

Encadeamento:
IPC-R • INPC • IGP-DI • Sem Correção

Períodos configurados: 7

Resumo semelhante à Fábrica

Exemplo:

(i) IPC-R: 07/1994 a 06/1995
(ii) INPC: 07/1995 a 04/1996
(iii) IGP-DI: 05/1996 a 07/1996

Tabelas da Guia 5
Separadores anuais discretos.
Contraste configurável.
Ajuste de fontes.
Ajuste de linhas de grade.
Ocultar totalizador redundante quando existir apenas um benefício.
Fase 1.8F – Juros de Mora

Prioridade: Alta

Estrutura

Implementar motor independente dos juros.

Separação definitiva:

Correção Monetária
+
Juros
=
Montante Atualizado

Juros a implementar
Juros de Mora 1% a.m.
Até 29/06/2009

Juros de Mora 0,5% a.m.

Casos específicos.

Poupança
30/06/2009 em diante


Conforme regras adotadas nos Manuais.

SELIC

Preparar suporte para:

09/12/2021 em diante

Funcionalidades
Exibição da memória

Mostrar:

Correção monetária


e

Juros


em colunas distintas.

Auditoria

Permitir visualizar:

coeficiente de correção
coeficiente de juros
coeficiente total

JSON

Expandir estrutura:

{
  "correcao": [],
  "juros": []
}

Fase 1.9 – Memória de Cálculo Avançada
Melhorias
Exportação PDF.
Exportação Word.
Exportação Excel.
Layout de impressão.
Cabeçalho institucional.
Auditoria

Exibir:

Encadeamentos utilizados
Coeficientes utilizados
Origem dos índices
Versão do Manual

Fase 2.0 – Plataforma ContadJus
Usuários
Cadastro.
Login.
Recuperação de senha.
Perfil de usuário.
Biblioteca de Parâmetros

Salvar:

MC 2022
MC 2026
TRF5
TRF4
TRF3

Compartilhamento
Compartilhar parâmetros.
Compartilhar cálculos.
Versionamento.
Administração
Controle de acesso.
Logs.
Auditoria.
Objetivo Estratégico

Ao final das próximas fases, o ContadJus deverá ser capaz de reproduzir integralmente:

✅ Manual de Cálculos 2022

✅ Manual de Cálculos 2026

✅ Correção monetária parametrizada

✅ Juros parametrizados

✅ Memória completa auditável

✅ Cálculos previdenciários

✅ Ações condenatórias em geral

✅ Plataforma online com autenticação e armazenamento de parâmetros.

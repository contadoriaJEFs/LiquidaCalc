// =====================================================================
// ADMINISTRAÇÃO DE ENCADEAMENTOS – Fase 1.8E (CORREÇÃO MONETÁRIA)
// =====================================================================
// Inclui:
// - Admin de parâmetros (CTRL+SHIFT+E)
// - Carregamento de JSON de correção/juros/SELIC na Guia 5
// - Importação de diferenças da Guia 4
// - Motor de correção monetária (cálculo e exibição)
// =====================================================================

// Inicialização segura das variáveis globais
if (window.parametrosCorrecaoAtual === undefined) {
    window.parametrosCorrecaoAtual = null;
}
if (window.parametrosJurosAtual === undefined) {
    window.parametrosJurosAtual = null;
}
if (window.parametrosSelicAtual === undefined) {
    window.parametrosSelicAtual = null;
}
if (window.diferencasAtualizacaoAtual === undefined) {
    window.diferencasAtualizacaoAtual = null;
}
if (window.resultadosAtualizacao === undefined) {
    window.resultadosAtualizacao = null;
}

// =====================================================================
// AUXILIARES
// =====================================================================

function adminCompetenciaParaNumero(str) {
    if (!str) return NaN;
    var partes = str.split('/');
    if (partes.length !== 2) return NaN;
    var mes = parseInt(partes[0], 10);
    var ano = parseInt(partes[1], 10);
    if (isNaN(mes) || isNaN(ano) || mes < 1 || mes > 12 || ano < 1900) return NaN;
    return ano * 100 + mes;
}

function adminProximaCompetenciaNumero(num) {
    var ano = Math.floor(num / 100);
    var mes = num % 100;
    if (mes === 12) return (ano + 1) * 100 + 1;
    return ano * 100 + (mes + 1);
}

function adminParseValorBrasileiro(texto) {
    if (!texto) return 0;
    var limpo = texto
        .replace(/[^0-9,.-]/g, '')
        .replace(/\./g, '')
        .replace(',', '.');
    return parseFloat(limpo) || 0;
}

function adminSanitizarNomeArquivo(nome) {
    if (!nome || nome.trim() === '') return 'SEM-NOME';
    var semAcentos = nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    // Substitui apóstrofos e similares por hífen
    var comHifens = semAcentos.replace(/['’`´]/g, '-');
    var sanitizado = comHifens
        .toUpperCase()
        .replace(/\s+/g, '-')
        .replace(/[^A-Z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    return sanitizado || 'SEM-NOME';
}

function adminGerarNomeArquivo(tipo, nome) {
    var nomeSanitizado = adminSanitizarNomeArquivo(nome);
    if (tipo === 'correcao_monetaria') {
        return 'CORRE-' + nomeSanitizado + '.corr';
    } else if (tipo === 'juros_selic') {
        return 'JUROS-' + nomeSanitizado + '.jur';
    }
    return 'parametros_' + tipo + '_' + nomeSanitizado + '.json';
}

function adminDataAtualFormatada() {
    var agora = new Date();
    var dia = String(agora.getDate()).padStart(2, '0');
    var mes = String(agora.getMonth() + 1).padStart(2, '0');
    var ano = agora.getFullYear();
    return dia + '/' + mes + '/' + ano;
}

// =====================================================================
// FUNÇÕES AUXILIARES PARA CATÁLOGO/BASE POR TIPO
// =====================================================================

function adminObterCatalogoPorTipo(tipo) {
    if (tipo === 'correcao_monetaria') {
        return window.CATALOGO_INDEXADORES_ATUALIZACAO || {};
    } else if (tipo === 'juros_mora' || tipo === 'selic') {
        return window.CATALOGO_INDEXADORES_JUROS || {};
    }
    return {};
}

function adminObterBasePorTipo(tipo) {
    if (tipo === 'correcao_monetaria') {
        return window.BASE_INDEXADORES_ATUALIZACAO || {};
    } else if (tipo === 'juros_mora' || tipo === 'selic') {
        return window.BASE_INDEXADORES_JUROS || {};
    }
    return {};
}

// =====================================================================
// FUNÇÕES AUXILIARES PARA VERIFICAÇÃO DE ÍNDICES
// =====================================================================

function adminIndiceExisteNaBase(codigo, tipo) {
    var catalogo = adminObterCatalogoPorTipo(tipo);
    return !!catalogo[codigo];
}

function adminIndiceCompativelComTipo(codigo, tipo) {
    var catalogo = adminObterCatalogoPorTipo(tipo);
    var item = catalogo[codigo];
    if (!item) return false;
    return item.tipo === tipo;
}

function adminObterIndicesDisponiveisPorTipo(tipo) {
    var catalogo = adminObterCatalogoPorTipo(tipo);
    var resultados = [];
    for (var chave in catalogo) {
        if (catalogo.hasOwnProperty(chave)) {
            var item = catalogo[chave];
            if (item.tipo === tipo) {
                resultados.push({
                    codigo: chave,
                    nome: item.nome || chave,
                    descricao: item.descricao || ''
                });
            }
        }
    }
    resultados.sort(function(a, b) {
        return a.nome.localeCompare(b.nome);
    });
    return resultados;
}

function adminVerificarBaseIndexadores() {
    if (!window.INDEXADORES_ATUALIZACAO) {
        adminExibirMensagem(
            'Aviso: base de indexadores não carregada. Verifique data/indexadores.js.',
            'warning'
        );
        return false;
    }
    return true;
}

// =====================================================================
// GERENCIAMENTO DO MODAL ADMINISTRATIVO
// =====================================================================

var adminModalCriado = false;
var adminEventosVinculados = false;
var adminTipoAtual = 'correcao_monetaria';

function criarModalAdmin() {
    if (document.getElementById('adminModal')) return;

    var overlay = document.createElement('div');
    overlay.id = 'adminModal';
    overlay.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 hidden modal-overlay';

    var modalContent = document.createElement('div');
    modalContent.className = 'bg-white p-6 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl';

    modalContent.innerHTML = `
        <h3 class="text-xl font-bold text-slate-800 mb-4">Administração de Parâmetros de Atualização</h3>

        <div id="adminMensagens" class="mb-4 p-3 rounded-md hidden"></div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
                <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Tipo do parâmetro</label>
                <select id="adminTipoParametro" class="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                    <option value="correcao_monetaria">Correção Monetária</option>
                    <option value="juros_selic">Juros e SELIC</option>
                </select>
            </div>
            <div>
                <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Nome do encadeamento *</label>
                <input type="text" id="adminNome" placeholder="Ex: CJF_PREVIDENCIARIO_2025" class="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
            </div>
        </div>

        <div class="mb-4">
            <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Descrição (opcional)</label>
            <textarea id="adminDescricao" rows="2" placeholder="Breve descrição do encadeamento..." class="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"></textarea>
        </div>

        <!-- SEÇÃO CORREÇÃO MONETÁRIA -->
        <div id="adminSeccaoCorrecao" class="mb-4">
            <div class="flex justify-between items-center mb-2">
                <h4 class="text-sm font-bold text-slate-700 uppercase tracking-wide">Encadeamento de Correção Monetária</h4>
                <button type="button" id="adminAdicionarLinhaCorrecao" class="px-3 py-1 bg-emerald-600 text-white text-xs rounded hover:bg-emerald-700 transition">+ Adicionar Linha</button>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-sm border-collapse">
                    <thead>
                        <tr class="bg-slate-100 text-slate-600 text-xs uppercase">
                            <th class="p-2 text-left">Índice</th>
                            <th class="p-2 text-left">Data Inicial</th>
                            <th class="p-2 text-left">Data Final</th>
                            <th class="p-2 text-center">Ação</th>
                        </tr>
                    </thead>
                    <tbody id="adminTabelaPeriodosCorrecao">
                    </tbody>
                </table>
            </div>
        </div>

        <!-- SEÇÃO JUROS E SELIC -->
        <div id="adminSeccaoJurosSelic" class="mb-4" style="display:none;">
            <!-- Juros -->
            <div class="mb-6">
                <div class="flex justify-between items-center mb-2">
                    <h4 class="text-sm font-bold text-slate-700 uppercase tracking-wide">Encadeamento de Juros de Mora</h4>
                    <button type="button" id="adminAdicionarLinhaJuros" class="px-3 py-1 bg-emerald-600 text-white text-xs rounded hover:bg-emerald-700 transition">+ Adicionar Linha de Juros</button>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm border-collapse">
                        <thead>
                            <tr class="bg-slate-100 text-slate-600 text-xs uppercase">
                                <th class="p-2 text-left">Índice</th>
                                <th class="p-2 text-left">Data Inicial</th>
                                <th class="p-2 text-left">Data Final</th>
                                <th class="p-2 text-center">Ação</th>
                            </tr>
                        </thead>
                        <tbody id="adminTabelaPeriodosJuros">
                        </tbody>
                    </table>
                </div>
            </div>
            <!-- SELIC -->
            <div>
                <div class="flex justify-between items-center mb-2">
                    <h4 class="text-sm font-bold text-slate-700 uppercase tracking-wide">Encadeamento SELIC</h4>
                    <button type="button" id="adminAdicionarLinhaSelic" class="px-3 py-1 bg-emerald-600 text-white text-xs rounded hover:bg-emerald-700 transition">+ Adicionar Linha SELIC</button>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm border-collapse">
                        <thead>
                            <tr class="bg-slate-100 text-slate-600 text-xs uppercase">
                                <th class="p-2 text-left">Índice</th>
                                <th class="p-2 text-left">Data Inicial</th>
                                <th class="p-2 text-left">Data Final</th>
                                <th class="p-2 text-center">Ação</th>
                            </tr>
                        </thead>
                        <tbody id="adminTabelaPeriodosSelic">
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <div class="flex flex-wrap gap-3 mt-4 border-t border-slate-200 pt-4">
            <button type="button" id="adminValidar" class="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 text-sm font-semibold shadow transition">Validar Encadeamento</button>
            <button type="button" id="adminExportar" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-semibold shadow transition">Exportar Arquivo</button>
            <button type="button" id="adminImportar" class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-semibold shadow transition">Importar Arquivo</button>
            <button type="button" id="adminFechar" class="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 text-sm font-semibold transition">Fechar</button>
        </div>

        <input type="file" id="adminFileInput" accept=".corr,.jur,.json,application/json" class="hidden">
    `;

    overlay.appendChild(modalContent);
    document.body.appendChild(overlay);

    if (!window.INDEXADORES_ATUALIZACAO) {
        adminExibirMensagem(
            'Aviso: base de indexadores não carregada. Verifique data/indexadores.js.',
            'warning'
        );
    }

    adminAlternarSeccoes('correcao_monetaria');
    adminAdicionarLinhaPeriodo('correcao');

    if (!adminEventosVinculados) {
        vincularEventosModal();
        adminEventosVinculados = true;
    }

    adminModalCriado = true;
}

function adminAlternarSeccoes(tipo) {
    var seccaoCorrecao = document.getElementById('adminSeccaoCorrecao');
    var seccaoJurosSelic = document.getElementById('adminSeccaoJurosSelic');
    if (tipo === 'correcao_monetaria') {
        seccaoCorrecao.style.display = 'block';
        seccaoJurosSelic.style.display = 'none';
    } else if (tipo === 'juros_selic') {
        seccaoCorrecao.style.display = 'none';
        seccaoJurosSelic.style.display = 'block';
    }
}

// =====================================================================
// EVENTOS DO MODAL
// =====================================================================

function vincularEventosModal() {
    document.getElementById('adminFechar').addEventListener('click', function() {
        document.getElementById('adminModal').classList.add('hidden');
    });

    document.getElementById('adminModal').addEventListener('click', function(e) {
        if (e.target === this) this.classList.add('hidden');
    });

    document.getElementById('adminTipoParametro').addEventListener('change', function() {
        var novoTipo = this.value;
        adminTipoAtual = novoTipo;
        adminAlternarSeccoes(novoTipo);
    });

    document.getElementById('adminAdicionarLinhaCorrecao').addEventListener('click', function() {
        adminAdicionarLinhaPeriodo('correcao');
    });
    document.getElementById('adminAdicionarLinhaJuros').addEventListener('click', function() {
        adminAdicionarLinhaPeriodo('juros');
    });
    document.getElementById('adminAdicionarLinhaSelic').addEventListener('click', function() {
        adminAdicionarLinhaPeriodo('selic');
    });

    document.getElementById('adminValidar').addEventListener('click', function() {
        var dados = adminColetarDados();
        var resultado = adminValidarDados(dados);
        if (resultado.erros.length === 0) {
            var msg = '✅ Encadeamento válido!';
            if (resultado.avisos.length > 0) {
                msg += '\n⚠️ Avisos:\n' + resultado.avisos.join('\n');
            }
            adminExibirMensagem(msg, 'success');
        } else {
            var msg = '❌ Erros:\n' + resultado.erros.join('\n');
            if (resultado.avisos.length > 0) {
                msg += '\n⚠️ Avisos:\n' + resultado.avisos.join('\n');
            }
            adminExibirMensagem(msg, 'error');
        }
    });

    document.getElementById('adminExportar').addEventListener('click', function() {
        var dados = adminColetarDados();
        var resultado = adminValidarDados(dados);
        if (resultado.erros.length > 0) {
            var msg = '❌ Não é possível exportar:\n' + resultado.erros.join('\n');
            if (resultado.avisos.length > 0) {
                msg += '\n⚠️ Avisos:\n' + resultado.avisos.join('\n');
            }
            adminExibirMensagem(msg, 'error');
            return;
        }
        adminExportarJSON(dados);
    });

    document.getElementById('adminImportar').addEventListener('click', function() {
        document.getElementById('adminFileInput').click();
    });

    document.getElementById('adminFileInput').addEventListener('change', function(e) {
        var file = e.target.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function(ev) {
            try {
                var json = JSON.parse(ev.target.result);
                adminImportarJSON(json);
            } catch (err) {
                adminExibirMensagem('❌ Erro ao ler o arquivo: ' + err.message, 'error');
            }
        };
        reader.readAsText(file);
        this.value = '';
    });
}

// =====================================================================
// FUNÇÕES DE LINHAS DA TABELA DE PERÍODOS (GENERICAS)
// =====================================================================

function adminObterIndicesDisponiveisParaTabela(tipoTabela) {
    var tipoParametro = '';
    if (tipoTabela === 'correcao') tipoParametro = 'correcao_monetaria';
    else if (tipoTabela === 'juros') tipoParametro = 'juros_mora';
    else if (tipoTabela === 'selic') tipoParametro = 'selic';
    return adminObterIndicesDisponiveisPorTipo(tipoParametro);
}

function adminCriarSelectIndiceParaTabela(tipoTabela, valorAtual, preservarIncompativel) {
    preservarIncompativel = preservarIncompativel || false;
    var tipoParametro = '';
    if (tipoTabela === 'correcao') tipoParametro = 'correcao_monetaria';
    else if (tipoTabela === 'juros') tipoParametro = 'juros_mora';
    else if (tipoTabela === 'selic') tipoParametro = 'selic';

    var indices = adminObterIndicesDisponiveisPorTipo(tipoParametro);
    var html = '<select class="admin-select-indice w-full px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" data-tipo-tabela="' + tipoTabela + '">';

    var existeNaBase = adminIndiceExisteNaBase(valorAtual, tipoParametro);
    var compativel = adminIndiceCompativelComTipo(valorAtual, tipoParametro);

    if (preservarIncompativel && valorAtual && existeNaBase && !compativel) {
        html += '<option value="' + valorAtual + '" selected>' + valorAtual + ' (incompatível com ' + tipoParametro + ')</option>';
    }

    if (valorAtual && !existeNaBase) {
        html += '<option value="' + valorAtual + '" selected>' + valorAtual + ' (não cadastrado na base)</option>';
    }

    if (indices.length === 0) {
        html += '<option value="">-- Nenhum índice disponível --</option>';
    } else {
        indices.forEach(function(item) {
            var selected = (item.codigo === valorAtual && compativel) ? 'selected' : '';
            var label = item.nome + ' (' + item.codigo + ')';
            html += '<option value="' + item.codigo + '" ' + selected + '>' + label + '</option>';
        });
    }

    html += '</select>';
    return html;
}

function adminAdicionarLinhaPeriodo(tipoTabela, indice, inicio, fim, preservarIncompativel) {
    preservarIncompativel = preservarIncompativel || false;
    var tbodyId = '';
    if (tipoTabela === 'correcao') tbodyId = 'adminTabelaPeriodosCorrecao';
    else if (tipoTabela === 'juros') tbodyId = 'adminTabelaPeriodosJuros';
    else if (tipoTabela === 'selic') tbodyId = 'adminTabelaPeriodosSelic';
    else return;

    var tbody = document.getElementById(tbodyId);
    if (!tbody) return;

    var tr = document.createElement('tr');
    tr.className = 'border-b border-slate-200';

    var selectIndice = adminCriarSelectIndiceParaTabela(tipoTabela, indice || '', preservarIncompativel);

    tr.innerHTML = `
        <td class="p-2">${selectIndice}</td>
        <td class="p-2"><input type="text" class="admin-data-inicio w-full px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="MM/AAAA" value="${inicio || ''}"></td>
        <td class="p-2"><input type="text" class="admin-data-fim w-full px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="MM/AAAA ou vazio" value="${fim || ''}"></td>
        <td class="p-2 text-center"><button type="button" class="admin-remover-linha text-red-600 hover:text-red-800 text-xs font-bold">✕</button></td>
    `;

    tbody.appendChild(tr);

    tr.querySelector('.admin-remover-linha').addEventListener('click', function() {
        tr.remove();
    });

    tr.querySelectorAll('.admin-data-inicio, .admin-data-fim').forEach(function(input) {
        input.addEventListener('input', function() {
            var v = this.value.replace(/\D/g, '');
            if (v.length > 6) v = v.substring(0, 6);
            if (v.length >= 3) {
                this.value = v.substring(0, 2) + '/' + v.substring(2);
            } else {
                this.value = v;
            }
        });
    });
}

// =====================================================================
// COLETA E VALIDAÇÃO DOS DADOS DO ADMIN
// =====================================================================

function adminColetarDados() {
    var tipo = document.getElementById('adminTipoParametro').value;
    var nome = document.getElementById('adminNome').value.trim();
    var descricao = document.getElementById('adminDescricao').value.trim();

    if (tipo === 'correcao_monetaria') {
        var periodosCorrecao = adminColetarPeriodosDaTabela('adminTabelaPeriodosCorrecao');
        return {
            tipo: tipo,
            nome: nome,
            descricao: descricao,
            periodos: periodosCorrecao,
            juros: null,
            selic: null
        };
    } else if (tipo === 'juros_selic') {
        var periodosJuros = adminColetarPeriodosDaTabela('adminTabelaPeriodosJuros');
        var periodosSelic = adminColetarPeriodosDaTabela('adminTabelaPeriodosSelic');
        return {
            tipo: tipo,
            nome: nome,
            descricao: descricao,
            periodos: [],
            juros: {
                tipoParametro: 'juros_mora',
                periodos: periodosJuros
            },
            selic: {
                tipoParametro: 'selic',
                periodos: periodosSelic
            }
        };
    }
    return null;
}

function adminColetarPeriodosDaTabela(tbodyId) {
    var tbody = document.getElementById(tbodyId);
    if (!tbody) return [];
    var linhas = tbody.querySelectorAll('tr');
    var periodos = [];
    linhas.forEach(function(tr) {
        var indiceSelect = tr.querySelector('.admin-select-indice');
        var inicioInput = tr.querySelector('.admin-data-inicio');
        var fimInput = tr.querySelector('.admin-data-fim');
        if (!indiceSelect || !inicioInput) return;
        var indice = indiceSelect.value;
        var inicio = inicioInput.value.trim();
        var fim = fimInput.value.trim();
        periodos.push({ indice: indice, inicio: inicio, fim: fim });
    });
    return periodos;
}

function adminValidarDados(dados) {
    var erros = [];
    var avisos = [];

    if (!dados.nome) {
        erros.push('Nome do encadeamento é obrigatório.');
    }

    if (!dados.tipo) {
        erros.push('Tipo do parâmetro é obrigatório.');
    }

    if (dados.tipo === 'correcao_monetaria') {
        var resultCorrecao = adminValidarPeriodos(dados.periodos, 'correcao_monetaria');
        erros = erros.concat(resultCorrecao.erros);
        avisos = avisos.concat(resultCorrecao.avisos);
        if (dados.periodos.length === 0) {
            erros.push('Correção Monetária deve ter pelo menos um período.');
        }
    } else if (dados.tipo === 'juros_selic') {
        if (dados.juros && dados.juros.periodos && dados.juros.periodos.length > 0) {
            var resultJuros = adminValidarPeriodos(dados.juros.periodos, 'juros_mora');
            erros = erros.concat(resultJuros.erros);
            avisos = avisos.concat(resultJuros.avisos);
        }
        if (dados.selic && dados.selic.periodos && dados.selic.periodos.length > 0) {
            var resultSelic = adminValidarPeriodos(dados.selic.periodos, 'selic');
            erros = erros.concat(resultSelic.erros);
            avisos = avisos.concat(resultSelic.avisos);
        }

        // Bloquear pacote totalmente vazio (Juros vazio E SELIC vazio)
        var jurosVazio = !dados.juros || !dados.juros.periodos || dados.juros.periodos.length === 0;
        var selicVazio = !dados.selic || !dados.selic.periodos || dados.selic.periodos.length === 0;
        if (jurosVazio && selicVazio) {
            erros.push('Informe pelo menos um período de Juros de Mora ou SELIC.');
        }
    }

    return { erros: erros, avisos: avisos };
}

function adminValidarPeriodos(periodos, tipoParametro) {
    var erros = [];
    var avisos = [];
    if (!periodos || periodos.length === 0) {
        return { erros: erros, avisos: avisos };
    }

    var regexMMAAAA = /^\d{2}\/\d{4}$/;
    var periodosAbertos = 0;
    var periodoAnteriorFimNum = null;

    var periodosOrdenados = periodos.slice().sort(function(a, b) {
        return adminCompetenciaParaNumero(a.inicio) - adminCompetenciaParaNumero(b.inicio);
    });

    var catalogo = adminObterCatalogoPorTipo(tipoParametro);
    var baseDisponivel = Object.keys(catalogo).length > 0;

    for (var i = 0; i < periodosOrdenados.length; i++) {
        var p = periodosOrdenados[i];

        if (!p.indice) {
            erros.push('Linha ' + (i+1) + ' (' + tipoParametro + '): Índice não selecionado.');
            continue;
        }

        if (baseDisponivel) {
            if (!adminIndiceExisteNaBase(p.indice, tipoParametro)) {
                avisos.push('Linha ' + (i+1) + ' (' + tipoParametro + '): Índice "' + p.indice + '" não existe no catálogo do tipo "' + tipoParametro + '". Será mantido no JSON, mas pode não ser reconhecido futuramente.');
            } else {
                var tipoIndexador = catalogo[p.indice].tipo;
                if (tipoIndexador !== tipoParametro) {
                    avisos.push('Linha ' + (i+1) + ' (' + tipoParametro + '): Índice "' + p.indice + '" pertence ao tipo "' + tipoIndexador + '", mas o encadeamento é do tipo "' + tipoParametro + '".');
                }
            }
        }

        if (!p.inicio || !regexMMAAAA.test(p.inicio)) {
            erros.push('Linha ' + (i+1) + ' (' + tipoParametro + '): Data inicial "' + p.inicio + '" inválida. Use MM/AAAA.');
            continue;
        }
        var numInicio = adminCompetenciaParaNumero(p.inicio);
        if (isNaN(numInicio)) {
            erros.push('Linha ' + (i+1) + ' (' + tipoParametro + '): Data inicial "' + p.inicio + '" inválida.');
            continue;
        }

        var numFim = null;
        if (p.fim) {
            if (!regexMMAAAA.test(p.fim)) {
                erros.push('Linha ' + (i+1) + ' (' + tipoParametro + '): Data final "' + p.fim + '" inválida. Use MM/AAAA ou deixe vazio.');
                continue;
            }
            numFim = adminCompetenciaParaNumero(p.fim);
            if (isNaN(numFim)) {
                erros.push('Linha ' + (i+1) + ' (' + tipoParametro + '): Data final "' + p.fim + '" inválida.');
                continue;
            }
            if (numFim < numInicio) {
                erros.push('Linha ' + (i+1) + ' (' + tipoParametro + '): Data final anterior à data inicial.');
                continue;
            }
        } else {
            periodosAbertos++;
            if (periodosAbertos > 1) {
                erros.push('Linha ' + (i+1) + ' (' + tipoParametro + '): Apenas um período pode estar aberto (sem data final).');
                continue;
            }
            numFim = Number.MAX_SAFE_INTEGER;
        }

        if (periodoAnteriorFimNum !== null && numInicio <= periodoAnteriorFimNum) {
            erros.push('Linha ' + (i+1) + ' (' + tipoParametro + '): Período se sobrepõe ao anterior.');
        }

        periodoAnteriorFimNum = numFim;
    }

    return { erros: erros, avisos: avisos };
}

function adminExibirMensagem(texto, tipo) {
    var div = document.getElementById('adminMensagens');
    if (!div) return;
    div.classList.remove('hidden', 'bg-green-100', 'text-green-700', 'bg-red-100', 'text-red-700', 'bg-amber-100', 'text-amber-700');
    div.textContent = texto;
    div.style.whiteSpace = 'pre-wrap';

    if (tipo === 'success') {
        div.classList.add('bg-green-100', 'text-green-700');
    } else if (tipo === 'error') {
        div.classList.add('bg-red-100', 'text-red-700');
    } else if (tipo === 'warning') {
        div.classList.add('bg-amber-100', 'text-amber-700');
    }
}

// =====================================================================
// EXPORTAÇÃO DO JSON DE PARÂMETROS
// =====================================================================

function adminExportarJSON(dados) {
    if (dados.tipo === 'correcao_monetaria') {
        var periodosOrdenados = dados.periodos.slice().sort(function(a, b) {
            return adminCompetenciaParaNumero(a.inicio) - adminCompetenciaParaNumero(b.inicio);
        });
        var indices = [];
        periodosOrdenados.forEach(function(p) {
            if (p.indice && indices.indexOf(p.indice) === -1) {
                indices.push(p.indice);
            }
        });
        var jsonObj = {
            tipoArquivo: 'parametros_atualizacao',
            tipoParametro: 'correcao_monetaria',
            versao: '1.0',
            nome: dados.nome,
            descricao: dados.descricao || '',
            dataCriacao: adminDataAtualFormatada(),
            indicesUtilizados: indices,
            periodos: periodosOrdenados.map(function(p) {
                return { indice: p.indice, inicio: p.inicio, fim: p.fim || '' };
            })
        };
        var jsonStr = JSON.stringify(jsonObj, null, 2);
        var blob = new Blob([jsonStr], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var link = document.createElement('a');
        var nomeArquivo = adminGerarNomeArquivo('correcao_monetaria', dados.nome);
        link.href = url;
        link.download = nomeArquivo;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        adminExibirMensagem('✅ Arquivo exportado com sucesso: ' + nomeArquivo, 'success');
    } else if (dados.tipo === 'juros_selic') {
        var jsonObj = {
            tipoArquivo: 'parametros_juros_selic',
            tipoParametro: 'juros_selic',
            versao: '1.0',
            nome: dados.nome,
            descricao: dados.descricao || '',
            dataCriacao: adminDataAtualFormatada(),
            juros: null,
            selic: null
        };

        if (dados.juros && dados.juros.periodos && dados.juros.periodos.length > 0) {
            var periodosJuros = dados.juros.periodos.slice().sort(function(a, b) {
                return adminCompetenciaParaNumero(a.inicio) - adminCompetenciaParaNumero(b.inicio);
            });
            var indicesJuros = [];
            periodosJuros.forEach(function(p) {
                if (p.indice && indicesJuros.indexOf(p.indice) === -1) {
                    indicesJuros.push(p.indice);
                }
            });
            jsonObj.juros = {
                tipoParametro: 'juros_mora',
                indicesUtilizados: indicesJuros,
                periodos: periodosJuros.map(function(p) {
                    return { indice: p.indice, inicio: p.inicio, fim: p.fim || '' };
                })
            };
        }

        if (dados.selic && dados.selic.periodos && dados.selic.periodos.length > 0) {
            var periodosSelic = dados.selic.periodos.slice().sort(function(a, b) {
                return adminCompetenciaParaNumero(a.inicio) - adminCompetenciaParaNumero(b.inicio);
            });
            var indicesSelic = [];
            periodosSelic.forEach(function(p) {
                if (p.indice && indicesSelic.indexOf(p.indice) === -1) {
                    indicesSelic.push(p.indice);
                }
            });
            jsonObj.selic = {
                tipoParametro: 'selic',
                indicesUtilizados: indicesSelic,
                periodos: periodosSelic.map(function(p) {
                    return { indice: p.indice, inicio: p.inicio, fim: p.fim || '' };
                })
            };
        }

        var jsonStr = JSON.stringify(jsonObj, null, 2);
        var blob = new Blob([jsonStr], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var link = document.createElement('a');
        var nomeArquivo = adminGerarNomeArquivo('juros_selic', dados.nome);
        link.href = url;
        link.download = nomeArquivo;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        adminExibirMensagem('✅ Arquivo exportado com sucesso: ' + nomeArquivo, 'success');
    }
}

// =====================================================================
// IMPORTAÇÃO DE JSON NO MODAL ADMIN
// =====================================================================

function adminImportarJSON(json) {
    // =============================================================
    // VALIDAÇÃO DE ESTRUTURA (formato antigo)
    // =============================================================
    if (json.tipoArquivo === 'parametros_atualizacao') {
        // Valida campos obrigatórios
        if (!json.tipoParametro) {
            adminExibirMensagem('❌ JSON inválido: tipoParametro ausente.', 'error');
            return;
        }
        if (!json.nome) {
            adminExibirMensagem('❌ JSON inválido: nome ausente.', 'error');
            return;
        }
        if (!Array.isArray(json.periodos)) {
            adminExibirMensagem('❌ JSON inválido: períodos ausentes ou inválidos.', 'error');
            return;
        }

        // Agora processa conforme o tipo
        if (json.tipoParametro === 'correcao_monetaria') {
            document.getElementById('adminTipoParametro').value = 'correcao_monetaria';
            adminTipoAtual = 'correcao_monetaria';
            adminAlternarSeccoes('correcao_monetaria');
            var tbodyCorrecao = document.getElementById('adminTabelaPeriodosCorrecao');
            tbodyCorrecao.innerHTML = '';
            json.periodos.forEach(function(p) {
                adminAdicionarLinhaPeriodo('correcao', p.indice, p.inicio, p.fim || '', true);
            });
            document.getElementById('adminNome').value = json.nome || '';
            document.getElementById('adminDescricao').value = json.descricao || '';
            adminExibirMensagem('✅ Arquivo de correção importado com sucesso.', 'success');
            return;
        } else if (json.tipoParametro === 'juros_mora') {
            document.getElementById('adminTipoParametro').value = 'juros_selic';
            adminTipoAtual = 'juros_selic';
            adminAlternarSeccoes('juros_selic');
            var tbodyJuros = document.getElementById('adminTabelaPeriodosJuros');
            tbodyJuros.innerHTML = '';
            var tbodySelic = document.getElementById('adminTabelaPeriodosSelic');
            tbodySelic.innerHTML = '';
            json.periodos.forEach(function(p) {
                adminAdicionarLinhaPeriodo('juros', p.indice, p.inicio, p.fim || '', true);
            });
            document.getElementById('adminNome').value = json.nome || '';
            document.getElementById('adminDescricao').value = json.descricao || '';
            adminExibirMensagem('✅ Arquivo de juros antigo importado com sucesso. (SELIC vazio)', 'success');
            return;
        } else if (json.tipoParametro === 'selic') {
            document.getElementById('adminTipoParametro').value = 'juros_selic';
            adminTipoAtual = 'juros_selic';
            adminAlternarSeccoes('juros_selic');
            var tbodyJuros = document.getElementById('adminTabelaPeriodosJuros');
            tbodyJuros.innerHTML = '';
            var tbodySelic = document.getElementById('adminTabelaPeriodosSelic');
            tbodySelic.innerHTML = '';
            json.periodos.forEach(function(p) {
                adminAdicionarLinhaPeriodo('selic', p.indice, p.inicio, p.fim || '', true);
            });
            document.getElementById('adminNome').value = json.nome || '';
            document.getElementById('adminDescricao').value = json.descricao || '';
            adminExibirMensagem('✅ Arquivo de SELIC antigo importado com sucesso. (Juros vazio)', 'success');
            return;
        } else {
            adminExibirMensagem('❌ Tipo de parâmetro não reconhecido.', 'error');
            return;
        }
    }

    // =============================================================
    // VALIDAÇÃO DE ESTRUTURA (novo pacote)
    // =============================================================
    if (json.tipoArquivo === 'parametros_juros_selic') {
        if (json.tipoParametro !== 'juros_selic') {
            adminExibirMensagem('❌ JSON inválido: tipo do pacote de Juros e SELIC incompatível.', 'error');
            return;
        }
        if (!json.nome) {
            adminExibirMensagem('❌ JSON inválido: nome ausente.', 'error');
            return;
        }

        // Valida juros se existir
        if (json.juros !== null && json.juros !== undefined) {
            if (!Array.isArray(json.juros.periodos)) {
                adminExibirMensagem('❌ JSON inválido: períodos de juros ausentes ou inválidos.', 'error');
                return;
            }
        }
        // Valida selic se existir
        if (json.selic !== null && json.selic !== undefined) {
            if (!Array.isArray(json.selic.periodos)) {
                adminExibirMensagem('❌ JSON inválido: períodos SELIC ausentes ou inválidos.', 'error');
                return;
            }
        }

        // Importação propriamente dita
        document.getElementById('adminTipoParametro').value = 'juros_selic';
        adminTipoAtual = 'juros_selic';
        adminAlternarSeccoes('juros_selic');

        var tbodyJuros = document.getElementById('adminTabelaPeriodosJuros');
        tbodyJuros.innerHTML = '';
        var tbodySelic = document.getElementById('adminTabelaPeriodosSelic');
        tbodySelic.innerHTML = '';

        if (json.juros && json.juros.periodos && json.juros.periodos.length > 0) {
            json.juros.periodos.forEach(function(p) {
                adminAdicionarLinhaPeriodo('juros', p.indice, p.inicio, p.fim || '', true);
            });
        }

        if (json.selic && json.selic.periodos && json.selic.periodos.length > 0) {
            json.selic.periodos.forEach(function(p) {
                adminAdicionarLinhaPeriodo('selic', p.indice, p.inicio, p.fim || '', true);
            });
        }

        document.getElementById('adminNome').value = json.nome || '';
        document.getElementById('adminDescricao').value = json.descricao || '';
        adminExibirMensagem('✅ Arquivo de Juros e SELIC importado com sucesso.', 'success');
        return;
    }

    adminExibirMensagem('❌ O arquivo não é um JSON de parâmetros reconhecido.', 'error');
}

// =====================================================================
// FUNÇÕES AUXILIARES PARA EXIBIÇÃO DOS PERÍODOS (Fase 1.8F-B4)
// =====================================================================

function adminObterNomeAmigavelIndice(codigo, tipoParametro) {
    if (!codigo) return codigo;
    var catalogo = adminObterCatalogoPorTipo(tipoParametro);
    if (catalogo && catalogo[codigo] && catalogo[codigo].nome) {
        return catalogo[codigo].nome;
    }
    return codigo;
}

function adminOrdenarPeriodosParaExibicao(periodos) {
    if (!periodos || !Array.isArray(periodos)) return [];
    var copia = periodos.slice();
    copia.sort(function(a, b) {
        return adminCompetenciaParaNumero(a.inicio) - adminCompetenciaParaNumero(b.inicio);
    });
    return copia;
}

function adminCriarBlocoPeriodosStatus(titulo, periodos, tipoParametro) {
    var container = document.createElement('div');
    container.className = 'mt-2';

    var tituloEl = document.createElement('div');
    tituloEl.className = 'text-xs font-semibold text-slate-600';
    tituloEl.textContent = titulo;
    container.appendChild(tituloEl);

    if (!periodos || periodos.length === 0) {
        var nenhum = document.createElement('div');
        nenhum.className = 'text-xs text-slate-500 mt-1';
        nenhum.textContent = 'Nenhum período definido.';
        container.appendChild(nenhum);
        return container;
    }

    var periodosOrdenados = adminOrdenarPeriodosParaExibicao(periodos);
    var wrapper = document.createElement('div');
    wrapper.className = 'flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs';

    periodosOrdenados.forEach(function(p) {
        var item = document.createElement('span');
        item.className = 'inline-flex items-baseline whitespace-nowrap';

        var bullet = document.createElement('span');
        bullet.className = 'text-green-900 font-bold mr-1';
        bullet.textContent = '►';
        item.appendChild(bullet);

        var nome = document.createElement('span');
        nome.className = 'text-green-900 font-semibold';
        nome.textContent = adminObterNomeAmigavelIndice(p.indice, tipoParametro) + ':';
        item.appendChild(nome);

        var intervalo = document.createElement('span');
        intervalo.className = 'text-green-700 ml-1';
        if (p.fim && p.fim.trim() !== '') {
            intervalo.textContent = p.inicio + ' a ' + p.fim + ';';
        } else {
            intervalo.textContent = p.inicio + ' em diante;';
        }
        item.appendChild(intervalo);

        wrapper.appendChild(item);
    });

    container.appendChild(wrapper);
    return container;
}

function adminAtualizarStatusDetalhado(tipoEsperado, json, mensagemBase) {
    var statusId = (tipoEsperado === 'correcao_monetaria') ? 'statusCorrecao' : 'statusJurosSelic';
    var div = document.getElementById(statusId);
    if (!div) return;

    // Limpa o conteúdo atual
    div.innerHTML = '';
    div.className = 'flex-1 min-w-0 text-sm p-3 rounded-md bg-green-100 text-green-700';

    // Mensagem principal
    var msgEl = document.createElement('div');
    msgEl.className = 'font-semibold';
    msgEl.textContent = mensagemBase || '✅ Parâmetros carregados com sucesso!';
    div.appendChild(msgEl);

    // Nome e descrição (sempre exibidos)
    var nomeEl = document.createElement('div');
    nomeEl.className = 'mt-1';
    nomeEl.textContent = 'Nome: ' + (json.nome || 'N/A');
    div.appendChild(nomeEl);

    var descEl = document.createElement('div');
    descEl.className = 'text-xs';
    descEl.textContent = 'Descrição: ' + (json.descricao || 'N/A');
    div.appendChild(descEl);

    if (tipoEsperado === 'correcao_monetaria') {
        // Correção monetária
        var periodos = json.periodos || [];
        var indices = [];
        periodos.forEach(function(p) {
            if (p.indice && indices.indexOf(p.indice) === -1) {
                indices.push(p.indice);
            }
        });
        var indiceStr = indices.length > 0 ? indices.join(', ') : 'N/A';
        var infoEl = document.createElement('div');
        infoEl.className = 'text-xs mt-1';
        infoEl.textContent = 'Índices: ' + indiceStr + '  |  Períodos: ' + periodos.length;
        div.appendChild(infoEl);

        var bloco = adminCriarBlocoPeriodosStatus('Encadeamento', periodos, 'correcao_monetaria');
        div.appendChild(bloco);

    } else if (tipoEsperado === 'juros_selic') {
        // Juros e SELIC
        // Juros
        var jurosPeriodos = (json.juros && json.juros.periodos) ? json.juros.periodos : [];
        var jurosEl = document.createElement('div');
        jurosEl.className = 'mt-2';
        var jurosTitulo = document.createElement('div');
        jurosTitulo.className = 'font-semibold text-sm';
        jurosTitulo.textContent = 'Juros:';
        jurosEl.appendChild(jurosTitulo);

        if (jurosPeriodos.length > 0) {
            var jurosIndices = [];
            jurosPeriodos.forEach(function(p) {
                if (p.indice && jurosIndices.indexOf(p.indice) === -1) {
                    jurosIndices.push(p.indice);
                }
            });
            var jurosInfo = document.createElement('div');
            jurosInfo.className = 'text-xs';
            jurosInfo.textContent = 'Índices: ' + jurosIndices.join(', ') + '  |  Períodos: ' + jurosPeriodos.length;
            jurosEl.appendChild(jurosInfo);
            var blocoJuros = adminCriarBlocoPeriodosStatus('Encadeamento de Juros', jurosPeriodos, 'juros_mora');
            jurosEl.appendChild(blocoJuros);
        } else {
            var nenhumJuros = document.createElement('div');
            nenhumJuros.className = 'text-xs text-slate-600';
            nenhumJuros.textContent = 'Nenhum período definido.';
            jurosEl.appendChild(nenhumJuros);
        }
        div.appendChild(jurosEl);

        // SELIC
        var selicPeriodos = (json.selic && json.selic.periodos) ? json.selic.periodos : [];
        var selicEl = document.createElement('div');
        selicEl.className = 'mt-2';
        var selicTitulo = document.createElement('div');
        selicTitulo.className = 'font-semibold text-sm';
        selicTitulo.textContent = 'SELIC:';
        selicEl.appendChild(selicTitulo);

        if (selicPeriodos.length > 0) {
            var selicIndices = [];
            selicPeriodos.forEach(function(p) {
                if (p.indice && selicIndices.indexOf(p.indice) === -1) {
                    selicIndices.push(p.indice);
                }
            });
            var selicInfo = document.createElement('div');
            selicInfo.className = 'text-xs';
            selicInfo.textContent = 'Índices: ' + selicIndices.join(', ') + '  |  Períodos: ' + selicPeriodos.length;
            selicEl.appendChild(selicInfo);
            var blocoSelic = adminCriarBlocoPeriodosStatus('Encadeamento SELIC', selicPeriodos, 'selic');
            selicEl.appendChild(blocoSelic);
        } else {
            var nenhumSelic = document.createElement('div');
            nenhumSelic.className = 'text-xs text-slate-600';
            nenhumSelic.textContent = 'Nenhum período definido.';
            selicEl.appendChild(nenhumSelic);
        }
        div.appendChild(selicEl);
    }
}

// =====================================================================
// FUNÇÃO PARA CARREGAR PARÂMETROS NA GUIA 5
// =====================================================================

function adminCarregarParametroGuia5(file, tipoEsperado) {
    var reader = new FileReader();
    reader.onload = function(e) {
        try {
            var json = JSON.parse(e.target.result);

            // =============================================================
            // FLUXO A: CORREÇÃO MONETÁRIA
            // =============================================================
            if (tipoEsperado === 'correcao_monetaria') {
                // Valida estrutura
                if (json.tipoArquivo !== 'parametros_atualizacao' ||
                    json.tipoParametro !== 'correcao_monetaria' ||
                    !json.nome ||
                    !Array.isArray(json.periodos)) {
                    adminExibirMensagemGuia5('O arquivo não é um JSON de correção monetária válido.', 'error', 'correcao_monetaria');
                    return;
                }
                window.parametrosCorrecaoAtual = json;
                // Atualiza status detalhado
                adminAtualizarStatusDetalhado('correcao_monetaria', json, '✅ Parâmetros de correção carregados com sucesso!');
                atualizarBotoesAtualizacao();
                return;
            }

            // =============================================================
            // FLUXO B: JUROS E SELIC
            // =============================================================

            // 1. Tentar novo pacote
            if (json.tipoArquivo === 'parametros_juros_selic' && json.tipoParametro === 'juros_selic') {
                // Valida estrutura
                if (!json.nome) {
                    adminExibirMensagemGuia5('JSON inválido: nome ausente.', 'error', 'juros_selic');
                    return;
                }
                if (json.juros !== null && json.juros !== undefined && !Array.isArray(json.juros.periodos)) {
                    adminExibirMensagemGuia5('JSON inválido: períodos de juros ausentes ou inválidos.', 'error', 'juros_selic');
                    return;
                }
                if (json.selic !== null && json.selic !== undefined && !Array.isArray(json.selic.periodos)) {
                    adminExibirMensagemGuia5('JSON inválido: períodos SELIC ausentes ou inválidos.', 'error', 'juros_selic');
                    return;
                }

                var jurosObj = json.juros ? Object.assign({}, json.juros, {
                    nomePacote: json.nome || '',
                    descricaoPacote: json.descricao || '',
                    dataCriacaoPacote: json.dataCriacao || ''
                }) : null;

                var selicObj = json.selic ? Object.assign({}, json.selic, {
                    nomePacote: json.nome || '',
                    descricaoPacote: json.descricao || '',
                    dataCriacaoPacote: json.dataCriacao || ''
                }) : null;

                window.parametrosJurosAtual = jurosObj;
                window.parametrosSelicAtual = selicObj;

                var pacoteCompleto = {
                    nome: json.nome,
                    descricao: json.descricao || '',
                    juros: jurosObj,
                    selic: selicObj
                };
                adminAtualizarStatusDetalhado('juros_selic', pacoteCompleto, '✅ Parâmetros de Juros e SELIC carregados com sucesso!');
                return;
            }

            // 2. Tentar formatos antigos
            if (json.tipoArquivo === 'parametros_atualizacao') {
                if (json.tipoParametro === 'correcao_monetaria') {
                    adminExibirMensagemGuia5('Este arquivo é de correção monetária, não de juros/SELIC.', 'error', 'juros_selic');
                    return;
                } else if (json.tipoParametro === 'juros_mora') {
                    if (!json.nome || !Array.isArray(json.periodos)) {
                        adminExibirMensagemGuia5('JSON de juros inválido: períodos ausentes ou inválidos.', 'error', 'juros_selic');
                        return;
                    }
                    window.parametrosJurosAtual = json;
                    window.parametrosSelicAtual = null;
                    var pacoteAntigo = {
                        nome: json.nome,
                        descricao: json.descricao || '',
                        juros: json,
                        selic: null
                    };
                    adminAtualizarStatusDetalhado('juros_selic', pacoteAntigo, '✅ Parâmetros de juros (formato antigo) carregados.');
                    return;
                } else if (json.tipoParametro === 'selic') {
                    if (!json.nome || !Array.isArray(json.periodos)) {
                        adminExibirMensagemGuia5('JSON de SELIC inválido: períodos ausentes ou inválidos.', 'error', 'juros_selic');
                        return;
                    }
                    window.parametrosSelicAtual = json;
                    window.parametrosJurosAtual = null;
                    var pacoteAntigoSelic = {
                        nome: json.nome,
                        descricao: json.descricao || '',
                        juros: null,
                        selic: json
                    };
                    adminAtualizarStatusDetalhado('juros_selic', pacoteAntigoSelic, '✅ Parâmetros SELIC (formato antigo) carregados.');
                    return;
                }
            }

            adminExibirMensagemGuia5('Tipo de arquivo não reconhecido para Juros e SELIC.', 'error', 'juros_selic');

        } catch (err) {
            adminExibirMensagemGuia5('Erro ao ler o arquivo: ' + err.message, 'error', tipoEsperado);
        }
    };
    reader.readAsText(file);
}

function adminExibirMensagemGuia5(texto, tipo, tipoEsperado) {
    var statusId;
    if (tipoEsperado === 'correcao_monetaria') {
        statusId = 'statusCorrecao';
    } else {
        statusId = 'statusJurosSelic';
    }
    var div = document.getElementById(statusId);
    if (!div) return;

    // Limpa e define estilo básico
    div.innerHTML = '';
    div.className = 'flex-1 min-w-0 text-sm p-3 rounded-md';
    if (tipo === 'success') {
        div.className += ' bg-green-100 text-green-700';
    } else if (tipo === 'error') {
        div.className += ' bg-red-100 text-red-700';
    } else if (tipo === 'warning') {
        div.className += ' bg-amber-100 text-amber-700';
    } else {
        div.className += ' bg-slate-100 text-slate-600';
    }
    // Para mensagens simples, coloca o texto em um parágrafo
    var p = document.createElement('p');
    p.textContent = texto;
    div.appendChild(p);
}

// =====================================================================
// LIMPAR DIFERENÇAS DA GUIA 5 (Fase 1.8F-A)
// =====================================================================

function limparDiferencasAtualizacao(mensagem) {
    window.diferencasAtualizacaoAtual = null;
    window.resultadosAtualizacao = null;

    var container = document.getElementById('containerTabelaDiferencas');
    var tbody = document.getElementById('corpoDiferencasAtualizacao');
    var resumo = document.getElementById('resumoAtualizacao');
    var totalOriginalEl = document.getElementById('totalOriginalAtualizacao');
    var totalCorrigidoEl = document.getElementById('totalCorrigidoAtualizacao');
    var totalJurosEl = document.getElementById('totalJurosAtualizacao');
    var status = document.getElementById('statusDiferencas');
    var statusAtualizacao = document.getElementById('statusAtualizacao');

    if (container) container.classList.add('hidden');
    if (resumo) resumo.classList.add('hidden');
    if (tbody) tbody.innerHTML = '';
    if (totalOriginalEl) totalOriginalEl.textContent = 'R$ 0,00';
    if (totalCorrigidoEl) totalCorrigidoEl.textContent = 'R$ 0,00';
    if (totalJurosEl) totalJurosEl.textContent = 'R$ 0,00';

    if (status) {
        status.textContent = mensagem || 'Nenhuma diferença importada.';
        status.className = 'text-sm text-slate-500';
    }
    if (statusAtualizacao) {
        statusAtualizacao.textContent = 'Aguardando diferenças e parâmetros de correção.';
        statusAtualizacao.className = 'text-sm text-slate-500';
    }

    atualizarBotoesAtualizacao();
}

// =====================================================================
// COLETA DE DIFERENÇAS DA GUIA 4 (PREPARAÇÃO PARA FUTURO)
// =====================================================================

function coletarDiferencasParaAtualizacao() {
    var rows = document.querySelectorAll('#corpoDiferencas tr');
    var resultados = [];

    rows.forEach(function(tr) {
        var competencia = tr.dataset.competencia;
        if (!competencia) return;

        var diffEl = tr.querySelector('.diferenca-devida');
        if (!diffEl) return;

        var valorTexto = diffEl.textContent.trim();
        var valorNum = adminParseValorBrasileiro(valorTexto);
        if (isNaN(valorNum)) return;

        resultados.push({
            competencia: competencia,
            diferenca: valorNum
        });
    });

    return resultados;
}

// =====================================================================
// FUNÇÃO AUXILIAR PARA FORMATAÇÃO DE PERCENTUAIS (Fase 1.8F-B2)
// =====================================================================

function formatarPercentualAtualizacao(valor, casas) {
    if (casas === undefined || casas === null) {
        casas = 4;
    }

    if (
        valor === null ||
        valor === undefined ||
        !Number.isFinite(Number(valor))
    ) {
        return '-';
    }

    return Number(valor).toLocaleString('pt-BR', {
        minimumFractionDigits: casas,
        maximumFractionDigits: casas
    }) + '%';
}

// =====================================================================
// FASE 1.8D – ESPELHO DAS DIFERENÇAS DA GUIA 4 NA GUIA 5
// =====================================================================

function formatarMoedaAtualizacao(valor) {
    if (valor === null || valor === undefined || isNaN(valor)) return 'R$ 0,00';
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function renderizarTabelaCorrigida(dados) {
    var container = document.getElementById('containerTabelaDiferencas');
    var tbody = document.getElementById('corpoDiferencasAtualizacao');
    var status = document.getElementById('statusDiferencas');
    var resumo = document.getElementById('resumoAtualizacao');
    var totalOriginalEl = document.getElementById('totalOriginalAtualizacao');
    var totalCorrigidoEl = document.getElementById('totalCorrigidoAtualizacao');

    if (!container || !tbody) return;

    tbody.innerHTML = '';

    if (!dados || dados.length === 0) {
        container.classList.add('hidden');
        if (resumo) resumo.classList.add('hidden');
        if (status) {
            status.textContent = 'Nenhuma diferença importada.';
            status.className = 'text-sm text-slate-500';
        }
        return;
    }

    var dadosOrdenados = dados.slice().sort(function(a, b) {
        var aIs13 = a.competencia.indexOf('13º') === 0;
        var bIs13 = b.competencia.indexOf('13º') === 0;
        var aNum, bNum;
        if (aIs13) {
            var aAno = parseInt(a.competencia.split('/')[1], 10);
            aNum = aAno * 100 + 13;
        } else {
            var aPartes = a.competencia.split('/');
            aNum = parseInt(aPartes[1], 10) * 100 + parseInt(aPartes[0], 10);
        }
        if (bIs13) {
            var bAno = parseInt(b.competencia.split('/')[1], 10);
            bNum = bAno * 100 + 13;
        } else {
            var bPartes = b.competencia.split('/');
            bNum = parseInt(bPartes[1], 10) * 100 + parseInt(bPartes[0], 10);
        }
        return aNum - bNum;
    });

    var totalOrig = 0;
    var totalCorr = 0;

    dadosOrdenados.forEach(function(item) {
        var tr = document.createElement('tr');
        tr.className = 'border-b border-slate-200 hover:bg-slate-50';
        var is13 = item.competencia.indexOf('13º') === 0;
        if (is13) tr.classList.add('linha-13');

        var tdComp = document.createElement('td');
        tdComp.className = 'p-2 font-semibold text-slate-800';
        tdComp.textContent = item.competencia;
        tr.appendChild(tdComp);

        var tdOrig = document.createElement('td');
        tdOrig.className = 'p-2 text-right font-mono';
        tdOrig.textContent = formatarMoedaAtualizacao(item.diferenca);
        if (item.diferenca < 0) tdOrig.style.color = '#dc2626';
        else if (item.diferenca > 0) tdOrig.style.color = '#16a34a';
        tr.appendChild(tdOrig);

        var tdCriterio = document.createElement('td');
        tdCriterio.className = 'p-2 text-left text-xs';
        if (item.criterio) {
            tdCriterio.textContent = item.criterio;
        } else {
            tdCriterio.textContent = '-';
        }
        tr.appendChild(tdCriterio);

        var tdCoef = document.createElement('td');
        tdCoef.className = 'p-2 text-right font-mono';
        if (item.coeficiente !== undefined && item.coeficiente !== null) {
            tdCoef.textContent = item.coeficiente.toFixed(10);
        } else {
            tdCoef.textContent = '-';
        }
        tr.appendChild(tdCoef);

        var tdCorr = document.createElement('td');
        tdCorr.className = 'p-2 text-right font-mono font-semibold';
        if (item.valorCorrigido !== undefined && item.valorCorrigido !== null) {
            tdCorr.textContent = formatarMoedaAtualizacao(item.valorCorrigido);
            if (item.valorCorrigido < 0) tdCorr.style.color = '#dc2626';
            else if (item.valorCorrigido > 0) tdCorr.style.color = '#16a34a';
            totalOrig += item.diferenca;
            totalCorr += item.valorCorrigido;
        } else {
            tdCorr.textContent = '-';
        }
        tr.appendChild(tdCorr);

        // --- NOVAS CÉLULAS (Fase 1.8F-B2) ---

        // 1. % Juros antes da SELIC
        var tdJurosAntes = document.createElement('td');
        tdJurosAntes.className = 'p-2 text-right font-mono';
        tdJurosAntes.textContent = formatarPercentualAtualizacao(item.percentualJurosAntesSelic);
        tr.appendChild(tdJurosAntes);

        // 2. Taxa Legal
        var tdTaxaLegal = document.createElement('td');
        tdTaxaLegal.className = 'p-2 text-right font-mono';
        if (item.percentualTaxaLegal !== undefined && item.percentualTaxaLegal !== null && item.percentualTaxaLegal !== 0) {
            tdTaxaLegal.textContent = formatarPercentualAtualizacao(item.percentualTaxaLegal);
        } else {
            tdTaxaLegal.textContent = '-';
        }
        tr.appendChild(tdTaxaLegal);

        // 3. % Juros até a atualização
        var tdJurosTotal = document.createElement('td');
        tdJurosTotal.className = 'p-2 text-right font-mono';
        tdJurosTotal.textContent = formatarPercentualAtualizacao(item.percentualJurosTotal);
        tr.appendChild(tdJurosTotal);

        // 4. Juros de Mora (R$)
        var tdJurosValor = document.createElement('td');
        tdJurosValor.className = 'p-2 text-right font-mono font-semibold';
        if (item.valorJuros !== undefined && item.valorJuros !== null) {
            tdJurosValor.textContent = formatarMoedaAtualizacao(item.valorJuros);
            if (item.valorJuros < 0) tdJurosValor.style.color = '#dc2626';
            else if (item.valorJuros > 0) tdJurosValor.style.color = '#16a34a';
            else tdJurosValor.style.color = 'inherit';
        } else {
            tdJurosValor.textContent = 'R$ 0,00';
        }
        tr.appendChild(tdJurosValor);

        tbody.appendChild(tr);
    });

    if (totalOriginalEl) totalOriginalEl.textContent = formatarMoedaAtualizacao(totalOrig);
    if (totalCorrigidoEl) totalCorrigidoEl.textContent = formatarMoedaAtualizacao(totalCorr);

    container.classList.remove('hidden');
    if (resumo) {
        if (totalCorr !== 0 || totalOrig !== 0) {
            resumo.classList.remove('hidden');
        } else {
            resumo.classList.add('hidden');
        }
    }

    if (status) {
        status.textContent = '✅ ' + dados.length + ' diferença(s) importada(s) da Guia 4.';
        status.className = 'text-sm text-green-700';
    }
    atualizarBotoesAtualizacao();
}

function importarDiferencasGuia4ParaAtualizacao() {
    var status = document.getElementById('statusDiferencas');

    var rows = document.querySelectorAll('#corpoDiferencas tr');
    if (rows.length === 0 || (rows.length === 1 && rows[0].textContent.indexOf('Nenhuma diferença') !== -1)) {
        limparDiferencasAtualizacao('⚠️ Nenhuma diferença encontrada. Calcule a Guia 4 antes de importar.');
        return;
    }

    var dados = coletarDiferencasParaAtualizacao();

    if (!dados || dados.length === 0) {
        limparDiferencasAtualizacao('⚠️ Nenhuma diferença com valor válido encontrada.');
        return;
    }

    window.diferencasAtualizacaoAtual = dados;
    var dadosTabela = dados.map(function(item) {
        return {
            competencia: item.competencia,
            diferenca: item.diferenca,
            criterio: null,
            coeficiente: null,
            valorCorrigido: null
        };
    });
    renderizarTabelaCorrigida(dadosTabela);
    if (status) {
        status.textContent = '✅ ' + dados.length + ' diferença(s) importada(s) da Guia 4.';
        status.className = 'text-sm text-green-700';
    }
    atualizarBotoesAtualizacao();
}

function atualizarBotoesAtualizacao() {
    var btnCalc = document.getElementById('btnCalcularAtualizacao');
    if (btnCalc) {
        var temDiferencas = window.diferencasAtualizacaoAtual && window.diferencasAtualizacaoAtual.length > 0;
        var temParametros = !!window.parametrosCorrecaoAtual;
        btnCalc.disabled = !(temDiferencas && temParametros);
    }
}

// =====================================================================
// SINCRONIZAÇÃO DAS DATAS DA GUIA 1 PARA GUIA 5
// =====================================================================

function sincronizarParametrosAtualizacao() {
    var dataAtualizacao1 = document.getElementById('dataAtualizacao');
    var dataAtualizacao2 = document.getElementById('dataAtualizacao2');
    var inicioJuros1 = document.getElementById('inicioJuros');
    var inicioJuros2 = document.getElementById('inicioJuros2');

    if (dataAtualizacao1 && dataAtualizacao2 && !dataAtualizacao2.value) {
        dataAtualizacao2.value = dataAtualizacao1.value;
    }
    if (inicioJuros1 && inicioJuros2 && !inicioJuros2.value) {
        inicioJuros2.value = inicioJuros1.value;
    }
}

// =====================================================================
// MOTOR DE ATUALIZAÇÃO MONETÁRIA – GUIA 5 (Fase 1.8E)
// =====================================================================

function guia5CompetenciaParaISO(competencia) {
    if (!competencia) return null;

    if (competencia.indexOf('13º') === 0) {
        var partes13 = competencia.split('/');
        if (partes13.length !== 2) return null;
        var ano13 = parseInt(partes13[1], 10);
        if (isNaN(ano13)) return null;
        return ano13 + '-12';
    }

    var partes = competencia.split('/');
    if (partes.length !== 2) return null;

    var mes = parseInt(partes[0], 10);
    var ano = parseInt(partes[1], 10);

    if (isNaN(mes) || isNaN(ano) || mes < 1 || mes > 12) return null;

    return ano + '-' + String(mes).padStart(2, '0');
}

function guia5ISOParaNumero(iso) {
    if (!iso) return NaN;
    var partes = iso.split('-');
    if (partes.length !== 2) return NaN;

    var ano = parseInt(partes[0], 10);
    var mes = parseInt(partes[1], 10);

    if (isNaN(ano) || isNaN(mes)) return NaN;

    return ano * 100 + mes;
}

function guia5ProximaCompetenciaISO(iso) {
    var partes = iso.split('-');
    var ano = parseInt(partes[0], 10);
    var mes = parseInt(partes[1], 10);

    if (mes === 12) {
        ano++;
        mes = 1;
    } else {
        mes++;
    }

    return ano + '-' + String(mes).padStart(2, '0');
}

function guia5ISOParaBR(iso) {
    if (!iso) return '';
    var partes = iso.split('-');
    return partes[1] + '/' + partes[0];
}

function guia5ObterPeriodoDoEncadeamento(parametros, competenciaISO) {
    if (!parametros || !parametros.periodos || parametros.periodos.length === 0) {
        return null;
    }

    var compNum = guia5ISOParaNumero(competenciaISO);

    for (var i = 0; i < parametros.periodos.length; i++) {
        var p = parametros.periodos[i];

        var inicioISO = guia5CompetenciaParaISO(p.inicio);
        var fimISO = p.fim ? guia5CompetenciaParaISO(p.fim) : null;

        if (!inicioISO) continue;

        var inicioNum = guia5ISOParaNumero(inicioISO);
        var fimNum = fimISO ? guia5ISOParaNumero(fimISO) : Number.MAX_SAFE_INTEGER;

        if (compNum >= inicioNum && compNum <= fimNum) {
            return p;
        }
    }

    return null;
}

function guia5ObterFatorMensal(indexador, competenciaISO) {
    if (indexador === 'SEM_CORRECAO') {
        return 1.0000;
    }

    if (!window.BASE_INDEXADORES_ATUALIZACAO) {
        throw new Error('Base de indexadores de atualização não carregada.');
    }

    var base = window.BASE_INDEXADORES_ATUALIZACAO[indexador];

    if (!base) {
        throw new Error('Índice "' + indexador + '" não existe na base de atualização.');
    }

    if (base[competenciaISO] === undefined || base[competenciaISO] === null) {
        throw new Error(
            'Não há índice cadastrado para "' + indexador + '" na competência ' +
            guia5ISOParaBR(competenciaISO) + '.'
        );
    }

    return base[competenciaISO];
}

function guia5DeveUsarManualMC2026(parametros) {
    return !!(
        parametros &&
        parametros.usarCoeficienteManualMC2026 === true
    );
}

function guia5CalcularCoeficienteMensal(competenciaISO, atualizacaoISO, parametros) {
    var compNum = guia5ISOParaNumero(competenciaISO);
    var atualNum = guia5ISOParaNumero(atualizacaoISO);

    if (isNaN(compNum) || isNaN(atualNum)) {
        throw new Error('Competência ou data de atualização inválida.');
    }

    if (compNum >= atualNum) {
        return {
            coeficiente: 1.0000,
            criterio: 'Sem atualização até a data informada'
        };
    }

    if (
        guia5DeveUsarManualMC2026(parametros) &&
        window.BASE_INDICE_PREVID_MC2026 &&
        window.calcularCoeficientePrevidMC2026 &&
        window.BASE_INDICE_PREVID_MC2026[competenciaISO] !== undefined &&
        window.BASE_INDICE_PREVID_MC2026[atualizacaoISO] !== undefined
    ) {
        return {
            coeficiente: window.calcularCoeficientePrevidMC2026(competenciaISO, atualizacaoISO),
            criterio: 'Manual MC2026 acumulado'
        };
    }

    var acumulado = 1.0000;
    var cursor = competenciaISO;
    var indicesUsados = [];

    while (guia5ISOParaNumero(cursor) < atualNum) {
        var periodo = guia5ObterPeriodoDoEncadeamento(parametros, cursor);

        if (!periodo || !periodo.indice) {
            throw new Error(
                'Não há período de correção definido para a competência ' +
                guia5ISOParaBR(cursor) + '.'
            );
        }

        var fator = guia5ObterFatorMensal(periodo.indice, cursor);
        acumulado = acumulado * fator;

        if (indicesUsados.indexOf(periodo.indice) === -1) {
            indicesUsados.push(periodo.indice);
        }

        cursor = guia5ProximaCompetenciaISO(cursor);
    }

    return {
        coeficiente: acumulado,
        criterio: indicesUsados.join(' / ')
    };
}

// =====================================================================
// FASE 1.8F-B1 – MOTOR INTERNO DE JUROS DETERMINÍSTICOS
// =====================================================================

function guia5ObterTaxaJurosDeterministica(indice) {
    switch (indice) {
        case 'SEM_JUROS':
            return 0;
        case 'JUROS_05_AM':
            return 0.5;
        case 'JUROS_1_AM':
            return 1;
        case 'JUROS_2_AA_EC136':
            return 2 / 12; // 0.1666666666666667
        default:
            throw new Error('Índice de juros ainda não implementado nesta fase: ' + indice);
    }
}

function guia5CalcularJurosDeterministicos(item, inicioJurosISO, atualizacaoISO, parametrosJuros) {
    var competenciaISO = item.competenciaISO;

    var inicioNum = Math.max(
        guia5ISOParaNumero(competenciaISO),
        guia5ISOParaNumero(inicioJurosISO)
    );
    var inicioEfetivoISO = String(Math.floor(inicioNum / 100)) + '-' + String(inicioNum % 100).padStart(2, '0');

    var cursor = guia5ProximaCompetenciaISO(inicioEfetivoISO);
    var fimNum = guia5ISOParaNumero(atualizacaoISO);

    var criteriosJuros = [];
    var detalhamentoJuros = [];
    var totalTaxa = 0;
    var meses = 0;

    while (guia5ISOParaNumero(cursor) <= fimNum) {
        var periodo = guia5ObterPeriodoDoEncadeamento(parametrosJuros, cursor);
        if (!periodo) {
            throw new Error('Não há período de juros definido para a competência ' + guia5ISOParaBR(cursor) + '.');
        }

        var taxa = guia5ObterTaxaJurosDeterministica(periodo.indice);
        totalTaxa += taxa;
        meses++;

        if (criteriosJuros.indexOf(periodo.indice) === -1) {
            criteriosJuros.push(periodo.indice);
        }

        detalhamentoJuros.push({
            competenciaISO: cursor,
            indice: periodo.indice,
            taxaPercentual: taxa
        });

        cursor = guia5ProximaCompetenciaISO(cursor);
    }

    var valorJuros = item.valorCorrigido * totalTaxa / 100;

    return {
        inicioJurosEfetivoISO: inicioEfetivoISO,
        fimJurosISO: atualizacaoISO,
        criteriosJuros: criteriosJuros,
        quantidadeMesesJuros: meses,
        percentualJurosAntesSelic: totalTaxa,
        percentualTaxaLegal: 0,
        percentualJurosTotal: totalTaxa,
        valorJuros: valorJuros,
        detalhamentoJuros: detalhamentoJuros
    };
}

// =====================================================================
// FUNÇÃO PRINCIPAL DE CÁLCULO DA ATUALIZAÇÃO (MODIFICADA)
// =====================================================================

function calcularAtualizacaoGuia5() {
    var status = document.getElementById('statusAtualizacao');
    var container = document.getElementById('containerTabelaDiferencas');
    var tbody = document.getElementById('corpoDiferencasAtualizacao');
    var totalOriginalEl = document.getElementById('totalOriginalAtualizacao');
    var totalCorrigidoEl = document.getElementById('totalCorrigidoAtualizacao');
    var totalJurosEl = document.getElementById('totalJurosAtualizacao');
    var resumo = document.getElementById('resumoAtualizacao');

    if (status) {
        status.textContent = 'Calculando atualização...';
        status.className = 'text-sm text-slate-500';
    }

    if (!window.diferencasAtualizacaoAtual || window.diferencasAtualizacaoAtual.length === 0) {
        if (status) {
            status.textContent = '⚠️ Importe as diferenças da Guia 4 antes de calcular.';
            status.className = 'text-sm text-amber-700';
        }
        return;
    }

    if (!window.parametrosCorrecaoAtual) {
        if (status) {
            status.textContent = '⚠️ Carregue um JSON de correção monetária antes de calcular.';
            status.className = 'text-sm text-amber-700';
        }
        return;
    }

    var dataAtualizacaoInput = document.getElementById('dataAtualizacao2');
    var dataAtualizacaoBR = dataAtualizacaoInput ? dataAtualizacaoInput.value.trim() : '';
    var atualizacaoISO = guia5CompetenciaParaISO(dataAtualizacaoBR);
    if (!atualizacaoISO) {
        if (status) {
            status.textContent = '⚠️ Informe uma data de atualização válida no formato MM/AAAA.';
            status.className = 'text-sm text-amber-700';
        }
        return;
    }
    var atualizacaoNum = guia5ISOParaNumero(atualizacaoISO);

    // =============================================================
    // Filtro temporal: excluir parcelas posteriores à data da conta
    // =============================================================
    var diferencasFiltradas = [];
    var excluidas = 0;
    for (var i = 0; i < window.diferencasAtualizacaoAtual.length; i++) {
        var item = window.diferencasAtualizacaoAtual[i];
        var competenciaISO = guia5CompetenciaParaISO(item.competencia);
        if (!competenciaISO) {
            window.resultadosAtualizacao = null;
            if (resumo) resumo.classList.add('hidden');
            if (container) container.classList.add('hidden');
            if (totalOriginalEl) totalOriginalEl.textContent = 'R$ 0,00';
            if (totalCorrigidoEl) totalCorrigidoEl.textContent = 'R$ 0,00';
            if (totalJurosEl) totalJurosEl.textContent = 'R$ 0,00';
            if (status) {
                status.textContent = '❌ Erro na atualização: Competência inválida: ' + item.competencia;
                status.className = 'text-sm text-red-700';
            }
            return;
        }
        if (guia5ISOParaNumero(competenciaISO) <= atualizacaoNum) {
            diferencasFiltradas.push(item);
        } else {
            excluidas++;
        }
    }

    if (diferencasFiltradas.length === 0) {
        window.resultadosAtualizacao = null;
        if (resumo) resumo.classList.add('hidden');
        if (container) container.classList.add('hidden');
        if (totalOriginalEl) totalOriginalEl.textContent = 'R$ 0,00';
        if (totalCorrigidoEl) totalCorrigidoEl.textContent = 'R$ 0,00';
        if (totalJurosEl) totalJurosEl.textContent = 'R$ 0,00';
        if (status) {
            status.textContent = '❌ Nenhuma parcela possui competência igual ou anterior à Data de Atualização.';
            status.className = 'text-sm text-red-700';
        }
        return;
    }

    var inicioJurosBR = '';
    var inicioJurosISO = null;
    if (window.parametrosJurosAtual) {
        var inicioJurosInput = document.getElementById('inicioJuros2');
        inicioJurosBR = inicioJurosInput ? inicioJurosInput.value.trim() : '';
        inicioJurosISO = guia5CompetenciaParaISO(inicioJurosBR);
        if (!inicioJurosISO) {
            if (status) {
                status.textContent = '⚠️ Informe um Início dos Juros válido no formato MM/AAAA.';
                status.className = 'text-sm text-amber-700';
            }
            return;
        }
    }

    try {
        var totalOriginal = 0;
        var totalCorrigido = 0;
        var totalJuros = 0;
        var resultados = [];

        for (var idx = 0; idx < diferencasFiltradas.length; idx++) {
            var item = diferencasFiltradas[idx];
            var competenciaISO = guia5CompetenciaParaISO(item.competencia);
            if (!competenciaISO) {
                throw new Error('Competência inválida: ' + item.competencia);
            }

            var resultadoCoef = guia5CalcularCoeficienteMensal(
                competenciaISO,
                atualizacaoISO,
                window.parametrosCorrecaoAtual
            );

            var diferencaOriginal = item.diferenca || 0;
            var valorCorrigido = diferencaOriginal * resultadoCoef.coeficiente;

            totalOriginal += diferencaOriginal;
            totalCorrigido += valorCorrigido;

            var obj = {
                competencia: item.competencia,
                competenciaISO: competenciaISO,
                diferenca: diferencaOriginal,
                criterio: resultadoCoef.criterio,
                coeficiente: resultadoCoef.coeficiente,
                valorCorrigido: valorCorrigido
            };

            if (window.parametrosJurosAtual) {
                var juros = guia5CalcularJurosDeterministicos(obj, inicioJurosISO, atualizacaoISO, window.parametrosJurosAtual);
                obj.inicioJurosEfetivoISO = juros.inicioJurosEfetivoISO;
                obj.inicioJurosEfetivo = guia5ISOParaBR(juros.inicioJurosEfetivoISO);
                obj.fimJurosISO = juros.fimJurosISO;
                obj.criteriosJuros = juros.criteriosJuros;
                obj.quantidadeMesesJuros = juros.quantidadeMesesJuros;
                obj.percentualJurosAntesSelic = juros.percentualJurosAntesSelic;
                obj.percentualTaxaLegal = juros.percentualTaxaLegal;
                obj.percentualJurosTotal = juros.percentualJurosTotal;
                obj.valorJuros = juros.valorJuros;
                obj.detalhamentoJuros = juros.detalhamentoJuros;

                totalJuros += obj.valorJuros;
            } else {
                obj.inicioJurosEfetivoISO = null;
                obj.inicioJurosEfetivo = null;
                obj.fimJurosISO = null;
                obj.criteriosJuros = [];
                obj.quantidadeMesesJuros = 0;
                obj.percentualJurosAntesSelic = 0;
                obj.percentualTaxaLegal = 0;
                obj.percentualJurosTotal = 0;
                obj.valorJuros = 0;
                obj.detalhamentoJuros = [];
            }

            resultados.push(obj);
        }

        window.resultadosAtualizacao = {
            dataAtualizacao: dataAtualizacaoBR,
            dataAtualizacaoISO: atualizacaoISO,
            parametrosCorrecao: window.parametrosCorrecaoAtual,
            parametrosJuros: window.parametrosJurosAtual || null,
            totalOriginal: totalOriginal,
            totalCorrigido: totalCorrigido,
            totalJuros: totalJuros,
            itens: resultados
        };

        renderizarTabelaCorrigida(resultados);

        if (totalOriginalEl) totalOriginalEl.textContent = formatarMoedaAtualizacao(totalOriginal);
        if (totalCorrigidoEl) totalCorrigidoEl.textContent = formatarMoedaAtualizacao(totalCorrigido);
        if (totalJurosEl) totalJurosEl.textContent = formatarMoedaAtualizacao(totalJuros);
        if (resumo) resumo.classList.remove('hidden');

        var msg = '✅ Atualização calculada com sucesso.';
        if (excluidas > 0) {
            msg += ' ' + excluidas + ' parcela(s) posterior(es) à data da conta foram desconsideradas.';
        }
        if (status) {
            status.textContent = msg;
            status.className = 'text-sm text-green-700';
        }

    } catch (erro) {
        window.resultadosAtualizacao = null;
        if (status) {
            status.textContent = '❌ Erro na atualização: ' + erro.message;
            status.className = 'text-sm text-red-700';
        }
        if (resumo) resumo.classList.add('hidden');
    }
}

window.calcularAtualizacaoGuia5 = calcularAtualizacaoGuia5;

// =====================================================================
// INICIALIZAÇÃO – DOMContentLoaded
// =====================================================================
document.addEventListener('DOMContentLoaded', function() {
    criarModalAdmin();

    document.addEventListener('keydown', function(e) {
        var tag = e.target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

        if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'e') {
            e.preventDefault();
            var modal = document.getElementById('adminModal');
            if (modal) {
                modal.classList.remove('hidden');
                var msgDiv = document.getElementById('adminMensagens');
                if (msgDiv) {
                    msgDiv.classList.add('hidden');
                    msgDiv.textContent = '';
                }
                if (!window.INDEXADORES_ATUALIZACAO) {
                    adminExibirMensagem(
                        'Aviso: base de indexadores não carregada. Verifique data/indexadores.js.',
                        'warning'
                    );
                }
            }
        }
    });

    var btnCorrecao = document.getElementById('btnCarregarCorrecao');
    var fileCorrecao = document.getElementById('fileInputCorrecao');
    if (btnCorrecao && fileCorrecao) {
        btnCorrecao.addEventListener('click', function() {
            fileCorrecao.click();
        });
        fileCorrecao.addEventListener('change', function(e) {
            var file = e.target.files[0];
            if (file) {
                adminCarregarParametroGuia5(file, 'correcao_monetaria');
            }
            this.value = '';
        });
    }

    var btnJurosSelic = document.getElementById('btnCarregarJurosSelic');
    var fileJurosSelic = document.getElementById('fileInputJurosSelic');
    if (btnJurosSelic && fileJurosSelic) {
        btnJurosSelic.addEventListener('click', function() {
            fileJurosSelic.click();
        });
        fileJurosSelic.addEventListener('change', function(e) {
            var file = e.target.files[0];
            if (file) {
                adminCarregarParametroGuia5(file, 'juros_selic');
            }
            this.value = '';
        });
    }

    var btnImportarDiferencas = document.getElementById('btnImportarDiferencas');
    if (btnImportarDiferencas) {
        btnImportarDiferencas.addEventListener('click', function() {
            importarDiferencasGuia4ParaAtualizacao();
        });
    }

    var btnCalcular = document.getElementById('btnCalcularAtualizacao');
    if (btnCalcular) {
        btnCalcular.addEventListener('click', function() {
            calcularAtualizacaoGuia5();
        });
    }

    function configurarListenerReset(containerId, eventos) {
        var container = document.getElementById(containerId);
        if (!container) return;
        eventos.forEach(function(evt) {
            container.addEventListener(evt, function(e) {
                if (containerId === 'guia-atualizacao') return;
                if (window.diferencasAtualizacaoAtual) {
                    limparDiferencasAtualizacao(
                        '⚠️ Diferenças não importadas após alteração dos dados. Reimporte a Guia 4. Parâmetros de correção e juros mantidos.'
                    );
                }
            }, true);
        });
    }

    configurarListenerReset('guia-entradas', ['input', 'change']);
    configurarListenerReset('guia-beneficios-recebidos', ['input', 'change']);
    configurarListenerReset('guia-diferencas', ['input', 'change']);

    document.querySelectorAll('.nav-guia button').forEach(function(btn) {
        btn.addEventListener('click', function() {
            if (this.dataset.guia === 'atualizacao') {
                sincronizarParametrosAtualizacao();
            }
        });
    });

    var guiaAtiva = document.querySelector('.nav-guia button.ativo');
    if (guiaAtiva && guiaAtiva.dataset.guia === 'atualizacao') {
        sincronizarParametrosAtualizacao();
    }

    window.coletarDiferencasParaAtualizacao = coletarDiferencasParaAtualizacao;
    window.sincronizarParametrosAtualizacao = sincronizarParametrosAtualizacao;
    window.importarDiferencasGuia4ParaAtualizacao = importarDiferencasGuia4ParaAtualizacao;
    window.limparDiferencasAtualizacao = limparDiferencasAtualizacao;
});
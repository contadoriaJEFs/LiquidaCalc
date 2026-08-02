// =====================================================================
// ADMINISTRAÇÃO DE ENCADEAMENTOS – Fase 1.8E (CORREÇÃO MONETÁRIA)
// =====================================================================
// Inclui:
// - Admin de parâmetros (CTRL+SHIFT+E)
// - Carregamento de JSON de correção/juros na Guia 5
// - Importação de diferenças da Guia 4
// - Motor de correção monetária (cálculo e exibição)
// =====================================================================

window.parametrosCorrecaoAtual = null;
window.parametrosJurosAtual = null;
window.parametrosSelicAtual = null;
window.diferencasAtualizacaoAtual = null;
window.resultadosAtualizacao = null;

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

function adminSanitizarNome(nome) {
    if (!nome) return 'ENCADEAMENTO_SEM_NOME';
    var semAcentos = nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    var sanitizado = semAcentos
        .toUpperCase()
        .replace(/\s+/g, '_')
        .replace(/[^A-Z0-9_]/g, '');
    sanitizado = sanitizado.replace(/_+/g, '_');
    sanitizado = sanitizado.replace(/^_|_$/g, '');
    return sanitizado || 'ENCADEAMENTO_SEM_NOME';
}

function adminGerarNomeArquivo(tipo, nome) {
    var nomeSanitizado = adminSanitizarNome(nome);
    var tipoMap = {
        'correcao_monetaria': 'correcao_monetaria',
        'juros_mora': 'juros_mora',
        'selic': 'selic',
        'taxa_legal': 'taxa_legal'
    };
    var prefixo = tipoMap[tipo] || 'parametro';
    return 'parametros_' + prefixo + '_' + nomeSanitizado + '.json';
}

function adminDataAtualFormatada() {
    var agora = new Date();
    var dia = String(agora.getDate()).padStart(2, '0');
    var mes = String(agora.getMonth() + 1).padStart(2, '0');
    var ano = agora.getFullYear();
    return dia + '/' + mes + '/' + ano;
}

// =====================================================================
// FUNÇÕES AUXILIARES PARA VERIFICAÇÃO DE ÍNDICES
// =====================================================================

function adminIndiceExisteNaBase(codigo) {
    if (!window.INDEXADORES_ATUALIZACAO) return false;
    return !!window.INDEXADORES_ATUALIZACAO[codigo];
}

function adminIndiceCompativelComTipo(codigo, tipoParametro) {
    if (!window.INDEXADORES_ATUALIZACAO) return false;
    var item = window.INDEXADORES_ATUALIZACAO[codigo];
    if (!item) return false;
    return item.tipo === tipoParametro;
}

function adminObterIndicesDisponiveisPorTipo(tipoParametro) {
    if (!window.INDEXADORES_ATUALIZACAO) {
        return [];
    }

    var resultados = [];
    var base = window.INDEXADORES_ATUALIZACAO;

    for (var chave in base) {
        if (base.hasOwnProperty(chave)) {
            var item = base[chave];
            if (item.tipo === tipoParametro) {
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
                    <option value="juros_mora">Juros de Mora</option>
                    <option value="selic" disabled>SELIC (futuro)</option>
                    <option value="taxa_legal" disabled>Taxa Legal (futuro)</option>
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

        <div class="mb-4">
            <div class="flex justify-between items-center mb-2">
                <h4 class="text-sm font-bold text-slate-700 uppercase tracking-wide">Períodos</h4>
                <button type="button" id="adminAdicionarLinha" class="px-3 py-1 bg-emerald-600 text-white text-xs rounded hover:bg-emerald-700 transition">+ Adicionar Linha</button>
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
                    <tbody id="adminTabelaPeriodos">
                    </tbody>
                </table>
            </div>
        </div>

        <div class="flex flex-wrap gap-3 mt-4 border-t border-slate-200 pt-4">
            <button type="button" id="adminValidar" class="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 text-sm font-semibold shadow transition">Validar Encadeamento</button>
            <button type="button" id="adminExportar" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-semibold shadow transition">Exportar JSON</button>
            <button type="button" id="adminImportar" class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-semibold shadow transition">Importar JSON</button>
            <button type="button" id="adminFechar" class="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 text-sm font-semibold transition">Fechar</button>
        </div>

        <input type="file" id="adminFileInput" accept=".json" class="hidden">
    `;

    overlay.appendChild(modalContent);
    document.body.appendChild(overlay);

    if (!window.INDEXADORES_ATUALIZACAO) {
        adminExibirMensagem(
            'Aviso: base de indexadores não carregada. Verifique data/indexadores.js.',
            'warning'
        );
    }

    var tbody = document.getElementById('adminTabelaPeriodos');
    if (tbody) adminAdicionarLinhaPeriodo();

    if (!adminEventosVinculados) {
        vincularEventosModal();
        adminEventosVinculados = true;
    }

    adminModalCriado = true;
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

    document.getElementById('adminAdicionarLinha').addEventListener('click', function() {
        adminAdicionarLinhaPeriodo();
    });

    document.getElementById('adminTipoParametro').addEventListener('change', function() {
        adminTipoAtual = this.value;
        adminAtualizarSelectsIndice();
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
// FUNÇÕES DE LINHAS DA TABELA DE PERÍODOS
// =====================================================================

function adminObterIndicesDisponiveis() {
    var selectTipo = document.getElementById('adminTipoParametro');
    var tipo = selectTipo ? selectTipo.value : 'correcao_monetaria';
    return adminObterIndicesDisponiveisPorTipo(tipo);
}

function adminCriarSelectIndice(valorAtual, preservarIncompativel) {
    preservarIncompativel = preservarIncompativel || false;
    var tipoAtual = document.getElementById('adminTipoParametro').value;
    var indices = adminObterIndicesDisponiveisPorTipo(tipoAtual);
    var html = '<select class="admin-select-indice w-full px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">';

    var existeNaBase = adminIndiceExisteNaBase(valorAtual);
    var compativel = adminIndiceCompativelComTipo(valorAtual, tipoAtual);

    if (preservarIncompativel && valorAtual && existeNaBase && !compativel) {
        html += '<option value="' + valorAtual + '" selected>' + valorAtual + ' (incompatível com ' + tipoAtual + ')</option>';
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

function adminAdicionarLinhaPeriodo(indice, inicio, fim, preservarIncompativel) {
    preservarIncompativel = preservarIncompativel || false;
    var tbody = document.getElementById('adminTabelaPeriodos');
    if (!tbody) return;

    var tr = document.createElement('tr');
    tr.className = 'border-b border-slate-200';

    var selectIndice = adminCriarSelectIndice(indice || '', preservarIncompativel);

    tr.innerHTML = `
        <td class="p-2">${selectIndice}</td>
        <td class="p-2"><input type="text" class="admin-data-inicio w-full px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="MM/AAAA" value="${inicio || ''}"></td>
        <td class="p-2"><input type="text" class="admin-data-fim w-full px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="MM/AAAA ou vazio" value="${fim || ''}"></td>
        <td class="p-2 text-center"><button type="button" class="admin-remover-linha text-red-600 hover:text-red-800 text-xs font-bold">✕</button></td>
    `;

    tbody.appendChild(tr);

    tr.querySelector('.admin-remover-linha').addEventListener('click', function() {
        if (tbody.children.length > 1) {
            tr.remove();
        } else {
            adminExibirMensagem('É necessário pelo menos uma linha.', 'warning');
        }
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

function adminAtualizarSelectsIndice() {
    var tipoAtual = document.getElementById('adminTipoParametro').value;
    var indices = adminObterIndicesDisponiveisPorTipo(tipoAtual);
    var selects = document.querySelectorAll('#adminTabelaPeriodos .admin-select-indice');

    selects.forEach(function(sel) {
        var valorAtual = sel.value;
        var existeNaBase = adminIndiceExisteNaBase(valorAtual);
        var compativel = adminIndiceCompativelComTipo(valorAtual, tipoAtual);

        if (existeNaBase && !compativel) {
            var options = '';
            if (indices.length === 0) {
                options += '<option value="">-- Nenhum índice disponível --</option>';
            } else {
                indices.forEach(function(item) {
                    var selected = (item.codigo === indices[0].codigo) ? 'selected' : '';
                    var label = item.nome + ' (' + item.codigo + ')';
                    options += '<option value="' + item.codigo + '" ' + selected + '>' + label + '</option>';
                });
            }
            sel.innerHTML = options;
            return;
        }

        var existeNaLista = indices.some(function(item) {
            return item.codigo === valorAtual;
        });

        var options = '';

        if (valorAtual && !existeNaBase) {
            options += '<option value="' + valorAtual + '" selected>' + valorAtual + ' (não cadastrado na base)</option>';
        }

        if (indices.length === 0) {
            options += '<option value="">-- Nenhum índice disponível --</option>';
        } else {
            indices.forEach(function(item) {
                var selected = (item.codigo === valorAtual && existeNaBase) ? 'selected' : '';
                var label = item.nome + ' (' + item.codigo + ')';
                options += '<option value="' + item.codigo + '" ' + selected + '>' + label + '</option>';
            });
        }

        sel.innerHTML = options;

        if (!sel.value && indices.length > 0) {
            sel.value = indices[0].codigo;
        }
    });
}

// =====================================================================
// COLETA E VALIDAÇÃO DOS DADOS DO ADMIN
// =====================================================================

function adminColetarDados() {
    var tipo = document.getElementById('adminTipoParametro').value;
    var nome = document.getElementById('adminNome').value.trim();
    var descricao = document.getElementById('adminDescricao').value.trim();

    var linhas = document.querySelectorAll('#adminTabelaPeriodos tr');
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

    return { tipo: tipo, nome: nome, descricao: descricao, periodos: periodos };
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

    if (dados.periodos.length === 0) {
        erros.push('Adicione pelo menos um período.');
        return { erros: erros, avisos: avisos };
    }

    var regexMMAAAA = /^\d{2}\/\d{4}$/;
    var periodosAbertos = 0;
    var periodoAnteriorFimNum = null;

    var periodosOrdenados = dados.periodos.slice().sort(function(a, b) {
        return adminCompetenciaParaNumero(a.inicio) - adminCompetenciaParaNumero(b.inicio);
    });

    var baseDisponivel = !!window.INDEXADORES_ATUALIZACAO;
    var base = window.INDEXADORES_ATUALIZACAO || {};

    for (var i = 0; i < periodosOrdenados.length; i++) {
        var p = periodosOrdenados[i];

        if (!p.indice) {
            erros.push('Linha ' + (i+1) + ': Índice não selecionado.');
            continue;
        }

        if (baseDisponivel) {
            if (!base[p.indice]) {
                avisos.push('Linha ' + (i+1) + ': Índice "' + p.indice + '" não existe na base atual de indexadores. Será mantido no JSON, mas pode não ser reconhecido futuramente.');
            } else {
                var tipoIndexador = base[p.indice].tipo;
                if (tipoIndexador !== dados.tipo) {
                    avisos.push('Linha ' + (i+1) + ': Índice "' + p.indice + '" pertence ao tipo "' + tipoIndexador + '", mas o encadeamento é do tipo "' + dados.tipo + '".');
                }
            }
        }

        if (!p.inicio || !regexMMAAAA.test(p.inicio)) {
            erros.push('Linha ' + (i+1) + ': Data inicial "' + p.inicio + '" inválida. Use MM/AAAA.');
            continue;
        }
        var numInicio = adminCompetenciaParaNumero(p.inicio);
        if (isNaN(numInicio)) {
            erros.push('Linha ' + (i+1) + ': Data inicial "' + p.inicio + '" inválida.');
            continue;
        }

        var numFim = null;
        if (p.fim) {
            if (!regexMMAAAA.test(p.fim)) {
                erros.push('Linha ' + (i+1) + ': Data final "' + p.fim + '" inválida. Use MM/AAAA ou deixe vazio.');
                continue;
            }
            numFim = adminCompetenciaParaNumero(p.fim);
            if (isNaN(numFim)) {
                erros.push('Linha ' + (i+1) + ': Data final "' + p.fim + '" inválida.');
                continue;
            }
            if (numFim < numInicio) {
                erros.push('Linha ' + (i+1) + ': Data final anterior à data inicial.');
                continue;
            }
        } else {
            periodosAbertos++;
            if (periodosAbertos > 1) {
                erros.push('Linha ' + (i+1) + ': Apenas um período pode estar aberto (sem data final).');
                continue;
            }
            numFim = Number.MAX_SAFE_INTEGER;
        }

        if (periodoAnteriorFimNum !== null && numInicio <= periodoAnteriorFimNum) {
            erros.push('Linha ' + (i+1) + ': Período se sobrepõe ao anterior (' + periodosOrdenados[i-1].inicio + ' a ' + (periodosOrdenados[i-1].fim || 'aberto') + ').');
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
    var tipo = dados.tipo;
    var nome = dados.nome;
    var descricao = dados.descricao;
    var periodos = dados.periodos;

    var periodosOrdenados = periodos.slice().sort(function(a, b) {
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
        tipoParametro: tipo,
        versao: '1.0',
        nome: nome,
        descricao: descricao || '',
        dataCriacao: adminDataAtualFormatada(),
        indicesUtilizados: indices,
        periodos: periodosOrdenados.map(function(p) {
            return {
                indice: p.indice,
                inicio: p.inicio,
                fim: p.fim || ''
            };
        })
    };

    var jsonStr = JSON.stringify(jsonObj, null, 2);
    var blob = new Blob([jsonStr], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');

    var nomeArquivo = adminGerarNomeArquivo(tipo, nome);
    link.href = url;
    link.download = nomeArquivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    adminExibirMensagem('✅ JSON exportado com sucesso: ' + nomeArquivo, 'success');
}

// =====================================================================
// IMPORTAÇÃO DE JSON NO MODAL ADMIN
// =====================================================================

function adminImportarJSON(json) {
    if (json.tipoArquivo !== 'parametros_atualizacao') {
        adminExibirMensagem('❌ O arquivo não é um JSON de parâmetros de atualização.', 'error');
        return;
    }

    if (!json.tipoParametro || !json.nome || !json.periodos || json.periodos.length === 0) {
        adminExibirMensagem('❌ JSON inválido: faltam campos obrigatórios.', 'error');
        return;
    }

    var baseDisponivel = !!window.INDEXADORES_ATUALIZACAO;
    var indicesNaoEncontrados = [];
    var indicesTipoIncompativel = [];

    if (baseDisponivel) {
        var base = window.INDEXADORES_ATUALIZACAO;
        json.periodos.forEach(function(p) {
            if (p.indice) {
                if (!base[p.indice]) {
                    if (indicesNaoEncontrados.indexOf(p.indice) === -1) {
                        indicesNaoEncontrados.push(p.indice);
                    }
                } else if (base[p.indice].tipo !== json.tipoParametro) {
                    if (indicesTipoIncompativel.indexOf(p.indice) === -1) {
                        indicesTipoIncompativel.push(p.indice);
                    }
                }
            }
        });
    }

    var selectTipo = document.getElementById('adminTipoParametro');
    if (selectTipo) {
        var option = selectTipo.querySelector('option[value="' + json.tipoParametro + '"]');
        if (option) {
            selectTipo.value = json.tipoParametro;
            adminTipoAtual = json.tipoParametro;
        } else {
            adminExibirMensagem('⚠️ Tipo "' + json.tipoParametro + '" não suportado. Será usado "correcao_monetaria".', 'warning');
            selectTipo.value = 'correcao_monetaria';
            adminTipoAtual = 'correcao_monetaria';
        }
    }

    document.getElementById('adminNome').value = json.nome || '';
    document.getElementById('adminDescricao').value = json.descricao || '';

    var tbody = document.getElementById('adminTabelaPeriodos');
    tbody.innerHTML = '';

    json.periodos.forEach(function(p) {
        adminAdicionarLinhaPeriodo(p.indice, p.inicio, p.fim || '', true);
    });

    var msg = '✅ JSON importado com sucesso!';

    if (indicesNaoEncontrados.length > 0) {
        msg += '\n⚠️ Aviso: os seguintes índices não foram encontrados na base atual: ' +
            indicesNaoEncontrados.join(', ') +
            '. Eles foram preservados, mas podem não ser reconhecidos.';
    }

    if (indicesTipoIncompativel.length > 0) {
        msg += '\n⚠️ Aviso: os seguintes índices pertencem a outro tipo de parâmetro: ' +
            indicesTipoIncompativel.join(', ') +
            '. Eles foram preservados como incompatíveis com o tipo "' +
            json.tipoParametro +
            '".';
    }

    adminExibirMensagem(
        msg,
        (indicesNaoEncontrados.length > 0 || indicesTipoIncompativel.length > 0) ? 'warning' : 'success'
    );
}

// =====================================================================
// FUNÇÃO PARA CARREGAR PARÂMETROS NA GUIA 5
// =====================================================================

function adminCarregarParametroGuia5(file, tipoEsperado) {
    var reader = new FileReader();
    reader.onload = function(e) {
        try {
            var json = JSON.parse(e.target.result);
            if (json.tipoArquivo !== 'parametros_atualizacao') {
                adminExibirMensagemGuia5('O arquivo não é um JSON de parâmetros de atualização.', 'error', tipoEsperado);
                return;
            }
            if (json.tipoParametro !== tipoEsperado) {
                var nomeEsperado = tipoEsperado === 'correcao_monetaria' ? 'correção monetária' : 'juros de mora';
                adminExibirMensagemGuia5('Este arquivo não é de ' + nomeEsperado + '.', 'error', tipoEsperado);
                return;
            }
            if (!json.nome || !json.periodos || json.periodos.length === 0) {
                adminExibirMensagemGuia5('JSON inválido: faltam campos obrigatórios.', 'error', tipoEsperado);
                return;
            }

            var baseDisponivel = !!window.INDEXADORES_ATUALIZACAO;
            var indicesNaoEncontrados = [];
            var indicesTipoIncompativel = [];
            if (baseDisponivel) {
                var base = window.INDEXADORES_ATUALIZACAO;
                json.periodos.forEach(function(p) {
                    if (p.indice) {
                        if (!base[p.indice]) {
                            if (indicesNaoEncontrados.indexOf(p.indice) === -1) {
                                indicesNaoEncontrados.push(p.indice);
                            }
                        } else if (base[p.indice].tipo !== json.tipoParametro) {
                            if (indicesTipoIncompativel.indexOf(p.indice) === -1) {
                                indicesTipoIncompativel.push(p.indice);
                            }
                        }
                    }
                });
            }

            if (tipoEsperado === 'correcao_monetaria') {
                window.parametrosCorrecaoAtual = json;
                var msg = '✅ Parâmetros de correção carregados com sucesso!\n' +
                          'Nome: ' + json.nome + '\n' +
                          'Descrição: ' + (json.descricao || 'N/A') + '\n' +
                          'Índices: ' + (json.indicesUtilizados ? json.indicesUtilizados.join(', ') : 'N/A') + '\n' +
                          'Períodos: ' + json.periodos.length;
                if (indicesNaoEncontrados.length > 0) {
                    msg += '\n⚠️ Atenção: índices não encontrados na base: ' + indicesNaoEncontrados.join(', ');
                }
                if (indicesTipoIncompativel.length > 0) {
                    msg += '\n⚠️ Atenção: índices incompatíveis com o tipo: ' + indicesTipoIncompativel.join(', ');
                }
                adminExibirMensagemGuia5(msg, 'success', tipoEsperado);
                // Habilita botão de cálculo se houver diferenças importadas
                atualizarBotoesAtualizacao();
            } else if (tipoEsperado === 'juros_mora') {
                window.parametrosJurosAtual = json;
                var msg = '✅ Parâmetros de juros carregados com sucesso!\n' +
                          'Nome: ' + json.nome + '\n' +
                          'Descrição: ' + (json.descricao || 'N/A') + '\n' +
                          'Índices: ' + (json.indicesUtilizados ? json.indicesUtilizados.join(', ') : 'N/A') + '\n' +
                          'Períodos: ' + json.periodos.length;
                if (indicesNaoEncontrados.length > 0) {
                    msg += '\n⚠️ Atenção: índices não encontrados na base: ' + indicesNaoEncontrados.join(', ');
                }
                if (indicesTipoIncompativel.length > 0) {
                    msg += '\n⚠️ Atenção: índices incompatíveis com o tipo: ' + indicesTipoIncompativel.join(', ');
                }
                adminExibirMensagemGuia5(msg, 'success', tipoEsperado);
            }
        } catch (err) {
            adminExibirMensagemGuia5('Erro ao ler o arquivo: ' + err.message, 'error', tipoEsperado);
        }
    };
    reader.readAsText(file);
}

function adminExibirMensagemGuia5(texto, tipo, tipoEsperado) {
    var statusId = tipoEsperado === 'correcao_monetaria' ? 'statusCorrecao' : 'statusJuros';
    var div = document.getElementById(statusId);
    if (!div) return;
    div.className = 'text-sm p-2 rounded-md mt-1';
    if (tipo === 'success') {
        div.className += ' bg-green-100 text-green-700';
    } else if (tipo === 'error') {
        div.className += ' bg-red-100 text-red-700';
    } else {
        div.className += ' bg-slate-100 text-slate-600';
    }
    div.textContent = texto;
    div.style.whiteSpace = 'pre-wrap';
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

    // Ordena
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

        // Competência
        var tdComp = document.createElement('td');
        tdComp.className = 'p-2 font-semibold text-slate-800';
        tdComp.textContent = item.competencia;
        tr.appendChild(tdComp);

        // Diferença Original
        var tdOrig = document.createElement('td');
        tdOrig.className = 'p-2 text-right font-mono';
        tdOrig.textContent = formatarMoedaAtualizacao(item.diferenca);
        if (item.diferenca < 0) tdOrig.style.color = '#dc2626';
        else if (item.diferenca > 0) tdOrig.style.color = '#16a34a';
        tr.appendChild(tdOrig);

        // Índice / Critério (se houver resultado da correção)
        var tdCriterio = document.createElement('td');
        tdCriterio.className = 'p-2 text-left text-xs';
        if (item.criterio) {
            tdCriterio.textContent = item.criterio;
        } else {
            tdCriterio.textContent = '-';
        }
        tr.appendChild(tdCriterio);

        // Coeficiente
        var tdCoef = document.createElement('td');
        tdCoef.className = 'p-2 text-right font-mono';
        if (item.coeficiente !== undefined && item.coeficiente !== null) {
            tdCoef.textContent = item.coeficiente.toFixed(10);
        } else {
            tdCoef.textContent = '-';
        }
        tr.appendChild(tdCoef);

        // Valor Corrigido
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

        tbody.appendChild(tr);
    });

    // Atualiza totais
    if (totalOriginalEl) totalOriginalEl.textContent = formatarMoedaAtualizacao(totalOrig);
    if (totalCorrigidoEl) totalCorrigidoEl.textContent = formatarMoedaAtualizacao(totalCorr);

    // Exibe container e resumo
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
    // Mapeia para o formato esperado pela tabela (sem correção)
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

// === AJUSTE 4: função que verifica se deve usar o Manual MC2026 ===
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

    // === AJUSTE 4: uso do Manual apenas com flag explícita ===
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

function calcularAtualizacaoGuia5() {
    var status = document.getElementById('statusAtualizacao');
    var container = document.getElementById('containerTabelaDiferencas');
    var tbody = document.getElementById('corpoDiferencasAtualizacao');
    var totalOriginalEl = document.getElementById('totalOriginalAtualizacao');
    var totalCorrigidoEl = document.getElementById('totalCorrigidoAtualizacao');
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

    try {
        var totalOriginal = 0;
        var totalCorrigido = 0;
        var resultados = [];

        var dadosAtualizados = window.diferencasAtualizacaoAtual.map(function(item) {
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
            resultados.push(obj);
            return obj;
        });

        // Armazena os resultados para uso futuro (juros, relatório, exportação)
        window.resultadosAtualizacao = {
            dataAtualizacao: dataAtualizacaoBR,
            dataAtualizacaoISO: atualizacaoISO,
            parametrosCorrecao: window.parametrosCorrecaoAtual,
            totalOriginal: totalOriginal,
            totalCorrigido: totalCorrigido,
            itens: resultados
        };

        // Renderiza a tabela única com as colunas completas
        renderizarTabelaCorrigida(dadosAtualizados);

        if (totalOriginalEl) totalOriginalEl.textContent = formatarMoedaAtualizacao(totalOriginal);
        if (totalCorrigidoEl) totalCorrigidoEl.textContent = formatarMoedaAtualizacao(totalCorrigido);
        if (resumo) resumo.classList.remove('hidden');

        if (status) {
            status.textContent = '✅ Atualização calculada com sucesso.';
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

// Expõe a função principal globalmente
window.calcularAtualizacaoGuia5 = calcularAtualizacaoGuia5;

// =====================================================================
// INICIALIZAÇÃO – DOMContentLoaded
// =====================================================================
document.addEventListener('DOMContentLoaded', function() {
    criarModalAdmin();

    // Atalho CTRL+SHIFT+E
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
                adminAtualizarSelectsIndice();
            }
        }
    });

    // Botões da Guia 5
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

    var btnJuros = document.getElementById('btnCarregarJuros');
    var fileJuros = document.getElementById('fileInputJuros');
    if (btnJuros && fileJuros) {
        btnJuros.addEventListener('click', function() {
            fileJuros.click();
        });
        fileJuros.addEventListener('change', function(e) {
            var file = e.target.files[0];
            if (file) {
                adminCarregarParametroGuia5(file, 'juros_mora');
            }
            this.value = '';
        });
    }

    // Botão Importar Diferenças
    var btnImportarDiferencas = document.getElementById('btnImportarDiferencas');
    if (btnImportarDiferencas) {
        btnImportarDiferencas.addEventListener('click', function() {
            importarDiferencasGuia4ParaAtualizacao();
        });
    }

    // Botão Calcular Atualização
    var btnCalcular = document.getElementById('btnCalcularAtualizacao');
    if (btnCalcular) {
        btnCalcular.addEventListener('click', function() {
            calcularAtualizacaoGuia5();
        });
    }

    // ============================================================
    // LISTENERS PARA RESET AUTOMÁTICO DAS DIFERENÇAS
    // ============================================================
    function configurarListenerReset(containerId, eventos) {
        var container = document.getElementById(containerId);
        if (!container) return;
        eventos.forEach(function(evt) {
            container.addEventListener(evt, function(e) {
                // Ignora mudanças na própria Guia 5
                if (containerId === 'guia-atualizacao') return;
                // Se houver dados importados, limpa
                if (window.diferencasAtualizacaoAtual) {
                    limparDiferencasAtualizacao(
                        '⚠️ Diferenças não importadas após alteração dos dados. Reimporte a Guia 4. Parâmetros de correção e juros mantidos.'
                    );
                }
            }, true);
        });
    }

    // Guia 1 – Entradas
    configurarListenerReset('guia-entradas', ['input', 'change']);

    // Guia 3 – Benefícios Recebidos
    configurarListenerReset('guia-beneficios-recebidos', ['input', 'change']);

    // Guia 4 – Diferenças (modo de compensação, edições manuais, etc.)
    configurarListenerReset('guia-diferencas', ['input', 'change']);

    // Sincroniza datas ao entrar na Guia 5
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

    // Exposição global
    window.coletarDiferencasParaAtualizacao = coletarDiferencasParaAtualizacao;
    window.sincronizarParametrosAtualizacao = sincronizarParametrosAtualizacao;
    window.importarDiferencasGuia4ParaAtualizacao = importarDiferencasGuia4ParaAtualizacao;
    window.limparDiferencasAtualizacao = limparDiferencasAtualizacao;
});

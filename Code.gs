// ============================================================
// CONTROLE DE PEDIDOS - MATERIAIS / FERRAMENTAS
// GOOGLE SHEETS + GOOGLE APPS SCRIPT
// VERSÃO 4.4
// ============================================================
//
// PRINCIPAIS CORREÇÕES DA VERSÃO 4.4
// ------------------------------------------------------------
// - Consulta otimizada
// - Última linha real baseada na coluna PROTOCOLO
// - Evita carregar linhas vazias causadas por formatação
// - Lista e detalhes separados conceitualmente
// - Tratamento robusto de carregamento no HTML
// - Tratamento de erros no google.script.run
// - Evita tela presa em "Carregando..."
// - Exclusão por protocolo
// - Entrega por protocolo
// - Dashboard preservado
// - Cadastro de itens preservado
// - Cadastro de usuários preservado
// - Lista WhatsApp preservada
// - CORREÇÃO DAS QUEBRAS DE LINHA DO WHATSAPP
// - Controle de WhatsApp por protocolo na coluna P
//
// ============================================================


// ============================================================
// CONFIGURAÇÃO CENTRAL
// ============================================================

const CONFIG = {

  ABA_SOLICITACOES: 'SOLICITACOES',
  ABA_ITENS: 'CADASTRO_ITENS',
  ABA_USUARIOS: 'USUARIOS',
  ABA_CONFIG: 'CONFIG',
  ABA_DASHBOARD: 'DASHBOARD',

  PREFIXO: 'SOL',

  PRIORIDADES: [
    'BAIXA',
    'NORMAL',
    'ALTA',
    'URGENTE'
  ],

  SITUACOES: [
    'PENDENTE',
    'ENTREGUE'
  ],

  STATUS_COMPRA: [
    'AGUARDANDO COMPRA',
    'COMPRA REALIZADA',
    'AGUARDANDO ENTREGA',
    'ENTREGUE',
    'CANCELADA'
  ],

  PERFIS: [
    'ADM',
    'USUARIO'
  ],

  TIPOS_ITEM: [
    'MATERIAL',
    'FERRAMENTA',
    'EQUIPAMENTO',
    'OUTROS'
  ],

  UNIDADES: [
    'UN',
    'M',
    'KG',
    'L',
    'CX',
    'PC',
    'KIT'
  ]

};


// ============================================================
// ÍNDICES DAS COLUNAS
// ============================================================

const COL = {

  PROTOCOLO: 1,
  DATA_PEDIDO: 2,
  SOLICITANTE: 3,
  EMAIL: 4,
  MATERIAL: 5,
  QUANTIDADE: 6,
  ONDE: 7,
  PARA_QUE: 8,
  PRIORIDADE: 9,
  SHE: 10,
  OBSERVACOES: 11,
  ULTIMA_ATUALIZACAO: 12,
  DATA_ENTREGA: 13,
  DIAS_DECORRIDOS: 14,
  SITUACAO: 15,
  WHATSAPP_ENVIADO: 16,
  RESPONSAVEL_COMPRA: 17,
  DATA_COMPRA: 18,
  PREVISAO_CHEGADA: 19,
  STATUS_COMPRA: 20

};


// ============================================================
// MENU
// ============================================================

function onOpen() {

  SpreadsheetApp
    .getUi()
    .createMenu('📦 CONTROLE DE PEDIDOS')

    .addItem(
      '📝 Nova solicitação',
      'abrirFormularioSolicitacao'
    )

    .addItem(
      '🔎 Consultar solicitações',
      'abrirConsulta'
    )

    .addItem(
      '📱 Gerar lista para WhatsApp',
      'abrirListaWhatsApp'
    )

    .addSeparator()

    .addItem(
      '📦 Cadastrar item',
      'abrirCadastroItem'
    )

    .addItem(
      '👤 Cadastrar usuário',
      'abrirCadastroUsuario'
    )

    .addSeparator()

    .addItem(
      '📊 Atualizar dashboard',
      'atualizarDashboard'
    )

    .addItem(
      '⚙️ Configurar sistema',
      'configurarSistema'
    )

    .addToUi();

}


// ============================================================
// CONFIGURAR SISTEMA
// ============================================================

function configurarSistema() {

  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  criarAbaSolicitacoes_(ss);
  criarAbaItens_(ss);
  criarAbaUsuarios_(ss);
  criarAbaConfig_(ss);
  criarAbaDashboard_(ss);

  configurarValidacoes_();
  configurarFormulasSolicitacoes_();

  atualizarDashboard();

  SpreadsheetApp.flush();

  SpreadsheetApp
    .getUi()
    .alert(
      '✅ Sistema configurado!\n\n' +
      'A aba SOLICITACOES possui 16 colunas.\n\n' +
      'Também estão disponíveis:\n' +
      '📝 Nova solicitação\n' +
      '🔎 Consulta\n' +
      '📱 Lista para WhatsApp\n' +
      '🗑️ Exclusão de solicitações\n' +
      '✓ Controle de entrega'
    );

}


// ============================================================
// ABA SOLICITACOES
// ============================================================

function criarAbaSolicitacoes_(ss) {

  let sheet =
    ss.getSheetByName(
      CONFIG.ABA_SOLICITACOES
    );

  if (!sheet) {

    sheet =
      ss.insertSheet(
        CONFIG.ABA_SOLICITACOES
      );

  }

  const headers = [

    'PROTOCOLO',
    'DATA/HORA DO PEDIDO',
    'SOLICITANTE',
    'E-MAIL',
    'MATERIAL / FERRAMENTA',
    'QUANTIDADE',
    'ONDE SERÁ UTILIZADO',
    'PARA QUE SERÁ UTILIZADO',
    'PRIORIDADE',
    'PRECISA DE LIBERAÇÃO SHE?',
    'OBSERVAÇÕES',
    'ÚLTIMA ATUALIZAÇÃO',
    'DATA DA ENTREGA',
    'DIAS DECORRIDOS',
    'SITUAÇÃO',
    'WHATSAPP_ENVIADO',
    'RESPONSAVEL_COMPRA',
    'DATA_COMPRA',
    'PREVISAO_CHEGADA',
    'STATUS_COMPRA'

  ];

  sheet
    .getRange(
      1,
      1,
      1,
      headers.length
    )
    .setValues([headers]);

  formatarCabecalho_(
    sheet,
    headers.length
  );

  sheet.setFrozenRows(1);

  sheet
    .getRange('B:B')
    .setNumberFormat(
      'dd/MM/yyyy HH:mm'
    );

  sheet
    .getRange('L:L')
    .setNumberFormat(
      'dd/MM/yyyy HH:mm'
    );

  sheet
    .getRange('M:M')
    .setNumberFormat(
      'dd/MM/yyyy'
    );

  sheet
    .getRange('R:R')
    .setNumberFormat(
      'dd/MM/yyyy'
    );

  sheet
    .getRange('S:S')
    .setNumberFormat(
      'dd/MM/yyyy'
    );

  sheet
    .getRange('A:T')
    .setVerticalAlignment('middle')
    .setWrap(true);

  criarFiltroSeguro_(
    sheet,
    headers.length
  );

  ajustarLargurasSolicitacoes_(
    sheet
  );

}


// ============================================================
// LARGURAS SOLICITACOES
// ============================================================

function ajustarLargurasSolicitacoes_(sheet) {

  const larguras = {

    1: 120,
    2: 145,
    3: 180,
    4: 220,
    5: 230,
    6: 90,
    7: 210,
    8: 250,
    9: 100,
    10: 160,
    11: 250,
    12: 145,
    13: 120,
    14: 110,
    15: 120,
    16: 130,
    17: 180,
    18: 120,
    19: 130,
    20: 160

  };

  Object.keys(larguras).forEach(
    coluna => {

      sheet.setColumnWidth(
        Number(coluna),
        larguras[coluna]
      );

    }
  );

}


// ============================================================
// CONFIGURAR FÓRMULAS
// ============================================================

function configurarFormulasSolicitacoes_() {

  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  const sheet =
    ss.getSheetByName(
      CONFIG.ABA_SOLICITACOES
    );

  if (!sheet) return;

  const ultimaLinha =
    obterUltimaLinhaReal_(sheet);

  if (ultimaLinha < 2) return;

  const formulas = [];

  for (
    let linha = 2;
    linha <= ultimaLinha;
    linha++
  ) {

    formulas.push([

      `=IF(B${linha}="";"";IF(M${linha}<>"";INT(M${linha}-B${linha});INT(NOW()-B${linha})))`

    ]);

  }

  sheet
    .getRange(
      2,
      COL.DIAS_DECORRIDOS,
      formulas.length,
      1
    )
    .setFormulas(formulas);

  sheet
    .getRange('N:N')
    .setNumberFormat('0');

}


// ============================================================
// ABA CADASTRO_ITENS
// ============================================================

function criarAbaItens_(ss) {

  let sheet =
    ss.getSheetByName(
      CONFIG.ABA_ITENS
    );

  if (!sheet) {

    sheet =
      ss.insertSheet(
        CONFIG.ABA_ITENS
      );

  }

  const headers = [

    'ITEM',
    'TIPO',
    'UNIDADE',
    'ATIVO',
    'OBSERVAÇÕES'

  ];

  sheet
    .getRange(
      1,
      1,
      1,
      headers.length
    )
    .setValues([headers]);

  formatarCabecalho_(
    sheet,
    headers.length
  );

  sheet.setFrozenRows(1);

  sheet
    .getRange('A:E')
    .setVerticalAlignment('middle')
    .setWrap(true);

  criarFiltroSeguro_(
    sheet,
    headers.length
  );

  sheet.setColumnWidth(1, 280);
  sheet.setColumnWidth(2, 160);
  sheet.setColumnWidth(3, 100);
  sheet.setColumnWidth(4, 100);
  sheet.setColumnWidth(5, 250);

}


// ============================================================
// ABA USUARIOS
// ============================================================

function criarAbaUsuarios_(ss) {

  let sheet =
    ss.getSheetByName(
      CONFIG.ABA_USUARIOS
    );

  if (!sheet) {

    sheet =
      ss.insertSheet(
        CONFIG.ABA_USUARIOS
      );

  }

  const headers = [

    'ID_USUARIO',
    'NOME',
    'E-MAIL',
    'USUARIO',
    'SENHA_HASH',
    'PERFIL',
    'ATIVO'

  ];

  sheet
    .getRange(
      1,
      1,
      1,
      headers.length
    )
    .setValues([headers]);

  formatarCabecalho_(
    sheet,
    headers.length
  );

  sheet.setFrozenRows(1);

  sheet
    .getRange('A:G')
    .setVerticalAlignment('middle');

  criarFiltroSeguro_(
    sheet,
    headers.length
  );

  sheet.setColumnWidth(1, 110);
  sheet.setColumnWidth(2, 250);
  sheet.setColumnWidth(3, 280);
  sheet.setColumnWidth(4, 160);
  sheet.setColumnWidth(5, 260);
  sheet.setColumnWidth(6, 100);
  sheet.setColumnWidth(7, 100);

  const ultimaLinha = obterUltimaLinhaReal_(sheet, 1);
  if (ultimaLinha < 2) {
    sheet.appendRow([
      'USR-001',
      'Administrador',
      'admin@empresa.com',
      'admin',
      gerarSenhaHash_('admin123'),
      'ADM',
      'SIM'
    ]);
  }

}


// ============================================================
// ABA CONFIG
// ============================================================

function criarAbaConfig_(ss) {

  let sheet =
    ss.getSheetByName(
      CONFIG.ABA_CONFIG
    );

  if (!sheet) {

    sheet =
      ss.insertSheet(
        CONFIG.ABA_CONFIG
      );

  }

  sheet.clear();

  sheet
    .getRange('A1')
    .setValue('CONFIGURAÇÕES')
    .setFontSize(16)
    .setFontWeight('bold');

  sheet
    .getRange('A3')
    .setValue('PRIORIDADES')
    .setFontWeight('bold');

  sheet
    .getRange(
      4,
      1,
      CONFIG.PRIORIDADES.length,
      1
    )
    .setValues(
      CONFIG.PRIORIDADES.map(
        valor => [valor]
      )
    );

  sheet
    .getRange('C3')
    .setValue('TIPOS DE ITEM')
    .setFontWeight('bold');

  sheet
    .getRange(
      4,
      3,
      CONFIG.TIPOS_ITEM.length,
      1
    )
    .setValues(
      CONFIG.TIPOS_ITEM.map(
        valor => [valor]
      )
    );

  sheet
    .getRange('E3')
    .setValue('UNIDADES')
    .setFontWeight('bold');

  sheet
    .getRange(
      4,
      5,
      CONFIG.UNIDADES.length,
      1
    )
    .setValues(
      CONFIG.UNIDADES.map(
        valor => [valor]
      )
    );

  sheet
    .getRange('G3')
    .setValue('SITUAÇÕES')
    .setFontWeight('bold');

  sheet
    .getRange(
      4,
      7,
      CONFIG.SITUACOES.length,
      1
    )
    .setValues(
      CONFIG.SITUACOES.map(
        valor => [valor]
      )
    );

  sheet.autoResizeColumns(1, 7);

}


// ============================================================
// DASHBOARD
// ============================================================

function criarAbaDashboard_(ss) {

  let sheet =
    ss.getSheetByName(
      CONFIG.ABA_DASHBOARD
    );

  if (!sheet) {

    sheet =
      ss.insertSheet(
        CONFIG.ABA_DASHBOARD
      );

  }

  sheet.clear();

  sheet
    .getRange('A1:H1')
    .merge();

  sheet
    .getRange('A1')
    .setValue('📊 CONTROLE DE PEDIDOS')
    .setFontSize(18)
    .setFontWeight('bold');

  sheet
    .getRange('A3:B3')
    .setValues([
      [
        'INDICADOR',
        'VALOR'
      ]
    ])
    .setFontWeight('bold');

}


// ============================================================
// ATUALIZAR DASHBOARD
// ============================================================

function atualizarDashboard() {

  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  const sheet =
    ss.getSheetByName(
      CONFIG.ABA_DASHBOARD
    );

  const solicitacoes =
    ss.getSheetByName(
      CONFIG.ABA_SOLICITACOES
    );

  if (!sheet || !solicitacoes) {
    return;
  }

  const ultimaLinha =
    obterUltimaLinhaReal_(solicitacoes);

  let total = 0;
  let urgentes = 0;
  let altas = 0;
  let she = 0;
  let pendentes = 0;
  let entregues = 0;

  if (ultimaLinha >= 2) {

    const dados =
      solicitacoes
        .getRange(
          2,
          1,
          ultimaLinha - 1,
          16
        )
        .getValues();

    dados.forEach(
      linha => {

        if (!linha[COL.PROTOCOLO - 1]) {
          return;
        }

        total++;

        const prioridade =
          String(
            linha[COL.PRIORIDADE - 1] || ''
          )
            .trim()
            .toUpperCase();

        const precisaSHE =
          String(
            linha[COL.SHE - 1] || ''
          )
            .trim()
            .toUpperCase();

        const situacao =
          String(
            linha[COL.SITUACAO - 1] || ''
          )
            .trim()
            .toUpperCase();

        if (prioridade === 'URGENTE') {
          urgentes++;
        }

        if (prioridade === 'ALTA') {
          altas++;
        }

        if (precisaSHE === 'SIM') {
          she++;
        }

        if (
          situacao === 'PENDENTE' ||
          !situacao
        ) {
          pendentes++;
        }

        if (situacao === 'ENTREGUE') {
          entregues++;
        }

      }
    );

  }

  const indicadores = [

    [
      'TOTAL DE SOLICITAÇÕES',
      total
    ],

    [
      'PENDENTES',
      pendentes
    ],

    [
      'ENTREGUES',
      entregues
    ],

    [
      'PRIORIDADE URGENTE',
      urgentes
    ],

    [
      'PRIORIDADE ALTA',
      altas
    ],

    [
      'COM LIBERAÇÃO SHE',
      she
    ]

  ];

  sheet
    .getRange(
      4,
      1,
      Math.max(
        sheet.getMaxRows() - 3,
        indicadores.length
      ),
      2
    )
    .clearContent();

  sheet
    .getRange(
      4,
      1,
      indicadores.length,
      2
    )
    .setValues(indicadores);

  sheet.autoResizeColumns(1, 2);

}


// ============================================================
// VALIDAÇÕES
// ============================================================

function configurarValidacoes_() {

  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  const solicitacoes =
    ss.getSheetByName(
      CONFIG.ABA_SOLICITACOES
    );

  const config =
    ss.getSheetByName(
      CONFIG.ABA_CONFIG
    );

  const itens =
    ss.getSheetByName(
      CONFIG.ABA_ITENS
    );

  if (!solicitacoes || !config) {
    return;
  }

  const regraPrioridade =
    SpreadsheetApp
      .newDataValidation()
      .requireValueInRange(
        config.getRange(
          4,
          1,
          CONFIG.PRIORIDADES.length,
          1
        ),
        true
      )
      .setAllowInvalid(false)
      .build();

  solicitacoes
    .getRange(
      2,
      COL.PRIORIDADE,
      Math.max(
        solicitacoes.getMaxRows() - 1,
        1
      ),
      1
    )
    .setDataValidation(
      regraPrioridade
    );

  const regraSHE =
    SpreadsheetApp
      .newDataValidation()
      .requireValueInList(
        [
          'SIM',
          'NÃO'
        ],
        true
      )
      .setAllowInvalid(false)
      .build();

  solicitacoes
    .getRange(
      2,
      COL.SHE,
      Math.max(
        solicitacoes.getMaxRows() - 1,
        1
      ),
      1
    )
    .setDataValidation(
      regraSHE
    );

  const regraSituacao =
    SpreadsheetApp
      .newDataValidation()
      .requireValueInRange(
        config.getRange(
          4,
          7,
          CONFIG.SITUACOES.length,
          1
        ),
        true
      )
      .setAllowInvalid(false)
      .build();

  solicitacoes
    .getRange(
      2,
      COL.SITUACAO,
      Math.max(
        solicitacoes.getMaxRows() - 1,
        1
      ),
      1
    )
    .setDataValidation(
      regraSituacao
    );

  if (itens) {

    const regraTipo =
      SpreadsheetApp
        .newDataValidation()
        .requireValueInRange(
          config.getRange(
            4,
            3,
            CONFIG.TIPOS_ITEM.length,
            1
          ),
          true
        )
        .setAllowInvalid(false)
        .build();

    itens
      .getRange(
        2,
        2,
        Math.max(
          itens.getMaxRows() - 1,
          1
        ),
        1
      )
      .setDataValidation(
        regraTipo
      );

  }

}


// ============================================================
// CADASTRAR ITEM
// ============================================================

function cadastrarItem(dados) {

  if (!dados) {
    throw new Error(
      'Dados do item não informados.'
    );
  }

  const nome =
    String(
      dados.item || ''
    ).trim();

  if (!nome) {
    throw new Error(
      'Informe o nome do item.'
    );
  }

  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  const sheet =
    ss.getSheetByName(
      CONFIG.ABA_ITENS
    );

  if (!sheet) {
    throw new Error(
      'A aba CADASTRO_ITENS não existe.'
    );
  }

  const ultimaLinha =
    obterUltimaLinhaReal_(sheet, 1);

  if (ultimaLinha >= 2) {

    const dadosExistentes =
      sheet
        .getRange(
          2,
          1,
          ultimaLinha - 1,
          5
        )
        .getValues();

    const nomeComparacao =
      normalizarTexto_(nome);

    for (
      let i = 0;
      i < dadosExistentes.length;
      i++
    ) {

      const existente =
        normalizarTexto_(
          dadosExistentes[i][0]
        );

      if (
        existente ===
        nomeComparacao
      ) {

        return {

          sucesso: true,
          existente: true,

          item:
            dadosExistentes[i][0]

        };

      }

    }

  }

  const tipoRecebido =
    String(
      dados.tipo || ''
    )
      .trim()
      .toUpperCase();

  const tipo =
    CONFIG.TIPOS_ITEM.includes(
      tipoRecebido
    )
      ? tipoRecebido
      : 'OUTROS';

  const unidadeRecebida =
    String(
      dados.unidade || ''
    )
      .trim()
      .toUpperCase();

  const unidade =
    CONFIG.UNIDADES.includes(
      unidadeRecebida
    )
      ? unidadeRecebida
      : 'UN';

  sheet.appendRow([

    nome,
    tipo,
    unidade,
    'SIM',
    dados.observacoes || ''

  ]);

  return {

    sucesso: true,
    existente: false,
    item: nome

  };

}


// ============================================================
// LISTAR ITENS
// ============================================================

function listarItens() {

  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  const sheet =
    ss.getSheetByName(
      CONFIG.ABA_ITENS
    );

  if (!sheet) {
    return [];
  }

  const ultimaLinha =
    obterUltimaLinhaReal_(sheet, 1);

  if (ultimaLinha < 2) {
    return [];
  }

  const dados =
    sheet
      .getRange(
        2,
        1,
        ultimaLinha - 1,
        5
      )
      .getValues();

  return dados

    .filter(
      linha => {

        const nome =
          String(
            linha[0] || ''
          ).trim();

        const ativo =
          String(
            linha[3] || 'SIM'
          )
            .trim()
            .toUpperCase();

        return (
          nome &&
          ativo !== 'NÃO'
        );

      }
    )

    .map(
      linha => ({

        item: linha[0],
        tipo: linha[1],
        unidade: linha[2]

      })
    )

    .sort(
      (a, b) =>
        String(a.item)
          .localeCompare(
            String(b.item),
            'pt-BR'
          )
    );

}


// ============================================================
// HASH E SESSÃO SEGUROS
// ============================================================

function gerarSenhaHash_(senha) {
  if (!senha && senha !== 0) return '';
  var digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(senha).trim(),
    Utilities.Charset.UTF_8
  );
  var hashStr = '';
  for (var i = 0; i < digest.length; i++) {
    var byteVal = digest[i];
    if (byteVal < 0) byteVal += 256;
    var byteStr = byteVal.toString(16);
    if (byteStr.length === 1) byteStr = '0' + byteStr;
    hashStr += byteStr;
  }
  return hashStr;
}

function criarSessaoUsuario_(usuarioObj) {
  limparSessoesExpiradas_();
  var props = PropertiesService.getScriptProperties();
  var token = 'TOK-' + Utilities.getUuid();
  var agora = new Date().getTime();
  var ttlMs = 8 * 60 * 60 * 1000; // 8 horas (TTL)
  var sessaoData = {
    token: token,
    idUsuario: usuarioObj.idUsuario || '',
    usuario: usuarioObj.usuario || '',
    nome: usuarioObj.nome || '',
    email: usuarioObj.email || '',
    perfil: usuarioObj.perfil || 'USUARIO',
    criadoEm: agora,
    expiraEm: agora + ttlMs
  };
  props.setProperty('SESSAO_' + token, JSON.stringify(sessaoData));
  return token;
}

function validarSessaoToken_(token) {
  if (!token) return null;
  var props = PropertiesService.getScriptProperties();
  var chave = 'SESSAO_' + String(token).trim();
  var raw = props.getProperty(chave);
  if (!raw) return null;
  try {
    var sessao = JSON.parse(raw);
    var agora = new Date().getTime();
    if (sessao.expiraEm && agora > sessao.expiraEm) {
      props.deleteProperty(chave);
      return null;
    }
    return sessao;
  } catch (e) {
    props.deleteProperty(chave);
    return null;
  }
}

function exigirSessaoValida_(token) {
  var sessao = validarSessaoToken_(token);
  if (!sessao) {
    throw new Error('Sessão inválida ou expirada. Faça login novamente.');
  }
  return sessao;
}

function logoutUsuario(token) {
  if (token) {
    var props = PropertiesService.getScriptProperties();
    var chave = 'SESSAO_' + String(token).trim();
    props.deleteProperty(chave);
  }
  return {
    sucesso: true,
    mensagem: 'Sessão encerrada com sucesso.'
  };
}

function limparSessoesExpiradas_() {
  try {
    var props = PropertiesService.getScriptProperties();
    var keys = props.getKeys();
    var agora = new Date().getTime();
    for (var i = 0; i < keys.length; i++) {
      if (keys[i].indexOf('SESSAO_') === 0) {
        var raw = props.getProperty(keys[i]);
        if (raw) {
          try {
            var data = JSON.parse(raw);
            if (data.expiraEm && agora > data.expiraEm) {
              props.deleteProperty(keys[i]);
            }
          } catch(e) {
            props.deleteProperty(keys[i]);
          }
        }
      }
    }
  } catch(e) {}
}

function contarAdmsAtivos_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.ABA_USUARIOS);
  if (!sheet) return 0;
  var uLinha = obterUltimaLinhaReal_(sheet, 1);
  if (uLinha < 2) return 0;
  var dados = sheet.getRange(2, 1, uLinha - 1, 7).getValues();
  var count = 0;
  for (var i = 0; i < dados.length; i++) {
    var r = dados[i];
    var perf = String(r[5] || 'USUARIO').trim().toUpperCase();
    var atv = String(r[6] || r[2] || 'SIM').trim().toUpperCase();
    if (perf === 'ADM' && atv === 'SIM') {
      count++;
    }
  }
  return count;
}

function verificarPrimeiroAcesso() {
  try {
    corrigirEstruturaUsuarios_();
  } catch (e) {
    console.error('Erro ao verificar/migrar usuarios em verificarPrimeiroAcesso: ' + e.message);
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.ABA_USUARIOS);
  if (!sheet) {
    return {
      sucesso: true,
      primeiroAcesso: true
    };
  }

  var uLinha = obterUltimaLinhaReal_(sheet, 1);
  if (uLinha < 2) {
    return {
      sucesso: true,
      primeiroAcesso: true
    };
  }

  var dados = sheet.getRange(2, 1, uLinha - 1, 7).getValues();
  var count = 0;
  for (var i = 0; i < dados.length; i++) {
    var nome = String(dados[i][1] || dados[i][0] || '').trim();
    if (nome) {
      count++;
    }
  }

  return {
    sucesso: true,
    primeiroAcesso: count === 0
  };
}

function corrigirEstruturaUsuarios_() {
  var lock = LockService.getScriptLock();
  try {
    try {
      lock.waitLock(10000);
    } catch (e) {
      // Prossegue mesmo se a trava falhar para evitar bloqueios permanentes
      console.warn('Não foi possível obter trava: ' + e.message);
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.ABA_USUARIOS);
    if (!sheet) {
      sheet = ss.insertSheet(CONFIG.ABA_USUARIOS);
    }

    var uLinha = obterUltimaLinhaReal_(sheet, 1);
    var headerCorreto = ['ID_USUARIO', 'NOME', 'E-MAIL', 'USUARIO', 'SENHA_HASH', 'PERFIL', 'ATIVO'];
    var hashAdminEsperado = gerarSenhaHash_('admin');

    if (uLinha < 1) {
      sheet.clearContents();
      sheet.getRange(1, 1, 1, 7).setValues([headerCorreto]);
      sheet.getRange(2, 1, 1, 7).setValues([
        ['USR-001', 'ADMINISTRADOR', '', 'admin', hashAdminEsperado, 'ADM', 'SIM']
      ]);

      return {
        sucesso: true,
        mensagem: 'Aba USUARIOS inicializada com o administrador padrão.',
        estruturaEncontrada: 'Aba vazia',
        registrosMigrados: 1,
        adminCorrigido: true,
        adminHashSHA256: hashAdminEsperado,
        primeiroAcesso: false
      };
    }

    var totalCols = Math.max(sheet.getLastColumn(), 7);
    var todosDados = sheet.getRange(1, 1, uLinha, totalCols).getValues();

    var primeiraLinha = todosDados[0];
    var col0Head = String(primeiraLinha[0] || '').trim().toUpperCase();
    var col3Head = String(primeiraLinha[3] || '').trim().toUpperCase();

    var eCabecalhoNovo = (col0Head === 'ID_USUARIO' && col3Head === 'USUARIO');

    var linhasOriginais = [];
    var inicioIdx = eCabecalhoNovo ? 1 : 0;

    for (var i = inicioIdx; i < todosDados.length; i++) {
      var row = todosDados[i];
      var c0 = String(row[0] || '').trim();
      var c1 = String(row[1] || '').trim();
      var c2 = String(row[2] || '').trim();

      if (i === 0 && (c0.toUpperCase() === 'NOME' || c0.toUpperCase() === 'NOME COMPLETO')) {
        continue;
      }

      if (c0 || c1 || c2) {
        linhasOriginais.push(row);
      }
    }

    var usuariosProcessados = [];
    var adminEncontrado = false;

    for (var j = 0; j < linhasOriginais.length; j++) {
      var r = linhasOriginais[j];

      var idExistente = '';
      var nome = '';
      var email = '';
      var usuarioHandle = '';
      var senhaHash = '';
      var perfil = 'USUARIO';
      var ativo = 'SIM';

      if (eCabecalhoNovo) {
        idExistente = String(r[0] || '').trim();
        nome = String(r[1] || '').trim();
        email = String(r[2] || '').trim().toLowerCase();
        usuarioHandle = String(r[3] || '').trim().toLowerCase();
        senhaHash = String(r[4] || '').trim();
        perfil = String(r[5] || 'USUARIO').trim().toUpperCase();
        ativo = String(r[6] || 'SIM').trim().toUpperCase();
      } else {
        var colA = String(r[0] || '').trim();
        var colB = String(r[1] || '').trim();
        var colC = String(r[2] || '').trim();

        if (colA.toUpperCase() === 'ADMIN' || colB.toLowerCase() === 'admin') {
          nome = 'ADMINISTRADOR';
          email = colB.includes('@') ? colB.toLowerCase() : '';
          usuarioHandle = 'admin';
          perfil = 'ADM';
          ativo = 'SIM';
          senhaHash = hashAdminEsperado;
        } else {
          nome = colA;
          email = colB.toLowerCase();
          ativo = (colC.toUpperCase() === 'NÃO' || colC.toUpperCase() === 'NAO') ? 'NÃO' : 'SIM';

          if (email && email.includes('@')) {
            usuarioHandle = email.split('@')[0].trim().toLowerCase();
          } else if (nome) {
            usuarioHandle = nome.toLowerCase()
              .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
              .replace(/[^a-z0-9]/g, '.')
              .replace(/\.+/g, '.');
          }
          perfil = 'USUARIO';
          senhaHash = '';
        }
      }

      if (usuarioHandle === 'admin' || nome.toUpperCase() === 'ADMIN' || nome.toUpperCase() === 'ADMINISTRADOR') {
        adminEncontrado = true;
        nome = nome || 'ADMINISTRADOR';
        usuarioHandle = 'admin';
        perfil = 'ADM';
        ativo = 'SIM';

        if (!senhaHash || senhaHash === 'admin' || senhaHash.length !== 64) {
          senhaHash = hashAdminEsperado;
        }
      }

      usuariosProcessados.push({
        id: idExistente,
        nome: nome,
        email: email,
        usuario: usuarioHandle,
        senhaHash: senhaHash,
        perfil: perfil,
        ativo: ativo
      });
    }

    if (!adminEncontrado) {
      usuariosProcessados.push({
        id: '',
        nome: 'ADMINISTRADOR',
        email: '',
        usuario: 'admin',
        senhaHash: hashAdminEsperado,
        perfil: 'ADM',
        ativo: 'SIM'
      });
    }

    var idsUsados = {};
    for (var k = 0; k < usuariosProcessados.length; k++) {
      var idCand = usuariosProcessados[k].id;
      if (idCand && /^USR-\d+$/i.test(idCand)) {
        idsUsados[idCand.toUpperCase()] = true;
      }
    }

    var proxId = 1;
    var matrizFinal = [];

    for (var m = 0; m < usuariosProcessados.length; m++) {
      var u = usuariosProcessados[m];
      var idFinal = u.id;

      if (!idFinal || !/^USR-\d+$/i.test(idFinal)) {
        while (idsUsados['USR-' + String(proxId).padStart(3, '0')]) {
          proxId++;
        }
        idFinal = 'USR-' + String(proxId).padStart(3, '0');
        idsUsados[idFinal] = true;
      }

      matrizFinal.push([
        idFinal,
        u.nome,
        u.email,
        u.usuario,
        u.senhaHash,
        u.perfil,
        u.ativo
      ]);
    }

    sheet.clearContents();
    sheet.getRange(1, 1, 1, 7).setValues([headerCorreto]);

    if (matrizFinal.length > 0) {
      sheet.getRange(2, 1, matrizFinal.length, 7).setValues(matrizFinal);
      try {
        sheet.getRange(2, 1, matrizFinal.length, 6).clearDataValidations();
      } catch (ev) {
        console.warn('Erro ao limpar validacoes: ' + ev.message);
      }
    }

    return {
      sucesso: true,
      mensagem: 'Estrutura da aba USUARIOS corrigida e migrada com sucesso.',
      estruturaEncontrada: eCabecalhoNovo ? 'Estrutura de 7 colunas (Ajustados hashes e registros)' : 'Estrutura antiga de 3 colunas',
      registrosMigrados: matrizFinal.length,
      adminCorrigido: true,
      adminHashSHA256: hashAdminEsperado,
      primeiroAcesso: false,
      usuarios: matrizFinal.map(function(item) {
        return {
          idUsuario: item[0],
          nome: item[1],
          email: item[2],
          usuario: item[3],
          senhaHashStatus: item[4] ? 'Preenchido (SHA-256)' : 'Vazio (Aguardando redefinição do ADM)',
          perfil: item[5],
          ativo: item[6]
        };
      })
    };
  } finally {
    lock.releaseLock();
  }
}

function criarPrimeiroAdministrador(dados) {
  var lock = LockService.getScriptLock();
  try {
    try {
      lock.waitLock(10000);
    } catch (e) {
      // Prossegue mesmo se a trava falhar para evitar bloqueios permanentes
      console.warn('Não foi possível obter trava: ' + e.message);
    }

    var checagem = verificarPrimeiroAcesso();
    if (!checagem.primeiroAcesso) {
      throw new Error('O sistema já possui um administrador inicializado.');
    }

    if (!dados) throw new Error('Dados do administrador não informados.');

    var nome = String(dados.nome || '').trim();
    var email = String(dados.email || '').trim().toLowerCase();
    var usuario = String(dados.usuario || dados.login || '').trim().toLowerCase();
    var senha = dados.senha;
    var confirmarSenha = dados.confirmarSenha || dados.confirmar_senha;

    if (!nome) throw new Error('Informe o nome completo.');
    if (!email) throw new Error('Informe o e-mail.');
    if (!usuario) throw new Error('Informe o nome de usuário (login).');
    if (!senha) throw new Error('Informe a senha.');
    if (String(senha).length < 6) throw new Error('A senha deve ter no mínimo 6 caracteres.');
    if (confirmarSenha && String(senha) !== String(confirmarSenha)) {
      throw new Error('As senhas não coincidem.');
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.ABA_USUARIOS);
    if (!sheet) {
      sheet = ss.insertSheet(CONFIG.ABA_USUARIOS);
      sheet.appendRow(['ID_USUARIO', 'NOME', 'E-MAIL', 'USUARIO', 'SENHA_HASH', 'PERFIL', 'ATIVO']);
    }

    var idUsuario = 'USR-001';
    var senhaHash = gerarSenhaHash_(senha);

    sheet.appendRow([
      idUsuario,
      nome,
      email,
      usuario,
      senhaHash,
      'ADM',
      'SIM'
    ]);

    return {
      sucesso: true,
      mensagem: 'Administrador criado com sucesso. Faça login para acessar o sistema.'
    };
  } finally {
    lock.releaseLock();
  }
}


// ============================================================
// AUTENTICAÇÃO E USUÁRIOS
// ============================================================

function loginUsuario(usuario, senha) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.ABA_USUARIOS);
  if (!sheet) {
    throw new Error('A aba USUARIOS não existe.');
  }

  var handle = String(usuario || '').trim().toLowerCase();
  var hashInformado = gerarSenhaHash_(senha);

  var uLinha = obterUltimaLinhaReal_(sheet, 1);
  if (uLinha < 2) {
    throw new Error('Nenhum usuário cadastrado no sistema.');
  }

  var dados = sheet.getRange(2, 1, uLinha - 1, 7).getValues();
  for (var i = 0; i < dados.length; i++) {
    var r = dados[i];
    var uId = String(r[0] || ('USR-' + (i + 1))).trim();
    var uNome = String(r[1] || '').trim();
    var uEmail = String(r[2] || '').trim();
    var uUsuario = String(r[3] || r[1] || '').trim().toLowerCase();
    var uHash = String(r[4] || '').trim();
    var uPerfil = String(r[5] || 'USUARIO').trim().toUpperCase();
    var uAtivo = String(r[6] || r[2] || 'SIM').trim().toUpperCase();

    if (uUsuario === handle || uEmail.toLowerCase() === handle || uNome.toLowerCase() === handle) {
      if (uAtivo === 'NÃO') {
        throw new Error('Usuário inativo. Contate o administrador.');
      }

      if (!uHash || uHash === '') {
        return {
          precisaCadastrarSenha: true,
          usuario: {
            idUsuario: uId,
            nome: uNome,
            email: uEmail,
            usuario: uUsuario,
            perfil: uPerfil,
            ativo: uAtivo
          }
        };
      }

      if (uHash !== hashInformado) {
        throw new Error('Senha incorreta.');
      }

      var userObj = {
        idUsuario: uId,
        nome: uNome,
        email: uEmail,
        usuario: uUsuario,
        perfil: uPerfil,
        ativo: uAtivo
      };

      var token = criarSessaoUsuario_(userObj);
      return {
        sucesso: true,
        token: token,
        usuario: userObj
      };
    }
  }

  throw new Error('Usuário não encontrado.');
}

function definirSenhaPrimeiroAcesso(usuario, novaSenha) {
  if (!usuario) throw new Error('Nome de usuário não informado.');
  if (!novaSenha) throw new Error('Nova senha não informada.');
  if (String(novaSenha).length < 6) throw new Error('A senha deve ter no mínimo 6 caracteres.');

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.ABA_USUARIOS);
  if (!sheet) throw new Error('A aba USUARIOS não existe.');

  var handle = String(usuario).trim().toLowerCase();
  var uLinha = obterUltimaLinhaReal_(sheet, 1);
  if (uLinha < 2) throw new Error('Nenhum usuário cadastrado.');

  var range = sheet.getRange(2, 1, uLinha - 1, 7);
  var dados = range.getValues();

  for (var i = 0; i < dados.length; i++) {
    var r = dados[i];
    var uId = String(r[0] || '').trim();
    var uNome = String(r[1] || '').trim();
    var uEmail = String(r[2] || '').trim().toLowerCase();
    var uUsuario = String(r[3] || r[1] || '').trim().toLowerCase();
    var uHash = String(r[4] || '').trim();
    var uPerfil = String(r[5] || 'USUARIO').trim().toUpperCase();
    var uAtivo = String(r[6] || 'SIM').trim().toUpperCase();

    if (uUsuario === handle || uEmail === handle) {
      if (uAtivo === 'NÃO') {
        throw new Error('Usuário inativo. Contate o administrador.');
      }
      if (uHash && uHash !== '') {
        throw new Error('Este usuário já possui uma senha cadastrada. Para redefinir, entre em contato com o administrador.');
      }

      var novaSenhaHash = gerarSenhaHash_(novaSenha);
      var linhaReal = i + 2;
      sheet.getRange(linhaReal, 5).setValue(novaSenhaHash);

      var userObj = {
        idUsuario: uId,
        nome: uNome,
        email: uEmail,
        usuario: uUsuario,
        perfil: uPerfil,
        ativo: uAtivo
      };

      var token = criarSessaoUsuario_(userObj);

      return {
        sucesso: true,
        mensagem: 'Senha cadastrada com sucesso!',
        token: token,
        usuario: userObj
      };
    }
  }

  throw new Error('Usuário não encontrado.');
}

function listarUsuarios() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.ABA_USUARIOS);
  if (!sheet) return [];

  var uLinha = obterUltimaLinhaReal_(sheet, 1);
  if (uLinha < 2) return [];

  var dados = sheet.getRange(2, 1, uLinha - 1, 7).getValues();
  var lista = [];

  for (var i = 0; i < dados.length; i++) {
    var r = dados[i];
    var nome = String(r[1] || r[0] || '').trim();
    if (!nome) continue;

    var idUsuario = String(r[0] || ('USR-' + (i + 1))).trim();
    var email = String(r[2] || '').trim();
    var usuario = String(r[3] || nome).trim();
    var perfil = String(r[5] || 'USUARIO').trim().toUpperCase();
    var ativo = String(r[6] || r[2] || 'SIM').trim().toUpperCase();

    lista.push({
      idUsuario: idUsuario,
      nome: nome,
      email: email,
      usuario: usuario,
      perfil: perfil,
      ativo: ativo
    });
  }

  return lista.sort(function(a, b) {
    return String(a.nome).localeCompare(String(b.nome), 'pt-BR');
  });
}

function cadastrarUsuario(dados, token) {
  if (!dados) throw new Error('Dados do usuário não informados.');

  var sessao = validarSessaoToken_(token);
  var usuariosExistentes = listarUsuarios();
  if (usuariosExistentes.length > 0) {
    if (!sessao || sessao.perfil !== 'ADM') {
      throw new Error('Apenas administradores podem cadastrar usuários.');
    }
  }

  var nome = String(dados.nome || '').trim();
  var email = String(dados.email || '').trim().toLowerCase();
  var usuario = String(dados.usuario || dados.login || nome.toLowerCase().replace(/\s+/g, '.')).trim();
  // Se a senha for vazia ou omitida, deixamos em branco para o próprio usuário cadastrar no primeiro acesso
  var senha = (dados.senha !== undefined && dados.senha !== null) ? String(dados.senha).trim() : '';
  var perfil = String(dados.perfil || 'USUARIO').trim().toUpperCase();
  var ativo = String(dados.ativo || 'SIM').trim().toUpperCase();

  if (!nome) throw new Error('Informe o nome.');
  if (!email) throw new Error('Informe o e-mail.');
  if (!usuario) throw new Error('Informe o login do usuário.');

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.ABA_USUARIOS);
  if (!sheet) throw new Error('A aba USUARIOS não existe.');

  var uLinha = obterUltimaLinhaReal_(sheet, 1);
  if (uLinha >= 2) {
    var existentes = sheet.getRange(2, 1, uLinha - 1, 7).getValues();
    for (var i = 0; i < existentes.length; i++) {
      var exEmail = String(existentes[i][2] || '').trim().toLowerCase();
      var exUsuario = String(existentes[i][3] || existentes[i][1] || '').trim().toLowerCase();

      if (exUsuario === usuario.toLowerCase()) {
        throw new Error('Nome de usuário/login já cadastrado.');
      }
      if (exEmail === email) {
        throw new Error('E-mail já cadastrado para outro usuário.');
      }
    }
  }

  var idUsuario = 'USR-' + String(uLinha < 2 ? 1 : uLinha).padStart(3, '0');
  var senhaHash = gerarSenhaHash_(senha);

  sheet.appendRow([
    idUsuario,
    nome,
    email,
    usuario,
    senhaHash,
    perfil,
    ativo
  ]);

  try {
    var novaLinha = obterUltimaLinhaReal_(sheet, 1);
    if (novaLinha > 1) {
      sheet.getRange(novaLinha, 1, 1, 6).clearDataValidations();
    }
  } catch (ev) {
    console.warn('Erro ao limpar validacoes em cadastrarUsuario: ' + ev.message);
  }

  return {
    sucesso: true,
    idUsuario: idUsuario,
    nome: nome,
    email: email,
    usuario: usuario,
    perfil: perfil,
    ativo: ativo
  };
}

function atualizarUsuario(usuarioTarget, dados, token) {
  var sessao = validarSessaoToken_(token);
  if (!sessao || sessao.perfil !== 'ADM') {
    throw new Error('Apenas administradores podem atualizar usuários.');
  }

  if (!usuarioTarget) throw new Error('Informe o usuário a ser atualizado.');
  if (!dados) throw new Error('Dados para atualização não fornecidos.');

  var target = String(usuarioTarget).trim().toLowerCase();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.ABA_USUARIOS);
  if (!sheet) throw new Error('A aba USUARIOS não existe.');

  var uLinha = obterUltimaLinhaReal_(sheet, 1);
  if (uLinha < 2) throw new Error('Nenhum usuário cadastrado.');

  var range = sheet.getRange(2, 1, uLinha - 1, 7);
  var valores = range.getValues();

  for (var i = 0; i < valores.length; i++) {
    var r = valores[i];
    var uId = String(r[0] || '').trim().toLowerCase();
    var uUsuario = String(r[3] || r[1] || '').trim().toLowerCase();

    if (uId === target || uUsuario === target) {
      var linha = i + 2;
      var currentPerfil = String(r[5] || 'USUARIO').trim().toUpperCase();
      var currentAtivo = String(r[6] || 'SIM').trim().toUpperCase();

      var nextPerfil = dados.perfil ? String(dados.perfil).trim().toUpperCase() : currentPerfil;
      var nextAtivo = dados.ativo ? String(dados.ativo).trim().toUpperCase() : currentAtivo;

      if (currentPerfil === 'ADM' && currentAtivo === 'SIM') {
        if ((nextPerfil !== 'ADM' || nextAtivo !== 'SIM') && contarAdmsAtivos_() <= 1) {
          throw new Error('Não é possível desativar ou rebaixar o único administrador ativo do sistema.');
        }
      }

      try {
        sheet.getRange(linha, 1, 1, 6).clearDataValidations();
      } catch (ev) {
        console.warn('Erro ao limpar validacoes em atualizarUsuario: ' + ev.message);
      }

      if (dados.nome !== undefined) sheet.getRange(linha, 2).setValue(String(dados.nome).trim());
      if (dados.email !== undefined) sheet.getRange(linha, 3).setValue(String(dados.email).trim().toLowerCase());
      if (dados.usuario !== undefined) sheet.getRange(linha, 4).setValue(String(dados.usuario).trim());
      if (dados.senha) sheet.getRange(linha, 5).setValue(gerarSenhaHash_(dados.senha));
      if (dados.perfil) sheet.getRange(linha, 6).setValue(nextPerfil);
      if (dados.ativo) sheet.getRange(linha, 7).setValue(nextAtivo);

      return {
        sucesso: true,
        mensagem: 'Usuário atualizado com sucesso.'
      };
    }
  }

  throw new Error('Usuário não encontrado.');
}

function alterarStatusUsuario(usuarioTarget, ativo, token) {
  return atualizarUsuario(usuarioTarget, { ativo: ativo === 'SIM' || ativo === true ? 'SIM' : 'NÃO' }, token);
}

function redefinirSenha(usuarioTarget, novaSenha, token) {
  if (!novaSenha) throw new Error('Informe a nova senha.');
  return atualizarUsuario(usuarioTarget, { senha: novaSenha }, token);
}

function excluirUsuario(usuarioTarget, token) {
  var sessao = exigirSessaoValida_(token);

  if (!usuarioTarget) throw new Error('Informe o usuário a ser excluído.');

  var target = String(usuarioTarget).trim().toLowerCase();

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.ABA_USUARIOS);
  if (!sheet) throw new Error('A aba USUARIOS não existe.');

  var headers = [];
  if (sheet.getLastColumn() >= 1) {
    headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0] || [];
  }

  var colIdUsuario = 1;
  var colNome = 2;
  var colEmail = 3;
  var colUsuario = 4;
  var colSenhaHash = 5;
  var colPerfil = 6;
  var colAtivo = 7;

  if (headers && headers.length >= 7) {
    for (var h = 0; h < headers.length; h++) {
      var hStr = String(headers[h] || '').trim().toUpperCase();
      if (hStr === 'ID_USUARIO' || hStr === 'IDUSUARIO') colIdUsuario = h + 1;
      else if (hStr === 'NOME') colNome = h + 1;
      else if (hStr === 'E-MAIL' || hStr === 'EMAIL') colEmail = h + 1;
      else if (hStr === 'USUARIO' || hStr === 'LOGIN') colUsuario = h + 1;
      else if (hStr === 'SENHA_HASH' || hStr === 'SENHAHASH') colSenhaHash = h + 1;
      else if (hStr === 'PERFIL') colPerfil = h + 1;
      else if (hStr === 'ATIVO') colAtivo = h + 1;
    }
  }

  // Identificar operador autenticado (da sessão + validação na planilha)
  var operatorUser = String(sessao.usuario || '').trim().toLowerCase();
  var operatorId = String(sessao.idUsuario || '').trim().toLowerCase();
  var operatorEmail = String(sessao.email || '').trim().toLowerCase();

  var operatorPerfil = String(sessao.perfil || '').trim().toUpperCase();
  var operatorAtivo = String(sessao.ativo || 'SIM').trim().toUpperCase();
  var officialOperatorId = operatorId;
  var officialOperatorUser = operatorUser;

  var uLinha = obterUltimaLinhaReal_(sheet, 1);
  if (uLinha < 2) throw new Error('Nenhum usuário cadastrado.');

  var range = sheet.getRange(2, 1, uLinha - 1, sheet.getLastColumn());
  var valores = range.getValues();

  for (var i = 0; i < valores.length; i++) {
    var r = valores[i];
    var uId = String(r[colIdUsuario - 1] || '').trim().toLowerCase();
    var uUsuario = String(r[colUsuario - 1] || '').trim().toLowerCase();
    var uEmail = String(r[colEmail - 1] || '').trim().toLowerCase();

    var matchId = operatorId && uId && (uId === operatorId);
    var matchUser = operatorUser && uUsuario && (uUsuario === operatorUser);
    var matchEmail = operatorEmail && uEmail && (uEmail === operatorEmail);

    if (matchId || matchUser || matchEmail) {
      var dbPerfil = String(r[colPerfil - 1] || '').trim().toUpperCase();
      if (dbPerfil === 'ADM' || dbPerfil === 'USUARIO') {
        operatorPerfil = dbPerfil;
      }

      var rawAtivo = r[colAtivo - 1];
      if (rawAtivo === false || String(rawAtivo).trim().toUpperCase() === 'NÃO' || String(rawAtivo).trim().toUpperCase() === 'NAO') {
        operatorAtivo = 'NÃO';
      } else if (rawAtivo === true || String(rawAtivo).trim().toUpperCase() === 'SIM') {
        operatorAtivo = 'SIM';
      }

      if (uId) officialOperatorId = uId;
      if (uUsuario) officialOperatorUser = uUsuario;
      break;
    }
  }

  // Diagnostic Log (Sem informações sensíveis)
  console.log({
    idUsuarioLogado: officialOperatorId || operatorId,
    usuarioLogado: officialOperatorUser || operatorUser,
    perfilLogado: operatorPerfil,
    ativoLogado: operatorAtivo
  });

  if (operatorPerfil !== 'ADM' || operatorAtivo !== 'SIM') {
    throw new Error('Apenas administradores ativos podem excluir usuários.');
  }

  // Localizar usuário alvo
  var targetIndex = -1;
  var targetId = '';
  var targetUser = '';
  var targetPerfil = '';
  var targetAtivo = '';

  for (var j = 0; j < valores.length; j++) {
    var row = valores[j];
    var tId = String(row[colIdUsuario - 1] || '').trim();
    var tUser = String(row[colUsuario - 1] || '').trim();
    var tEmail = String(row[colEmail - 1] || '').trim();

    var isMatch = (tId && tId.toLowerCase() === target) ||
                  (tUser && tUser.toLowerCase() === target) ||
                  (tEmail && tEmail.toLowerCase() === target);

    if (isMatch) {
      targetIndex = j;
      targetId = tId;
      targetUser = tUser;
      targetPerfil = String(row[colPerfil - 1] || 'USUARIO').trim().toUpperCase();
      var rawAct = row[colAtivo - 1];
      if (rawAct === false || String(rawAct).trim().toUpperCase() === 'NÃO' || String(rawAct).trim().toUpperCase() === 'NAO') {
        targetAtivo = 'NÃO';
      } else {
        targetAtivo = 'SIM';
      }
      break;
    }
  }

  if (targetIndex === -1) {
    throw new Error('Usuário não encontrado.');
  }

  // Proteção: autoexclusão
  var isSameId = officialOperatorId && targetId && (officialOperatorId.toLowerCase() === targetId.toLowerCase());
  var isSameUser = officialOperatorUser && targetUser && (officialOperatorUser.toLowerCase() === targetUser.toLowerCase());

  if (isSameId || isSameUser) {
    throw new Error('Você não pode excluir o próprio usuário enquanto estiver conectado.');
  }

  // Proteção: último ADM ativo
  if (targetPerfil === 'ADM' && targetAtivo === 'SIM') {
    if (contarAdmsAtivos_(sheet, colPerfil, colAtivo) <= 1) {
      throw new Error('Não é possível excluir o único administrador ativo do sistema.');
    }
  }

  var linhaDelete = targetIndex + 2;

  // Invalidar sessões ativas do usuário excluído
  invalidarSessoesUsuario_(targetId, targetUser);

  // Exclusão física
  sheet.deleteRow(linhaDelete);

  return {
    sucesso: true,
    mensagem: 'Usuário excluído com sucesso.'
  };
}

function contarAdmsAtivos_(sheet, colPerfil, colAtivo) {
  if (!sheet) return 0;
  var uLinha = obterUltimaLinhaReal_(sheet, 1);
  if (uLinha < 2) return 0;

  var cPerf = colPerfil || 6;
  var cAtiv = colAtivo || 7;

  var dados = sheet.getRange(2, 1, uLinha - 1, sheet.getLastColumn()).getValues();
  var count = 0;
  for (var i = 0; i < dados.length; i++) {
    var r = dados[i];
    var perf = String(r[cPerf - 1] || '').trim().toUpperCase();
    var act = r[cAtiv - 1];
    var isAct = (act !== false && String(act).trim().toUpperCase() !== 'NÃO' && String(act).trim().toUpperCase() !== 'NAO');
    if (perf === 'ADM' && isAct) {
      count++;
    }
  }
  return count;
}

function invalidarSessoesUsuario_(idUsuario, nomeUsuario) {
  try {
    var props = PropertiesService.getScriptProperties();
    var keys = props.getKeys();
    var count = 0;
    
    var idTarget = String(idUsuario || '').trim().toLowerCase();
    var userTarget = String(nomeUsuario || '').trim().toLowerCase();
    
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      if (k.indexOf('SESSAO_') === 0) {
        var raw = props.getProperty(k);
        if (raw) {
          try {
            var sessao = JSON.parse(raw);
            var sId = String(sessao.idUsuario || '').trim().toLowerCase();
            var sUser = String(sessao.usuario || '').trim().toLowerCase();
            
            if ((idTarget && sId === idTarget) || (userTarget && sUser === userTarget)) {
              props.deleteProperty(k);
              count++;
            }
          } catch (e) {
            // Ignore format error
          }
        }
      }
    }
    console.log('Sessões invalidadas para o usuário ' + idUsuario + '/' + nomeUsuario + ': ' + count);
  } catch (err) {
    console.warn('Erro ao invalidar sessoes do usuario: ' + err.message);
  }
}


// ============================================================
// GERAR PROTOCOLO
// ============================================================

function gerarProtocolo_() {

  const lock =
    LockService.getScriptLock();

  lock.waitLock(30000);

  try {

    const props =
      PropertiesService
        .getScriptProperties();

    let contador =
      Number(
        props.getProperty(
          'CONTADOR_PROTOCOLO'
        ) || 0
      );

    contador++;

    props.setProperty(
      'CONTADOR_PROTOCOLO',
      String(contador)
    );

    return (

      CONFIG.PREFIXO +
      '-' +
      new Date().getFullYear() +
      '-' +
      String(contador)
        .padStart(4, '0')

    );

  } finally {

    lock.releaseLock();

  }

}


// ============================================================
// CRIAR SOLICITAÇÃO
// ============================================================

function criarSolicitacao(dados) {

  if (!dados) {
    throw new Error(
      'Dados da solicitação não informados.'
    );
  }

  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  const sheet =
    ss.getSheetByName(
      CONFIG.ABA_SOLICITACOES
    );

  if (!sheet) {
    throw new Error(
      'A aba SOLICITACOES não existe.'
    );
  }

  const solicitante =
    String(
      dados.solicitante || ''
    ).trim();

  const email =
    String(
      dados.email || ''
    ).trim();

  const material =
    String(
      dados.material || ''
    ).trim();

  const quantidade =
    Number(
      dados.quantidade
    );

  const onde =
    String(
      dados.onde || ''
    ).trim();

  const paraQue =
    String(
      dados.paraQue || ''
    ).trim();

  const prioridade =
    String(
      dados.prioridade || 'NORMAL'
    )
      .trim()
      .toUpperCase();

  const she =
    String(
      dados.precisaLiberacao || 'NÃO'
    )
      .trim()
      .toUpperCase();

  if (!solicitante) {
    throw new Error(
      'Selecione o solicitante.'
    );
  }

  if (!material) {
    throw new Error(
      'Selecione ou informe o material.'
    );
  }

  if (
    !Number.isFinite(quantidade) ||
    quantidade <= 0
  ) {
    throw new Error(
      'Informe uma quantidade válida.'
    );
  }

  if (!onde) {
    throw new Error(
      'Informe onde será utilizado.'
    );
  }

  if (!paraQue) {
    throw new Error(
      'Informe para que será utilizado.'
    );
  }

  if (
    !CONFIG.PRIORIDADES.includes(
      prioridade
    )
  ) {
    throw new Error(
      'Prioridade inválida.'
    );
  }

  if (
    !['SIM', 'NÃO'].includes(
      she
    )
  ) {
    throw new Error(
      'Valor de liberação SHE inválido.'
    );
  }

  const agora =
    new Date();

  const protocolo =
    gerarProtocolo_();

  sheet.appendRow([

    protocolo,
    agora,
    solicitante,
    email,
    material,
    quantidade,
    onde,
    paraQue,
    prioridade,
    she,
    dados.observacoes || '',
    agora,
    '',
    '',
    'PENDENTE',
    'NÃO',
    dados.responsavelCompra || '',
    dados.dataCompra ? new Date(dados.dataCompra) : '',
    dados.previsaoChegada ? new Date(dados.previsaoChegada) : '',
    dados.statusCompra || 'AGUARDANDO COMPRA'

  ]);

  const linha =
    sheet.getLastRow();

  sheet
    .getRange(
      linha,
      COL.DIAS_DECORRIDOS
    )
    .setFormula(
      `=IF(B${linha}="";"";IF(M${linha}<>"";INT(M${linha}-B${linha});INT(NOW()-B${linha})))`
    );

  sheet
    .getRange(
      linha,
      COL.DATA_PEDIDO
    )
    .setNumberFormat(
      'dd/MM/yyyy HH:mm'
    );

  sheet
    .getRange(
      linha,
      COL.ULTIMA_ATUALIZACAO
    )
    .setNumberFormat(
      'dd/MM/yyyy HH:mm'
    );

  sheet
    .getRange(
      linha,
      COL.DATA_ENTREGA
    )
    .setNumberFormat(
      'dd/MM/yyyy'
    );

  if (dados.dataCompra) {
    sheet.getRange(linha, COL.DATA_COMPRA).setNumberFormat('dd/MM/yyyy');
  }

  if (dados.previsaoChegada) {
    sheet.getRange(linha, COL.PREVISAO_CHEGADA).setNumberFormat('dd/MM/yyyy');
  }

  atualizarDashboard();

  return {

    sucesso: true,

    protocolo: protocolo,

    dataHora:
      formatarDataWeb_(
        agora
      )

  };

}


// ============================================================
// LISTAR SOLICITAÇÕES
// ============================================================

function listarSolicitacoes() {

  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  const sheet =
    ss.getSheetByName(
      CONFIG.ABA_SOLICITACOES
    );

  if (!sheet) {

    throw new Error(
      'A aba SOLICITACOES não existe.'
    );

  }

  const mapa = obterMapeamentoColunasSolicitacoes_(sheet);

  const ultimaLinha =
    obterUltimaLinhaReal_(
      sheet,
      mapa.PROTOCOLO
    );

  if (ultimaLinha < 2) {
    return [];
  }

  const quantidadeLinhas =
    ultimaLinha - 1;

  const maxCols = Math.max(sheet.getLastColumn(), 20);

  const dados =
    sheet
      .getRange(
        2,
        1,
        quantidadeLinhas,
        maxCols
      )
      .getValues();

  const resultado = [];

  for (
    let i = 0;
    i < dados.length;
    i++
  ) {

    const linha =
      dados[i];

    const protocolo =
      String(
        linha[mapa.PROTOCOLO - 1] || ''
      ).trim();

    if (!protocolo) {
      continue;
    }

    resultado.push(

      converterSolicitacaoObjeto_(
        linha,
        mapa
      )

    );

  }

  return ordenarSolicitacoesGS_(resultado);

}


// ============================================================
// AUXILIAR DE ORDENAÇÃO DE SOLICITAÇÕES
// ============================================================

function isEntregueOuConcluidoGS_(s) {
  if (!s) return false;
  var sit = String(s.situacao || '').trim().toUpperCase();
  var st = String(s.statusCompra || '').trim().toUpperCase();
  return sit === 'ENTREGUE' || st === 'ENTREGUE';
}

function parseDateTimestampGS_(value) {
  if (!value) return 0;
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? 0 : value.getTime();
  }
  var text = String(value).trim();
  if (!text) return 0;

  var brMatch = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
  if (brMatch) {
    var day = Number(brMatch[1]);
    var month = Number(brMatch[2]) - 1;
    var year = Number(brMatch[3]);
    var hour = Number(brMatch[4] || 0);
    var min = Number(brMatch[5] || 0);
    var sec = Number(brMatch[6] || 0);
    var d = new Date(year, month, day, hour, min, sec);
    return isNaN(d.getTime()) ? 0 : d.getTime();
  }

  var d = new Date(text);
  return isNaN(d.getTime()) ? 0 : d.getTime();
}

function ordenarSolicitacoesGS_(lista) {
  if (!lista || !lista.length) return [];
  var pesos = { 'URGENTE': 4, 'ALTA': 3, 'NORMAL': 2, 'BAIXA': 1 };

  return lista.sort(function(a, b) {
    var gA = isEntregueOuConcluidoGS_(a) ? 2 : 1;
    var gB = isEntregueOuConcluidoGS_(b) ? 2 : 1;
    if (gA !== gB) {
      return gA - gB;
    }

    var pA = pesos[String(a.prioridade || '').trim().toUpperCase()] || 0;
    var pB = pesos[String(b.prioridade || '').trim().toUpperCase()] || 0;
    if (pA !== pB) {
      return pB - pA;
    }

    var tA = parseDateTimestampGS_(a.dataHora || a.dataPedido);
    var tB = parseDateTimestampGS_(b.dataHora || b.dataPedido);
    if (tA !== tB) {
      return tA - tB;
    }

    return String(a.protocolo || '').localeCompare(String(b.protocolo || ''));
  });
}


// ============================================================
// BUSCAR SOLICITAÇÃO
// ============================================================

function buscarSolicitacao(protocolo) {

  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  const sheet =
    ss.getSheetByName(
      CONFIG.ABA_SOLICITACOES
    );

  if (!sheet) {

    throw new Error(
      'A aba SOLICITACOES não existe.'
    );

  }

  const procurado =
    String(
      protocolo || ''
    )
      .trim()
      .toUpperCase();

  if (!procurado) {

    return {
      encontrado: false
    };

  }

  const mapa = obterMapeamentoColunasSolicitacoes_(sheet);

  const ultimaLinha =
    obterUltimaLinhaReal_(
      sheet,
      mapa.PROTOCOLO
    );

  if (ultimaLinha < 2) {

    return {
      encontrado: false
    };

  }

  const maxCols = Math.max(sheet.getLastColumn(), 20);

  const dados =
    sheet
      .getRange(
        2,
        1,
        ultimaLinha - 1,
        maxCols
      )
      .getValues();

  for (
    let i = 0;
    i < dados.length;
    i++
  ) {

    const atual =
      String(
        dados[i][mapa.PROTOCOLO - 1] || ''
      )
        .trim()
        .toUpperCase();

    if (
      atual ===
      procurado
    ) {

      return {

        encontrado: true,

        ...converterSolicitacaoObjeto_(
          dados[i],
          mapa
        )

      };

    }

  }

  return {

    encontrado: false

  };

}


// ============================================================
// CONVERTER LINHA EM OBJETO
// ============================================================

function converterSolicitacaoObjeto_(linha, colMapa) {
  var c = colMapa || COL;

  return {

    protocolo:
      linha[c.PROTOCOLO - 1],

    dataHora:
      formatarDataWeb_(
        linha[c.DATA_PEDIDO - 1]
      ),

    dataPedido:
      formatarDataWeb_(
        linha[c.DATA_PEDIDO - 1]
      ),

    solicitante:
      linha[c.SOLICITANTE - 1],

    email:
      linha[c.EMAIL - 1],

    material:
      linha[c.MATERIAL - 1],

    quantidade:
      linha[c.QUANTIDADE - 1],

    onde:
      linha[c.ONDE - 1],

    paraQue:
      linha[c.PARA_QUE - 1],

    prioridade:
      linha[c.PRIORIDADE - 1],

    precisaLiberacao:
      linha[c.SHE - 1],

    precisaLiberacaoShe:
      linha[c.SHE - 1],

    observacoes:
      linha[c.OBSERVACOES - 1],

    ultimaAtualizacao:
      formatarDataWeb_(
        linha[
          c.ULTIMA_ATUALIZACAO - 1
        ]
      ),

    dataEntrega:
      formatarDataSemHora_(
        linha[c.DATA_ENTREGA - 1]
      ),

    diasDecorridos:
      linha[c.DIAS_DECORRIDOS - 1],

    situacao:
      linha[c.SITUACAO - 1] ||
      'PENDENTE',

    whatsappEnviado:
      linha[c.WHATSAPP_ENVIADO - 1] ||
      'NÃO',

    responsavelCompra:
      linha[c.RESPONSAVEL_COMPRA - 1] || '',

    dataCompra:
      formatarDataSemHora_(
        linha[c.DATA_COMPRA - 1]
      ),

    previsaoChegada:
      formatarDataSemHora_(
        linha[c.PREVISAO_CHEGADA - 1]
      ),

    statusCompra:
      linha[c.STATUS_COMPRA - 1] ||
      'AGUARDANDO COMPRA'

  };

}

// ============================================================
// ATUALIZAR CONTROLE DE COMPRA
// ============================================================

function atualizarControleCompra(protocolo, dados, token) {
  if (!protocolo) throw new Error('Informe o protocolo.');
  if (!dados) throw new Error('Dados do controle de compra não informados.');

  var sessao = validarSessaoToken_(token);
  if (!sessao) {
    throw new Error('Sessão inválida ou expirada. Faça login novamente.');
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.ABA_SOLICITACOES);
  if (!sheet) throw new Error('A aba SOLICITACOES não existe.');

  var mapa = obterMapeamentoColunasSolicitacoes_(sheet);
  var procurado = String(protocolo).trim().toUpperCase();
  var uLinha = obterUltimaLinhaReal_(sheet, mapa.PROTOCOLO);
  if (uLinha < 2) throw new Error('Solicitação não encontrada.');

  var maxCols = Math.max(sheet.getLastColumn(), 20);
  var dadosPlanilha = sheet.getRange(2, 1, uLinha - 1, maxCols).getValues();
  for (var i = 0; i < dadosPlanilha.length; i++) {
    var linha = dadosPlanilha[i];
    var actualProto = String(linha[mapa.PROTOCOLO - 1] || '').trim().toUpperCase();
    if (actualProto === procurado) {
      var numLinha = i + 2;

      var currentResp = String(linha[mapa.RESPONSAVEL_COMPRA - 1] || '').trim().toLowerCase();
      var userLogin = String(sessao.usuario || '').trim().toLowerCase();
      var userNome = String(sessao.nome || '').trim().toLowerCase();

      if (sessao.perfil !== 'ADM') {
        if (currentResp && currentResp !== userLogin && currentResp !== userNome) {
          throw new Error('Apenas o responsável pela compra ou um ADM podem alterar estes dados.');
        }
      }

      var agora = new Date();

      if (dados.responsavelCompra !== undefined) {
        sheet.getRange(numLinha, mapa.RESPONSAVEL_COMPRA).setValue(String(dados.responsavelCompra || '').trim());
      }

      if (dados.dataCompra !== undefined) {
        if (dados.dataCompra) {
          var dtCompra = parseDataParaSheets_(dados.dataCompra);
          if (dtCompra) {
            sheet.getRange(numLinha, mapa.DATA_COMPRA).setValue(dtCompra).setNumberFormat('dd/MM/yyyy');
          } else {
            sheet.getRange(numLinha, mapa.DATA_COMPRA).setValue('');
          }
        } else {
          sheet.getRange(numLinha, mapa.DATA_COMPRA).setValue('');
        }
      }

      if (dados.previsaoChegada !== undefined) {
        if (dados.previsaoChegada) {
          var dtPrev = parseDataParaSheets_(dados.previsaoChegada);
          if (dtPrev) {
            sheet.getRange(numLinha, mapa.PREVISAO_CHEGADA).setValue(dtPrev).setNumberFormat('dd/MM/yyyy');
          } else {
            sheet.getRange(numLinha, mapa.PREVISAO_CHEGADA).setValue('');
          }
        } else {
          sheet.getRange(numLinha, mapa.PREVISAO_CHEGADA).setValue('');
        }
      }

      if (dados.statusCompra !== undefined) {
        var st = String(dados.statusCompra || '').trim().toUpperCase();
        if (st && CONFIG.STATUS_COMPRA && !CONFIG.STATUS_COMPRA.includes(st)) {
          throw new Error('Status de compra inválido.');
        }
        sheet.getRange(numLinha, mapa.STATUS_COMPRA).setValue(st || 'AGUARDANDO COMPRA');
      }

      sheet.getRange(numLinha, mapa.ULTIMA_ATUALIZACAO).setValue(agora).setNumberFormat('dd/MM/yyyy HH:mm');

      return {
        sucesso: true,
        protocolo: actualProto,
        ultimaAtualizacao: formatarDataWeb_(agora)
      };
    }
  }

  throw new Error('Solicitação não encontrada.');
}


// ============================================================
// MARCAR COMO ENTREGUE
// ============================================================

function marcarComoEntregue(protocolo) {

  if (!protocolo) {

    throw new Error(
      'Informe o protocolo.'
    );

  }

  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  const sheet =
    ss.getSheetByName(
      CONFIG.ABA_SOLICITACOES
    );

  if (!sheet) {

    throw new Error(
      'A aba SOLICITACOES não existe.'
    );

  }

  const mapa = obterMapeamentoColunasSolicitacoes_(sheet);

  const procurado =
    String(protocolo)
      .trim()
      .toUpperCase();

  const ultimaLinha =
    obterUltimaLinhaReal_(
      sheet,
      mapa.PROTOCOLO
    );

  if (ultimaLinha < 2) {

    throw new Error(
      'Solicitação não encontrada.'
    );

  }

  const maxCols = Math.max(sheet.getLastColumn(), 20);

  const dados =
    sheet
      .getRange(
        2,
        1,
        ultimaLinha - 1,
        maxCols
      )
      .getValues();

  for (
    let i = 0;
    i < dados.length;
    i++
  ) {

    const atual =
      String(
        dados[i][mapa.PROTOCOLO - 1] || ''
      )
        .trim()
        .toUpperCase();

    if (
      atual !==
      procurado
    ) {
      continue;
    }

    const linha =
      i + 2;

    const agora =
      new Date();

    sheet
      .getRange(
        linha,
        mapa.DATA_ENTREGA
      )
      .setValue(agora)
      .setNumberFormat(
        'dd/MM/yyyy'
      );

    sheet
      .getRange(
        linha,
        mapa.ULTIMA_ATUALIZACAO
      )
      .setValue(agora)
      .setNumberFormat(
        'dd/MM/yyyy HH:mm'
      );

    sheet
      .getRange(
        linha,
        mapa.SITUACAO
      )
      .setValue(
        'ENTREGUE'
      );

    sheet
      .getRange(
        linha,
        mapa.DIAS_DECORRIDOS
      )
      .setFormula(
        `=IF(B${linha}="";"";IF(M${linha}<>"";INT(M${linha}-B${linha});INT(NOW()-B${linha})))`
      );

    atualizarDashboard();

    return {

      sucesso: true,

      protocolo:
        dados[i][mapa.PROTOCOLO - 1],

      situacao:
        'ENTREGUE',

      dataEntrega:
        formatarDataWeb_(
          agora
        )

    };

  }

  throw new Error(
    'Solicitação não encontrada.'
  );

}


// ============================================================
// MARCAR WHATSAPP COMO ENVIADO
// ============================================================

function marcarWhatsAppEnviado(protocolo, enviado) {

  if (!protocolo) {

    throw new Error(
      'Informe o protocolo da solicitação.'
    );

  }

  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  const sheet =
    ss.getSheetByName(
      CONFIG.ABA_SOLICITACOES
    );

  if (!sheet) {

    throw new Error(
      'A aba SOLICITACOES não existe.'
    );

  }

  const mapa = obterMapeamentoColunasSolicitacoes_(sheet);

  const procurado =
    String(protocolo)
      .trim()
      .toUpperCase();

  const ultimaLinha =
    obterUltimaLinhaReal_(
      sheet,
      mapa.PROTOCOLO
    );

  if (ultimaLinha < 2) {

    throw new Error(
      'Solicitação não encontrada.'
    );

  }

  const maxCols = Math.max(sheet.getLastColumn(), 20);

  const dados =
    sheet
      .getRange(
        2,
        1,
        ultimaLinha - 1,
        maxCols
      )
      .getValues();

  for (
    let i = 0;
    i < dados.length;
    i++
  ) {

    const atual =
      String(
        dados[i][mapa.PROTOCOLO - 1] || ''
      )
        .trim()
        .toUpperCase();

    if (atual !== procurado) {
      continue;
    }

    const linha = i + 2;

    const valor =
      enviado === true ||
      String(enviado || '')
        .trim()
        .toUpperCase() === 'SIM'
        ? 'SIM'
        : 'NÃO';

    sheet
      .getRange(
        linha,
        mapa.WHATSAPP_ENVIADO
      )
      .setValue(valor);

    return {

      sucesso: true,

      protocolo:
        dados[i][mapa.PROTOCOLO - 1],

      whatsappEnviado:
        valor

    };

  }

  throw new Error(
    'Solicitação não encontrada.'
  );

}


// ============================================================
// EXCLUIR SOLICITAÇÃO
// ============================================================

function excluirSolicitacao(protocolo) {

  if (!protocolo) {

    throw new Error(
      'Informe o protocolo da solicitação.'
    );

  }

  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  const sheet =
    ss.getSheetByName(
      CONFIG.ABA_SOLICITACOES
    );

  if (!sheet) {

    throw new Error(
      'A aba SOLICITACOES não existe.'
    );

  }

  const mapa = obterMapeamentoColunasSolicitacoes_(sheet);

  const procurado =
    String(protocolo)
      .trim()
      .toUpperCase();

  const ultimaLinha =
    obterUltimaLinhaReal_(
      sheet,
      mapa.PROTOCOLO
    );

  if (ultimaLinha < 2) {

    throw new Error(
      'Solicitação não encontrada.'
    );

  }

  const maxCols = Math.max(sheet.getLastColumn(), 20);

  const dados =
    sheet
      .getRange(
        2,
        1,
        ultimaLinha - 1,
        maxCols
      )
      .getValues();

  for (
    let i = 0;
    i < dados.length;
    i++
  ) {

    const atual =
      String(
        dados[i][mapa.PROTOCOLO - 1] || ''
      )
        .trim()
        .toUpperCase();

    if (
      atual !==
      procurado
    ) {
      continue;
    }

    const linha =
      i + 2;

    const protocoloExcluido =
      dados[i][mapa.PROTOCOLO - 1];

    sheet.deleteRow(linha);

    atualizarDashboard();

    return {

      sucesso: true,

      protocolo:
        protocoloExcluido

    };

  }

  throw new Error(
    'Solicitação não encontrada.'
  );

}


// ============================================================
// ATUALIZAR SOLICITAÇÃO
// ============================================================

function atualizarSolicitacao(
  protocolo,
  dados
) {

  if (!protocolo) {

    throw new Error(
      'Informe o protocolo.'
    );

  }

  if (!dados) {

    throw new Error(
      'Dados da atualização não informados.'
    );

  }

  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  const sheet =
    ss.getSheetByName(
      CONFIG.ABA_SOLICITACOES
    );

  if (!sheet) {

    throw new Error(
      'A aba SOLICITACOES não existe.'
    );

  }

  const mapa = obterMapeamentoColunasSolicitacoes_(sheet);

  const procurado =
    String(protocolo)
      .trim()
      .toUpperCase();

  const ultimaLinha =
    obterUltimaLinhaReal_(
      sheet,
      mapa.PROTOCOLO
    );

  if (ultimaLinha < 2) {

    throw new Error(
      'Solicitação não encontrada.'
    );

  }

  const maxCols = Math.max(sheet.getLastColumn(), 20);

  const valores =
    sheet
      .getRange(
        2,
        1,
        ultimaLinha - 1,
        maxCols
      )
      .getValues();

  for (
    let i = 0;
    i < valores.length;
    i++
  ) {

    const atual =
      String(
        valores[i][mapa.PROTOCOLO - 1] || ''
      )
        .trim()
        .toUpperCase();

    if (
      atual !==
      procurado
    ) {
      continue;
    }

    const linha =
      i + 2;

    const prioridade =
      String(
        dados.prioridade ||
        valores[i][mapa.PRIORIDADE - 1] ||
        'NORMAL'
      )
        .trim()
        .toUpperCase();

    const she =
      String(
        dados.precisaLiberacao ||
        dados.precisaLiberacaoShe ||
        valores[i][mapa.SHE - 1] ||
        'NÃO'
      )
        .trim()
        .toUpperCase();

    if (
      !CONFIG.PRIORIDADES.includes(
        prioridade
      )
    ) {

      throw new Error(
        'Prioridade inválida.'
      );

    }

    if (
      !['SIM', 'NÃO'].includes(she)
    ) {

      throw new Error(
        'Valor de liberação SHE inválido.'
      );

    }

    const agora =
      new Date();

    if (
      dados.solicitante !== undefined
    ) {

      sheet
        .getRange(
          linha,
          mapa.SOLICITANTE
        )
        .setValue(
          String(
            dados.solicitante
          ).trim()
        );

    }

    if (
      dados.email !== undefined
    ) {

      sheet
        .getRange(
          linha,
          mapa.EMAIL
        )
        .setValue(
          String(
            dados.email
          ).trim()
        );

    }

    if (
      dados.material !== undefined
    ) {

      sheet
        .getRange(
          linha,
          mapa.MATERIAL
        )
        .setValue(
          String(
            dados.material
          ).trim()
        );

    }

    if (
      dados.quantidade !== undefined
    ) {

      const quantidade =
        Number(
          dados.quantidade
        );

      if (
        !Number.isFinite(quantidade) ||
        quantidade <= 0
      ) {

        throw new Error(
          'Quantidade inválida.'
        );

      }

      sheet
        .getRange(
          linha,
          mapa.QUANTIDADE
        )
        .setValue(
          quantidade
        );

    }

    if (
      dados.onde !== undefined
    ) {

      sheet
        .getRange(
          linha,
          mapa.ONDE
        )
        .setValue(
          String(
            dados.onde
          ).trim()
        );

    }

    if (
      dados.paraQue !== undefined
    ) {

      sheet
        .getRange(
          linha,
          mapa.PARA_QUE
        )
        .setValue(
          String(
            dados.paraQue
          ).trim()
        );

    }

    sheet
      .getRange(
        linha,
        mapa.PRIORIDADE
      )
      .setValue(
        prioridade
      );

    sheet
      .getRange(
        linha,
        mapa.SHE
      )
      .setValue(
        she
      );

    if (
      dados.observacoes !== undefined
    ) {

      sheet
        .getRange(
          linha,
          mapa.OBSERVACOES
        )
        .setValue(
          dados.observacoes
        );

    }

    if (
      dados.situacao !== undefined
    ) {

      const novaSituacao =
        String(dados.situacao || '')
          .trim()
          .toUpperCase();

      if (
        ['PENDENTE', 'ENTREGUE', 'CANCELADO', 'CANCELADA'].includes(novaSituacao)
      ) {

        sheet
          .getRange(
            linha,
            mapa.SITUACAO
          )
          .setValue(novaSituacao);

        if (novaSituacao === 'PENDENTE') {

          sheet
            .getRange(
              linha,
              mapa.DATA_ENTREGA
            )
            .setValue('');

          sheet
            .getRange(
              linha,
              mapa.DIAS_DECORRIDOS
            )
            .setFormula(
              `=IF(B${linha}="";"";IF(M${linha}<>"";INT(M${linha}-B${linha});INT(NOW()-B${linha})))`
            );

        } else if (novaSituacao === 'ENTREGUE') {

          const dtEntregaAtual =
            sheet
              .getRange(
                linha,
                mapa.DATA_ENTREGA
              )
              .getValue();

          if (!dtEntregaAtual) {

            sheet
              .getRange(
                linha,
                mapa.DATA_ENTREGA
              )
              .setValue(agora)
              .setNumberFormat('dd/MM/yyyy');

          }

          sheet
            .getRange(
              linha,
              mapa.DIAS_DECORRIDOS
            )
            .setFormula(
              `=IF(B${linha}="";"";IF(M${linha}<>"";INT(M${linha}-B${linha});INT(NOW()-B${linha})))`
            );

        }

      }

    }

    sheet
      .getRange(
        linha,
        mapa.ULTIMA_ATUALIZACAO
      )
      .setValue(agora)
      .setNumberFormat(
        'dd/MM/yyyy HH:mm'
      );

    atualizarDashboard();

    return {

      sucesso: true,

      protocolo:
        valores[i][mapa.PROTOCOLO - 1],

      ultimaAtualizacao:
        formatarDataWeb_(
          agora
        )

    };

  }

  throw new Error(
    'Solicitação não encontrada.'
  );

}


// ============================================================
// FORMULÁRIO DE SOLICITAÇÃO
// ============================================================

function abrirFormularioSolicitacao() {

  const html =
    HtmlService
      .createHtmlOutput(
        criarPaginaSolicitacao_()
      )
      .setWidth(800)
      .setHeight(720);

  SpreadsheetApp
    .getUi()
    .showModalDialog(
      html,
      '📝 Nova Solicitação'
    );

}


// ============================================================
// PÁGINA DE SOLICITAÇÃO
// ============================================================

function criarPaginaSolicitacao_() {

  return `

<!DOCTYPE html>
<html>

<head>

<meta charset="UTF-8">

<meta name="viewport"
content="width=device-width, initial-scale=1">

<style>

* {
  box-sizing:border-box;
}

body {
  margin:0;
  padding:20px;
  font-family:Arial,sans-serif;
  background:#f1f5f9;
  color:#1e293b;
}

.container {
  max-width:760px;
  margin:auto;
}

.card {
  background:white;
  border-radius:12px;
  padding:22px;
  box-shadow:0 3px 12px rgba(0,0,0,.08);
}

h2 {
  margin-top:0;
}

.grid {
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:14px;
}

label {
  display:block;
  margin-top:14px;
  margin-bottom:5px;
  font-weight:bold;
}

input,
select,
textarea {
  width:100%;
  padding:10px;
  border:1px solid #cbd5e1;
  border-radius:7px;
  font-size:14px;
}

textarea {
  min-height:80px;
  resize:vertical;
}

button {
  border:0;
  border-radius:7px;
  padding:11px 16px;
  font-weight:bold;
  cursor:pointer;
}

button:disabled {
  opacity:.6;
  cursor:not-allowed;
}

.btn {
  background:#2563eb;
  color:white;
}

.btn-sec {
  background:#64748b;
  color:white;
}

.btn-new {
  background:#16a34a;
  color:white;
  margin-top:5px;
}

.acoes {
  margin-top:20px;
  display:flex;
  gap:8px;
}

.alert {
  display:none;
  margin-bottom:15px;
  padding:12px;
  border-radius:7px;
}

.sucesso {
  background:#dcfce7;
  color:#166534;
}

.erro {
  background:#fee2e2;
  color:#991b1b;
}

.item-novo {
  display:none;
  margin-top:8px;
  padding:12px;
  border:1px solid #bbf7d0;
  border-radius:7px;
  background:#f0fdf4;
}

@media(max-width:650px) {

  .grid {
    grid-template-columns:1fr;
  }

  .acoes {
    flex-direction:column;
  }

  .acoes button {
    width:100%;
  }

}

</style>

</head>

<body>

<div class="container">

<div class="card">

<h2>
📦 Nova Solicitação
</h2>

<div id="mensagem"
class="alert">
</div>

<div class="grid">

<div>

<label>
Solicitante *
</label>

<select
id="solicitante"
onchange="selecionarUsuario()">

<option value="">
Carregando usuários...
</option>

</select>

</div>

<div>

<label>
E-mail
</label>

<input
id="email"
readonly>

</div>

</div>

<label>
Material / Ferramenta *
</label>

<select id="material">

<option value="">
Carregando itens...
</option>

</select>

<button
type="button"
class="btn-new"
onclick="mostrarNovoItem()">

+ Cadastrar novo item

</button>

<div
id="novoItem"
class="item-novo">

<label>
Nome do novo item
</label>

<input
id="novoItemNome"
placeholder="Ex.: Furadeira 1/2">

<div class="grid">

<div>

<label>
Tipo
</label>

<select id="novoItemTipo">

<option>MATERIAL</option>
<option>FERRAMENTA</option>
<option>EQUIPAMENTO</option>
<option>OUTROS</option>

</select>

</div>

<div>

<label>
Unidade
</label>

<select id="novoItemUnidade">

<option>UN</option>
<option>M</option>
<option>KG</option>
<option>L</option>
<option>CX</option>
<option>PC</option>
<option>KIT</option>

</select>

</div>

</div>

<div class="acoes">

<button
type="button"
class="btn-new"
onclick="salvarNovoItem()">

Cadastrar item

</button>

<button
type="button"
class="btn-sec"
onclick="cancelarNovoItem()">

Cancelar

</button>

</div>

</div>

<div class="grid">

<div>

<label>
Quantidade *
</label>

<input
type="number"
id="quantidade"
min="1"
step="1">

</div>

<div>

<label>
Prioridade
</label>

<select id="prioridade">

<option>BAIXA</option>
<option selected>NORMAL</option>
<option>ALTA</option>
<option>URGENTE</option>

</select>

</div>

</div>

<label>
Onde será utilizado? *
</label>

<input
id="onde"
placeholder="Ex.: Área elétrica, manutenção, obra...">

<label>
Para que será utilizado? *
</label>

<textarea
id="paraQue"
placeholder="Descreva a necessidade">
</textarea>

<label>
Precisa de liberação SHE?
</label>

<select id="she">

<option>NÃO</option>
<option>SIM</option>

</select>

<label>
Observações
</label>

<textarea
id="observacoes"
placeholder="Alguma informação adicional">
</textarea>

<div class="acoes">

<button
id="btnRegistrar"
type="button"
class="btn"
onclick="enviar()">

💾 Registrar solicitação

</button>

<button
type="button"
class="btn-sec"
onclick="limpar()">

Limpar

</button>

</div>

</div>

</div>

<script>

let usuarios = [];
let itens = [];

window.onload = function() {

  carregarUsuarios();
  carregarItens();

};


function carregarUsuarios() {

  google.script.run

    .withSuccessHandler(function(dados) {

      usuarios = dados || [];

      const select =
        document.getElementById('solicitante');

      select.innerHTML =
        '<option value="">Selecione...</option>';

      usuarios.forEach(function(usuario) {

        const option =
          document.createElement('option');

        option.value =
          usuario.nome;

        option.textContent =
          usuario.nome;

        option.dataset.email =
          usuario.email;

        select.appendChild(option);

      });

    })

    .withFailureHandler(function(erro) {

      mostrarErro(
        erro.message || String(erro)
      );

    })

    .listarUsuarios();

}


function selecionarUsuario() {

  const select =
    document.getElementById('solicitante');

  const option =
    select.options[
      select.selectedIndex
    ];

  document.getElementById('email').value =
    option
      ? (
          option.dataset.email ||
          ''
        )
      : '';

}


function carregarItens() {

  google.script.run

    .withSuccessHandler(function(dados) {

      itens = dados || [];

      montarListaItens();

    })

    .withFailureHandler(function(erro) {

      mostrarErro(
        erro.message || String(erro)
      );

    })

    .listarItens();

}


function montarListaItens() {

  const select =
    document.getElementById('material');

  select.innerHTML =
    '<option value="">Selecione um item...</option>';

  itens.forEach(function(item) {

    const option =
      document.createElement('option');

    option.value =
      item.item;

    option.textContent =
      item.item +
      ' - ' +
      item.tipo;

    select.appendChild(option);

  });

}


function mostrarNovoItem() {

  document.getElementById('novoItem')
    .style.display = 'block';

  document.getElementById('novoItemNome')
    .focus();

}


function cancelarNovoItem() {

  document.getElementById('novoItem')
    .style.display = 'none';

}


function salvarNovoItem() {

  const nome =
    document.getElementById('novoItemNome')
      .value
      .trim();

  if (!nome) {

    alert(
      'Informe o nome do item.'
    );

    return;

  }

  const dados = {

    item: nome,

    tipo:
      document.getElementById('novoItemTipo')
        .value,

    unidade:
      document.getElementById('novoItemUnidade')
        .value

  };

  google.script.run

    .withSuccessHandler(function(resultado) {

      if (
        !resultado ||
        !resultado.sucesso
      ) {

        mostrarErro(
          'Não foi possível cadastrar o item.'
        );

        return;

      }

      carregarItensDepoisDoCadastro(
        resultado.item
      );

      document.getElementById('novoItem')
        .style.display = 'none';

      document.getElementById('novoItemNome')
        .value = '';

    })

    .withFailureHandler(function(erro) {

      mostrarErro(
        erro.message || String(erro)
      );

    })

    .cadastrarItem(dados);

}


function carregarItensDepoisDoCadastro(
  itemSelecionado
) {

  google.script.run

    .withSuccessHandler(function(dados) {

      itens = dados || [];

      montarListaItens();

      document.getElementById('material')
        .value = itemSelecionado;

    })

    .withFailureHandler(function(erro) {

      mostrarErro(
        erro.message || String(erro)
      );

    })

    .listarItens();

}


function enviar() {

  const botao =
    document.getElementById(
      'btnRegistrar'
    );

  const solicitante =
    document.getElementById('solicitante')
      .value;

  const email =
    document.getElementById('email')
      .value;

  const material =
    document.getElementById('material')
      .value;

  const quantidade =
    document.getElementById('quantidade')
      .value;

  const onde =
    document.getElementById('onde')
      .value
      .trim();

  const paraQue =
    document.getElementById('paraQue')
      .value
      .trim();

  const prioridade =
    document.getElementById('prioridade')
      .value;

  const she =
    document.getElementById('she')
      .value;

  const observacoes =
    document.getElementById('observacoes')
      .value
      .trim();

  if (!solicitante) {

    mostrarErro(
      'Selecione o solicitante.'
    );

    return;

  }

  if (!material) {

    mostrarErro(
      'Selecione o material ou ferramenta.'
    );

    return;

  }

  if (
    !quantidade ||
    Number(quantidade) <= 0
  ) {

    mostrarErro(
      'Informe a quantidade.'
    );

    return;

  }

  if (!onde) {

    mostrarErro(
      'Informe onde será utilizado.'
    );

    return;

  }

  if (!paraQue) {

    mostrarErro(
      'Informe para que será utilizado.'
    );

  }

  const dados = {

    solicitante: solicitante,
    email: email,
    material: material,
    quantidade: quantidade,
    onde: onde,
    paraQue: paraQue,
    prioridade: prioridade,
    precisaLiberacao: she,
    observacoes: observacoes

  };

  botao.disabled = true;

  botao.textContent =
    '⏳ Registrando...';

  google.script.run

    .withSuccessHandler(function(resultado) {

      botao.disabled = false;

      botao.textContent =
        '💾 Registrar solicitação';

      if (
        resultado &&
        resultado.sucesso
      ) {

        mostrarSucesso(

          '✅ Solicitação registrada!<br><br>' +

          '<b>Protocolo:</b> ' +
          resultado.protocolo +

          '<br><br>' +

          'O pedido foi registrado com sucesso.'

        );

        limparCampos();

      } else {

        mostrarErro(
          'Não foi possível registrar a solicitação.'
        );

      }

    })

    .withFailureHandler(function(erro) {

      botao.disabled = false;

      botao.textContent =
        '💾 Registrar solicitação';

      mostrarErro(
        erro.message || String(erro)
      );

    })

    .criarSolicitacao(dados);

}


function limpar() {

  limparCampos();

  document.getElementById('mensagem')
    .style.display = 'none';

}


function limparCampos() {

  document.getElementById('solicitante')
    .value = '';

  document.getElementById('email')
    .value = '';

  document.getElementById('material')
    .value = '';

  document.getElementById('quantidade')
    .value = '';

  document.getElementById('onde')
    .value = '';

  document.getElementById('paraQue')
    .value = '';

  document.getElementById('prioridade')
    .value = 'NORMAL';

  document.getElementById('she')
    .value = 'NÃO';

  document.getElementById('observacoes')
    .value = '';

}


function mostrarErro(texto) {

  const elemento =
    document.getElementById('mensagem');

  elemento.className =
    'alert erro';

  elemento.innerHTML =
    '❌ ' + texto;

  elemento.style.display =
    'block';

}


function mostrarSucesso(texto) {

  const elemento =
    document.getElementById('mensagem');

  elemento.className =
    'alert sucesso';

  elemento.innerHTML =
    texto;

  elemento.style.display =
    'block';

}

</script>

</body>

</html>

`;

}


// ============================================================
// CONSULTA
// ============================================================

function abrirConsulta() {

  const html =
    HtmlService
      .createHtmlOutput(
        criarPaginaConsulta_()
      )
      .setWidth(720)
      .setHeight(720);

  SpreadsheetApp
    .getUi()
    .showModalDialog(
      html,
      '🔎 Consultar Solicitações'
    );

}


// ============================================================
// PÁGINA DE CONSULTA - VERSÃO 4.4
// ============================================================

function criarPaginaConsulta_() {

  return `

<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<meta name="viewport"
content="width=device-width, initial-scale=1">

<style>

* {
  box-sizing:border-box;
}

body {

  font-family:Arial,sans-serif;

  margin:0;

  padding:20px;

  background:#f1f5f9;

  color:#1e293b;

}

h2 {
  margin-top:0;
}

input {

  width:100%;

  padding:12px;

  border:1px solid #cbd5e1;

  border-radius:7px;

  font-size:14px;

}

.item {

  background:white;

  padding:13px;

  margin-top:8px;

  border-radius:8px;

  border:1px solid #e2e8f0;

  cursor:pointer;

  transition:.15s;

}

.item:hover {
  background:#eff6ff;
}

.protocolo {

  font-weight:bold;

  color:#2563eb;

}

.material {

  font-weight:bold;

  margin-top:3px;

}

.info {

  color:#64748b;

  font-size:12px;

  margin-top:4px;

}

.card {

  background:white;

  margin-top:15px;

  padding:18px;

  border-radius:8px;

}

.linha {
  margin-bottom:10px;
}

.status {

  display:inline-block;

  padding:5px 8px;

  background:#e2e8f0;

  border-radius:5px;

  font-size:12px;

  font-weight:bold;

  margin-top:7px;

}

.entregue {

  background:#dcfce7;

  color:#166534;

}

.pendente {

  background:#fef3c7;

  color:#92400e;

}

.vazio {

  text-align:center;

  padding:20px;

  color:#64748b;

  background:white;

  border-radius:8px;

  margin-top:15px;

}

.carregando {

  text-align:center;

  padding:25px;

  color:#64748b;

  background:white;

  border-radius:8px;

  margin-top:15px;

}

.erro-carregamento {

  text-align:center;

  padding:20px;

  color:#991b1b;

  background:#fee2e2;

  border-radius:8px;

  margin-top:15px;

}

button {

  border:0;

  border-radius:7px;

  padding:10px 14px;

  font-weight:bold;

  cursor:pointer;

  color:white;

  font-size:13px;

}

button:disabled {

  opacity:.6;

  cursor:not-allowed;

}

.btn-entregar {
  background:#16a34a;
}

.btn-entregar:hover {
  background:#15803d;
}

.btn-excluir {
  background:#dc2626;
}

.btn-excluir:hover {
  background:#b91c1c;
}

.btn-recarregar {

  background:#2563eb;

  margin-top:10px;

}

.acoes-detalhe {

  display:flex;

  gap:10px;

  margin-top:18px;

  flex-wrap:wrap;

}

.contador {

  margin-top:8px;

  margin-bottom:4px;

  color:#64748b;

  font-size:12px;

}

@media(max-width:600px) {

  body {
    padding:10px;
  }

  .card {
    padding:15px;
  }

  .acoes-detalhe {
    flex-direction:column;
  }

  .acoes-detalhe button {
    width:100%;
  }

}

</style>

</head>

<body>

<h2>
🔎 Solicitações
</h2>

<input
id="busca"
placeholder="Pesquisar protocolo, material ou solicitante..."
oninput="filtrar()">

<div
id="contador"
class="contador">
</div>

<div id="lista">

<div class="carregando">
⏳ Carregando solicitações...
</div>

</div>

<div id="detalhe"></div>


<script>

let dados = [];
let carregando = false;
let carregamentoFinalizado = false;


window.onload = function() {

  carregar();

};


function carregar() {

  if (carregando) {
    return;
  }

  carregando = true;
  carregamentoFinalizado = false;

  const lista =
    document.getElementById('lista');

  const contador =
    document.getElementById('contador');

  const detalhe =
    document.getElementById('detalhe');

  lista.innerHTML =
    '<div class="carregando">' +
      '⏳ Consultando solicitações...' +
    '</div>';

  contador.textContent = '';
  detalhe.innerHTML = '';

  google.script.run

    .withSuccessHandler(
      function(resultado) {

        carregando = false;
        carregamentoFinalizado = true;

        if (!Array.isArray(resultado)) {

          dados = [];

          mostrar([]);

          return;

        }

        dados = resultado;

        mostrar(dados);

      }
    )

    .withFailureHandler(
      function(erro) {

        carregando = false;
        carregamentoFinalizado = true;

        const mensagem =
          erro &&
          erro.message
            ? erro.message
            : String(erro);

        lista.innerHTML =

          '<div class="erro-carregamento">' +

            '<b>❌ Não foi possível carregar as solicitações.</b>' +

            '<br><br>' +

            escapeHtml(mensagem) +

            '<br><br>' +

            '<button ' +
            'class="btn-recarregar" ' +
            'onclick="carregar()">' +

              '🔄 Tentar novamente' +

            '</button>' +

          '</div>';

      }
    )

    .listarSolicitacoes();

}


function filtrar() {

  const texto =
    document
      .getElementById('busca')
      .value
      .toLowerCase()
      .trim();

  if (!texto) {

    mostrar(dados);

    return;

  }

  const filtrados =
    dados.filter(function(item) {

      return (

        String(
          item.protocolo || ''
        )
          .toLowerCase()
          .includes(texto)

        ||

        String(
          item.material || ''
        )
          .toLowerCase()
          .includes(texto)

        ||

        String(
          item.solicitante || ''
        )
          .toLowerCase()
          .includes(texto)

      );

    });

  mostrar(filtrados);

}


function mostrar(lista) {

  const elemento =
    document.getElementById('lista');

  const contador =
    document.getElementById('contador');

  if (!Array.isArray(lista)) {
    lista = [];
  }

  if (!lista.length) {

    contador.textContent =
      '0 solicitações';

    elemento.innerHTML =

      '<div class="vazio">' +

        'Nenhuma solicitação encontrada.' +

      '</div>';

    return;

  }

  contador.textContent =
    lista.length +
    (
      lista.length === 1
        ? ' solicitação'
        : ' solicitações'
    );

  elemento.innerHTML =
    lista.map(function(item) {

      const situacao =
        String(
          item.situacao ||
          'PENDENTE'
        )
          .toUpperCase();

      const classe =
        situacao === 'ENTREGUE'
          ? 'entregue'
          : 'pendente';

      const protocolo =
        escapeHtml(
          item.protocolo
        );

      return (

        '<div class="item" ' +

        'data-protocolo="' +
        protocolo +
        '" ' +

        'onclick="abrirDetalhePorElemento(this)">' +

          '<div class="protocolo">' +
            protocolo +
          '</div>' +

          '<div class="material">' +
            escapeHtml(
              item.material
            ) +
          '</div>' +

          '<div class="info">' +

            escapeHtml(
              item.solicitante
            ) +

            ' - ' +

            escapeHtml(
              item.dataHora
            ) +

          '</div>' +

          '<div class="status ' +
            classe +
          '">' +

            escapeHtml(
              situacao
            ) +

          '</div>' +

        '</div>'

      );

    }).join('');

}


function abrirDetalhePorElemento(
  elemento
) {

  const protocolo =
    elemento.dataset.protocolo;

  detalhar(protocolo);

}


function detalhar(protocolo) {

  const detalhe =
    document.getElementById('detalhe');

  detalhe.innerHTML =

    '<div class="card">' +

      '<div style="text-align:center;padding:20px">' +

        '⏳ Carregando detalhes...' +

      '</div>' +

    '</div>';

  google.script.run

    .withSuccessHandler(
      function(resultado) {

        if (
          !resultado ||
          !resultado.encontrado
        ) {

          detalhe.innerHTML =

            '<div class="card">' +

              '❌ Solicitação não encontrada.' +

            '</div>';

          return;

        }

        renderizarDetalhe(
          resultado
        );

      }
    )

    .withFailureHandler(
      function(erro) {

        detalhe.innerHTML =

          '<div class="card">' +

            '<b>❌ Erro ao carregar detalhes.</b>' +

            '<br><br>' +

            escapeHtml(
              erro.message ||
              String(erro)
            ) +

          '</div>';

      }
    )

    .buscarSolicitacao(
      protocolo
    );

}


function renderizarDetalhe(item) {

  const situacao =
    String(
      item.situacao ||
      'PENDENTE'
    )
      .toUpperCase();

  let botaoEntrega = '';

  if (
    situacao !== 'ENTREGUE'
  ) {

    botaoEntrega =

      '<button ' +
      'class="btn-entregar" ' +
      'onclick="entregar(event, this.dataset.protocolo)" ' +
      'data-protocolo="' +
      escapeHtml(item.protocolo) +
      '">' +

        '✓ Marcar como entregue' +

      '</button>';

  }


  const botaoExcluir =

    '<button ' +
    'class="btn-excluir" ' +
    'onclick="excluir(event, this.dataset.protocolo)" ' +
    'data-protocolo="' +
    escapeHtml(item.protocolo) +
    '">' +

      '🗑️ Excluir solicitação' +

    '</button>';


  const html =

    '<div class="card">' +

      '<h3>' +
        escapeHtml(item.protocolo) +
      '</h3>' +

      '<div class="linha">' +
        '<b>Situação:</b> ' +
        escapeHtml(situacao) +
      '</div>' +

      '<div class="linha">' +
        '<b>Data do pedido:</b> ' +
        escapeHtml(item.dataHora) +
      '</div>' +

      '<div class="linha">' +
        '<b>Solicitante:</b><br>' +
        escapeHtml(item.solicitante) +
      '</div>' +

      '<div class="linha">' +
        '<b>E-mail:</b><br>' +
        escapeHtml(item.email) +
      '</div>' +

      '<div class="linha">' +
        '<b>Material/Ferramenta:</b><br>' +
        escapeHtml(item.material) +
      '</div>' +

      '<div class="linha">' +
        '<b>Quantidade:</b> ' +
        escapeHtml(item.quantidade) +
      '</div>' +

      '<div class="linha">' +
        '<b>Onde:</b><br>' +
        escapeHtml(item.onde) +
      '</div>' +

      '<div class="linha">' +
        '<b>Para que:</b><br>' +
        escapeHtml(item.paraQue) +
      '</div>' +

      '<div class="linha">' +
        '<b>Prioridade:</b> ' +
        escapeHtml(item.prioridade) +
      '</div>' +

      '<div class="linha">' +
        '<b>Liberação SHE:</b> ' +
        escapeHtml(item.precisaLiberacao) +
      '</div>' +

      '<div class="linha">' +
        '<b>Última atualização:</b><br>' +
        escapeHtml(item.ultimaAtualizacao) +
      '</div>' +

      '<div class="linha">' +
        '<b>Data da entrega:</b><br>' +
        escapeHtml(
          item.dataEntrega || '-'
        ) +
      '</div>' +

      '<div class="linha">' +
        '<b>Dias decorridos:</b> ' +
        escapeHtml(item.diasDecorridos) +
      '</div>' +

      '<div class="linha">' +
        '<b>Observações:</b><br>' +
        escapeHtml(item.observacoes) +
      '</div>' +

      '<div class="acoes-detalhe">' +

        botaoEntrega +

        botaoExcluir +

      '</div>' +

    '</div>';


  document
    .getElementById('detalhe')
    .innerHTML = html;

}


function entregar(
  event,
  protocolo
) {

  if (event) {
    event.stopPropagation();
  }

  if (!protocolo) {
    return;
  }

  if (
    !confirm(
      'Confirmar que o pedido ' +
      protocolo +
      ' foi entregue?'
    )
  ) {
    return;
  }

  const detalhe =
    document.getElementById('detalhe');

  detalhe.innerHTML =

    '<div class="card">' +

      '<div style="text-align:center;padding:20px">' +

        '⏳ Registrando entrega...' +

      '</div>' +

    '</div>';

  google.script.run

    .withSuccessHandler(
      function(resultado) {

        if (
          resultado &&
          resultado.sucesso
        ) {

          alert(
            'Pedido marcado como entregue.'
          );

          carregar();

        } else {

          alert(
            'Não foi possível marcar o pedido como entregue.'
          );

          carregar();

        }

      }
    )

    .withFailureHandler(
      function(erro) {

        alert(
          '❌ Erro ao marcar como entregue:\\n\\n' +
          (
            erro.message ||
            String(erro)
          )
        );

        carregar();

      }
    )

    .marcarComoEntregue(
      protocolo
    );

}


function excluir(
  event,
  protocolo
) {

  if (event) {
    event.stopPropagation();
  }

  if (!protocolo) {
    return;
  }

  const confirmacao =
    confirm(

      '⚠️ EXCLUIR SOLICITAÇÃO\\n\\n' +

      'Protocolo: ' +
      protocolo +
      '\\n\\n' +

      'Esta ação irá remover permanentemente ' +
      'esta solicitação da planilha.\\n\\n' +

      'Essa ação não pode ser desfeita.\\n\\n' +

      'Deseja realmente excluir?'

    );

  if (!confirmacao) {
    return;
  }

  const confirmacaoFinal =
    confirm(

      '🚨 ÚLTIMA CONFIRMAÇÃO\\n\\n' +

      'Você está prestes a excluir:\\n\\n' +

      protocolo +
      '\\n\\n' +

      'O registro será removido definitivamente.\\n\\n' +

      'CONFIRMAR EXCLUSÃO?'

    );

  if (!confirmacaoFinal) {
    return;
  }

  const detalhe =
    document.getElementById('detalhe');

  detalhe.innerHTML =

    '<div class="card">' +

      '<div style="text-align:center;padding:20px">' +

        '⏳ Excluindo solicitação...' +

      '</div>' +

    '</div>';

  google.script.run

    .withSuccessHandler(
      function(resultado) {

        if (
          !resultado ||
          !resultado.sucesso
        ) {

          alert(
            '❌ Não foi possível excluir a solicitação.'
          );

          carregar();

          return;

        }

        alert(

          '🗑️ Solicitação excluída com sucesso!\\n\\n' +

          'Protocolo: ' +
          resultado.protocolo

        );

        carregar();

      }
    )

    .withFailureHandler(
      function(erro) {

        alert(

          '❌ Não foi possível excluir a solicitação.\\n\\n' +

          (
            erro.message ||
            String(erro)
          )

        );

        carregar();

      }
    )

    .excluirSolicitacao(
      protocolo
    );

}


function escapeHtml(valor) {

  if (
    valor === null ||
    valor === undefined
  ) {
    return '';
  }

  return String(valor)

    .replace(
      /&/g,
      '&amp;'
    )

    .replace(
      /</g,
      '&lt;'
    )

    .replace(
      />/g,
      '&gt;'
    )

    .replace(
      /"/g,
      '&quot;'
    )

    .replace(
      /'/g,
      '&#039;'
    );

}

</script>

</body>

</html>

`;

}


// ============================================================
// LISTA PARA WHATSAPP
// ============================================================

function abrirListaWhatsApp() {

  const html =
    HtmlService
      .createHtmlOutput(
        criarPaginaListaWhatsApp_()
      )
      .setWidth(760)
      .setHeight(720);

  SpreadsheetApp
    .getUi()
    .showModalDialog(
      html,
      '📱 Lista para WhatsApp'
    );

}


// ============================================================
// GERAR LISTA WHATSAPP
// ============================================================

function gerarListaWhatsApp() {

  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  const sheet =
    ss.getSheetByName(
      CONFIG.ABA_SOLICITACOES
    );

  if (!sheet) {

    throw new Error(
      'A aba SOLICITACOES não existe.'
    );

  }

  const ultimaLinha =
    obterUltimaLinhaReal_(
      sheet,
      COL.PROTOCOLO
    );

  if (ultimaLinha < 2) {

    return {

      sucesso: true,

      quantidade: 0,

      texto:
        '📦 *CONTROLE DE PEDIDOS*\n\n' +
        'Não existem solicitações cadastradas.'

    };

  }

  const dados =
    sheet
      .getRange(
        2,
        1,
        ultimaLinha - 1,
        16
      )
      .getValues();

  const pendentes = dados.filter(linha => {
    const protocolo = String(linha[COL.PROTOCOLO  - 1] || '').trim();
    if (!protocolo) return false;

    const situacao = String(linha[COL.SITUACAO - 1] || '')
    .trim()
    .toUpperCase();

    const whatsappEnviado = String(linha[COL.WHATSAPP_ENVIADO - 1] || '')
    .trim()
    .toUpperCase();

    return (
    (situacao === 'PENDENTE' || situacao === '') &&
    whatsappEnviado !== 'SIM'
      );
  });

  if (!pendentes.length) {

    return {

      sucesso: true,

      quantidade: 0,

      texto:
        '📦 *CONTROLE DE PEDIDOS*\n\n' +
        '✅ Não existem solicitações pendentes no momento.'

    };

  }

  const ordemPrioridade = {

    'URGENTE': 1,
    'ALTA': 2,
    'NORMAL': 3,
    'BAIXA': 4

  };

  pendentes.sort(
    function(a, b) {

      const prioridadeA =
        String(
          a[COL.PRIORIDADE - 1] ||
          'NORMAL'
        )
          .trim()
          .toUpperCase();

      const prioridadeB =
        String(
          b[COL.PRIORIDADE - 1] ||
          'NORMAL'
        )
          .trim()
          .toUpperCase();

      const ordemA =
        ordemPrioridade[
          prioridadeA
        ] || 3;

      const ordemB =
        ordemPrioridade[
          prioridadeB
        ] || 3;

      if (
        ordemA !==
        ordemB
      ) {

        return ordemA - ordemB;

      }

      const dataA =
        a[COL.DATA_PEDIDO - 1];

      const dataB =
        b[COL.DATA_PEDIDO - 1];

      if (
        dataA instanceof Date &&
        dataB instanceof Date
      ) {

        return (
          dataA.getTime() -
          dataB.getTime()
        );

      }

      return 0;

    }
  );

  const agora =
    new Date();

  const dataAtual =
    Utilities.formatDate(
      agora,
      Session.getScriptTimeZone(),
      'dd/MM/yyyy'
    );

  let texto = '';

  texto +=
    '📦 *CONTROLE DE PEDIDOS*\n';

  texto +=
    '📅 ' +
    dataAtual +
    '\n';

  texto +=
    '📋 *Solicitações pendentes: ' +
    pendentes.length +
    '*\n\n';

  pendentes.forEach(
    function(linha, indice) {

      const protocolo =
        String(
          linha[COL.PROTOCOLO - 1] || ''
        ).trim();

      const solicitante =
        String(
          linha[COL.SOLICITANTE - 1] || ''
        ).trim();

      const material =
        String(
          linha[COL.MATERIAL - 1] || ''
        ).trim();

      const quantidade =
        formatarQuantidadeWhatsApp_(
          linha[COL.QUANTIDADE - 1]
        );

      const onde =
        String(
          linha[COL.ONDE - 1] || ''
        ).trim();

      const paraQue =
        String(
          linha[COL.PARA_QUE - 1] || ''
        ).trim();

      const prioridade =
        String(
          linha[COL.PRIORIDADE - 1] ||
          'NORMAL'
        )
          .trim()
          .toUpperCase();

      const she =
        String(
          linha[COL.SHE - 1] ||
          'NÃO'
        )
          .trim()
          .toUpperCase();

      const observacoes =
        String(
          linha[COL.OBSERVACOES - 1] ||
          ''
        ).trim();

      let iconePrioridade =
        '🟡';

      if (
        prioridade === 'URGENTE'
      ) {

        iconePrioridade =
          '🚨';

      } else if (
        prioridade === 'ALTA'
      ) {

        iconePrioridade =
          '🔴';

      } else if (
        prioridade === 'BAIXA'
      ) {

        iconePrioridade =
          '🟢';

      }

      texto +=
        '*' +
        (indice + 1) +
        '. ' +
        protocolo +
        '*\n';

      texto +=
        '👤 ' +
        solicitante +
        '\n';

      texto +=
        '📦 *' +
        material +
        '*\n';

      texto +=
        '🔢 Quantidade: ' +
        quantidade +
        '\n';

      texto +=
        '📍 Onde: ' +
        onde +
        '\n';

      texto +=
        '🎯 Para que: ' +
        paraQue +
        '\n';

      texto +=
        iconePrioridade +
        ' Prioridade: *' +
        prioridade +
        '*\n';

      if (
        she === 'SIM'
      ) {

        texto +=
          '⚠️ *Necessita liberação SHE*\n';

      }

      if (
        observacoes
      ) {

        texto +=
          '📝 Observação: ' +
          observacoes +
          '\n';

      }

      texto +=
        '\n';

      texto +=
        '────────────────────\n\n';

    }
  );

  texto +=
    '📌 *Favor verificar e dar andamento aos pedidos acima.*';

  return {

    sucesso: true,

    quantidade:
      pendentes.length,

    texto:
      texto

  };

}


// ============================================================
// FORMATAR QUANTIDADE WHATSAPP
// ============================================================

function formatarQuantidadeWhatsApp_(quantidade) {

  if (
    quantidade === null ||
    quantidade === undefined ||
    quantidade === ''
  ) {

    return '-';

  }

  const numero =
    Number(
      quantidade
    );

  if (
    !Number.isFinite(numero)
  ) {

    return String(
      quantidade
    );

  }

  if (
    Number.isInteger(numero)
  ) {

    return String(
      numero
    );

  }

  return String(
    numero
  );

}


// ============================================================
// PÁGINA WHATSAPP
// ============================================================

function criarPaginaListaWhatsApp_() {

  return `

<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<meta name="viewport"
content="width=device-width, initial-scale=1">

<style>

* {
  box-sizing:border-box;
}

body {

  margin:0;
  padding:20px;

  font-family:Arial,sans-serif;

  background:#f1f5f9;

  color:#1e293b;

}

.container {

  max-width:720px;
  margin:auto;

}

.card {

  background:white;

  border-radius:12px;

  padding:20px;

  box-shadow:0 3px 12px rgba(0,0,0,.08);

}

h2 {
  margin:0 0 6px 0;
}

.subtitulo {

  color:#64748b;

  font-size:13px;

  margin-bottom:15px;

}

.info {

  padding:10px 12px;

  background:#eff6ff;

  border:1px solid #bfdbfe;

  border-radius:8px;

  margin-bottom:14px;

  font-size:13px;

}

textarea {

  width:100%;

  min-height:430px;

  resize:vertical;

  padding:14px;

  border:1px solid #cbd5e1;

  border-radius:8px;

  font-family:Arial,sans-serif;

  font-size:14px;

  line-height:1.45;

  color:#1e293b;

  background:#f8fafc;

}

.acoes {

  display:flex;

  gap:10px;

  margin-top:14px;

  flex-wrap:wrap;

}

button {

  border:0;

  border-radius:8px;

  padding:12px 16px;

  font-weight:bold;

  cursor:pointer;

  font-size:14px;

}

.btn-copiar {

  background:#16a34a;
  color:white;

}

.btn-atualizar {

  background:#2563eb;
  color:white;

}

.btn-fechar {

  background:#64748b;
  color:white;

}

.mensagem {

  display:none;

  margin-top:12px;

  padding:10px;

  border-radius:7px;

  background:#dcfce7;

  color:#166534;

  font-weight:bold;

}

@media(max-width:600px) {

  body {
    padding:10px;
  }

  .card {
    padding:15px;
  }

  textarea {
    min-height:400px;
  }

  .acoes button {
    width:100%;
  }

}

</style>

</head>

<body>

<div class="container">

<div class="card">

<h2>
📱 Lista para WhatsApp
</h2>

<div class="subtitulo">

Lista das solicitações pendentes,
organizadas por prioridade.

</div>

<div
id="info"
class="info">

Carregando solicitações...

</div>

<textarea
id="texto"
readonly
placeholder="Gerando lista...">
</textarea>

<div class="acoes">

<button
class="btn-copiar"
onclick="copiar()">

📋 Copiar texto

</button>

<button
class="btn-atualizar"
onclick="carregar()">

🔄 Atualizar lista

</button>

<button
class="btn-fechar"
onclick="fechar()">

Fechar

</button>

</div>

<div
id="mensagem"
class="mensagem">

✅ Texto copiado!

</div>

</div>

</div>

<script>

let carregando = false;


window.onload = function() {

  carregar();

};


function carregar() {

  if (carregando) {
    return;
  }

  carregando = true;

  const textarea =
    document.getElementById('texto');

  const info =
    document.getElementById('info');

  textarea.value =
    'Gerando lista...';

  info.textContent =
    '⏳ Consultando solicitações pendentes...';

  google.script.run

    .withSuccessHandler(
      function(resultado) {

        carregando = false;

        if (
          !resultado ||
          !resultado.sucesso
        ) {

          textarea.value = '';

          info.textContent =
            '❌ Não foi possível gerar a lista.';

          return;

        }

        textarea.value =
          resultado.texto || '';

        if (
          resultado.quantidade === 0
        ) {

          info.textContent =
            '✅ Nenhuma solicitação pendente.';

        } else {

          info.textContent =
            '📋 ' +
            resultado.quantidade +
            ' solicitação(ões) pendente(s) encontradas.';

        }

        textarea.focus();

      }
    )

    .withFailureHandler(
      function(erro) {

        carregando = false;

        textarea.value = '';

        info.textContent =
          '❌ Erro: ' +
          (
            erro.message ||
            String(erro)
          );

      }
    )

    .gerarListaWhatsApp();

}


function copiar() {

  const textarea =
    document.getElementById('texto');

  const texto =
    textarea.value;

  if (!texto) {
    return;
  }

  if (
    navigator.clipboard &&
    navigator.clipboard.writeText
  ) {

    navigator.clipboard
      .writeText(texto)

      .then(
        function() {

          mostrarMensagem();

        }
      )

      .catch(
        function() {

          copiarAlternativo();

        }
      );

    return;

  }

  copiarAlternativo();

}


function copiarAlternativo() {

  const textarea =
    document.getElementById('texto');

  textarea.removeAttribute(
    'readonly'
  );

  textarea.select();

  textarea.setSelectionRange(
    0,
    textarea.value.length
  );

  try {

    document.execCommand(
      'copy'
    );

    mostrarMensagem();

  } catch (erro) {

    alert(
      'Não foi possível copiar automaticamente. ' +
      'Selecione o texto e copie manualmente.'
    );

  }

  textarea.setAttribute(
    'readonly',
    'readonly'
  );

}


function mostrarMensagem() {

  const mensagem =
    document.getElementById(
      'mensagem'
    );

  mensagem.style.display =
    'block';

  setTimeout(
    function() {

      mensagem.style.display =
        'none';

    },
    2500
  );

}


function fechar() {

  google.script.host.close();

}

</script>

</body>

</html>

`;

}


// ============================================================
// CADASTRO DE ITEM
// ============================================================

function abrirCadastroItem() {

  const html =
    HtmlService
      .createHtmlOutput(
        criarPaginaCadastroItem_()
      )
      .setWidth(500)
      .setHeight(550);

  SpreadsheetApp
    .getUi()
    .showModalDialog(
      html,
      '📦 Cadastro de Item'
    );

}


function criarPaginaCadastroItem_() {

  return `

<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<style>

body {

  font-family:Arial;

  padding:20px;

  background:#f1f5f9;

}

.card {

  background:white;

  padding:20px;

  border-radius:10px;

}

label {

  display:block;

  font-weight:bold;

  margin-top:12px;

  margin-bottom:5px;

}

input,
select {

  width:100%;

  padding:10px;

  box-sizing:border-box;

}

button {

  margin-top:18px;

  padding:10px 15px;

  border:0;

  border-radius:6px;

  background:#2563eb;

  color:white;

  font-weight:bold;

  cursor:pointer;

}

</style>

</head>

<body>

<div class="card">

<h2>
📦 Novo Item
</h2>

<label>
Item
</label>

<input
id="item"
placeholder="Ex.: Furadeira">

<label>
Tipo
</label>

<select id="tipo">

<option>MATERIAL</option>
<option>FERRAMENTA</option>
<option>EQUIPAMENTO</option>
<option>OUTROS</option>

</select>

<label>
Unidade
</label>

<select id="unidade">

<option>UN</option>
<option>M</option>
<option>KG</option>
<option>L</option>
<option>CX</option>
<option>PC</option>
<option>KIT</option>

</select>

<button
onclick="salvar()">

Cadastrar

</button>

<script>

function salvar() {

  const item =
    document.getElementById('item')
      .value
      .trim();

  if (!item) {

    alert(
      'Informe o item.'
    );

    return;

  }

  google.script.run

    .withSuccessHandler(
      function(resultado) {

        alert(
          'Item cadastrado: ' +
          resultado.item
        );

        google.script.host.close();

      }
    )

    .withFailureHandler(
      function(erro) {

        alert(
          erro.message ||
          String(erro)
        );

      }
    )

    .cadastrarItem({

      item: item,

      tipo:
        document.getElementById('tipo')
          .value,

      unidade:
        document.getElementById('unidade')
          .value

    });

}

</script>

</div>

</body>

</html>

`;

}


// ============================================================
// CADASTRO DE USUÁRIO
// ============================================================

function abrirCadastroUsuario() {

  const html =
    HtmlService
      .createHtmlOutput(
        criarPaginaCadastroUsuario_()
      )
      .setWidth(500)
      .setHeight(450);

  SpreadsheetApp
    .getUi()
    .showModalDialog(
      html,
      '👤 Cadastro de Usuário'
    );

}


function criarPaginaCadastroUsuario_() {

  return `

<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<style>

body {

  font-family:Arial;

  padding:20px;

  background:#f1f5f9;

}

.card {

  background:white;

  padding:20px;

  border-radius:10px;

}

label {

  display:block;

  font-weight:bold;

  margin-top:12px;

  margin-bottom:5px;

}

input {

  width:100%;

  padding:10px;

  box-sizing:border-box;

}

button {

  margin-top:18px;

  padding:10px 15px;

  border:0;

  border-radius:6px;

  background:#2563eb;

  color:white;

  font-weight:bold;

  cursor:pointer;

}

</style>

</head>

<body>

<div class="card">

<h2>
👤 Novo Usuário
</h2>

<label>
Nome
</label>

<input
id="nome"
placeholder="Nome completo">

<label>
E-mail
</label>

<input
id="email"
type="email"
placeholder="email@empresa.com">

<button
onclick="salvar()">

Cadastrar

</button>

<script>

function salvar() {

  const nome =
    document.getElementById('nome')
      .value
      .trim();

  const email =
    document.getElementById('email')
      .value
      .trim();

  if (!nome || !email) {

    alert(
      'Preencha nome e e-mail.'
    );

    return;

  }

  google.script.run

    .withSuccessHandler(
      function(resultado) {

        alert(
          'Usuário cadastrado: ' +
          resultado.nome
        );

        google.script.host.close();

      }
    )

    .withFailureHandler(
      function(erro) {

        alert(
          erro.message ||
          String(erro)
        );

      }
    )

    .cadastrarUsuario({

      nome: nome,

      email: email

    });

}

</script>

</div>

</body>

</html>

`;

}


// ============================================================
// TESTE DO SISTEMA
// ============================================================

function testarSistema() {

  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  const abas = [

    CONFIG.ABA_SOLICITACOES,
    CONFIG.ABA_ITENS,
    CONFIG.ABA_USUARIOS,
    CONFIG.ABA_CONFIG,
    CONFIG.ABA_DASHBOARD

  ];

  const faltando =
    abas.filter(
      nome =>
        !ss.getSheetByName(nome)
    );

  if (faltando.length) {

    SpreadsheetApp
      .getUi()
      .alert(

        '⚠️ Abas faltando:\n\n' +

        faltando
          .map(
            nome =>
              '• ' + nome
          )
          .join('\n')

      );

    return false;

  }

  const solicitacoes =
    ss.getSheetByName(
      CONFIG.ABA_SOLICITACOES
    );

  const ultimaColuna =
    solicitacoes
      ? solicitacoes.getLastColumn()
      : 0;

  if (
    ultimaColuna !== 16
  ) {

    SpreadsheetApp
      .getUi()
      .alert(

        '⚠️ A aba SOLICITACOES deveria possuir 16 colunas.\n\n' +

        'Encontradas: ' +
        ultimaColuna

      );

    return false;

  }

  SpreadsheetApp
    .getUi()
    .alert(

      '✅ Sistema funcionando.\n\n' +

      'Todas as abas necessárias existem.\n' +

      'SOLICITACOES possui 16 colunas.\n\n' +

      '📱 Lista para WhatsApp disponível.\n' +

      '🗑️ Exclusão disponível na consulta.'

    );

  return true;

}


// ============================================================
// FORMATAR DATA
// ============================================================

function formatarDataWeb_(data) {

  if (!data) {
    return '';
  }

  if (
    Object.prototype
      .toString
      .call(data) !==
    '[object Date]'
  ) {

    return String(data);

  }

  return Utilities
    .formatDate(
      data,
      Session.getScriptTimeZone(),
      'dd/MM/yyyy HH:mm'
    );

}


function formatarDataSemHora_(data) {
  if (!data) return '';
  if (Object.prototype.toString.call(data) === '[object Date]') {
    if (isNaN(data.getTime())) return '';
    return Utilities.formatDate(data, Session.getScriptTimeZone(), 'dd/MM/yyyy');
  }
  var str = String(data).trim();
  if (!str) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    var p = str.split('T')[0].split('-');
    return p[2] + '/' + p[1] + '/' + p[0];
  }
  if (str.indexOf(' ') !== -1) {
    return str.split(' ')[0];
  }
  return str;
}


function parseDataParaSheets_(dataStr) {
  if (!dataStr) return '';
  if (Object.prototype.toString.call(dataStr) === '[object Date]') {
    return isNaN(dataStr.getTime()) ? '' : dataStr;
  }
  var str = String(dataStr).trim();
  if (!str) return '';

  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    var p = str.split('T')[0].split('-');
    return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  }
  if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(str)) {
    var p = str.split(' ')[0].split('/');
    return new Date(Number(p[2]), Number(p[1]) - 1, Number(p[0]));
  }

  var d = new Date(str);
  return isNaN(d.getTime()) ? '' : d;
}


function obterMapeamentoColunasSolicitacoes_(sheet) {
  var mapa = {
    PROTOCOLO: COL.PROTOCOLO,
    DATA_PEDIDO: COL.DATA_PEDIDO,
    SOLICITANTE: COL.SOLICITANTE,
    EMAIL: COL.EMAIL,
    MATERIAL: COL.MATERIAL,
    QUANTIDADE: COL.QUANTIDADE,
    ONDE: COL.ONDE,
    PARA_QUE: COL.PARA_QUE,
    PRIORIDADE: COL.PRIORIDADE,
    SHE: COL.SHE,
    OBSERVACOES: COL.OBSERVACOES,
    ULTIMA_ATUALIZACAO: COL.ULTIMA_ATUALIZACAO,
    DATA_ENTREGA: COL.DATA_ENTREGA,
    DIAS_DECORRIDOS: COL.DIAS_DECORRIDOS,
    SITUACAO: COL.SITUACAO,
    WHATSAPP_ENVIADO: COL.WHATSAPP_ENVIADO,
    RESPONSAVEL_COMPRA: COL.RESPONSAVEL_COMPRA,
    DATA_COMPRA: COL.DATA_COMPRA,
    PREVISAO_CHEGADA: COL.PREVISAO_CHEGADA,
    STATUS_COMPRA: COL.STATUS_COMPRA
  };

  try {
    if (sheet && sheet.getLastColumn() >= 1) {
      var headers = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 20)).getValues()[0];
      for (var c = 0; c < headers.length; c++) {
        var h = normalizarTexto_(headers[c]);
        if (h === 'PROTOCOLO') mapa.PROTOCOLO = c + 1;
        else if (h.indexOf('RESPONSAVEL') !== -1) mapa.RESPONSAVEL_COMPRA = c + 1;
        else if (h === 'DATA_COMPRA' || h === 'DATA DA COMPRA') mapa.DATA_COMPRA = c + 1;
        else if (h.indexOf('PREVISAO') !== -1) mapa.PREVISAO_CHEGADA = c + 1;
        else if (h === 'STATUS_COMPRA' || h === 'STATUS DA COMPRA') mapa.STATUS_COMPRA = c + 1;
        else if (h.indexOf('ULTIMA') !== -1 || h.indexOf('ATUALIZACAO') !== -1) mapa.ULTIMA_ATUALIZACAO = c + 1;
        else if (h.indexOf('SITUACAO') !== -1) mapa.SITUACAO = c + 1;
        else if (h.indexOf('WHATSAPP') !== -1) mapa.WHATSAPP_ENVIADO = c + 1;
        else if (h.indexOf('ENTREGA') !== -1) mapa.DATA_ENTREGA = c + 1;
      }
    }
  } catch (e) {
    console.warn('Erro ao mapear cabeçalhos de solicitações: ' + e.message);
  }

  return mapa;
}


// ============================================================
// NORMALIZAR TEXTO
// ============================================================

function normalizarTexto_(valor) {

  return String(
    valor || ''
  )
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      ''
    );

}


// ============================================================
// OBTER ÚLTIMA LINHA REAL
// ============================================================

function obterUltimaLinhaReal_(
  sheet,
  coluna
) {

  coluna =
    coluna ||
    1;

  const lastRow =
    sheet.getLastRow();

  if (lastRow < 2) {
    return 1;
  }

  const valores =
    sheet
      .getRange(
        1,
        coluna,
        lastRow,
        1
      )
      .getValues();

  for (
    let i = valores.length - 1;
    i >= 1;
    i--
  ) {

    if (
      String(
        valores[i][0] || ''
      ).trim() !== ''
    ) {

      return i + 1;

    }

  }

  return 1;

}


// ============================================================
// FILTRO SEGURO
// ============================================================

function criarFiltroSeguro_(
  sheet,
  quantidadeColunas
) {

  try {

    const filtro =
      sheet.getFilter();

    if (filtro) {

      filtro.remove();

    }

    if (
      sheet.getMaxRows() >= 2
    ) {

      sheet
        .getRange(
          1,
          1,
          Math.max(
            sheet.getLastRow(),
            2
          ),
          quantidadeColunas
        )
        .createFilter();

    }

  } catch (erro) {

    console.log(
      'Filtro não criado: ' +
      erro.message
    );

  }

}


// ============================================================
// CABEÇALHO
// ============================================================

function formatarCabecalho_(
  sheet,
  quantidadeColunas
) {

  sheet
    .getRange(
      1,
      1,
      1,
      quantidadeColunas
    )
    .setFontWeight('bold')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');

}


// ============================================================
// API WEB APP - COMUNICAÇÃO HTTP
// ============================================================

function doGet(e) {

  try {

    const parametros =
      e && e.parameter
        ? e.parameter
        : {};

    const acao =
      String(
        parametros.acao ||
        'teste'
      )
        .trim();

    return respostaJson_(
      executarAcaoApi_(
        acao,
        parametros,
        null
      )
    );

  } catch (erro) {

    return respostaErroApi_(
      erro
    );

  }

}


function doPost(e) {

  try {

    if (!e) {

      throw new Error(
        'Requisição POST não recebida.'
      );

    }

    let dadosRecebidos = {};

    if (
      e.postData &&
      e.postData.contents
    ) {

      const corpo =
        String(
          e.postData.contents
        ).trim();

      if (corpo) {

        try {

          dadosRecebidos =
            JSON.parse(
              corpo
            );

        } catch (erroJson) {

          throw new Error(
            'O corpo da requisição não contém um JSON válido.'
          );

        }

      }

    }

    const parametros =
      e.parameter || {};

    const acao =
      String(
        dadosRecebidos.acao ||
        parametros.acao ||
        ''
      )
        .trim();

    if (!acao) {

      throw new Error(
        'Nenhuma ação foi informada na requisição.'
      );

    }

    return respostaJson_(
      executarAcaoApi_(
        acao,
        parametros,
        dadosRecebidos
      )
    );

  } catch (erro) {

    return respostaErroApi_(
      erro
    );

  }

}


function executarAcaoApi_(
  acao,
  parametros,
  corpo
) {

  const nomeAcao =
    String(
      acao || ''
    )
      .trim()
      .toLowerCase();


  if (
    nomeAcao === 'teste' ||
    nomeAcao === 'testar' ||
    nomeAcao === 'health' ||
    nomeAcao === 'ping'
  ) {

    return {

      sucesso: true,

      status: 'online',

      mensagem:
        'Google Apps Script conectado com sucesso.',

      timestamp:
        formatarDataWeb_(
          new Date()
        )

    };

  }


  if (
    nomeAcao === 'corrigirestruturausuarios' ||
    nomeAcao === 'migrarusuarios'
  ) {
    return corrigirEstruturaUsuarios_();
  }

  if (
    nomeAcao === 'verificarprimeiroacesso'
  ) {
    return verificarPrimeiroAcesso();
  }

  if (
    nomeAcao === 'criarprimeiroadministrador'
  ) {
    const dados = (corpo && corpo.dados) ? corpo.dados : (corpo || parametros);
    return criarPrimeiroAdministrador(dados);
  }

  if (
    nomeAcao === 'login' ||
    nomeAcao === 'loginusuario'
  ) {
    const usuario = obterParametroApi_(parametros, corpo, 'usuario') || obterParametroApi_(parametros, corpo, 'login');
    const senha = obterParametroApi_(parametros, corpo, 'senha');

    const resultado = loginUsuario(usuario, senha);
    return {
      sucesso: true,
      ...resultado
    };
  }

  if (
    nomeAcao === 'definirsenhaprimeiroacesso'
  ) {
    const usuario = obterParametroApi_(parametros, corpo, 'usuario') || obterParametroApi_(parametros, corpo, 'login');
    const senha = obterParametroApi_(parametros, corpo, 'senha') || obterParametroApi_(parametros, corpo, 'novaSenha');

    const resultado = definirSenhaPrimeiroAcesso(usuario, senha);
    return {
      sucesso: true,
      ...resultado
    };
  }


  if (
    nomeAcao === 'logout' ||
    nomeAcao === 'logoutusuario'
  ) {
    const token = obterParametroApi_(parametros, corpo, 'token');
    const resultado = logoutUsuario(token);
    return {
      sucesso: true,
      ...resultado
    };
  }


  if (
    nomeAcao ===
    'listarsolicitacoes'
  ) {
    const token = obterParametroApi_(parametros, corpo, 'token');
    exigirSessaoValida_(token);

    return {

      sucesso: true,

      dados:
        listarSolicitacoes()

    };

  }


  if (
    nomeAcao ===
    'buscarsolicitacao'
  ) {
    const token = obterParametroApi_(parametros, corpo, 'token');
    exigirSessaoValida_(token);

    const protocolo =
      obterParametroApi_(
        parametros,
        corpo,
        'protocolo'
      );

    if (!protocolo) {

      throw new Error(
        'Informe o protocolo da solicitação.'
      );

    }

    const resultado =
      buscarSolicitacao(
        protocolo
      );

    return {

      sucesso: true,

      ...resultado

    };

  }


  if (
    nomeAcao ===
    'criarsolicitacao'
  ) {
    const token = obterParametroApi_(parametros, corpo, 'token');
    exigirSessaoValida_(token);

    const dados =
      obterDadosApi_(
        parametros,
        corpo
      );

    if (
      !dados ||
      typeof dados !== 'object'
    ) {

      throw new Error(
        'Dados da solicitação não foram informados.'
      );

    }

    const resultado =
      criarSolicitacao(
        dados
      );

    return {

      sucesso: true,

      ...resultado

    };

  }


  if (
    nomeAcao ===
    'atualizarsolicitacao'
  ) {
    const token = obterParametroApi_(parametros, corpo, 'token');
    exigirSessaoValida_(token);

    const protocolo =
      obterParametroApi_(
        parametros,
        corpo,
        'protocolo'
      );

    if (!protocolo) {

      throw new Error(
        'Informe o protocolo.'
      );

    }

    const dados =
      obterDadosApi_(
        parametros,
        corpo
      );

    const resultado =
      atualizarSolicitacao(
        protocolo,
        dados
      );

    return {

      sucesso: true,

      ...resultado

    };

  }


  if (
    nomeAcao ===
    'marcarwhatsappenviado'
  ) {
    const token = obterParametroApi_(parametros, corpo, 'token');
    exigirSessaoValida_(token);

    const protocolo =
      obterParametroApi_(
        parametros,
        corpo,
        'protocolo'
      );

    if (!protocolo) {

      throw new Error(
        'Informe o protocolo da solicitação.'
      );

    }

    let enviado = true;

    if (corpo && corpo.enviado !== undefined) {
      enviado = corpo.enviado;
    } else if (
      corpo &&
      corpo.dados &&
      corpo.dados.enviado !== undefined
    ) {
      enviado = corpo.dados.enviado;
    } else if (
      parametros &&
      parametros.enviado !== undefined
    ) {
      enviado = parametros.enviado;
    }

    const resultado =
      marcarWhatsAppEnviado(
        protocolo,
        enviado
      );

    return {

      sucesso: true,

      ...resultado

    };

  }


  if (
    nomeAcao ===
    'excluirsolicitacao'
  ) {
    const token = obterParametroApi_(parametros, corpo, 'token');
    const sessao = exigirSessaoValida_(token);
    if (sessao.perfil !== 'ADM') {
      throw new Error('Apenas administradores podem excluir solicitações.');
    }

    const protocolo =
      obterParametroApi_(
        parametros,
        corpo,
        'protocolo'
      );

    if (!protocolo) {

      throw new Error(
        'Informe o protocolo da solicitação.'
      );

    }

    const resultado =
      excluirSolicitacao(
        protocolo
      );

    return {

      sucesso: true,

      ...resultado

    };

  }


  if (
    nomeAcao ===
    'marcarcomoentregue' ||

    nomeAcao ===
    'entregarsolicitacao'
  ) {
    const token = obterParametroApi_(parametros, corpo, 'token');
    exigirSessaoValida_(token);

    const protocolo =
      obterParametroApi_(
        parametros,
        corpo,
        'protocolo'
      );

    if (!protocolo) {

      throw new Error(
        'Informe o protocolo da solicitação.'
      );

    }

    const resultado =
      marcarComoEntregue(
        protocolo
      );

    return {

      sucesso: true,

      ...resultado

    };

  }


  if (
    nomeAcao ===
    'listaritens'
  ) {
    const token = obterParametroApi_(parametros, corpo, 'token');
    exigirSessaoValida_(token);

    return {

      sucesso: true,

      dados:
        listarItens()

    };

  }


  if (
    nomeAcao ===
    'cadastraritem'
  ) {
    const token = obterParametroApi_(parametros, corpo, 'token');
    exigirSessaoValida_(token);

    const dados =
      obterDadosApi_(
        parametros,
        corpo
      );

    const resultado =
      cadastrarItem(
        dados
      );

    return {

      sucesso: true,

      ...resultado

    };

  }


  if (
    nomeAcao ===
    'listarusuarios'
  ) {
    const token = obterParametroApi_(parametros, corpo, 'token');
    exigirSessaoValida_(token);

    return {

      sucesso: true,

      dados:
        listarUsuarios()

    };

  }


  if (
    nomeAcao ===
    'cadastrarusuario'
  ) {

    const dados =
      obterDadosApi_(
        parametros,
        corpo
      );

    const token = obterParametroApi_(parametros, corpo, 'token');

    const resultado =
      cadastrarUsuario(
        dados,
        token
      );

    return {

      sucesso: true,

      ...resultado

    };

  }


  if (
    nomeAcao === 'atualizarusuario'
  ) {
    const usuarioTarget = obterParametroApi_(parametros, corpo, 'idUsuario') || obterParametroApi_(parametros, corpo, 'usuarioTarget') || obterParametroApi_(parametros, corpo, 'usuario');
    const dados = obterDadosApi_(parametros, corpo);
    const token = obterParametroApi_(parametros, corpo, 'token');

    const resultado = atualizarUsuario(usuarioTarget, dados, token);
    return {
      sucesso: true,
      ...resultado
    };
  }


  if (
    nomeAcao === 'alterarstatususuario'
  ) {
    const usuarioTarget = obterParametroApi_(parametros, corpo, 'idUsuario') || obterParametroApi_(parametros, corpo, 'usuarioTarget') || obterParametroApi_(parametros, corpo, 'usuario');
    const ativo = obterParametroApi_(parametros, corpo, 'ativo');
    const token = obterParametroApi_(parametros, corpo, 'token');

    const resultado = alterarStatusUsuario(usuarioTarget, ativo, token);
    return {
      sucesso: true,
      ...resultado
    };
  }


  if (
    nomeAcao === 'redefinirsenha'
  ) {
    const usuarioTarget = obterParametroApi_(parametros, corpo, 'idUsuario') || obterParametroApi_(parametros, corpo, 'usuarioTarget') || obterParametroApi_(parametros, corpo, 'usuario');
    const novaSenha = obterParametroApi_(parametros, corpo, 'novaSenha') || obterParametroApi_(parametros, corpo, 'senha');
    const token = obterParametroApi_(parametros, corpo, 'token');

    const resultado = redefinirSenha(usuarioTarget, novaSenha, token);
    return {
      sucesso: true,
      ...resultado
    };
  }


  if (
    nomeAcao === 'excluirusuario'
  ) {
    const usuarioTarget = obterParametroApi_(parametros, corpo, 'idUsuario') || obterParametroApi_(parametros, corpo, 'usuarioTarget') || obterParametroApi_(parametros, corpo, 'usuario');
    const token = obterParametroApi_(parametros, corpo, 'token');

    const resultado = excluirUsuario(usuarioTarget, token);
    return {
      sucesso: true,
      ...resultado
    };
  }


  if (
    nomeAcao === 'atualizarcontrolecompra'
  ) {
    const protocolo = obterParametroApi_(parametros, corpo, 'protocolo');
    const dados = obterDadosApi_(parametros, corpo);
    const token = obterParametroApi_(parametros, corpo, 'token');

    const resultado = atualizarControleCompra(protocolo, dados, token);
    return {
      sucesso: true,
      ...resultado
    };
  }


  if (
    nomeAcao ===
    'gerarlistawhatsapp'
  ) {
    const token = obterParametroApi_(parametros, corpo, 'token');
    exigirSessaoValida_(token);

    const resultado =
      gerarListaWhatsApp();

    return {

      sucesso: true,

      ...resultado

    };

  }


  if (
    nomeAcao ===
    'testarsistema'
  ) {
    const token = obterParametroApi_(parametros, corpo, 'token');
    const sessao = exigirSessaoValida_(token);
    if (sessao.perfil !== 'ADM') {
      throw new Error('Apenas administradores podem testar o sistema.');
    }

    const resultado =
      testarSistema();

    return {

      sucesso: Boolean(
        resultado
      ),

      sistema:
        Boolean(
          resultado
        )

    };

  }


  throw new Error(

    'Ação não reconhecida: ' +
    acao

  );

}


function obterDadosApi_(
  parametros,
  corpo
) {

  if (
    corpo &&
    corpo.dados &&
    typeof corpo.dados === 'object'
  ) {

    return corpo.dados;

  }

  if (
    corpo &&
    typeof corpo === 'object'
  ) {

    const copia =
      Object.assign(
        {},
        corpo
      );

    delete copia.acao;

    return copia;

  }

  return Object.assign(
    {},
    parametros || {}
  );

}


function obterParametroApi_(
  parametros,
  corpo,
  nome
) {

  if (
    corpo &&
    corpo[nome] !== undefined &&
    corpo[nome] !== null
  ) {

    return String(
      corpo[nome]
    ).trim();

  }

  if (
    corpo &&
    corpo.dados &&
    corpo.dados[nome] !== undefined &&
    corpo.dados[nome] !== null
  ) {

    return String(
      corpo.dados[nome]
    ).trim();

  }

  if (
    parametros &&
    parametros[nome] !== undefined &&
    parametros[nome] !== null
  ) {

    return String(
      parametros[nome]
    ).trim();

  }

  return '';

}


// ============================================================
// RESPOSTA JSON
// ============================================================

function respostaJson_(
  objeto
) {

  return ContentService

    .createTextOutput(
      JSON.stringify(
        objeto || {}
      )
    )

    .setMimeType(
      ContentService
        .MimeType
        .JSON
    );

}


// ============================================================
// RESPOSTA DE ERRO
// ============================================================

function respostaErroApi_(
  erro
) {

  const mensagem =
    erro &&
    erro.message
      ? erro.message
      : String(
          erro || 
          'Erro desconhecido.'
        );

  console.error(
    'ERRO API: ' +
    mensagem
  );

  return respostaJson_({

    sucesso: false,

    erro: true,

    mensagem: mensagem,

    timestamp:
      formatarDataWeb_(
        new Date()
      )

  });

}

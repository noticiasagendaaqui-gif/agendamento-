/**
 * SISTEMA DE AGENDAMENTO - LIMPOESTOFADOS
 * JavaScript completo com todas as funcionalidades
 * 
 * Funcionalidades:
 * - Navegação entre telas
 * - Seleção de serviços
 * - Agendamento com bloqueio de horários
 * - Validação de formulários
 * - Integração com WhatsApp
 * - Painel administrativo
 * - LocalStorage como banco de dados
 */

// ============================================
// CONFIGURAÇÕES GLOBAIS
// ============================================

const CONFIG = {
    // Número do WhatsApp da empresa (substitua pelo número real)
    WHATSAPP_NUMERO: '5531980252882',
    
    // Senha do painel administrativo
    SENHA_ADMIN: 'admin123',
    
    // Horários disponíveis para agendamento
    HORARIOS_DISPONIVEIS: [
        '08:00', '09:00', '10:00', '11:00',
        '13:00', '14:00', '15:00', '16:00', '17:00'
    ],
    
    // Nomes dos serviços para exibição
    SERVICOS_NOMES: {
        'sofa2': 'Sofá 2 Lugares',
        'sofa3': 'Sofá 3 Lugares',
        'colchao-solteiro': 'Colchão Solteiro',
        'colchao-casal': 'Colchão Casal',
        'banco-automotivo': 'Banco Automotivo',
        'poltrona': 'Poltrona'
    },
    
    // Preços dos serviços
    SERVICOS_PRECOS: {
        'sofa2': 120,
        'sofa3': 150,
        'colchao-solteiro': 80,
        'colchao-casal': 120,
        'banco-automotivo': 200,
        'poltrona': 70
    }
};

// ============================================
// ESTADO DA APLICAÇÃO
// ============================================

const state = {
    // Dados do agendamento em andamento
    agendamentoAtual: {
        servico: null,
        servicoNome: null,
        preco: null,
        data: null,
        horario: null,
        nome: null,
        whatsapp: null,
        endereco: null,
        observacoes: null
    },
    
    // Filtro atual do painel admin
    filtroAdmin: 'todos',
    
    // Agendamento selecionado no modal
    agendamentoSelecionado: null
};

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    inicializarSistema();
});

function inicializarSistema() {
    // Configurar data mínima como hoje
    configurarDataMinima();
    
    // Carregar agendamentos de exemplo se não houver nenhum
    carregarAgendamentosExemplo();
    
    // Atualizar estatísticas do painel admin
    atualizarEstatisticasAdmin();
    
    console.log('✅ Sistema de agendamento inicializado com sucesso!');
}

function configurarDataMinima() {
    const inputData = document.getElementById('data-agendamento');
    if (inputData) {
        const hoje = new Date().toISOString().split('T')[0];
        inputData.setAttribute('min', hoje);
    }
}

function carregarAgendamentosExemplo() {
    const agendamentos = getAgendamentos();
    if (agendamentos.length === 0) {
        // Criar alguns agendamentos de exemplo
        const exemplos = [
            {
                id: Date.now() - 100000,
                servico: 'sofa3',
                servicoNome: 'Sofá 3 Lugares',
                preco: 150,
                data: new Date(Date.now() + 86400000).toISOString().split('T')[0],
                horario: '10:00',
                nome: 'Maria Silva',
                whatsapp: '(11) 98765-4321',
                endereco: 'Rua das Flores, 123 - São Paulo',
                observacoes: 'Portão azul',
                status: 'pendente',
                dataCriacao: new Date(Date.now() - 100000).toISOString()
            },
            {
                id: Date.now() - 200000,
                servico: 'colchao-casal',
                servicoNome: 'Colchão Casal',
                preco: 120,
                data: new Date(Date.now() - 86400000).toISOString().split('T')[0],
                horario: '14:00',
                nome: 'João Santos',
                whatsapp: '(11) 91234-5678',
                endereco: 'Av. Paulista, 1000 - São Paulo',
                observacoes: '',
                status: 'concluido',
                dataCriacao: new Date(Date.now() - 200000).toISOString()
            }
        ];
        
        localStorage.setItem('agendamentos', JSON.stringify(exemplos));
    }
}

// ============================================
// NAVEGAÇÃO ENTRE TELAS
// ============================================

function navegarPara(telaId) {
    // Esconder todas as telas
    const todasTelas = document.querySelectorAll('.tela');
    todasTelas.forEach(tela => {
        tela.classList.remove('ativa');
    });
    
    // Mostrar tela solicitada
    const telaDestino = document.getElementById(telaId);
    if (telaDestino) {
        telaDestino.classList.add('ativa');
        window.scrollTo(0, 0);
    }
    
    // Ações específicas por tela
    if (telaId === 'tela-admin') {
        renderizarListaAgendamentos();
    }
}

function avancarEtapa(etapa) {
    switch(etapa) {
        case 2:
            if (state.agendamentoAtual.servico) {
                navegarPara('tela-data-horario');
            }
            break;
        case 3:
            if (state.agendamentoAtual.data && state.agendamentoAtual.horario) {
                navegarPara('tela-dados');
            }
            break;
    }
}

function voltarEtapa(etapa) {
    switch(etapa) {
        case 1:
            navegarPara('tela-agendamento');
            break;
        case 2:
            navegarPara('tela-data-horario');
            break;
        case 3:
            navegarPara('tela-dados');
            break;
    }
}

function avancarParaConfirmacao() {
    if (validarDadosPessoais()) {
        preencherResumo();
        navegarPara('tela-confirmacao');
    }
}

// ============================================
// SELEÇÃO DE SERVIÇO
// ============================================

function selecionarServico(elemento) {
    // Remover seleção anterior
    const todosServicos = document.querySelectorAll('.servico-card');
    todosServicos.forEach(servico => {
        servico.classList.remove('selecionado');
    });
    
    // Adicionar seleção ao clicado
    elemento.classList.add('selecionado');
    
    // Salvar no estado
    state.agendamentoAtual.servico = elemento.dataset.servico;
    state.agendamentoAtual.servicoNome = CONFIG.SERVICOS_NOMES[elemento.dataset.servico];
    state.agendamentoAtual.preco = elemento.dataset.preco;
    
    // Habilitar botão continuar
    document.getElementById('btn-continuar-servico').disabled = false;
}

// ============================================
// SELEÇÃO DE DATA E HORÁRIO
// ============================================

function carregarHorariosDisponiveis() {
    const inputData = document.getElementById('data-agendamento');
    const container = document.getElementById('horarios-container');
    const dataSelecionada = inputData.value;
    
    if (!dataSelecionada) {
        container.innerHTML = '<p class="mensagem-info">Selecione uma data para ver os horários disponíveis</p>';
        return;
    }
    
    // Salvar data no estado
    state.agendamentoAtual.data = dataSelecionada;
    
    // Buscar horários ocupados
    const horariosOcupados = getHorariosOcupados(dataSelecionada);
    
    // Gerar grid de horários
    let html = '';
    CONFIG.HORARIOS_DISPONIVEIS.forEach(horario => {
        const ocupado = horariosOcupados.includes(horario);
        const classe = ocupado ? 'horario-btn' : 'horario-btn';
        const disabled = ocupado ? 'disabled' : '';
        const onclick = ocupado ? '' : `onclick="selecionarHorario('${horario}', this)"`;
        
        html += `<button class="${classe}" ${disabled} ${onclick}>${horario}</button>`;
    });
    
    container.innerHTML = html;
    
    // Resetar seleção de horário
    state.agendamentoAtual.horario = null;
    document.getElementById('btn-continuar-data').disabled = true;
}

function getHorariosOcupados(data) {
    const agendamentos = getAgendamentos();
    return agendamentos
        .filter(a => a.data === data && a.status === 'pendente')
        .map(a => a.horario);
}

function selecionarHorario(horario, elemento) {
    // Remover seleção anterior
    const todosHorarios = document.querySelectorAll('.horario-btn');
    todosHorarios.forEach(h => {
        h.classList.remove('selecionado');
    });
    
    // Adicionar seleção ao clicado
    elemento.classList.add('selecionado');
    
    // Salvar no estado
    state.agendamentoAtual.horario = horario;
    
    // Habilitar botão continuar
    document.getElementById('btn-continuar-data').disabled = false;
}

// ============================================
// VALIDAÇÃO DE DADOS PESSOAIS
// ============================================

function validarDadosPessoais() {
    const nome = document.getElementById('nome-cliente').value.trim();
    const whatsapp = document.getElementById('whatsapp-cliente').value.trim();
    const endereco = document.getElementById('endereco-cliente').value.trim();
    
    // Validações
    if (!nome || nome.length < 3) {
        alert('Por favor, digite seu nome completo (mínimo 3 caracteres).');
        document.getElementById('nome-cliente').focus();
        return false;
    }
    
    if (!whatsapp || whatsapp.length < 14) {
        alert('Por favor, digite um número de WhatsApp válido.');
        document.getElementById('whatsapp-cliente').focus();
        return false;
    }
    
    if (!endereco || endereco.length < 10) {
        alert('Por favor, digite seu endereço completo.');
        document.getElementById('endereco-cliente').focus();
        return false;
    }
    
    // Salvar no estado
    state.agendamentoAtual.nome = nome;
    state.agendamentoAtual.whatsapp = whatsapp;
    state.agendamentoAtual.endereco = endereco;
    state.agendamentoAtual.observacoes = document.getElementById('observacoes-cliente').value.trim();
    
    return true;
}

function mascaraTelefone(input) {
    let valor = input.value.replace(/\D/g, '');
    
    if (valor.length > 11) {
        valor = valor.substring(0, 11);
    }
    
    if (valor.length > 0) {
        if (valor.length <= 2) {
            valor = `(${valor}`;
        } else if (valor.length <= 7) {
            valor = `(${valor.substring(0, 2)}) ${valor.substring(2)}`;
        } else {
            valor = `(${valor.substring(0, 2)}) ${valor.substring(2, 7)}-${valor.substring(7)}`;
        }
    }
    
    input.value = valor;
}

// ============================================
// TELA DE CONFIRMAÇÃO
// ============================================

function preencherResumo() {
    document.getElementById('resumo-servico').textContent = state.agendamentoAtual.servicoNome;
    document.getElementById('resumo-preco').textContent = `R$ ${state.agendamentoAtual.preco},00`;
    document.getElementById('resumo-data').textContent = formatarData(state.agendamentoAtual.data);
    document.getElementById('resumo-horario').textContent = state.agendamentoAtual.horario;
    document.getElementById('resumo-nome').textContent = state.agendamentoAtual.nome;
    document.getElementById('resumo-whatsapp').textContent = state.agendamentoAtual.whatsapp;
    document.getElementById('resumo-endereco').textContent = state.agendamentoAtual.endereco;
    
    const obsContainer = document.getElementById('resumo-obs-container');
    if (state.agendamentoAtual.observacoes) {
        document.getElementById('resumo-observacoes').textContent = state.agendamentoAtual.observacoes;
        obsContainer.style.display = 'flex';
    } else {
        obsContainer.style.display = 'none';
    }
}

function formatarData(dataString) {
    if (!dataString) return '-';
    const [ano, mes, dia] = dataString.split('-');
    return `${dia}/${mes}/${ano}`;
}

// ============================================
// CONFIRMAÇÃO E INTEGRAÇÃO WHATSAPP
// ============================================

function confirmarAgendamento() {
    // Mostrar loading
    mostrarLoading(true);
    
    // Criar objeto do agendamento
    const agendamento = {
        id: Date.now(),
        servico: state.agendamentoAtual.servico,
        servicoNome: state.agendamentoAtual.servicoNome,
        preco: state.agendamentoAtual.preco,
        data: state.agendamentoAtual.data,
        horario: state.agendamentoAtual.horario,
        nome: state.agendamentoAtual.nome,
        whatsapp: state.agendamentoAtual.whatsapp,
        endereco: state.agendamentoAtual.endereco,
        observacoes: state.agendamentoAtual.observacoes,
        status: 'pendente',
        dataCriacao: new Date().toISOString()
    };
    
    // Salvar no LocalStorage
    salvarAgendamento(agendamento);
    
    // Gerar mensagem do WhatsApp
    const mensagem = gerarMensagemWhatsApp(agendamento);
    
    // Gerar link do WhatsApp
    const linkWhatsApp = `https://wa.me/${CONFIG.WHATSAPP_NUMERO}?text=${encodeURIComponent(mensagem)}`;
    
    // Esconder loading
    mostrarLoading(false);
    
    // Preencher tela de sucesso
    preencherTelaSucesso(agendamento);
    
    // Abrir WhatsApp em nova aba
    window.open(linkWhatsApp, '_blank');
    
    // Navegar para tela de sucesso
    navegarPara('tela-sucesso');
    
    // Limpar estado
    limparEstadoAgendamento();
}

function gerarMensagemWhatsApp(agendamento) {
    let mensagem = `*Novo Agendamento - LimpoEstofados*\n\n`;
    mensagem += `*Cliente:* ${agendamento.nome}\n`;
    mensagem += `*Serviço:* ${agendamento.servicoNome}\n`;
    mensagem += `*Data:* ${formatarData(agendamento.data)}\n`;
    mensagem += `*Horário:* ${agendamento.horario}\n`;
    mensagem += `*Valor:* R$ ${agendamento.preco},00\n`;
    mensagem += `*Endereço:* ${agendamento.endereco}\n`;
    
    if (agendamento.observacoes) {
        mensagem += `*Observações:* ${agendamento.observacoes}\n`;
    }
    
    mensagem += `\n*WhatsApp:* ${agendamento.whatsapp}`;
    
    return mensagem;
}

function preencherTelaSucesso(agendamento) {
    const container = document.getElementById('sucesso-detalhes');
    container.innerHTML = `
        <div class="resumo-item">
            <span class="resumo-label">Serviço:</span>
            <span class="resumo-valor">${agendamento.servicoNome}</span>
        </div>
        <div class="resumo-item">
            <span class="resumo-label">Data:</span>
            <span class="resumo-valor">${formatarData(agendamento.data)} às ${agendamento.horario}</span>
        </div>
        <div class="resumo-item">
            <span class="resumo-label">Endereço:</span>
            <span class="resumo-valor">${agendamento.endereco}</span>
        </div>
    `;
}

function limparEstadoAgendamento() {
    state.agendamentoAtual = {
        servico: null,
        servicoNome: null,
        preco: null,
        data: null,
        horario: null,
        nome: null,
        whatsapp: null,
        endereco: null,
        observacoes: null
    };
    
    // Limpar formulários
    document.getElementById('data-agendamento').value = '';
    document.getElementById('nome-cliente').value = '';
    document.getElementById('whatsapp-cliente').value = '';
    document.getElementById('endereco-cliente').value = '';
    document.getElementById('observacoes-cliente').value = '';
    
    // Limpar seleções visuais
    document.querySelectorAll('.servico-card').forEach(s => s.classList.remove('selecionado'));
    document.getElementById('horarios-container').innerHTML = '<p class="mensagem-info">Selecione uma data para ver os horários disponíveis</p>';
    
    // Desabilitar botões
    document.getElementById('btn-continuar-servico').disabled = true;
    document.getElementById('btn-continuar-data').disabled = true;
}

// ============================================
// LOCALSTORAGE - BANCO DE DADOS
// ============================================

function getAgendamentos() {
    const dados = localStorage.getItem('agendamentos');
    return dados ? JSON.parse(dados) : [];
}

function salvarAgendamento(agendamento) {
    const agendamentos = getAgendamentos();
    agendamentos.push(agendamento);
    localStorage.setItem('agendamentos', JSON.stringify(agendamentos));
}

function atualizarAgendamento(agendamentoAtualizado) {
    const agendamentos = getAgendamentos();
    const index = agendamentos.findIndex(a => a.id === agendamentoAtualizado.id);
    if (index !== -1) {
        agendamentos[index] = agendamentoAtualizado;
        localStorage.setItem('agendamentos', JSON.stringify(agendamentos));
    }
}

function excluirAgendamento(id) {
    const agendamentos = getAgendamentos();
    const filtrados = agendamentos.filter(a => a.id !== id);
    localStorage.setItem('agendamentos', JSON.stringify(filtrados));
}

function limparTodosAgendamentos() {
    if (confirm('Tem certeza que deseja excluir TODOS os agendamentos? Esta ação não pode ser desfeita.')) {
        localStorage.removeItem('agendamentos');
        renderizarListaAgendamentos();
        atualizarEstatisticasAdmin();
        alert('Todos os agendamentos foram excluídos.');
    }
}

// ============================================
// PAINEL ADMINISTRATIVO
// ============================================

function verificarSenhaAdmin() {
    const senha = document.getElementById('senha-admin').value;
    
    if (senha === CONFIG.SENHA_ADMIN) {
        document.getElementById('senha-admin').value = '';
        navegarPara('tela-admin');
    } else {
        alert('Senha incorreta. Tente novamente.');
        document.getElementById('senha-admin').value = '';
        document.getElementById('senha-admin').focus();
    }
}

function atualizarEstatisticasAdmin() {
    const agendamentos = getAgendamentos();
    const pendentes = agendamentos.filter(a => a.status === 'pendente').length;
    const concluidos = agendamentos.filter(a => a.status === 'concluido').length;
    
    document.getElementById('total-agendamentos').textContent = agendamentos.length;
    document.getElementById('agendamentos-pendentes').textContent = pendentes;
    document.getElementById('agendamentos-concluidos').textContent = concluidos;
}

function filtrarAgendamentos(filtro) {
    state.filtroAdmin = filtro;
    
    // Atualizar botões de filtro
    document.querySelectorAll('.filtro-btn').forEach(btn => {
        btn.classList.remove('ativa');
    });
    event.target.classList.add('ativa');
    
    renderizarListaAgendamentos();
}

function renderizarListaAgendamentos() {
    const container = document.getElementById('lista-agendamentos');
    const agendamentos = getAgendamentos();
    
    // Ordenar por data (mais recentes primeiro)
    agendamentos.sort((a, b) => new Date(b.dataCriacao) - new Date(a.dataCriacao));
    
    // Aplicar filtro
    let agendamentosFiltrados = agendamentos;
    if (state.filtroAdmin !== 'todos') {
        agendamentosFiltrados = agendamentos.filter(a => a.status === state.filtroAdmin);
    }
    
    if (agendamentosFiltrados.length === 0) {
        container.innerHTML = `
            <div class="sem-agendamentos">
                <div class="sem-agendamentos-icon">📋</div>
                <p>Nenhum agendamento encontrado.</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    agendamentosFiltrados.forEach(agendamento => {
        const classeStatus = agendamento.status === 'concluido' ? 'concluido' : '';
        const statusTexto = agendamento.status === 'concluido' ? 'Concluído' : 'Pendente';
        
        html += `
            <div class="agendamento-card ${classeStatus}" onclick="abrirModalDetalhes(${agendamento.id})">
                <div class="agendamento-header">
                    <span class="agendamento-servico">${agendamento.servicoNome}</span>
                    <span class="agendamento-status">${statusTexto}</span>
                </div>
                <div class="agendamento-info">
                    <span>📅 ${formatarData(agendamento.data)}</span>
                    <span>🕐 ${agendamento.horario}</span>
                    <span>👤 ${agendamento.nome}</span>
                    <span>💰 R$ ${agendamento.preco},00</span>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// ============================================
// MODAL DE DETALHES
// ============================================

function abrirModalDetalhes(id) {
    const agendamentos = getAgendamentos();
    const agendamento = agendamentos.find(a => a.id === id);
    
    if (!agendamento) return;
    
    state.agendamentoSelecionado = agendamento;
    
    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = `
        <div class="resumo-item">
            <span class="resumo-label">ID:</span>
            <span class="resumo-valor">#${agendamento.id}</span>
        </div>
        <div class="resumo-item">
            <span class="resumo-label">Serviço:</span>
            <span class="resumo-valor">${agendamento.servicoNome}</span>
        </div>
        <div class="resumo-item">
            <span class="resumo-label">Valor:</span>
            <span class="resumo-valor preco-destaque">R$ ${agendamento.preco},00</span>
        </div>
        <div class="resumo-item">
            <span class="resumo-label">Data:</span>
            <span class="resumo-valor">${formatarData(agendamento.data)}</span>
        </div>
        <div class="resumo-item">
            <span class="resumo-label">Horário:</span>
            <span class="resumo-valor">${agendamento.horario}</span>
        </div>
        <div class="resumo-item">
            <span class="resumo-label">Cliente:</span>
            <span class="resumo-valor">${agendamento.nome}</span>
        </div>
        <div class="resumo-item">
            <span class="resumo-label">WhatsApp:</span>
            <span class="resumo-valor">${agendamento.whatsapp}</span>
        </div>
        <div class="resumo-item">
            <span class="resumo-label">Endereço:</span>
            <span class="resumo-valor">${agendamento.endereco}</span>
        </div>
        ${agendamento.observacoes ? `
        <div class="resumo-item">
            <span class="resumo-label">Observações:</span>
            <span class="resumo-valor">${agendamento.observacoes}</span>
        </div>
        ` : ''}
        <div class="resumo-item">
            <span class="resumo-label">Status:</span>
            <span class="resumo-valor">${agendamento.status === 'concluido' ? 'Concluído' : 'Pendente'}</span>
        </div>
        <div class="resumo-item">
            <span class="resumo-label">Criado em:</span>
            <span class="resumo-valor">${new Date(agendamento.dataCriacao).toLocaleString('pt-BR')}</span>
        </div>
    `;
    
    // Atualizar botão de ação
    const btnMarcarConcluido = document.getElementById('btn-marcar-concluido');
    if (agendamento.status === 'concluido') {
        btnMarcarConcluido.textContent = 'Marcar como Pendente';
        btnMarcarConcluido.onclick = marcarPendente;
    } else {
        btnMarcarConcluido.textContent = 'Marcar como Concluído';
        btnMarcarConcluido.onclick = marcarConcluido;
    }
    
    document.getElementById('modal-detalhes').classList.add('ativo');
}

function fecharModal() {
    document.getElementById('modal-detalhes').classList.remove('ativo');
    state.agendamentoSelecionado = null;
}

function marcarConcluido() {
    if (state.agendamentoSelecionado) {
        state.agendamentoSelecionado.status = 'concluido';
        atualizarAgendamento(state.agendamentoSelecionado);
        fecharModal();
        renderizarListaAgendamentos();
        atualizarEstatisticasAdmin();
    }
}

function marcarPendente() {
    if (state.agendamentoSelecionado) {
        state.agendamentoSelecionado.status = 'pendente';
        atualizarAgendamento(state.agendamentoSelecionado);
        fecharModal();
        renderizarListaAgendamentos();
        atualizarEstatisticasAdmin();
    }
}

// ============================================
// UTILITÁRIOS
// ============================================

function mostrarLoading(mostrar) {
    const loading = document.getElementById('loading-overlay');
    if (mostrar) {
        loading.classList.add('ativo');
    } else {
        loading.classList.remove('ativo');
    }
}

// Fechar modal ao clicar fora
document.addEventListener('click', function(e) {
    const modal = document.getElementById('modal-detalhes');
    if (e.target === modal) {
        fecharModal();
    }
});

// Tecla Enter no login admin
document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        const senhaInput = document.getElementById('senha-admin');
        if (document.activeElement === senhaInput) {
            verificarSenhaAdmin();
        }
    }
});

// ============================================
// EXPORTAR PARA INTEGRAÇÃO FUTURA COM BACKEND
// ============================================

/**
 * Estrutura preparada para integração com backend PHP + MySQL
 * 
 * Para migrar para backend:
 * 
 * 1. Criar tabela SQL:
 * CREATE TABLE agendamentos (
 *     id INT AUTO_INCREMENT PRIMARY KEY,
 *     servico VARCHAR(50) NOT NULL,
 *     servico_nome VARCHAR(100) NOT NULL,
 *     preco DECIMAL(10,2) NOT NULL,
 *     data DATE NOT NULL,
 *     horario TIME NOT NULL,
 *     nome VARCHAR(200) NOT NULL,
 *     whatsapp VARCHAR(20) NOT NULL,
 *     endereco TEXT NOT NULL,
 *     observacoes TEXT,
 *     status ENUM('pendente', 'concluido') DEFAULT 'pendente',
 *     data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
 * );
 * 
 * 2. Substituir funções de LocalStorage por chamadas AJAX/fetch
 * 3. Implementar autenticação segura para o painel admin
 * 4. Adicionar validações server-side
 */

console.log('📱 Sistema LimpoEstofados carregado!');
console.log('💡 Dica: Altere o número do WhatsApp em CONFIG.WHATSAPP_NUMERO');

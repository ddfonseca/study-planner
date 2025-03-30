document.addEventListener("DOMContentLoaded", () => {
  // --- Elementos Globais ---
  const corpoCalendario = document.getElementById("corpo-calendario");
  const mesAnoAtualEl = document.getElementById("mes-ano-atual");
  const mesAnteriorBtn = document.getElementById("mes-anterior");
  const mesProximoBtn = document.getElementById("mes-proximo");
  const irParaHojeBtn = document.getElementById("ir-para-hoje");
  const minHorasInput = document.getElementById("min-horas");
  const desHorasInput = document.getElementById("des-horas");
  const salvarConfigBtn = document.getElementById("salvar-config");
  const configStatusEl = document.getElementById("config-status");
  const abasBtns = document.querySelectorAll(".aba-btn");
  const abasConteudos = document.querySelectorAll(".aba-conteudo");

  // --- Elementos do Modal ---
  const modal = document.getElementById("modal-materia");
  const modalFecharBtn = document.getElementById("modal-fechar-btn");
  const modalDataSelecionadaEl = document.getElementById(
    "modal-data-selecionada",
  );
  const materiaInputModal = document.getElementById("materia-input-modal");
  const minutosInputModal = document.getElementById("minutos-input-modal");
  const addMateriaModalBtn = document.getElementById("add-materia-modal-btn");
  const modalListaMateriasEl = document.getElementById("modal-lista-materias");
  const modalTotalTempoDiaEl = document.getElementById("modal-total-tempo-dia");

  // --- Elementos do Dashboard ---
  const dataInicioDashInput = document.getElementById("data-inicio-dash");
  const dataFimDashInput = document.getElementById("data-fim-dash");
  const shortcutBtns = document.querySelectorAll(".btn-shortcut");
  const aplicarFiltroDashBtn = document.getElementById("aplicar-filtro-dash");
  const canvasGraficoMaterias = document
    .getElementById("grafico-materias")
    .getContext("2d");
  const canvasGraficoDias = document
    .getElementById("grafico-dias")
    .getContext("2d");
  const msgSemDadosMaterias = document.getElementById("msg-sem-dados-materias");
  const msgSemDadosDias = document.getElementById("msg-sem-dados-dias");
  let graficoMateriasInstance = null;
  let graficoDiasInstance = null;

  // --- Estado ---
  let dataVisivel = new Date(); // Mês/Ano sendo exibido no calendário
  let dataSelecionadaModal = null; // Guarda a data 'YYYY-MM-DD' para o modal
  let config = carregarConfig();
  let dadosEstudo = carregarDadosEstudo();
  const hojeStr = formatarData(new Date());

  // --- Funções Auxiliares ---
  function formatarData(date) {
    // Garante que seja um objeto Date válido
    if (!(date instanceof Date) || isNaN(date)) {
      // Tenta converter se for string 'YYYY-MM-DD'
      if (typeof date === "string" && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        date = new Date(date + "T00:00:00"); // Adiciona hora para evitar problemas de fuso
        if (isNaN(date)) return null; // Retorna null se a conversão falhar
      } else {
        return null; // Retorna null para datas inválidas
      }
    }
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  function formatarTempo(totalMinutos) {
    if (!totalMinutos || totalMinutos <= 0) {
      return "0m"; // Mais conciso para listas
    }
    const horas = Math.floor(totalMinutos / 60);
    const minutos = totalMinutos % 60;
    let str = "";
    if (horas > 0) str += `${horas}h `;
    if (minutos > 0 || horas === 0) str += `${minutos}m`;
    return str.trim(); // Sem emoji aqui para economizar espaço na célula
  }

  function formatarTempoComEmoji(totalMinutos) {
    const tempoFormatado = formatarTempo(totalMinutos);
    return tempoFormatado !== "0m"
      ? `${tempoFormatado} <i class="far fa-clock" style="font-size: 0.8em; opacity: 0.7;"></i>`
      : "0m"; // Emoji apenas se houver tempo
  }

  // --- Funções de Persistência (localStorage) ---
  // (Manter as funções carregar/salvarConfig e carregar/salvarDadosEstudo da versão anterior)
  function carregarConfig() {
    const configSalva = localStorage.getItem("calendarioEstudoConfig_v3"); // Nova chave
    const configPadrao = { minHoras: 2, desHoras: 4 };
    let configAtual = configPadrao;
    if (configSalva) {
      try {
        configAtual = JSON.parse(configSalva);
        if (
          typeof configAtual.minHoras !== "number" ||
          typeof configAtual.desHoras !== "number"
        ) {
          configAtual = configPadrao;
        }
      } catch (e) {
        console.error("Erro ao carregar config:", e);
        configAtual = configPadrao;
      }
    }
    minHorasInput.value = configAtual.minHoras;
    desHorasInput.value = configAtual.desHoras;
    return configAtual;
  }

  function salvarConfig() {
    const minH = parseFloat(minHorasInput.value) || 0;
    const desH = parseFloat(desHorasInput.value) || 0;

    if (minH < 0 || desH < 0) {
      alert("As horas não podem ser negativas.");
      return;
    }
    if (minH > desH && desH > 0) {
      alert(
        "As horas mínimas não podem ser maiores que as horas desejadas (a menos que desejadas seja 0).",
      );
      return;
    }

    config = { minHoras: minH, desHoras: desH };
    localStorage.setItem("calendarioEstudoConfig_v3", JSON.stringify(config));
    configStatusEl.textContent = "Salvo!";
    setTimeout(() => (configStatusEl.textContent = ""), 2000);
    renderizarCalendario(dataVisivel.getFullYear(), dataVisivel.getMonth());
  }

  function carregarDadosEstudo() {
    const dadosSalvos = localStorage.getItem("calendarioEstudoDados_v3"); // Nova chave
    if (dadosSalvos) {
      try {
        return JSON.parse(dadosSalvos);
      } catch (e) {
        console.error("Erro ao carregar dados de estudo:", e);
        return {};
      }
    }
    return {};
  }

  function salvarDadosEstudo() {
    localStorage.setItem(
      "calendarioEstudoDados_v3",
      JSON.stringify(dadosEstudo),
    );
    // Atualiza o dashboard se estiver visível e as datas estiverem definidas
    if (
      document
        .getElementById("dashboard-container")
        .classList.contains("active") &&
      dataInicioDashInput.value &&
      dataFimDashInput.value
    ) {
      renderizarDashboard(dataInicioDashInput.value, dataFimDashInput.value);
    }
  }

  // --- Funções do Calendário ---
  function obterDadosDia(dataStr) {
    return dadosEstudo[dataStr] || { totalMinutos: 0, materias: [] };
  }

  function atualizarEstiloDia(celula, dataStr) {
    // (Lógica de cores mantida da versão anterior, usando config.minHoras * 60 e config.desHoras * 60)
    const dadosDoDia = obterDadosDia(dataStr);
    const totalMinutosDia = dadosDoDia.totalMinutos;
    const minMinutos = config.minHoras * 60;
    const desMinutos = config.desHoras * 60;

    celula.classList.remove("horas-minimas-ok", "horas-desejadas-ok", "hoje"); // Limpa todas

    if (desMinutos > 0 && totalMinutosDia >= desMinutos) {
      celula.classList.add("horas-desejadas-ok");
    } else if (minMinutos > 0 && totalMinutosDia >= minMinutos) {
      celula.classList.add("horas-minimas-ok");
    }
    if (dataStr === hojeStr) {
      celula.classList.add("hoje");
    }
  }

  function renderizarCelulaDia(celula, dataStr) {
    const dadosDoDia = obterDadosDia(dataStr);
    celula.innerHTML = ""; // Limpa conteúdo anterior

    // Número do dia
    const diaNumEl = document.createElement("span");
    diaNumEl.classList.add("dia-numero");
    diaNumEl.textContent = new Date(dataStr + "T00:00:00").getDate(); // Pega o dia da data
    celula.appendChild(diaNumEl);

    // Lista de matérias na célula
    const listaMateriasEl = document.createElement("ul");
    listaMateriasEl.classList.add("lista-materias-celula");
    dadosDoDia.materias.forEach((item, index) => {
      const li = document.createElement("li");

      const textoEl = document.createElement("span");
      textoEl.classList.add("materia-texto");
      textoEl.textContent = item.materia;
      textoEl.title = `${item.materia}: ${formatarTempo(item.minutos)}`; // Tooltip completo
      li.appendChild(textoEl);

      const tempoEl = document.createElement("span");
      tempoEl.classList.add("materia-tempo");
      tempoEl.innerHTML = formatarTempo(item.minutos); // Usar innerHTML se formatarTempo retornar HTML (ícones)
      li.appendChild(tempoEl);

      const removeBtn = document.createElement("button"); // Usar botão para semântica
      removeBtn.classList.add("remover-materia-celula");
      removeBtn.dataset.index = index; // Índice para remoção
      removeBtn.title = `Remover ${item.materia}`;
      removeBtn.innerHTML = '<i class="fas fa-trash-alt fa-xs"></i>'; // Ícone Font Awesome
      li.appendChild(removeBtn);

      listaMateriasEl.appendChild(li);
    });
    celula.appendChild(listaMateriasEl);

    // Total de tempo na célula
    const totalTempoEl = document.createElement("span");
    totalTempoEl.classList.add("total-tempo-dia-celula");
    totalTempoEl.innerHTML = formatarTempoComEmoji(dadosDoDia.totalMinutos); // Com emoji
    celula.appendChild(totalTempoEl);

    // Aplica estilo de cor
    atualizarEstiloDia(celula, dataStr);
  }

  function renderizarCalendario(ano, mes) {
    corpoCalendario.innerHTML = "";
    mesAnoAtualEl.textContent = `${new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(new Date(ano, mes))} de ${ano}`;
    dataVisivel = new Date(ano, mes, 1); // Atualiza a data visível

    const primeiroDiaMes = new Date(ano, mes, 1);
    const ultimoDiaMes = new Date(ano, mes + 1, 0);
    const numDiasMes = ultimoDiaMes.getDate();
    const diaSemanaPrimeiro = primeiroDiaMes.getDay();

    let data = 1;
    for (let i = 0; i < 6; i++) {
      const linha = document.createElement("tr");
      for (let j = 0; j < 7; j++) {
        const celula = document.createElement("td");
        if ((i === 0 && j < diaSemanaPrimeiro) || data > numDiasMes) {
          celula.classList.add("dia-fora-mes");
        } else {
          const dataCompleta = new Date(ano, mes, data);
          const dataStr = formatarData(dataCompleta);
          celula.dataset.date = dataStr;

          renderizarCelulaDia(celula, dataStr); // Renderiza o conteúdo interno da célula

          // Adiciona listener para abrir modal (no dia todo)
          // O listener para deleção será adicionado à tbody
          celula.addEventListener("click", (e) => {
            // Abre o modal apenas se o clique NÃO for no botão de remover
            if (!e.target.closest(".remover-materia-celula")) {
              abrirModal(dataStr);
            }
          });

          data++;
        }
        linha.appendChild(celula);
      }
      corpoCalendario.appendChild(linha);
      if (data > numDiasMes) break;
    }
  }

  // --- Funções do Modal (Manter abrir/fecharModal, adicionarMateriaModal da versão anterior) ---
  // Pequenas adaptações para usar formatarTempoComEmoji e ícones
  function abrirModal(dataStr) {
    dataSelecionadaModal = dataStr;
    const dataObj = new Date(dataStr + "T00:00:00");
    modalDataSelecionadaEl.textContent = dataObj.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    atualizarListaModal();
    materiaInputModal.value = "";
    minutosInputModal.value = "";
    modal.style.display = "block";
    materiaInputModal.focus();
  }

  function fecharModal() {
    modal.style.display = "none";
    dataSelecionadaModal = null;
  }

  function atualizarListaModal() {
    if (!dataSelecionadaModal) return;

    const dadosDoDia = obterDadosDia(dataSelecionadaModal);
    modalListaMateriasEl.innerHTML = ""; // Limpa

    dadosDoDia.materias.forEach((item, index) => {
      const li = document.createElement("li");

      const textoItem = document.createElement("span");
      textoItem.innerHTML = `<i class="fas fa-book-reader fa-xs" style="opacity: 0.6;"></i> ${item.materia}`; // Ícone e matéria
      li.appendChild(textoItem);

      const tempoEBotao = document.createElement("div"); // Grupo para tempo e botão delete
      tempoEBotao.style.display = "flex";
      tempoEBotao.style.alignItems = "center";
      tempoEBotao.style.gap = "10px";

      const tempoModal = document.createElement("span");
      tempoModal.classList.add("materia-tempo-modal");
      tempoModal.innerHTML = formatarTempoComEmoji(item.minutos);
      tempoEBotao.appendChild(tempoModal);

      const removeBtn = document.createElement("button"); // Botão semântico
      removeBtn.classList.add("remove-materia-modal");
      removeBtn.title = `Remover ${item.materia}`;
      removeBtn.dataset.index = index;
      removeBtn.innerHTML = '<i class="fas fa-times-circle"></i>'; // Ícone de remover
      tempoEBotao.appendChild(removeBtn);

      li.appendChild(tempoEBotao);

      modalListaMateriasEl.appendChild(li);
    });

    modalTotalTempoDiaEl.innerHTML = formatarTempoComEmoji(
      dadosDoDia.totalMinutos,
    ); // Com emoji
  }

  function adicionarMateriaModal() {
    if (!dataSelecionadaModal) return;

    const materia = materiaInputModal.value.trim();
    const minutos = parseInt(minutosInputModal.value, 10);

    if (!materia) {
      alert("Insira o nome da matéria.");
      return;
    }
    if (isNaN(minutos) || minutos <= 0) {
      alert("Insira minutos válidos (> 0).");
      return;
    }

    if (!dadosEstudo[dataSelecionadaModal]) {
      dadosEstudo[dataSelecionadaModal] = { totalMinutos: 0, materias: [] };
    }

    dadosEstudo[dataSelecionadaModal].materias.push({
      materia: materia,
      minutos: minutos,
    });
    recalcularTotalDia(dataSelecionadaModal); // Usa função separada
    salvarDadosEstudo();

    atualizarListaModal();
    atualizarCelulaCalendario(dataSelecionadaModal);
    materiaInputModal.value = "";
    minutosInputModal.value = "";
    materiaInputModal.focus();
  }

  function removerMateria(dataStr, index) {
    if (!dadosEstudo[dataStr] || !dadosEstudo[dataStr].materias[index])
      return false; // Verifica se existe

    dadosEstudo[dataStr].materias.splice(index, 1);
    recalcularTotalDia(dataStr);

    if (dadosEstudo[dataStr].materias.length === 0) {
      delete dadosEstudo[dataStr];
    }

    salvarDadosEstudo();
    return true; // Indica sucesso
  }

  function removerMateriaModal(index) {
    if (!dataSelecionadaModal) return;
    if (removerMateria(dataSelecionadaModal, index)) {
      atualizarListaModal();
      atualizarCelulaCalendario(dataSelecionadaModal);
    }
  }

  // Função chamada pelo listener de delegação na célula
  function removerMateriaDireto(dataStr, index) {
    if (confirm(`Tem certeza que deseja remover esta entrada de estudo?`)) {
      // Confirmação
      if (removerMateria(dataStr, index)) {
        atualizarCelulaCalendario(dataStr);
        // Se o modal estiver aberto para este dia, atualiza-o também
        if (
          modal.style.display === "block" &&
          dataSelecionadaModal === dataStr
        ) {
          atualizarListaModal();
        }
      }
    }
  }

  function recalcularTotalDia(dataStr) {
    if (!dadosEstudo[dataStr]) return;
    dadosEstudo[dataStr].totalMinutos = dadosEstudo[dataStr].materias.reduce(
      (sum, item) => sum + item.minutos,
      0,
    );
  }

  // Atualiza apenas o conteúdo de uma célula específica no calendário
  function atualizarCelulaCalendario(dataStr) {
    const celula = corpoCalendario.querySelector(`td[data-date="${dataStr}"]`);
    if (celula) {
      renderizarCelulaDia(celula, dataStr); // Re-renderiza todo o conteúdo interno
    }
  }

  // --- Funções do Dashboard ---

  // Define as datas nos inputs
  function setDateRange(diasAtras) {
    const hoje = new Date();
    const fim = new Date(hoje);
    const inicio = new Date(hoje);
    inicio.setDate(hoje.getDate() - (diasAtras - 1)); // -6 para 7 dias (inclui hoje)

    dataInicioDashInput.value = formatarData(inicio);
    dataFimDashInput.value = formatarData(fim);
  }

  // Função principal do dashboard, agora aceita datas
  function renderizarDashboard(startDateStr, endDateStr) {
    // Validação básica das datas
    if (
      !startDateStr ||
      !endDateStr ||
      new Date(startDateStr) > new Date(endDateStr)
    ) {
      alert("Por favor, selecione um período de datas válido.");
      // Limpa gráficos se as datas forem inválidas? Ou mantém o anterior?
      // clearDashboardCharts(); // Função para limpar os gráficos
      return;
    }

    renderizarGraficoMaterias(startDateStr, endDateStr);
    renderizarGraficoDias(startDateStr, endDateStr);
  }

  function clearDashboardCharts() {
    if (graficoMateriasInstance) graficoMateriasInstance.destroy();
    if (graficoDiasInstance) graficoDiasInstance.destroy();
    msgSemDadosMaterias.style.display = "block";
    msgSemDadosDias.style.display = "block";
    // Limpar os canvas manualmente se necessário
    canvasGraficoMaterias
      .getContext("2d")
      .clearRect(
        0,
        0,
        canvasGraficoMaterias.width,
        canvasGraficoMaterias.height,
      );
    canvasGraficoDias
      .getContext("2d")
      .clearRect(0, 0, canvasGraficoDias.width, canvasGraficoDias.height);
  }

  function renderizarGraficoMaterias(startDateStr, endDateStr) {
    const dadosAgregados = {};
    const inicio = new Date(startDateStr + "T00:00:00");
    const fim = new Date(endDateStr + "T23:59:59"); // Inclui o dia final

    // Filtra e Agrega
    Object.entries(dadosEstudo).forEach(([data, diaData]) => {
      const dataAtual = new Date(data + "T00:00:00");
      if (dataAtual >= inicio && dataAtual <= fim) {
        diaData.materias.forEach((item) => {
          dadosAgregados[item.materia] =
            (dadosAgregados[item.materia] || 0) + item.minutos;
        });
      }
    });

    const labels = Object.keys(dadosAgregados);
    const data = Object.values(dadosAgregados);

    if (graficoMateriasInstance) graficoMateriasInstance.destroy();

    msgSemDadosMaterias.style.display = labels.length === 0 ? "block" : "none"; // Mostra/esconde msg
    canvasGraficoMaterias.style.display = labels.length > 0 ? "block" : "none"; // Mostra/esconde canvas

    if (labels.length > 0) {
      graficoMateriasInstance = new Chart(canvasGraficoMaterias, {
        type: "doughnut", // Um pouco mais moderno
        data: {
          labels: labels,
          datasets: [
            {
              label: "Minutos",
              data: data,
              backgroundColor: gerarCores(labels.length), // Função para cores
              borderColor: "rgba(255, 255, 255, 0.5)", // Borda branca sutil
              borderWidth: 1,
              hoverOffset: 8,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false, // Permite controlar altura via CSS wrapper
          plugins: {
            legend: {
              position: "bottom",
              labels: { padding: 15, font: { size: 13 } },
            },
            tooltip: {
              callbacks: {
                label: (context) =>
                  `${context.label}: ${formatarTempo(context.parsed)}`,
              },
            },
          },
        },
      });
    }
  }

  function renderizarGraficoDias(startDateStr, endDateStr) {
    const labels = []; // Datas no formato 'YYYY-MM-DD'
    const data = []; // Minutos por dia
    const inicio = new Date(startDateStr + "T00:00:00");
    const fim = new Date(endDateStr + "T00:00:00"); // Compara apenas a data

    // Gera todas as datas no intervalo
    let diaAtual = new Date(inicio);
    while (diaAtual <= fim) {
      const diaStr = formatarData(diaAtual);
      labels.push(diaStr);
      data.push(obterDadosDia(diaStr).totalMinutos);
      diaAtual.setDate(diaAtual.getDate() + 1); // Vai para o próximo dia
    }

    if (graficoDiasInstance) graficoDiasInstance.destroy();

    const temDados = data.some((min) => min > 0);
    msgSemDadosDias.style.display = !temDados ? "block" : "none";
    canvasGraficoDias.style.display = temDados ? "block" : "none";

    if (temDados) {
      graficoDiasInstance = new Chart(canvasGraficoDias, {
        type: "bar",
        data: {
          labels: labels, // Usa as datas 'YYYY-MM-DD'
          datasets: [
            {
              label: "Minutos Estudados",
              data: data,
              backgroundColor: "rgba(74, 144, 226, 0.6)",
              borderColor: "rgba(74, 144, 226, 1)",
              borderWidth: 1,
              borderRadius: 4, // Barras arredondadas
              barPercentage: 0.7, // Barras um pouco mais finas
              categoryPercentage: 0.8,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              type: "time", // ESSENCIAL para o Chart.js entender as datas
              time: {
                unit: labels.length > 30 ? "month" : "day", // Ajusta unidade baseada no range
                tooltipFormat: "PPP", // Formato do tooltip (ex: Mar 30, 2025) - Requer date-fns
                displayFormats: {
                  // Formato da exibição no eixo
                  day: "dd MMM", // Ex: 30 Mar
                  month: "MMM yyyy", // Ex: Mar 2025
                },
              },
              grid: { display: false }, // Remove linhas de grade verticais
              ticks: {
                font: { size: 11 },
                maxRotation: 0, // Evita rotação se possível
                autoSkip: true, // Pula alguns labels se ficarem apertados
                maxTicksLimit: labels.length > 14 ? 7 : 10, // Limita qtd de labels visíveis
              },
            },
            y: {
              beginAtZero: true,
              grid: { color: "#eef1f3" }, // Linhas de grade horizontais mais suaves
              ticks: {
                font: { size: 11 },
                callback: (value) => formatarTempo(value), // Formata eixo Y
              },
            },
          },
          plugins: {
            legend: { display: false }, // Legenda geralmente desnecessária para 1 dataset
            tooltip: {
              callbacks: {
                title: (context) => context[0].label, // Usa o label formatado pelo eixo X
                label: (context) =>
                  `Estudo: ${formatarTempo(context.parsed.y)}`,
              },
            },
          },
        },
      });
    }
  }

  // Gera cores variadas
  function gerarCores(numCores) {
    const cores = [];
    const baseHue = 195; // Começa com um tom azulado
    const saturation = 70;
    const lightness = 75;
    for (let i = 0; i < numCores; i++) {
      const hue = (baseHue + i * (360 / (numCores * 1.5))) % 360; // Espaçamento maior
      cores.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
    }
    return cores;
  }

  // --- Funções de Navegação e Inicialização ---
  function mudarAba(event) {
    const abaAlvo = event.target.closest(".aba-btn").dataset.aba; // Pega do botão mesmo se clicar no ícone

    abasBtns.forEach((btn) =>
      btn.classList.toggle("active", btn.dataset.aba === abaAlvo),
    );
    abasConteudos.forEach((conteudo) =>
      conteudo.classList.toggle(
        "active",
        conteudo.id === `${abaAlvo}-container`,
      ),
    );

    if (abaAlvo === "dashboard") {
      // Define um range padrão se ainda não houver e renderiza
      if (!dataInicioDashInput.value || !dataFimDashInput.value) {
        setDateRange(7); // Padrão: Últimos 7 dias
      }
      aplicarFiltroDashBtn.click(); // Simula clique para renderizar com as datas atuais
    }
  }

  function irParaMesHoje() {
    dataVisivel = new Date();
    renderizarCalendario(dataVisivel.getFullYear(), dataVisivel.getMonth());
  }

  // --- Event Listeners ---
  mesAnteriorBtn.addEventListener("click", () => {
    dataVisivel.setMonth(dataVisivel.getMonth() - 1);
    renderizarCalendario(dataVisivel.getFullYear(), dataVisivel.getMonth());
  });

  mesProximoBtn.addEventListener("click", () => {
    dataVisivel.setMonth(dataVisivel.getMonth() + 1);
    renderizarCalendario(dataVisivel.getFullYear(), dataVisivel.getMonth());
  });

  irParaHojeBtn.addEventListener("click", irParaMesHoje);
  salvarConfigBtn.addEventListener("click", salvarConfig);

  // Listener do Corpo do Calendário (Delegação para remoção na célula)
  corpoCalendario.addEventListener("click", (event) => {
    const removeBtn = event.target.closest(".remover-materia-celula");
    if (removeBtn) {
      event.stopPropagation(); // Impede que o clique no botão abra o modal
      const celula = removeBtn.closest("td");
      const dataStr = celula.dataset.date;
      const index = parseInt(removeBtn.dataset.index, 10);
      if (dataStr && !isNaN(index)) {
        removerMateriaDireto(dataStr, index);
      }
    }
  });

  // Listeners do Modal
  modalFecharBtn.addEventListener("click", fecharModal);
  window.addEventListener("click", (event) => {
    if (event.target === modal) fecharModal();
  });
  addMateriaModalBtn.addEventListener("click", adicionarMateriaModal);
  minutosInputModal.addEventListener("keypress", (e) => {
    if (e.key === "Enter") addMateriaModalBtn.click();
  });
  modalListaMateriasEl.addEventListener("click", (event) => {
    // Delegação para remover no modal
    const removeBtn = event.target.closest(".remove-materia-modal");
    if (removeBtn) {
      const index = parseInt(removeBtn.dataset.index, 10);
      if (!isNaN(index)) {
        removerMateriaModal(index);
      }
    }
  });

  // Listeners das Abas
  abasBtns.forEach((btn) => btn.addEventListener("click", mudarAba));

  // Listeners do Dashboard
  shortcutBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const dias = parseInt(btn.dataset.dias, 10);
      setDateRange(dias);
      // Aplica o filtro automaticamente ao clicar no atalho
      aplicarFiltroDashBtn.click();
    });
  });
  aplicarFiltroDashBtn.addEventListener("click", () => {
    renderizarDashboard(dataInicioDashInput.value, dataFimDashInput.value);
  });

  // --- Inicialização ---
  irParaMesHoje(); // Renderiza o calendário no mês atual
  // Define o range inicial do dashboard (ex: últimos 7 dias) para que carregue na primeira vez
  setDateRange(7);
  // Não renderiza o dashboard inicialmente, só quando a aba for clicada pela primeira vez (controlado em mudarAba)
});

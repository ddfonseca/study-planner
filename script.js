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
  const canvasGraficoMaterias = document
    .getElementById("grafico-materias")
    .getContext("2d");
  const canvasGraficoDias = document
    .getElementById("grafico-dias")
    .getContext("2d");
  let graficoMateriasInstance = null;
  let graficoDiasInstance = null;

  // --- Estado ---
  let dataVisivel = new Date(); // Mês/Ano sendo exibido no calendário
  let dataSelecionadaModal = null; // Guarda a data 'YYYY-MM-DD' do dia clicado para o modal
  let config = carregarConfig();
  let dadosEstudo = carregarDadosEstudo();
  const hojeStr = formatarData(new Date()); // Guarda a data de hoje para comparação

  // --- Funções Auxiliares ---
  function formatarData(date) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  function formatarTempo(totalMinutos) {
    if (!totalMinutos || totalMinutos <= 0) {
      return "0m ⏰";
    }
    const horas = Math.floor(totalMinutos / 60);
    const minutos = totalMinutos % 60;
    let str = "";
    if (horas > 0) {
      str += `${horas}h `;
    }
    if (minutos > 0 || horas === 0) {
      // Mostra minutos se houver, ou se for a única unidade (ex: 0h 30m)
      str += `${minutos}m `;
    }
    return str.trim() + " ⏰";
  }

  // --- Funções de Persistência (localStorage) ---
  function carregarConfig() {
    const configSalva = localStorage.getItem("calendarioEstudoConfig_v2"); // Nova chave para evitar conflito com versão antiga
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
    localStorage.setItem("calendarioEstudoConfig_v2", JSON.stringify(config));
    configStatusEl.textContent = "Configurações salvas!";
    setTimeout(() => (configStatusEl.textContent = ""), 3000);
    renderizarCalendario(dataVisivel.getFullYear(), dataVisivel.getMonth()); // Re-renderiza para aplicar cores
  }

  function carregarDadosEstudo() {
    const dadosSalvos = localStorage.getItem("calendarioEstudoDados_v2"); // Nova chave
    if (dadosSalvos) {
      try {
        // Adicionar validação se necessário
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
      "calendarioEstudoDados_v2",
      JSON.stringify(dadosEstudo),
    );
    // Se o dashboard estiver visível, atualize-o
    if (
      document
        .getElementById("dashboard-container")
        .classList.contains("active")
    ) {
      renderizarDashboard();
    }
  }

  // --- Funções do Calendário ---
  function obterDadosDia(dataStr) {
    return dadosEstudo[dataStr] || { totalMinutos: 0, materias: [] };
  }

  function atualizarEstiloDia(celula, dataStr) {
    const dadosDoDia = obterDadosDia(dataStr);
    const totalMinutosDia = dadosDoDia.totalMinutos;
    const minMinutos = config.minHoras * 60;
    const desMinutos = config.desHoras * 60;

    celula.classList.remove("horas-minimas-ok", "horas-desejadas-ok");

    if (desMinutos > 0 && totalMinutosDia >= desMinutos) {
      celula.classList.add("horas-desejadas-ok");
    } else if (minMinutos > 0 && totalMinutosDia >= minMinutos) {
      celula.classList.add("horas-minimas-ok");
    }
    // Adiciona ou remove a classe 'hoje'
    if (dataStr === hojeStr) {
      celula.classList.add("hoje");
    } else {
      celula.classList.remove("hoje");
    }
  }

  function renderizarCalendario(ano, mes) {
    corpoCalendario.innerHTML = "";
    mesAnoAtualEl.textContent = `${new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(new Date(ano, mes))} de ${ano}`;

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

          const diaNumEl = document.createElement("span");
          diaNumEl.classList.add("dia-numero");
          diaNumEl.textContent = data;
          celula.appendChild(diaNumEl);

          // Não mostra mais a lista aqui, apenas o total
          const totalTempoEl = document.createElement("span");
          totalTempoEl.classList.add("total-horas-dia"); // Mantendo a classe CSS por simplicidade
          totalTempoEl.textContent = formatarTempo(
            obterDadosDia(dataStr).totalMinutos,
          ); // Mostra o tempo formatado
          celula.appendChild(totalTempoEl);

          atualizarEstiloDia(celula, dataStr);

          celula.addEventListener("click", () => abrirModal(dataStr));

          data++;
        }
        linha.appendChild(celula);
      }
      corpoCalendario.appendChild(linha);
      if (data > numDiasMes) break;
    }
  }

  // --- Funções do Modal ---
  function abrirModal(dataStr) {
    dataSelecionadaModal = dataStr;
    const dataObj = new Date(dataStr + "T00:00:00"); // Adiciona T00:00:00 para evitar problemas de fuso horário na formatação
    modalDataSelecionadaEl.textContent = dataObj.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    atualizarListaModal();
    materiaInputModal.value = "";
    minutosInputModal.value = "";
    modal.style.display = "block";
    materiaInputModal.focus(); // Foco no input de matéria ao abrir
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
      textoItem.textContent = `${item.materia}: ${formatarTempo(item.minutos)}`;
      li.appendChild(textoItem);

      const removeBtn = document.createElement("span");
      removeBtn.textContent = "X";
      removeBtn.classList.add("remove-materia-modal");
      removeBtn.title = "Remover esta matéria";
      removeBtn.dataset.index = index; // Guarda o índice para remoção
      li.appendChild(removeBtn);

      modalListaMateriasEl.appendChild(li);
    });

    modalTotalTempoDiaEl.textContent = formatarTempo(dadosDoDia.totalMinutos);
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
      alert("Insira uma quantidade de minutos válida (maior que zero).");
      return;
    }

    if (!dadosEstudo[dataSelecionadaModal]) {
      dadosEstudo[dataSelecionadaModal] = { totalMinutos: 0, materias: [] };
    }

    dadosEstudo[dataSelecionadaModal].materias.push({
      materia: materia,
      minutos: minutos,
    });
    dadosEstudo[dataSelecionadaModal].totalMinutos = dadosEstudo[
      dataSelecionadaModal
    ].materias.reduce((sum, item) => sum + item.minutos, 0);

    salvarDadosEstudo();

    // Atualiza UI
    atualizarListaModal();
    atualizarCelulaCalendario(dataSelecionadaModal); // Atualiza a célula correspondente no calendário
    materiaInputModal.value = "";
    minutosInputModal.value = "";
    materiaInputModal.focus();
  }

  function removerMateriaModal(index) {
    if (!dataSelecionadaModal || !dadosEstudo[dataSelecionadaModal]) return;

    dadosEstudo[dataSelecionadaModal].materias.splice(index, 1);
    dadosEstudo[dataSelecionadaModal].totalMinutos = dadosEstudo[
      dataSelecionadaModal
    ].materias.reduce((sum, item) => sum + item.minutos, 0);

    if (dadosEstudo[dataSelecionadaModal].materias.length === 0) {
      delete dadosEstudo[dataSelecionadaModal]; // Remove a entrada do dia se ficar vazia
    }

    salvarDadosEstudo();
    atualizarListaModal();
    atualizarCelulaCalendario(dataSelecionadaModal);
  }

  // Atualiza a célula no grid do calendário após mudanças no modal
  function atualizarCelulaCalendario(dataStr) {
    const celula = corpoCalendario.querySelector(`td[data-date="${dataStr}"]`);
    if (celula) {
      const totalTempoEl = celula.querySelector(".total-horas-dia"); // Classe mantida
      const dadosDoDia = obterDadosDia(dataStr);
      totalTempoEl.textContent = formatarTempo(dadosDoDia.totalMinutos);
      atualizarEstiloDia(celula, dataStr); // Reavalia a cor
    }
  }

  // --- Funções do Dashboard ---
  function renderizarDashboard() {
    renderizarGraficoMaterias();
    renderizarGraficoDias();
  }

  function renderizarGraficoMaterias() {
    const dadosAgregados = {}; // { materia: totalMinutos }

    // Agrega minutos por matéria de todos os dias
    Object.values(dadosEstudo).forEach((dia) => {
      dia.materias.forEach((item) => {
        dadosAgregados[item.materia] =
          (dadosAgregados[item.materia] || 0) + item.minutos;
      });
    });

    const labels = Object.keys(dadosAgregados);
    const data = Object.values(dadosAgregados);

    if (graficoMateriasInstance) {
      graficoMateriasInstance.destroy(); // Destroi gráfico anterior se existir
    }

    if (labels.length === 0) {
      // Opcional: Mostrar mensagem se não houver dados
      canvasGraficoMaterias.parentElement.insertAdjacentHTML(
        "afterbegin",
        '<p id="msg-sem-dados-materias">Sem dados de matérias para exibir.</p>',
      );
      return;
    } else {
      const msg = document.getElementById("msg-sem-dados-materias");
      if (msg) msg.remove();
    }

    graficoMateriasInstance = new Chart(canvasGraficoMaterias, {
      type: "pie", // ou 'doughnut'
      data: {
        labels: labels,
        datasets: [
          {
            label: "Minutos por Matéria",
            data: data,
            backgroundColor: gerarCoresPastel(labels.length), // Gera cores automaticamente
            hoverOffset: 4,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "top",
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                let label = context.label || "";
                if (label) {
                  label += ": ";
                }
                if (context.parsed !== null) {
                  // Formata o tooltip para mostrar horas e minutos também
                  label += formatarTempo(context.parsed).replace("⏰", ""); // Remove emoji do tooltip
                }
                return label;
              },
            },
          },
        },
      },
    });
  }

  function renderizarGraficoDias() {
    const ultimos7Dias = [];
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0); // Zera hora para comparar apenas datas

    // Pega os últimos 7 dias (incluindo hoje)
    for (let i = 6; i >= 0; i--) {
      const dia = new Date(hoje);
      dia.setDate(hoje.getDate() - i);
      ultimos7Dias.push(formatarData(dia));
    }

    const labels = ultimos7Dias.map((dataStr) => {
      const [, , dia] = dataStr.split("-");
      const mes = new Date(dataStr + "T00:00:00").toLocaleDateString("pt-BR", {
        month: "short",
      });
      return `${dia} ${mes}`; // Formato "DD MêsAbrev"
    });
    const data = ultimos7Dias.map(
      (dataStr) => obterDadosDia(dataStr).totalMinutos,
    );

    if (graficoDiasInstance) {
      graficoDiasInstance.destroy();
    }

    // Verifica se há dados para exibir (total de minutos > 0)
    const temDados = data.some((minutos) => minutos > 0);
    if (!temDados) {
      const msgExistente = document.getElementById("msg-sem-dados-dias");
      if (!msgExistente) {
        // Só adiciona a mensagem se ela não existir
        canvasGraficoDias.parentElement.insertAdjacentHTML(
          "afterbegin",
          '<p id="msg-sem-dados-dias">Sem dados de estudo nos últimos 7 dias.</p>',
        );
      }
      // Limpa a área do canvas se existia um gráfico antes
      canvasGraficoDias
        .getContext("2d")
        .clearRect(0, 0, canvasGraficoDias.width, canvasGraficoDias.height);
      return;
    } else {
      const msg = document.getElementById("msg-sem-dados-dias");
      if (msg) msg.remove();
    }

    graficoDiasInstance = new Chart(canvasGraficoDias, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Minutos Estudados por Dia",
            data: data,
            backgroundColor: "rgba(54, 162, 235, 0.6)", // Azul com transparência
            borderColor: "rgba(54, 162, 235, 1)",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              // Formata o eixo Y para mostrar h e m
              callback: function (value, index, values) {
                return formatarTempo(value).replace("⏰", "");
              },
            },
          },
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function (context) {
                let label = context.dataset.label || "";
                if (label) {
                  label += ": ";
                }
                if (context.parsed.y !== null) {
                  label += formatarTempo(context.parsed.y).replace("⏰", "");
                }
                return label;
              },
            },
          },
        },
      },
    });
  }

  // Função simples para gerar cores diferentes para o gráfico de pizza
  function gerarCoresPastel(numCores) {
    const cores = [];
    const baseHue = Math.random() * 360; // Começa com uma matiz aleatória
    for (let i = 0; i < numCores; i++) {
      // Varia a matiz (H), mantém saturação (S) e luminosidade (L) altas para tons pastel
      const hue = (baseHue + i * (360 / numCores)) % 360;
      cores.push(`hsl(${hue}, 70%, 80%)`);
    }
    return cores;
  }

  // --- Funções de Navegação e Inicialização ---
  function mudarAba(event) {
    const abaAlvo = event.target.dataset.aba;

    // Atualiza botões
    abasBtns.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.aba === abaAlvo);
    });

    // Atualiza conteúdo
    abasConteudos.forEach((conteudo) => {
      conteudo.classList.toggle(
        "active",
        conteudo.id === `${abaAlvo}-container`,
      );
    });

    // Renderiza o dashboard se for a aba ativa
    if (abaAlvo === "dashboard") {
      renderizarDashboard();
    }
  }

  function irParaMesHoje() {
    dataVisivel = new Date(); // Volta para a data atual
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

  // Listeners do Modal
  modalFecharBtn.addEventListener("click", fecharModal);
  window.addEventListener("click", (event) => {
    // Fecha se clicar fora do conteúdo
    if (event.target === modal) {
      fecharModal();
    }
  });
  addMateriaModalBtn.addEventListener("click", adicionarMateriaModal);
  // Adicionar com Enter no input de minutos
  minutosInputModal.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      addMateriaModalBtn.click();
    }
  });
  // Listener para remover matéria (delegação de evento)
  modalListaMateriasEl.addEventListener("click", (event) => {
    if (event.target.classList.contains("remove-materia-modal")) {
      const index = parseInt(event.target.dataset.index, 10);
      removerMateriaModal(index);
    }
  });

  // Listeners das Abas
  abasBtns.forEach((btn) => btn.addEventListener("click", mudarAba));

  // --- Inicialização ---
  irParaMesHoje(); // Renderiza o calendário no mês atual ao carregar
});

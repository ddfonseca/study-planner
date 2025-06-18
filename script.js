/**
 * Planner de Estudos Elegante - Script Completo
 * Inclui: Modal, Tempo em Minutos, Formatação h/m, Foco em Hoje,
 * Dashboard c/ Chart.js e Filtros, Visualização/Deleção na Célula,
 * Resumo Mensal e Total Semanal.
 */
document.addEventListener("DOMContentLoaded", () => {
	// --- Seletores de Elementos Globais ---
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
	const diasVerdesCountEl = document.getElementById("dias-verdes-count");
	const diasAzuisCountEl = document.getElementById("dias-azuis-count");

	// --- Seletores de Elementos do Modal ---
	const modal = document.getElementById("modal-materia");
	const modalFecharBtn = document.getElementById("modal-fechar-btn");
	const modalDataSelecionadaEl = document.getElementById("modal-data-selecionada");
	const materiaInputModal = document.getElementById("materia-input-modal");
	const minutosInputModal = document.getElementById("minutos-input-modal");
	const addMateriaModalBtn = document.getElementById("add-materia-modal-btn");
	const modalListaMateriasEl = document.getElementById("modal-lista-materias");
	const modalTotalTempoDiaEl = document.getElementById("modal-total-tempo-dia");

	// --- Seletores de Elementos do Dashboard ---
	const dataInicioDashInput = document.getElementById("data-inicio-dash");
	const dataFimDashInput = document.getElementById("data-fim-dash");
	const shortcutBtns = document.querySelectorAll(".btn-shortcut");
	const aplicarFiltroDashBtn = document.getElementById("aplicar-filtro-dash");
	const canvasGraficoMaterias = document.getElementById("grafico-materias")?.getContext("2d"); // Adiciona '?' para segurança
	const canvasGraficoDias = document.getElementById("grafico-dias")?.getContext("2d");
	const msgSemDadosMaterias = document.getElementById("msg-sem-dados-materias");
	const msgSemDadosDias = document.getElementById("msg-sem-dados-dias");
	let graficoMateriasInstance = null;
	let graficoDiasInstance = null;

	// --- Estado da Aplicação ---
	let dataVisivel = new Date(); // Mês/Ano sendo exibido no calendário
	let dataSelecionadaModal = null; // Data 'YYYY-MM-DD' do dia selecionado para o modal
	let config = carregarConfig();
	let dadosEstudo = carregarDadosEstudo();
	const hojeStr = formatarData(new Date()); // Data de hoje em string para comparações

	// ========================================================================
	// --- Funções Auxiliares ---
	// ========================================================================

	/** Formata um objeto Date para 'YYYY-MM-DD' */
	function formatarData(date) {
		if (!(date instanceof Date) || isNaN(date)) {
			if (typeof date === "string" && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
				date = new Date(date + "T00:00:00");
				if (isNaN(date)) return null;
			} else {
				return null;
			}
		}
		const yyyy = date.getFullYear();
		const mm = String(date.getMonth() + 1).padStart(2, "0");
		const dd = String(date.getDate()).padStart(2, "0");
		return `${yyyy}-${mm}-${dd}`;
	}

	/** Formata minutos totais para 'Xh Ym' */
	function formatarTempo(totalMinutos) {
		if (!totalMinutos || totalMinutos <= 0) {
			return "0m";
		}
		const horas = Math.floor(totalMinutos / 60);
		const minutos = totalMinutos % 60;
		let str = "";
		if (horas > 0) str += `${horas}h `;
		if (minutos > 0 || horas === 0) str += `${minutos}m`;
		return str.trim();
	}

	/** Formata minutos totais para 'Xh Ym ⏰' (com ícone) */
	function formatarTempoComEmoji(totalMinutos) {
		const tempoFormatado = formatarTempo(totalMinutos);
		// Adiciona ícone Font Awesome via innerHTML
		return tempoFormatado !== "0m"
			? `${tempoFormatado} <i class="far fa-clock" style="font-size: 0.8em; opacity: 0.7;"></i>`
			: "0m";
	}

	// ========================================================================
	// --- Funções de Persistência (localStorage) ---
	// ========================================================================

	/** Carrega configurações salvas */
	function carregarConfig() {
		const configSalva = localStorage.getItem("calendarioEstudoConfig_v3");
		const configPadrao = { minHoras: 2, desHoras: 4 };
		let configAtual = configPadrao;
		if (configSalva) {
			try {
				configAtual = JSON.parse(configSalva);
				if (typeof configAtual.minHoras !== "number" || typeof configAtual.desHoras !== "number") {
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

	/** Salva as configurações atuais */
	function salvarConfig() {
		const minH = parseFloat(minHorasInput.value) || 0;
		const desH = parseFloat(desHorasInput.value) || 0;

		if (minH < 0 || desH < 0) {
			alert("As horas não podem ser negativas.");
			return;
		}
		if (minH > desH && desH > 0) {
			alert("As horas mínimas não podem ser maiores que as horas desejadas (a menos que desejadas seja 0).");
			return;
		}

		config = { minHoras: minH, desHoras: desH };
		localStorage.setItem("calendarioEstudoConfig_v3", JSON.stringify(config));
		configStatusEl.textContent = "Salvo!";
		setTimeout(() => (configStatusEl.textContent = ""), 2000);
		renderizarCalendario(dataVisivel.getFullYear(), dataVisivel.getMonth()); // Re-renderiza para aplicar cores
	}

	/** Carrega dados de estudo salvos */
	function carregarDadosEstudo() {
		const dadosSalvos = localStorage.getItem("calendarioEstudoDados_v3");
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

	/** Salva os dados de estudo atuais */
	function salvarDadosEstudo() {
		localStorage.setItem("calendarioEstudoDados_v3", JSON.stringify(dadosEstudo));
		// Atualiza o dashboard se estiver visível e as datas estiverem definidas
		if (
			document.getElementById("dashboard-container").classList.contains("active") &&
			dataInicioDashInput.value &&
			dataFimDashInput.value
		) {
			renderizarDashboard(dataInicioDashInput.value, dataFimDashInput.value);
		}
	}

	// ========================================================================
	// --- Funções do Calendário ---
	// ========================================================================

	/** Obtém os dados de estudo para um dia específico */
	function obterDadosDia(dataStr) {
		// Retorna um objeto padrão se não houver dados para o dia
		return dadosEstudo[dataStr] || { totalMinutos: 0, materias: [] };
	}

	/** Aplica estilo de cor à célula e retorna status */
	function atualizarEstiloDia(celula, dataStr) {
		const dadosDoDia = obterDadosDia(dataStr);
		const totalMinutosDia = dadosDoDia.totalMinutos;
		const minMinutos = config.minHoras * 60;
		const desMinutos = config.desHoras * 60;

		celula.classList.remove("horas-minimas-ok", "horas-desejadas-ok", "hoje");

		let isGreen = false;
		let isBlue = false;

		if (desMinutos > 0 && totalMinutosDia >= desMinutos) {
			celula.classList.add("horas-desejadas-ok");
			isBlue = true;
			isGreen = true; // Azul implica verde para contagem
		} else if (minMinutos > 0 && totalMinutosDia >= minMinutos) {
			celula.classList.add("horas-minimas-ok");
			isGreen = true;
		}

		if (dataStr === hojeStr) {
			celula.classList.add("hoje");
		}
		return { isGreen, isBlue };
	}

	/** Renderiza o conteúdo interno de uma célula de dia do calendário */
	function renderizarCelulaDia(celula, dataStr) {
		const dadosDoDia = obterDadosDia(dataStr);
		celula.innerHTML = ""; // Limpa conteúdo anterior

		// Número do dia
		const diaNumEl = document.createElement("span");
		diaNumEl.classList.add("dia-numero");
		diaNumEl.textContent = new Date(dataStr + "T00:00:00").getDate();
		celula.appendChild(diaNumEl);

		// Lista de matérias na célula
		const listaMateriasEl = document.createElement("ul");
		listaMateriasEl.classList.add("lista-materias-celula");
		dadosDoDia.materias.forEach((item, index) => {
			const li = document.createElement("li");

			const textoEl = document.createElement("span");
			textoEl.classList.add("materia-texto");
			textoEl.textContent = item.materia;
			textoEl.title = `${item.materia}: ${formatarTempo(item.minutos)}`;
			li.appendChild(textoEl);

			const tempoEl = document.createElement("span");
			tempoEl.classList.add("materia-tempo");
			tempoEl.innerHTML = formatarTempo(item.minutos); // Sem emoji aqui
			li.appendChild(tempoEl);

			// Botão de remover
			const removeBtn = document.createElement("button");
			removeBtn.classList.add("remover-materia-celula");
			removeBtn.dataset.index = index;
			removeBtn.title = `Remover ${item.materia}`;
			removeBtn.innerHTML = '<i class="fas fa-trash-alt fa-xs"></i>'; // Ícone
			li.appendChild(removeBtn);

			listaMateriasEl.appendChild(li);
		});
		celula.appendChild(listaMateriasEl);

		// Total de tempo diário na célula
		const totalTempoEl = document.createElement("span");
		totalTempoEl.classList.add("total-tempo-dia-celula");
		totalTempoEl.innerHTML = formatarTempoComEmoji(dadosDoDia.totalMinutos); // Com emoji
		celula.appendChild(totalTempoEl);

		// Aplica estilo (cor) e retorna status para contagem
		return atualizarEstiloDia(celula, dataStr);
	}

	/** Renderiza todo o grid do calendário para um mês/ano específico */
	function renderizarCalendario(ano, mes) {
		corpoCalendario.innerHTML = "";
		mesAnoAtualEl.textContent = `${new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(
			new Date(ano, mes)
		)} de ${ano}`;
		dataVisivel = new Date(ano, mes, 1);

		let greenDaysCount = 0;
		let blueDaysCount = 0;

		const primeiroDiaMes = new Date(ano, mes, 1);
		const ultimoDiaMes = new Date(ano, mes + 1, 0);
		const numDiasMes = ultimoDiaMes.getDate();
		const diaSemanaPrimeiro = primeiroDiaMes.getDay(); // 0 = Domingo

		let data = 1;
		for (let i = 0; i < 6; i++) {
			// Loop das semanas (linhas)
			const linha = document.createElement("tr");
			let weeklyTotalMinutes = 0;

			for (let j = 0; j < 7; j++) {
				// Loop dos dias da semana (colunas)
				const celula = document.createElement("td");
				if ((i === 0 && j < diaSemanaPrimeiro) || data > numDiasMes) {
					// Célula vazia (antes do dia 1 ou depois do último dia)
					celula.classList.add("dia-fora-mes");
				} else {
					// Dia válido do mês
					const dataCompleta = new Date(ano, mes, data);
					const dataStr = formatarData(dataCompleta);
					celula.dataset.date = dataStr;

					// Renderiza conteúdo e obtém status (verde/azul)
					const statusDia = renderizarCelulaDia(celula, dataStr);

					// Contagem para resumo mensal
					if (statusDia.isGreen) greenDaysCount++;
					if (statusDia.isBlue) blueDaysCount++;

					// Acumula total semanal
					weeklyTotalMinutes += obterDadosDia(dataStr).totalMinutos;

					// Adiciona listener para abrir modal (se não clicar no botão de remover)
					celula.addEventListener("click", (e) => {
						if (!e.target.closest(".remover-materia-celula")) {
							abrirModal(dataStr);
						}
					});
					data++;
				}
				linha.appendChild(celula);
			} // Fim loop dias (j)

			// Adiciona célula de total semanal à linha
			const totalCell = document.createElement("td");
			totalCell.classList.add("total-semanal-cell");
			totalCell.innerHTML = formatarTempoComEmoji(weeklyTotalMinutes);
			linha.appendChild(totalCell);

			corpoCalendario.appendChild(linha);
			if (data > numDiasMes) break; // Otimização: para de criar linhas se não há mais dias
		} // Fim loop semanas (i)

		// Atualiza os contadores no resumo mensal
		diasVerdesCountEl.textContent = greenDaysCount;
		diasAzuisCountEl.textContent = blueDaysCount;
	}

	// ========================================================================
	// --- Funções do Modal ---
	// ========================================================================

	/** Abre o modal para um dia específico */
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

	/** Fecha o modal */
	function fecharModal() {
		modal.style.display = "none";
		dataSelecionadaModal = null;
	}

	/** Atualiza a lista de matérias dentro do modal */
	function atualizarListaModal() {
		if (!dataSelecionadaModal) return;
		const dadosDoDia = obterDadosDia(dataSelecionadaModal);
		modalListaMateriasEl.innerHTML = ""; // Limpa

		dadosDoDia.materias.forEach((item, index) => {
			const li = document.createElement("li");

			const textoItem = document.createElement("span");
			textoItem.innerHTML = `<i class="fas fa-book-reader fa-xs" style="opacity: 0.6;"></i> ${item.materia}`;
			li.appendChild(textoItem);

			const tempoEBotao = document.createElement("div");
			tempoEBotao.style.display = "flex";
			tempoEBotao.style.alignItems = "center";
			tempoEBotao.style.gap = "10px";

			const tempoModal = document.createElement("span");
			tempoModal.classList.add("materia-tempo-modal");
			tempoModal.innerHTML = formatarTempoComEmoji(item.minutos); // Com emoji
			tempoEBotao.appendChild(tempoModal);

			const removeBtn = document.createElement("button");
			removeBtn.classList.add("remove-materia-modal");
			removeBtn.title = `Remover ${item.materia}`;
			removeBtn.dataset.index = index;
			removeBtn.innerHTML = '<i class="fas fa-times-circle"></i>'; // Ícone de remover
			tempoEBotao.appendChild(removeBtn);

			li.appendChild(tempoEBotao);
			modalListaMateriasEl.appendChild(li);
		});

		modalTotalTempoDiaEl.innerHTML = formatarTempoComEmoji(dadosDoDia.totalMinutos); // Com emoji
	}

	/** Adiciona uma nova matéria/tempo através do modal */
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

		// Garante que a entrada para o dia exista
		if (!dadosEstudo[dataSelecionadaModal]) {
			dadosEstudo[dataSelecionadaModal] = { totalMinutos: 0, materias: [] };
		}

		dadosEstudo[dataSelecionadaModal].materias.push({
			materia: materia,
			minutos: minutos,
		});
		recalcularTotalDia(dataSelecionadaModal); // Atualiza o totalMinutos
		salvarDadosEstudo();

		// Atualiza a interface
		atualizarListaModal();
		atualizarCelulaCalendario(dataSelecionadaModal); // Re-renderiza o calendário
		materiaInputModal.value = "";
		minutosInputModal.value = "";
		materiaInputModal.focus();
	}

	/** Recalcula o total de minutos para um dia específico */
	function recalcularTotalDia(dataStr) {
		if (!dadosEstudo[dataStr]) return; // Sai se o dia não existe nos dados
		dadosEstudo[dataStr].totalMinutos = dadosEstudo[dataStr].materias.reduce(
			(sum, item) => sum + item.minutos,
			0
		);
	}

	/** Remove uma matéria de um dia específico (usado pelo modal e pela célula) */
	function removerMateria(dataStr, index) {
		if (!dadosEstudo[dataStr] || !dadosEstudo[dataStr].materias[index]) return false; // Verifica existência

		dadosEstudo[dataStr].materias.splice(index, 1);
		recalcularTotalDia(dataStr);

		// Se não houver mais matérias, remove a entrada do dia completamente
		if (dadosEstudo[dataStr].materias.length === 0) {
			delete dadosEstudo[dataStr];
		}
		salvarDadosEstudo();
		return true; // Sucesso
	}

	/** Remove matéria via clique no botão 'X' do modal */
	function removerMateriaModal(index) {
		if (!dataSelecionadaModal) return;
		if (removerMateria(dataSelecionadaModal, index)) {
			atualizarListaModal(); // Atualiza a lista do modal
			atualizarCelulaCalendario(dataSelecionadaModal); // Re-renderiza calendário
		}
	}

	/** Remove matéria via clique no botão lixeira da célula do calendário */
	function removerMateriaDireto(dataStr, index) {
		// Adiciona uma confirmação
		if (confirm(`Tem certeza que deseja remover esta entrada de estudo?`)) {
			if (removerMateria(dataStr, index)) {
				atualizarCelulaCalendario(dataStr); // Re-renderiza calendário
				// Se o modal estiver aberto para este dia, atualiza-o também
				if (modal.style.display === "block" && dataSelecionadaModal === dataStr) {
					atualizarListaModal();
				}
			}
		}
	}

	/** Atualiza a célula no calendário (re-renderizando tudo para atualizar totais) */
	function atualizarCelulaCalendario(dataStr) {
		// A forma mais simples e segura de garantir que os totais
		// (diário na célula, semanal na linha, mensal na sidebar)
		// sejam atualizados corretamente é re-renderizar o calendário.
		renderizarCalendario(dataVisivel.getFullYear(), dataVisivel.getMonth());
	}

	// ========================================================================
	// --- Funções do Dashboard ---
	// ========================================================================

	/** Define o intervalo de datas nos inputs do dashboard */
	function setDateRange(diasAtras) {
		const hoje = new Date();
		const fim = new Date(hoje);
		const inicio = new Date(hoje);
		inicio.setDate(hoje.getDate() - (diasAtras - 1)); // Ex: 7 dias -> hoje - 6

		// Usa formatarData para garantir o formato YYYY-MM-DD
		dataInicioDashInput.value = formatarData(inicio);
		dataFimDashInput.value = formatarData(fim);
	}

	/** Renderiza ambos os gráficos do dashboard para um intervalo de datas */
	function renderizarDashboard(startDateStr, endDateStr) {
		// Verifica se os elementos canvas existem
		if (!canvasGraficoMaterias || !canvasGraficoDias) {
			console.error("Elementos canvas do dashboard não encontrados.");
			return;
		}

		// Validação de datas
		if (
			!startDateStr ||
			!endDateStr ||
			new Date(startDateStr + "T00:00:00") > new Date(endDateStr + "T00:00:00")
		) {
			alert(
				"Por favor, selecione um período de datas válido (data de início não pode ser maior que a data de fim)."
			);
			// Opcional: Limpar gráficos ou mostrar mensagem de erro nos gráficos
			// clearDashboardCharts();
			return;
		}

		renderizarGraficoMaterias(startDateStr, endDateStr);
		renderizarGraficoDias(startDateStr, endDateStr);
	}

	/** Limpa os gráficos e exibe mensagens de "sem dados" */
	function clearDashboardCharts() {
		if (graficoMateriasInstance) graficoMateriasInstance.destroy();
		if (graficoDiasInstance) graficoDiasInstance.destroy();
		if (msgSemDadosMaterias) msgSemDadosMaterias.style.display = "block";
		if (msgSemDadosDias) msgSemDadosDias.style.display = "block";
		if (canvasGraficoMaterias) {
			canvasGraficoMaterias.style.display = "none"; // Esconde canvas
			canvasGraficoMaterias
				.getContext("2d")
				.clearRect(0, 0, canvasGraficoMaterias.width, canvasGraficoMaterias.height);
		}
		if (canvasGraficoDias) {
			canvasGraficoDias.style.display = "none"; // Esconde canvas
			canvasGraficoDias.getContext("2d").clearRect(0, 0, canvasGraficoDias.width, canvasGraficoDias.height);
		}
	}

	/** Renderiza o gráfico de pizza/doughnut de minutos por matéria */
	function renderizarGraficoMaterias(startDateStr, endDateStr) {
		const dadosAgregados = {};
		const inicio = new Date(startDateStr + "T00:00:00");
		const fim = new Date(endDateStr + "T23:59:59"); // Inclui dia final completo

		// Filtra e Agrega dados do período selecionado
		Object.entries(dadosEstudo).forEach(([data, diaData]) => {
			const dataAtual = new Date(data + "T00:00:00");
			if (dataAtual >= inicio && dataAtual <= fim) {
				diaData.materias.forEach((item) => {
					dadosAgregados[item.materia] = (dadosAgregados[item.materia] || 0) + item.minutos;
				});
			}
		});

		const labels = Object.keys(dadosAgregados);
		const data = Object.values(dadosAgregados);

		if (graficoMateriasInstance) graficoMateriasInstance.destroy(); // Destroi gráfico anterior

		// Mostra/esconde mensagem e canvas
		if (msgSemDadosMaterias) msgSemDadosMaterias.style.display = labels.length === 0 ? "block" : "none";
		if (canvasGraficoMaterias) canvasGraficoMaterias.style.display = labels.length > 0 ? "block" : "none";

		if (labels.length > 0) {
			graficoMateriasInstance = new Chart(canvasGraficoMaterias, {
				type: "doughnut",
				data: {
					labels: labels,
					datasets: [
						{
							label: "Minutos",
							data: data,
							backgroundColor: gerarCores(labels.length),
							borderColor: "rgba(255, 255, 255, 0.5)",
							borderWidth: 1,
							hoverOffset: 8,
						},
					],
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					plugins: {
						legend: {
							position: "bottom",
							labels: { padding: 15, font: { size: 13 } },
						},
						tooltip: {
							callbacks: {
								label: (context) => `${context.label}: ${formatarTempo(context.parsed)}`,
							},
						},
					},
				},
			});
		}
	}

	/** Renderiza o gráfico de barras de minutos por dia */
	function renderizarGraficoDias(startDateStr, endDateStr) {
		const labels = []; // Datas 'YYYY-MM-DD'
		const data = []; // Minutos por dia
		const inicio = new Date(startDateStr + "T00:00:00");
		const fim = new Date(endDateStr + "T00:00:00");

		// Gera todas as datas no intervalo e busca os dados
		let diaAtualLoop = new Date(inicio);
		while (diaAtualLoop <= fim) {
			const diaStr = formatarData(diaAtualLoop);
			labels.push(diaStr);
			data.push(obterDadosDia(diaStr).totalMinutos);
			diaAtualLoop.setDate(diaAtualLoop.getDate() + 1); // Próximo dia
		}

		if (graficoDiasInstance) graficoDiasInstance.destroy(); // Destroi anterior

		const temDados = data.some((min) => min > 0);
		// Mostra/esconde mensagem e canvas
		if (msgSemDadosDias) msgSemDadosDias.style.display = !temDados ? "block" : "none";
		if (canvasGraficoDias) canvasGraficoDias.style.display = temDados ? "block" : "none";

		if (temDados) {
			graficoDiasInstance = new Chart(canvasGraficoDias, {
				type: "bar",
				data: {
					labels: labels, // Datas 'YYYY-MM-DD'
					datasets: [
						{
							label: "Minutos Estudados",
							data: data,
							backgroundColor: "rgba(74, 144, 226, 0.6)",
							borderColor: "rgba(74, 144, 226, 1)",
							borderWidth: 1,
							borderRadius: 4,
							barPercentage: 0.7,
							categoryPercentage: 0.8,
						},
					],
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					scales: {
						x: {
							// Eixo X configurado para tempo
							type: "time",
							time: {
								unit: labels.length > 35 ? "month" : labels.length > 7 ? "week" : "day", // Ajusta unidade
								tooltipFormat: "PPP", // Formato do tooltip (requer date-fns)
								displayFormats: {
									day: "dd MMM",
									week: "dd MMM",
									month: "MMM yyyy",
								},
							},
							grid: { display: false },
							ticks: {
								font: { size: 11 },
								maxRotation: 0,
								autoSkip: true,
								maxTicksLimit: 10,
							},
						},
						y: {
							// Eixo Y
							beginAtZero: true,
							grid: { color: "#eef1f3" },
							ticks: {
								font: { size: 11 },
								callback: (value) => formatarTempo(value),
							}, // Formata labels Y
						},
					},
					plugins: {
						legend: { display: false },
						tooltip: {
							callbacks: {
								title: (context) => context[0].label, // Usa label formatado do eixo X
								label: (context) => `Estudo: ${formatarTempo(context.parsed.y)}`,
							},
						},
					},
				},
			});
		}
	}

	/** Gera cores variadas para gráficos */
	function gerarCores(numCores) {
		const cores = [];
		const baseHue = 195; // Tom azulado inicial
		const saturation = 70;
		const lightness = 75;
		for (let i = 0; i < numCores; i++) {
			const hue = (baseHue + i * (360 / (numCores + 1))) % 360; // Distribuição de matiz
			cores.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
		}
		return cores;
	}

	// ========================================================================
	// --- Funções de Navegação (Abas) ---
	// ========================================================================

	/** Alterna a visibilidade das abas e seus conteúdos */
	function mudarAba(event) {
		const abaBtnClicado = event.target.closest(".aba-btn");
		if (!abaBtnClicado) return; // Sai se o clique não foi em um botão de aba

		const abaAlvo = abaBtnClicado.dataset.aba;

		// Atualiza estilo dos botões
		abasBtns.forEach((btn) => btn.classList.toggle("active", btn.dataset.aba === abaAlvo));
		// Atualiza visibilidade do conteúdo
		abasConteudos.forEach((conteudo) =>
			conteudo.classList.toggle("active", conteudo.id === `${abaAlvo}-container`)
		);

		// Se a aba do dashboard foi ativada, renderiza os gráficos
		if (abaAlvo === "dashboard") {
			// Define um range padrão se as datas estiverem vazias
			if (!dataInicioDashInput.value || !dataFimDashInput.value) {
				setDateRange(7); // Padrão: Últimos 7 dias
			}
			// Renderiza com as datas atuais dos inputs
			renderizarDashboard(dataInicioDashInput.value, dataFimDashInput.value);
		}
	}

	/** Navega o calendário para o mês atual */
	function irParaMesHoje() {
		dataVisivel = new Date(); // Define a data visível para hoje
		renderizarCalendario(dataVisivel.getFullYear(), dataVisivel.getMonth());
	}

	// ========================================================================
	// --- Event Listeners ---
	// ========================================================================

	// Navegação do Calendário
	mesAnteriorBtn.addEventListener("click", () => {
		dataVisivel.setMonth(dataVisivel.getMonth() - 1);
		renderizarCalendario(dataVisivel.getFullYear(), dataVisivel.getMonth());
	});
	mesProximoBtn.addEventListener("click", () => {
		dataVisivel.setMonth(dataVisivel.getMonth() + 1);
		renderizarCalendario(dataVisivel.getFullYear(), dataVisivel.getMonth());
	});
	irParaHojeBtn.addEventListener("click", irParaMesHoje);

	// Configurações
	salvarConfigBtn.addEventListener("click", salvarConfig);

	// Delegação de Evento no Corpo do Calendário (para remoção na célula)
	corpoCalendario.addEventListener("click", (event) => {
		const removeBtn = event.target.closest(".remover-materia-celula");
		if (removeBtn) {
			event.stopPropagation(); // Impede que abrir modal
			const celula = removeBtn.closest("td");
			const dataStr = celula.dataset.date;
			const index = parseInt(removeBtn.dataset.index, 10);
			if (dataStr && !isNaN(index)) {
				removerMateriaDireto(dataStr, index);
			}
		}
	});

	// Event Listeners do Modal
	modalFecharBtn.addEventListener("click", fecharModal);
	window.addEventListener("click", (event) => {
		if (event.target === modal) fecharModal();
	}); // Fecha ao clicar fora
	addMateriaModalBtn.addEventListener("click", adicionarMateriaModal);
	minutosInputModal.addEventListener("keypress", (e) => {
		if (e.key === "Enter") addMateriaModalBtn.click();
	}); // Enter adiciona
	// Delegação de evento para remover item na lista do modal
	modalListaMateriasEl.addEventListener("click", (event) => {
		const removeBtn = event.target.closest(".remove-materia-modal");
		if (removeBtn) {
			const index = parseInt(removeBtn.dataset.index, 10);
			if (!isNaN(index)) {
				removerMateriaModal(index);
			}
		}
	});

	// Navegação por Abas
	abasBtns.forEach((btn) => btn.addEventListener("click", mudarAba));

	// Event Listeners do Dashboard
	shortcutBtns.forEach((btn) => {
		btn.addEventListener("click", () => {
			const dias = parseInt(btn.dataset.dias, 10);
			setDateRange(dias);
			aplicarFiltroDashBtn.click(); // Aplica filtro automaticamente
		});
	});
	aplicarFiltroDashBtn.addEventListener("click", () => {
		// Validação básica antes de renderizar
		if (dataInicioDashInput.value && dataFimDashInput.value) {
			renderizarDashboard(dataInicioDashInput.value, dataFimDashInput.value);
		} else {
			alert("Por favor, selecione as datas de início e fim.");
		}
	});

	// ========================================================================
	// --- Inicialização da Aplicação ---
	// ========================================================================
	irParaMesHoje(); // Renderiza o calendário no mês atual ao carregar
	setDateRange(7); // Define o range inicial do dashboard (mas não renderiza ainda)
});

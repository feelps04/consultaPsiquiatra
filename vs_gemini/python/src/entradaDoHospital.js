// Log para confirmar que o script está sendo carregado
console.log("entradaDoHospital.js loaded");

// Garante que o DOM esteja completamente carregado antes de tentar obter os elementos
document.addEventListener('DOMContentLoaded', () => {
    // Obtém referências para os elementos necessários para a simulação
    const gameCanvas = document.getElementById('gameCanvas'); // Referência ao canvas
    const ctx = gameCanvas.getContext('2d'); // Contexto 2D para desenhar no canvas
    const messageBox = document.getElementById('message-box'); // Referência à caixa de mensagem

    // --- Elementos da Interface de Chat ---
    const chatContainer = document.getElementById('chat-container');
    const chatBox = document.getElementById('chat-box');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');
    // Opcional: Adicionar um elemento para mostrar com quem o usuário está a falar
    const chatTitle = document.createElement('h3');
    chatTitle.textContent = "Chat com a Enfermeira";
    chatTitle.style.textAlign = 'center';
    chatTitle.style.marginBottom = '10px';
    chatTitle.style.color = '#0277bd'; // Cor tema hospital
    chatContainer.insertBefore(chatTitle, chatBox); // Insere o título antes da caixa de chat

    // --- Botão de Fechar Chat ---
    const closeChatButton = document.createElement('button');
    closeChatButton.textContent = 'X'; // Texto do botão
    closeChatButton.style.position = 'absolute'; // Posição absoluta para ficar no canto
    closeChatButton.style.top = '10px'; // Distância do topo
    closeChatButton.style.right = '10px'; // Distância da direita
    closeChatButton.style.backgroundColor = 'transparent'; // Fundo transparente
    closeChatButton.style.border = 'none'; // Sem borda
    closeChatButton.style.color = '#0277bd'; // Cor do texto/ícone
    closeChatButton.style.fontSize = '1.2em'; // Tamanho da fonte
    closeChatButton.style.cursor = 'pointer'; // Cursor de mão ao passar por cima
    closeChatButton.style.fontWeight = 'bold'; // Negrito
    closeChatButton.style.zIndex = '10'; // Garante que fique acima de outros elementos no contêiner
    chatContainer.appendChild(closeChatButton); // Adiciona o botão ao contêiner do chat

    // Listener para o botão de fechar
    closeChatButton.addEventListener('click', () => {
        console.log("Close button clicked. Ending chat.");
        // A ação de fechar agora é sempre chamar endChat e iniciar a saída
        showMessage('Interação com a Google IA finalizada pelo usuário.', 3000); // Mensagem para o usuário
        // Ao fechar, vamos diretamente para a tela final, exibindo o histórico atual (se houver)
        simulationState = 'finalizedChat'; // Define o estado para finalizado
        // Passa o histórico atual para displaySummaryAndHistory
        displaySummaryAndHistory("Chat finalizado pelo usuário.", fullConversationHistory);
        endChat(); // Limpa a interface do chat imediatamente
        // A animação de saída ocorrerá após a tela final ser exibida e o botão de reiniciar for clicado
    });
    // --- Fim do Botão de Fechar Chat ---

    // --- Elementos da Tela Final ---
    const endScreen = document.getElementById('end-screen');
    const summaryContainer = document.getElementById('summary-container');
    const endMessage = document.getElementById('end-message'); // Note: This element is no longer in HTML v3 and v4
    const historyContentDiv = document.getElementById('history-content'); // Note: This element is no longer in HTML v3 and v4
    const restartButton = document.getElementById('restart-button');
    // --- Fim Elementos da Tela Final ---


    // --- Variável para armazenar o ID da sessão de chat ---
    let currentChatSessionId = null;
    // --- Variável para armazenar o histórico completo do chat para o sumário ---
    let fullConversationHistory = [];

    // --- Obter dados do personagem e do usuário da URL ---
    const urlParams = new URLSearchParams(window.location.search);
    const selectedGender = urlParams.get('gender') || 'male'; // Padrão para 'male' se não encontrado
    const selectedSkinColor = urlParams.get('skin') || 'blue'; // Padrão para 'blue' se não encontrado
    const characterImageUrl = urlParams.get('imageUrl'); // Obtém a URL da imagem do personagem
    const selectedChatStyle = urlParams.get('chatStyle') || 'short'; // Obtém o estilo de chat

    // Novos dados do usuário obtidos da URL
    const userName = urlParams.get('userName');
    const userAge = urlParams.get('userAge');
    const userWeight = urlParams.get('userWeight');
    const userHeight = urlParams.get('userHeight');
    const userBMI = urlParams.get('userBMI');

    console.log("Dados do usuário recebidos na entradaDoHospital.js:");
    console.log(`Nome: ${userName}, Idade: ${userAge}, Peso: ${userWeight}, Altura: ${userHeight}, IMC: ${userBMI}`);
    console.log(`Valor de userBMI recebido da URL: ${userBMI}`);


    // --- URLs dos Avatares ---
    // URL para o avatar da enfermeira
    const nurseAvatarUrl = 'imagens/enfermeiraEsquerda.png'; // Caminho para a imagem da enfermeira
    // URL para o avatar da psicóloga
    const psicologaAvatarUrl = 'imagens/psicologa.png'; // Caminho para a imagem da psicóloga (FEMININO)
    // URL para o avatar do psicólogo
    const psicologoAvatarUrl = 'imagens/psicologo.png'; // Caminho para a imagem do psicólogo (MASCULINO)
    // A URL do avatar do paciente é a characterImageUrl obtida da URL

    // --- Variável de estado para controlar o avatar da IA no chat ---
    let isChattingWithSpecialist = false;
    // Variável para armazenar o gênero do especialista para escolher o avatar
    let currentSpecialistGender = null; // Pode ser 'Masculino', 'Feminino', ou null


    // --- Declaração de variáveis no início do scope ---
    // Localizações importantes para esta cena
    const locations = {
        start: { x: 50, y: 600, label: 'Início' }, // Ponto de partida (esquerda)
        hospitalEntrance: { x: 450, y: 600, label: 'Entrada do Hospital' }, // Posição da porta de entrada (ajustado para a direita)
        insideHospital: { x: 650, y: 600, label: 'Dentro do Hospital' }, // Posição X AJUSTADA para mais à direita
        inFrontOfNurse: { x: 750, y: 600, label: 'Frente da Enfermeira' }, // Posição X ajustada para frente da enfermeira
        offScreenLeft: {x: -100, y: 600, label: 'Out of Screen Left'} // Nova localização para saída
    };

    // Propriedades da porta simbólica (agora para bi-porta)
    const hospitalDoor = {
        x: locations.hospitalEntrance.x, // Posição X central da porta dupla
        y: locations.hospitalEntrance.y - 180, // Posição Y (topo da porta) - Ajuste conforme a altura do personagem
        totalWidth: 120, // Largura total da porta dupla (aumentado)
        height: 180, // Altura da porta (aumentado)
        color: '#78909c', // Cor da porta (cinza azulado)
        isOpen: false, // Estado da porta (aberta ou fechada)
        openingSpeed: 4, // Velocidade de abertura (para animação)
        closingSpeed: 6, // Velocidade de fechamento (para animação) - AUMENTADO AQUI
        currentWidth: 120 // Largura atual de cada metade da porta (inicialmente a largura total / 2)
    };
    hospitalDoor.currentWidth = hospitalDoor.totalWidth / 2;

    // Propriedades do sensor de presença simbólico
    const presenceSensor = {
        x: hospitalDoor.x, // Posição X do sensor (no centro da porta)
        y: hospitalDoor.y + hospitalDoor.height / 2, // Posição Y do sensor (no meio da porta)
        radius: 10, // Raio do sensor visual
        color: '#ff0000', // Cor inicial (vermelho - inativo)
        activeColor: '#00ff00', // Cor quando ativo (verde)
        detectionRadius: 100 // Raio de detecção do personagem
    };

    let characterImage = new Image();
    let isCharacterImageLoaded = false;

    const character = {
        x: 50, // Posição X inicial (esquerda)
        y: 600, // Posição Y inicial (base do personagem) - Ajustado para caber na tela
        width: 60, // Largura padrão inicial (ajustada para um tamanho razoável)
        height: 120, // Altura padrão inicial (ajustada para um tamanho razoável)
        color: '#0000FF', // Cor padrão (azul) - Usada apenas como fallback se a imagem não carregar
        speed: 2, // Velocidade de movimento
        targetX: 0, // Posição X alvo (será definida pela lógica do jogo)
        targetY: 600, // Posição Y alvo (será definida pela lógica do jogo)
        isMoving: false, // Indica se o personagem está se movendo
        animationFrame: 0, // Frame atual da animação de caminhada (para fallback ou spritesheet)
        animationSpeed: 8 // Velocidade da animação (menor = mais rápido)
    };

    // --- Propriedades da Enfermeira ---
    let nurseImage = new Image();
    let isNurseImageLoaded = false;

    const nurse = {
        x: 800, // Ajustado para uma posição MAIS à direita
        y: 600, // Alinhada com a base do personagem
        width: 80, // Largura padrão (ajustar se usar imagem real)
        height: 150, // Altura padrão (ajustar se usar imagem real)
        color: '#c2185b' // Cor simbólica (rosa escuro) - Usada apenas como fallback
    };

    // URL da imagem da enfermeira (substituída pelo caminho do arquivo)
    const nurseImageUrl = 'imagens/enfermeiraEsquerda.png'; // Caminho para a imagem da enfermeira


    // Estado atual da simulação para esta cena
    let simulationState = 'loading'; // Estado inicial temporário enquanto espera as imagens (ou fallback)

    // --- Funções de Simulação 2D ---

    function drawNurse(x, y, color) {
         ctx.fillStyle = '#000000';
         ctx.fillRect(x - 2, y - 2, 4, 4);

         if (isNurseImageLoaded) {
             const drawX = x - nurse.width / 2;
             const drawY = y - nurse.height;
             ctx.drawImage(nurseImage, drawX, drawY, nurse.width, nurse.height);
         } else {
             ctx.fillStyle = color;
             ctx.fillRect(x - nurse.width / 2, y - nurse.height, nurse.width, nurse.height - 20);
             ctx.beginPath();
             ctx.arc(x, y - nurse.height - 10, nurse.width / 3, 0, Math.PI * 2);
             ctx.fill();
         }
    }

    function drawCharacter(x, y, color, frame = 0) {
        if (isCharacterImageLoaded) {
            const drawX = x - character.width / 2;
            const drawY = y - character.height;
            ctx.drawImage(characterImage, drawX, drawY, character.width, character.height);
        } else {
            ctx.fillStyle = color;
            const legWidth = character.width / 2 - 2;
            const legHeight = character.height / 3; // Ajustado para fallback
            let legOffset1 = 0;
            let legOffset2 = 0;

            if (character.isMoving) {
                legOffset1 = (Math.floor(frame / character.animationSpeed) % 2 === 0) ? 2 : -2;
                legOffset2 = (Math.floor(frame / character.animationSpeed) % 2 === 0) ? -2 : 2;
            }

            // Pernas
            ctx.fillRect(x - character.width / 4, y - legHeight + legOffset1, character.width / 4, legHeight);
            ctx.fillRect(x + character.width / 4 - character.width / 4, y - legHeight + legOffset2, character.width / 4, legHeight);

            // Corpo
            ctx.fillRect(x - character.width / 2, y - legHeight - character.height, character.width, character.height);

            // Cabeça
            ctx.beginPath();
            ctx.arc(x, y - legHeight - character.height - (character.width / 4), character.width / 4, 0, Math.PI * 2);
            ctx.fill();
        }

         if (character.isMoving) {
             character.animationFrame++;
         }
    }

    function drawScene() {
        ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
        drawHospitalDoor();
        drawNurse(nurse.x, nurse.y, nurse.color);
        drawCharacter(character.x, character.y, character.color, character.animationFrame);

         ctx.fillStyle = '#000';
         ctx.font = '16px sans-serif';
         ctx.textAlign = 'center';
         ctx.fillText(locations.start.label, locations.start.x, locations.start.y + 30);
         ctx.fillText(locations.hospitalEntrance.label, locations.hospitalEntrance.x, locations.hospitalEntrance.y + 30);
         ctx.fillText(locations.insideHospital.label, locations.insideHospital.x, locations.insideHospital.y + 30);
    }

    function drawHospitalDoor() {
        ctx.fillStyle = hospitalDoor.color;

        const leftDoorX = hospitalDoor.x - hospitalDoor.currentWidth;
        ctx.fillRect(leftDoorX, hospitalDoor.y, hospitalDoor.currentWidth, hospitalDoor.height);

        const rightDoorX = hospitalDoor.x;
        ctx.fillRect(rightDoorX, hospitalDoor.y, hospitalDoor.currentWidth, hospitalDoor.height);

        if (hospitalDoor.isOpen && hospitalDoor.currentWidth === 0) {
            ctx.strokeStyle = hospitalDoor.color;
            ctx.lineWidth = 5;
            const frameX = hospitalDoor.x - hospitalDoor.totalWidth / 2;
            const frameY = hospitalDoor.y;
            ctx.strokeRect(frameX, frameY, hospitalDoor.totalWidth, hospitalDoor.height);
            ctx.lineWidth = 1;
        }

        ctx.fillStyle = presenceSensor.color;
        ctx.beginPath();
        ctx.arc(presenceSensor.x, presenceSensor.y, presenceSensor.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    function moveCharacter() {
        if (simulationState !== 'movingToEntrance' && simulationState !== 'movingIntoHospital' && simulationState !== 'movingToNurse' && simulationState !== 'leavingHospital') {
             return;
        }

        const dx = character.targetX - character.x;
        const dy = character.targetY - character.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < character.speed) {
            console.log(`moveCharacter: Reached target for state ${simulationState}. Current X: ${character.x.toFixed(2)}, Target X: ${character.targetX.toFixed(2)}`);
            character.x = character.targetX;
            character.y = character.targetY;
            character.isMoving = false;
            handleStateChange();
        } else {
            character.x += (dx / distance) * character.speed;
            character.y += (dy / distance) * character.speed;
        }
    }

    function setCharacterTarget(x, y) {
        console.log("setCharacterTarget called. Setting target to X:", x, "Y:", y);
        character.targetX = x;
        character.targetY = y;
        character.isMoving = true;
    }

    function showMessage(message, duration = 3000) {
        messageBox.textContent = message;
        messageBox.style.display = 'block';

        if (duration > 0) {
            setTimeout(() => {
                hideMessage();
            }, duration);
        }
    }

    function hideMessage() {
        messageBox.style.display = 'none';
    }

    // --- FUNÇÃO MODIFICADA: Adiciona mensagens com avatares e considera o estado do chat ---
    function addChatMessage(sender, message) {
        console.log(`addChatMessage called for sender: ${sender}, message: ${message}`); // Log para depuração
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message');

        const avatarElement = document.createElement('img');
        avatarElement.classList.add('chat-avatar');

        const textElement = document.createElement('div');
        textElement.classList.add('message-text');
        textElement.textContent = message; // A mensagem já vem formatada do backend se necessário

        if (sender === "Google IA") {
            messageElement.classList.add('ai-message');
            avatarElement.classList.add('ai-avatar');
            // --- Lógica para escolher o avatar da IA ---
            console.log(`Avatar Logic: isChattingWithSpecialist=${isChattingWithSpecialist}, currentSpecialistGender=${currentSpecialistGender}`); // Log de depuração
            if (isChattingWithSpecialist && currentSpecialistGender) {
                 // Usa o gênero armazenado para escolher o avatar
                 if (currentSpecialistGender.toLowerCase() === 'feminino') {
                     console.log("Using Psicologa avatar:", psicologaAvatarUrl);
                     avatarElement.src = psicologaAvatarUrl; // Avatar da psicóloga
                     avatarElement.alt = "Avatar Psicóloga";
                 } else { // Assume Masculino ou outro caso como padrão para psicologo.png
                     console.log("Using Psicologo avatar:", psicologoAvatarUrl);
                     avatarElement.src = psicologoAvatarUrl; // Avatar do psicólogo
                     avatarElement.alt = "Avatar Psicólogo";
                 }
                 // Adiciona um handler de erro para o caso das imagens do especialista não carregarem
                 avatarElement.onerror = () => {
                     console.error("Erro ao carregar a imagem do avatar do especialista:", avatarElement.src);
                     // Opcional: Substituir por uma imagem de fallback ou esconder o avatar
                 };
            } else {
                 console.log("Using Nurse avatar:", nurseAvatarUrl);
                 avatarElement.src = nurseAvatarUrl; // Avatar da enfermeira
                 avatarElement.alt = "Avatar Enfermeira";
                 // Adiciona um handler de erro para o caso da imagem da enfermeira não carregar
                 avatarElement.onerror = () => {
                     console.error("Erro ao carregar a imagem do avatar da enfermeira:", avatarElement.src);
                     // Opcional: Substituir por uma imagem de fallback ou esconder o avatar
                 };
            }
            // --- Fim da lógica de avatar da IA ---

            messageElement.appendChild(avatarElement);
            messageElement.appendChild(textElement);
        } else { // Assumimos que é o usuário ("Você")
            console.log("Adding user message with avatar:", decodeURIComponent(characterImageUrl)); // Log para avatar do usuário
            messageElement.classList.add('user-message');
            avatarElement.classList.add('user-avatar');
            // Usa a URL da imagem do personagem obtida da URL
            // Adiciona um handler de erro para o caso da imagem do personagem não carregar
            avatarElement.onerror = () => {
                console.error("Erro ao carregar a imagem do avatar do personagem:", avatarElement.src);
                // Opcional: Substituir por uma imagem de fallback ou esconder o avatar
                // avatarElement.src = 'caminho/para/fallback_paciente.png';
                // avatarElement.style.display = 'none';
            };
            avatarElement.src = decodeURIComponent(characterImageUrl);
            avatarElement.alt = "Avatar Paciente";
            messageElement.appendChild(textElement); // Texto antes do avatar para o usuário
            messageElement.appendChild(avatarElement);
        }

        chatBox.appendChild(messageElement);
        // Rolagem automática para a mensagem mais recente
        chatBox.scrollTop = chatBox.scrollHeight; // Adiciona esta linha para rolar para o final
         console.log("Message added to chatBox."); // Log de confirmação
    }


    // --- FUNÇÃO MODIFICADA: Agora chama o backend real com a URL da imagem e dados do usuário e lida com histórico ---
    async function sendChatMessage(message) {
        console.log("sendChatMessage called with message:", message); // Log no início da função
        if (!currentChatSessionId) {
            console.error("No active chat session. Cannot send message.");
            return;
        }

        // Adiciona a mensagem do usuário ao histórico completo ANTES de enviar
        // Isso garante que o histórico contenha a última mensagem do usuário
        fullConversationHistory.push({ role: 'user', parts: [{ text: message }] });
        console.log("User message added to fullConversationHistory. Current length:", fullConversationHistory.length);

        addChatMessage("Você", message); // Adiciona a mensagem do usuário ao chat

        chatInput.value = ''; // Limpa o input imediatamente
        chatInput.disabled = true; // Desabilita input e botão enquanto espera a resposta
        sendButton.disabled = true;
        chatInput.placeholder = "Aguardando resposta..."; // Adiciona placeholder para feedback

        // Declare data outside the try block
        let data = null; // Initialize data to null

        try {
            console.log("Attempting to send message to /chat endpoint."); // Log antes de enviar
            const response = await fetch('http://127.0.0.1:5000/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    session_id: currentChatSessionId,
                    message: message,
                    gender: selectedGender, // Envia o gênero do paciente para concordância
                    // Envia os dados do usuário para o backend em cada mensagem (opcional, pode enviar apenas no start_chat)
                    // Para garantir que o backend sempre tenha os dados mais recentes, enviar aqui também.
                    userName: userName,
                    userAge: userAge,
                    userWeight: userWeight,
                    userHeight: userHeight,
                    userBMI: userBMI
                })
            });
            console.log("Fetch response received."); // Log após receber resposta

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Server responded with error:", response.status, errorData); // Log do erro do servidor
                throw new Error(`Erro do servidor: ${response.status} - ${errorData.error}`);
            }

            data = await response.json(); // Assign data here
            console.log("Response data parsed:", data); // Log dos dados parseados
            // --- ADICIONADO: Log do histórico recebido no backend ---
            console.log("Histórico de chat recebido do backend:", data.chat_history);
            // --- Fim ADICIONADO ---


            // --- MOVIDO: Atualiza o gênero do especialista ANTES de adicionar a mensagem ---
            // Atualiza o gênero do especialista se for o caso
            if (data && data.specialist_gender) {
                currentSpecialistGender = data.specialist_gender;
                isChattingWithSpecialist = true; // Muda o estado para o avatar do especialista
                // Atualiza o título do chat para refletir o especialista e seu gênero
                chatTitle.textContent = `Chat com o(a) ${currentSpecialistGender === 'Masculino' ? 'Dr.' : 'Dra.'} de Psicologia`;
                console.log("Specialist gender updated:", currentSpecialistGender); // Log para confirmar atualização
            }
            // --- Fim MOVIDO ---


            // Add AI message to chat (only if not finalized by error)
            if (data && data.message) {
                 addChatMessage("Google IA", data.message);
                 // Adiciona a mensagem da IA ao histórico completo
                 fullConversationHistory.push({ role: 'model', parts: [{ text: data.message }] });
                 console.log("AI message added to fullConversationHistory. Current length:", fullConversationHistory.length);
            }


            // --- Lógica para chat finalizado e exibição do sumário/histórico ---
            console.log("Checking if chat is finalized. data.finalized:", data ? data.finalized : 'data is null'); // *** NOVO LOG ***
            if (data && data.finalized) { // Check if data is defined and finalized
                simulationState = 'finalizedChat'; // Novo estado: chat finalizado, mas ainda visível
                console.log("Chat finalizado detectado pelo frontend. data.summary:", data.summary); // Log para verificar summary
                console.log("Chat finalizado detectado pelo frontend. data.chat_history:", data.chat_history); // Log para verificar histórico
                console.log("Condição data.finalized é TRUE."); // *** NOVO LOG ***

                // Armazena o histórico completo recebido do backend (se existir e for mais completo)
                // Preferimos o histórico que construímos no frontend, mas podemos usar o do backend como fallback
                if (data.chat_history && Array.isArray(data.chat_history) && data.chat_history.length > fullConversationHistory.length) {
                     fullConversationHistory = data.chat_history;
                     console.log(`Histórico completo atualizado com dados do backend. ${fullConversationHistory.length} mensagens.`);
                } else {
                     console.log(`Usando histórico construído no frontend. ${fullConversationHistory.length} mensagens.`);
                }


                // Permitir que o usuário leia a última mensagem antes de acionar a tela final
                setTimeout(() => {
                    console.log("Timeout para finalização acionado."); // Log dentro do timeout
                    showMessage("A consulta foi finalizada!", 3000); // Mensagem para o usuário
                    console.log("Iniciando exibição da tela final...");

                    // Exibe a tela FINAL SEMPRE que o chat é finalizado
                    try { // *** ADICIONADO: Try-catch around displaySummaryAndHistory ***
                        displaySummaryAndHistory(data.summary, fullConversationHistory); // summaryText ainda é passado, mas só o histórico é exibido
                        console.log("displaySummaryAndHistory called successfully."); // *** NOVO LOG ***
                    } catch (displayError) {
                        console.error("Error calling displaySummaryAndHistory:", displayError); // *** NOVO LOG ***
                        showMessage("Ocorreu um erro ao exibir a tela final.", 5000);
                        // Em caso de erro ao exibir, ainda tentar finalizar o chat
                        endChat();
                    }


                    // A animação de saída agora é acionada pelo clique no botão de reiniciar na tela final.
                    // Removemos o setTimeout que iniciava a saída automaticamente.

                }, 1000); // Dá um segundo para a última mensagem da IA ser lida
            }


        } catch (error) {
            console.error("Erro ao enviar mensagem:", error);
            addChatMessage("Google IA", "Desculpe, houve um erro na comunicação. Por favor, tente novamente mais tarde.");
             // Em caso de erro na comunicação, também finalizar o chat para evitar travamento
            console.error("Erro de comunicação. Finalizando chat e exibindo tela final.");
            simulationState = 'finalizedChat'; // Define o estado para finalizado
             // Exibe a tela final mesmo em caso de erro de comunicação, com o histórico parcial
            try { // *** ADICIONADO: Try-catch around displaySummaryAndHistory ***
                displaySummaryAndHistory("Ocorreu um erro na comunicação.", fullConversationHistory);
                 console.log("displaySummaryAndHistory called successfully after communication error."); // *** NOVO LOG ***
            } catch (displayError) {
                console.error("Error calling displaySummaryAndHistory after communication error:", displayError); // *** NOVO LOG ***
                showMessage("Ocorreu um erro ao exibir a tela final após falha de comunicação.", 5000);
            }
            endChat(); // Limpa a interface do chat
        } finally {
            // Reabilita o input e botão APENAS se o chat NÃO foi finalizado
            // Agora 'data' é sempre definida (ou null em caso de erro grave), então a verificação é mais simples.
            if (data && !data.finalized) {
                chatInput.disabled = false; // Reabilita o input e botão
                sendButton.disabled = false;
                chatInput.placeholder = "Digite sua mensagem...";
                chatInput.focus(); // Foca no input para facilitar a próxima mensagem
            } else if (!data) {
                 // Em caso de erro grave onde 'data' é null, manter desabilitado e mostrar mensagem de erro
                 chatInput.disabled = true;
                 sendButton.disabled = false;
                 chatInput.placeholder = "Erro na comunicação.";
            } else {
                 // Se o chat foi finalizado (por IA), manter os inputs desabilitados
                 chatInput.disabled = true;
                 sendButton.disabled = false;
                 chatInput.placeholder = "Chat finalizado.";
            }
             console.log("sendChatMessage function finished."); // *** NOVO LOG ***
        }
    }

    // Função para iniciar a sessão de chat principal
    async function startChatSession() {
        console.log("Attempting to start new chat session...");
        chatInput.disabled = true; // Desabilita input e botão enquanto espera a sessão
        sendButton.disabled = true;
        chatInput.placeholder = "Iniciando chat..."; // Adiciona placeholder

        // Limpa o histórico completo ao iniciar uma nova sessão
        fullConversationHistory = [];
        console.log("fullConversationHistory cleared at start.");

        // --- LOGS ADICIONAIS ANTES DO FETCH ---
        const startChatUrl = 'http://127.0.0.1:5000/start_chat';
        const requestBody = {
            chatStyle: selectedChatStyle, // Envia o estilo de chat
            gender: selectedGender, // Envia o gênero do paciente
            // Envia os dados do usuário para o backend na primeira requisição
            userName: userName,
            userAge: userAge,
            userWeight: userWeight,
            userHeight: userHeight,
            userBMI: userBMI
        };
        console.log("startChatSession: URL do endpoint:", startChatUrl);
        console.log("startChatSession: Dados enviados no body:", requestBody);
        // --- Fim dos LOGS ADICIONAIS ---


        try {
            console.log("Attempting to send message to /start_chat endpoint."); // Log antes de enviar
            const response = await fetch(startChatUrl, { // Usa a variável startChatUrl
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody) // Usa a variável requestBody
            });
             console.log("Fetch response from /start_chat received."); // Log após receber resposta


            if (!response.ok) {
                const errorData = await response.json();
                 console.error("Server responded with error on /start_chat:", response.status, errorData); // Log do erro do servidor
                throw new Error(`Erro do servidor: ${response.status} - ${errorData.error}`);
            }

            const data = await response.json();
            console.log("Response data from /start_chat parsed:", data); // Log dos dados parseados

            currentChatSessionId = data.session_id;
            addChatMessage("Google IA", data.initial_message); // Adiciona a primeira mensagem da IA
             // Adiciona a mensagem inicial da IA ao histórico completo
            fullConversationHistory.push({ role: 'model', parts: [{ text: data.initial_message }] });
            console.log("Initial AI message added to fullConversationHistory. Current length:", fullConversationHistory.length);

            chatContainer.classList.remove('hidden'); // Mostra o chat removendo a classe hidden


            console.log("Chat session started with ID:", currentChatSessionId);
            chatInput.focus(); // Foca no input do chat

            // --- ADICIONADO: Rolagem automática para baixo após iniciar o chat ---
            // Rola a janela para baixo para mostrar o chat
            window.scrollTo(0, document.body.scrollHeight);
            console.log("Window scrolled down to show chat.");
            // --- Fim ADICIONADO ---

        } catch (error) {
            console.error("Erro ao iniciar sessão de chat:", error);
            showMessage(`Erro ao iniciar chat: ${error.message}. Por favor, tente novamente.`, 5000);
            chatContainer.classList.add('hidden'); // Esconde o chat se não conseguir iniciar
        } finally {
             // Habilita input e botão após tentar iniciar a sessão
            chatInput.disabled = false;
            sendButton.disabled = false;
            chatInput.placeholder = "Digite sua mensagem...";
        }
    }

    // Função para finalizar o chat e esconder a interface
    function endChat() {
        console.log("endChat called. Hiding chat container."); // Log no início da função endChat
        chatContainer.classList.add('hidden'); // Esconde o contêiner de chat adicionando a classe hidden

        chatBox.innerHTML = ''; // Limpa as mensagens
        currentChatSessionId = null; // Zera o ID da sessão
        isChattingWithSpecialist = false; // Reseta o estado do avatar
        currentSpecialistGender = null; // Reseta o gênero do especialista
        chatTitle.textContent = "Chat com a Enfermeira"; // Reseta o título
        // Não limpamos fullConversationHistory aqui, pois ele é usado na tela final.
        console.log("Chat interface reset and hidden."); // Log no final da função endChat
        // A transição de estado de simulação agora é feita em handleChatResponse ou closeChatButton click
        // simulationState = 'finished'; // Isso agora é controlado pela animação de saída
    }

     // --- FUNÇÃO MODIFICADA: Exibe a tela final com o histórico (sempre que chamada) ---
    function displaySummaryAndHistory(summaryText, history) {
        console.log("displaySummaryAndHistory called."); // *** NOVO LOG ***
        // summaryContainer e historyContentDiv já foram obtidos no início do script

        // Limpa o conteúdo anterior do histórico (historyContentDiv foi removido do HTML)
        // if (historyContentDiv) {
        //     historyContentDiv.innerHTML = '';
        // }


        // Exibe o histórico real da conversa recebido do backend ou o construído no frontend
        // Esta parte não será executada pois historyContentDiv foi removido do HTML
        // if (history && Array.isArray(history) && history.length > 0) {
        //     console.log(`Displaying conversation history. ${history.length} messages.`);
        //     if (historyContentDiv) {
        //         history.forEach(message => {
        //             const messageElement = document.createElement('p');
        //             // Determina a role baseada na estrutura do objeto de histórico
        //             const role = message.role === 'user' ? 'Paciente' : 'IA';
        //              // Acessa o texto da primeira parte, verificando se existe
        //             const textContent = message.parts && message.parts.length > 0 && message.parts[0].text ? message.parts[0].text : '';
        //             messageElement.textContent = `${role}: ${textContent}`;
        //             historyContentDiv.appendChild(messageElement);
        //         });
        //     }
        // } else {
        //     console.log("No conversation history to display or history is not an array/empty.");
        //     if (historyContentDiv) {
        //          const noHistoryMessage = document.createElement('p');
        //          noHistoryMessage.textContent = "Histórico da conversa não disponível ou vazio.";
        //          historyContentDiv.appendChild(noHistoryMessage);
        //     }
        // }

        // Mostra a tela final
        if (endScreen) { // *** ADICICIONADO: Verifica se endScreen existe ***
            endScreen.classList.remove('hidden');
            console.log("End screen displayed by removing 'hidden' class."); // *** NOVO LOG ***
        } else {
            console.error("End screen element not found!"); // *** NOVO LOG ***
        }


        // Adiciona listener ao botão de reiniciar
        // Verifica se o listener já foi adicionado para evitar duplicidade
        if (restartButton && !restartButton.dataset.listenerAdded) { // *** ADICIONADO: Verifica se restartButton existe ***
            restartButton.addEventListener('click', () => {
                console.log("Restart button clicked. Redirecting to menu.");
                // Inicia a animação de saída ANTES de redirecionar
                simulationState = 'leavingHospital';
                setCharacterTarget(locations.offScreenLeft.x, locations.offScreenLeft.y);
                // Redireciona APENAS após o personagem sair da tela (ou com um pequeno delay)
                // Um pequeno delay é mais simples do que esperar a animação de saída terminar aqui.
                setTimeout(() => {
                     window.location.href = 'menu_structure.html'; // Redireciona para a página do menu
                }, 1000); // Redireciona após 1 segundo
            });
            restartButton.dataset.listenerAdded = 'true'; // Marca que o listener foi adicionado
             console.log("Restart button listener added."); // *** NOVO LOG ***
        } else if (!restartButton) {
             console.error("Restart button element not found!"); // *** NOVO LOG ***
        }


         // Rola a janela para baixo para mostrar a tela final
         window.scrollTo(0, document.body.scrollHeight);
         console.log("Window scrolled down to show end screen.");
    }


    // --- Função para download do sumário e histórico (REMOVIDA) ---
    // Esta função foi removida conforme solicitado
    // function downloadSummary(summaryText, history) {
    //     console.log("Download summary functionality is disabled.");
    //     // Nenhuma ação de download é realizada aqui
    // }


// ... (rest of the code remains the same) ...
    // --- Lógica de Transição de Estados da Simulação ---
    // Esta função será chamada sempre que o personagem atingir um alvo.
    function handleStateChange() {
        console.log("Handling state change. Current state:", simulationState);
        switch (simulationState) {
            case 'movingToEntrance':
                if (!character.isMoving) {
                    // Após chegar na entrada do hospital, abrir a porta
                    hospitalDoor.isOpen = true;
                    // Mudar o estado para 'doorOpening' e aguardar
                    simulationState = 'doorOpening';
                    animateDoor();
                }
                break;
            case 'doorOpening':
                // Já animado por animateDoor, que vai chamar handleStateChange novamente quando terminar
                if (hospitalDoor.currentWidth <= 0) {
                    hospitalDoor.isOpen = true; // Garante que esteja aberto logicamente
                    // Agora que a porta está aberta, mover para dentro do hospital
                    setCharacterTarget(locations.insideHospital.x, locations.insideHospital.y);
                    simulationState = 'movingIntoHospital';
                    showMessage('Bem-vindo ao hospital! A enfermeira de triagem está aguardando você.', 3000); // Mensagem para o usuário
                }
                break;
            case 'movingIntoHospital':
                if (!character.isMoving) {
                    // Após entrar no hospital, mover para a frente da enfermeira
                    // --- Ajuste: Fechar a porta ---
                    hospitalDoor.isOpen = false; // Inicia o fechamento da porta
                    animateDoor(); // Anima o fechamento da porta
                    // --- Fim do Ajuste ---
                    // Define o alvo para a posição da enfermeira, subtraindo 20 pixels
                    setCharacterTarget(locations.inFrontOfNurse.x - 20, locations.inFrontOfNurse.y); // Subtrai 20 pixels
                    simulationState = 'movingToNurse';
                }
                break;
            case 'movingToNurse':
                if (!character.isMoving) {
                    // Chegou na enfermeira, iniciar o chat imediatamente
                    console.log("Reached nurse position. Starting chat."); // Log para confirmar
                    simulationState = 'chatting';
                    startChatSession(); // Inicia o chat com a IA
                    // A rolagem automática foi movida para dentro de startChatSession
                }
                break;
            case 'leavingHospital': // Novo estado para a animação de saída
                if (!character.isMoving) {
                    // Personagem saiu da tela
                    console.log("Personagem saiu da tela. Simulação finalizada.");
                    simulationState = 'finished';
                    gameCanvas.style.display = 'none'; // Esconde o canvas
                    // A exibição do sumário e botão de reiniciar agora acontece em displaySummaryAndHistory
                    // que é chamado quando data.finalized é true em sendChatMessage ou pelo clique no botão fechar.
                    // Não precisamos chamar displaySummaryAndHistory aqui novamente.
                }
                break;
            case 'finished':
                // Estado final, nenhuma ação de movimento adicional aqui
                break;
            case 'chatting':
                // No estado de chat, o loop continua para desenhar a cena de fundo,
                // mas a lógica de movimento é pausada.
                // A transição para 'finalizedChat' ou 'leavingHospital' é feita
                // pela resposta da IA ou pelo clique no botão de fechar.
                break;
            case 'finalizedChat':
                 // Chat finalizado, esperando a ação do usuário na tela final.
                 // Nenhuma ação de movimento aqui.
                 break;
            default:
                console.log("Estado da simulação desconhecido ou não tratado:", simulationState);
        }
    }


    // Funções de Animação
    function animateDoor() {
        if (hospitalDoor.isOpen && hospitalDoor.currentWidth > 0) {
            hospitalDoor.currentWidth = Math.max(0, hospitalDoor.currentWidth - hospitalDoor.openingSpeed);
            requestAnimationFrame(animateDoor);
        } else if (!hospitalDoor.isOpen && hospitalDoor.currentWidth < hospitalDoor.totalWidth / 2) {
                hospitalDoor.currentWidth = Math.min(hospitalDoor.totalWidth / 2, hospitalDoor.currentWidth + hospitalDoor.closingSpeed);
                requestAnimationFrame(animateDoor);
        } else {
            // Porta terminou de abrir ou fechar, chama o handler de estado
            handleStateChange();
        }
    }

    function gameLoop() {
        drawScene();
        moveCharacter();
        requestAnimationFrame(gameLoop);
    }

    // Função para iniciar a sequência de mensagens guiadas pela IA (Movida para antes de startSimulation)
    function startAIGuidedSimulation() {
        showMessage('Olá! Eu sou a Google IA. Iniciando sua jornada para o Hospital Psiquiátrico.', 5000);
        setTimeout(() => {
             showMessage('Dirigindo-se para a entrada...', 5000);
        }, 6000);
    }


    // Função para iniciar a simulação após o carregamento das imagens ou uso do fallback
    function startSimulation() {
         console.log("Iniciando simulação...");
         simulationState = 'movingToEntrance'; // Define o estado inicial para iniciar o movimento
         setCharacterTarget(locations.hospitalEntrance.x, locations.hospitalEntrance.y); // Define o alvo para a entrada do hospital
         startAIGuidedSimulation(); // Inicia a sequência de mensagens da IA
         gameLoop(); // Inicia o loop de animação
    }


    // Carregamento de Imagens
    characterImage.src = decodeURIComponent(characterImageUrl);
    characterImage.onload = () => {
        isCharacterImageLoaded = true;
        console.log("Character image loaded.");
        // Se todas as imagens estiverem carregadas, iniciar a simulação
        if (isNurseImageLoaded) {
            startSimulation();
        }
    };
    characterImage.onerror = () => {
        console.error("Failed to load character image:", characterImageUrl);
        isCharacterImageLoaded = false; // Garante que o fallback seja usado
        // Ainda tenta iniciar a simulação mesmo sem a imagem, usando o fallback
        if (isNurseImageLoaded) {
            startSimulation();
        }
    };


    nurseImage.src = nurseImageUrl;
    nurseImage.onload = () => {
        isNurseImageLoaded = true;
        console.log("Nurse image loaded.");
        if (isCharacterImageLoaded) {
            startSimulation();
        }
    };
    nurseImage.onerror = () => {
        console.error("Failed to load nurse image:", nurseImageUrl);
        isNurseImageLoaded = false; // Garante que o fallback seja usado
        if (isCharacterImageLoaded) {
            startSimulation();
        }
    };


    // Event Listeners para o Chat Principal
    sendButton.addEventListener('click', () => {
        const message = chatInput.value.trim();
        if (message && simulationState !== 'finalizedChat') { // Impede envio após finalização
            sendChatMessage(message);
        }
    });

    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && simulationState !== 'finalizedChat') { // Impede envio após finalização
            e.preventDefault(); // Previne a quebra de linha padrão do Enter no textarea
            const message = chatInput.value.trim();
            if (message) {
                sendButton.click(); // Simula o clique no botão de enviar
            }
        }
    });

    // Iniciar a simulação após o carregamento do DOM e das imagens
    // As chamadas para startSimulation estão dentro dos `onload` das imagens.
    // Se uma imagem falhar, a simulação ainda deve iniciar.
    // Se ambas falharem, a simulação iniciará quando a última falha for detectada.
    // É mais robusto ter uma contagem de carregamentos ou um Promise.all.
    // Por enquanto, a lógica atual nos `onload` e `onerror` é suficiente para garantir que `startSimulation` é chamado.
});

// Log para confirmar que o script está sendo carregado
console.log("menu.style.js loaded");

// Garante que o DOM esteja completamente carregado antes de tentar obter os elementos
document.addEventListener('DOMContentLoaded', () => {
    // Obtém referências para os elementos do HTML
    const characterPreviewImage = document.getElementById('character-preview');
    const skinColorSelect = document.getElementById('skin-color');
    const genderRadios = document.querySelectorAll('input[name="gender"]');
    const chatStyleRadios = document.querySelectorAll('input[name="chat-style"]'); // Referência aos botões de estilo de chat
    const startButton = document.getElementById('start-button'); // Referência ao botão Iniciar
    const messageBox = document.getElementById('message-box'); // Referência à caixa de mensagem
    const customizationMenu = document.getElementById('customization-menu'); // Referência ao menu

    // Referências para os novos campos de dados do usuário
    const userNameInput = document.getElementById('user-name');
    const userAgeInput = document.getElementById('user-age');
    const userWeightInput = document.getElementById('user-weight');
    const userHeightInput = document.getElementById('user-height');

    // --- Referências para os elementos do chat no menu (ADICIONADO) ---
    const menuChatContainer = document.getElementById('menu-chat-container');
    const menuChatBox = document.getElementById('menu-chat-box');
    const menuChatInput = document.getElementById('menu-chat-input');
    const menuSendButton = document.getElementById('menu-send-button');
    // --- Fim das Referências para o chat no menu ---

    // Variável para armazenar o ID da sessão do chat no menu
    let menuChatSessionId = null;


    // Mapeamento de seleção para URLs das imagens na pasta 'imagens'
    const characterImages = {
        male: {
            white: 'imagens/homen_branco..png',
            black: 'imagens/homenPreto.png'
        },
        female: {
            white: 'imagens/mulherBranca.png',
            black: 'imagens/mulherPreta.png'
        }
    };

    // Função para atualizar as opções de cor de pele no select
    function updateSkinColorOptions(selectedGender) {
        skinColorSelect.innerHTML = '';
        if (selectedGender === 'male') {
            const optionWhite = document.createElement('option');
            optionWhite.value = 'white';
            optionWhite.textContent = 'Branco';
            skinColorSelect.appendChild(optionWhite);

            const optionBlack = document.createElement('option');
            optionBlack.value = 'black';
            optionBlack.textContent = 'Preto';
            skinColorSelect.appendChild(optionBlack);
        } else { // female
            const optionWhite = document.createElement('option');
            optionWhite.value = 'white';
            optionWhite.textContent = 'Branca';
            skinColorSelect.appendChild(optionWhite);

            const optionBlack = document.createElement('option');
            optionBlack.value = 'black';
            optionBlack.textContent = 'Preta';
            skinColorSelect.appendChild(optionBlack);
        }
        console.log(`Opções de cor de pele atualizadas para gênero: ${selectedGender}`);
        updateCharacterPreview();
    }

    // Função para atualizar a imagem de pré-visualização com base nas seleções
    function updateCharacterPreview() {
        const selectedGender = document.querySelector('input[name="gender"]:checked').value;
        const selectedSkinColor = skinColorSelect.value;
        const imageUrl = characterImages[selectedGender][selectedSkinColor];

        let altText = 'Preview de Avatar';
        if (selectedGender === 'male') {
            altText += ' Homem';
            if (selectedSkinColor === 'white') {
                altText += ' Branco';
            } else { // black
                altText += ' Preto';
            }
        } else { // female
            altText += ' Mulher';
            if (selectedSkinColor === 'white') {
                altText += ' Branca';
            } else { // black
                altText += ' Preta';
            }
        }
        characterPreviewImage.src = imageUrl;
        characterPreviewImage.alt = altText;
        console.log(`Preview atualizado: Gênero: ${selectedGender}, Cor da Pele: ${selectedSkinColor}, URL: ${imageUrl}, Alt Text: "${altText}"`);
    }

    // Listener para mudanças na seleção de gênero
    genderRadios.forEach(radio => {
        radio.addEventListener('change', (event) => {
            const selectedGender = event.target.value;
            updateSkinColorOptions(selectedGender);
        });
    });

    // Listener para mudanças na seleção de cor de pele
    skinColorSelect.addEventListener('change', updateCharacterPreview);

    // Listener para mudanças no estilo de conversa
    chatStyleRadios.forEach(radio => {
        radio.addEventListener('change', (event) => {
            console.log(`Estilo de conversa selecionado: ${event.target.value}`);
        });
    });

    // Função para mostrar mensagens na caixa de mensagem (flutuante)
    function showMessage(message, duration = 3000) {
        messageBox.textContent = message;
        messageBox.style.display = 'block';
        if (duration > 0) {
            setTimeout(() => {
                hideMessage();
            }, duration);
        }
    }

    // Função para esconder a caixa de mensagem (flutuante)
    function hideMessage() {
        messageBox.style.display = 'none';
    }

    // --- Funções para o chat no menu (ADICIONADO) ---
    function addMenuChatMessage(sender, message) {
        console.log(`addMenuChatMessage called for sender: ${sender}, message: ${message}`);
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message');

        const avatarElement = document.createElement('img');
        avatarElement.classList.add('chat-avatar');

        const textElement = document.createElement('div');
        textElement.classList.add('message-text');
        textElement.textContent = message;

        if (sender === "Google IA") {
            messageElement.classList.add('ai-message');
            // --- ALTERADO: Usando a imagem da secretaria para o avatar da IA no menu ---
            avatarElement.src = 'imagens/secretaria.png'; // Avatar da secretaria para IA no menu
            avatarElement.alt = "Avatar Secretaria";
            // Adiciona handler de erro para o avatar da IA no menu
            avatarElement.onerror = () => {
                 console.error("Erro ao carregar a imagem do avatar da IA do menu:", avatarElement.src);
                 // Opcional: usar um avatar de fallback ou esconder o avatar
                 // avatarElement.src = 'imagens/robo_avatar_fallback.png';
                 // avatarElement.style.display = 'none';
            };
            // --- Fim da ALTERAÇÃO ---
            messageElement.appendChild(avatarElement);
            messageElement.appendChild(textElement);
        } else { // Assumimos que é o usuário ("Você")
            messageElement.classList.add('user-message');
            // Usar um avatar genérico para o usuário no chat do menu, ou talvez o preview?
            // Vamos usar um genérico por enquanto para simplificar.
            avatarElement.src = 'imagens/user_avatar_placeholder.png'; // Placeholder para avatar do usuário no menu
            avatarElement.alt = "Seu Avatar";
             // Adiciona handler de erro para o avatar do usuário no menu
            avatarElement.onerror = () => {
                 console.error("Erro ao carregar a imagem do avatar do usuário do menu:", avatarElement.src);
            };
            messageElement.appendChild(textElement);
            messageElement.appendChild(avatarElement);
        }

        menuChatBox.appendChild(messageElement);
        // Rolagem automática
        menuChatBox.scrollTop = menuChatBox.scrollHeight;
        console.log("Message added to menuChatBox.");
    }

    async function sendMenuChatMessage(message) {
        if (!menuChatSessionId) {
            console.error("No active menu chat session. Cannot send message.");
            return;
        }

        addMenuChatMessage("Você", message); // Adiciona a mensagem do usuário

        menuChatInput.value = ''; // Limpa o input
        menuChatInput.disabled = true; // Desabilita input e botão
        menuSendButton.disabled = true;
        menuChatInput.placeholder = "Aguardando resposta...";

        try {
            const response = await fetch('http://127.0.0.1:5000/menu_chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_id: menuChatSessionId, message: message })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Erro do servidor no chat do menu: ${response.status} - ${errorData.error}`);
            }

            const data = await response.json();
            console.log("Response from menu backend:", data);

            if (data && data.message) {
                addMenuChatMessage("Google IA", data.message);
            }

        } catch (error) {
            console.error("Erro ao enviar mensagem para chat do menu:", error);
            addMenuChatMessage("Google IA", "Desculpe, houve um erro na comunicação com o chat de boas-vindas. Por favor, tente novamente mais tarde.");
        } finally {
            menuChatInput.disabled = false; // Reabilita input e botão
            menuSendButton.disabled = false;
            menuChatInput.placeholder = "Converse com a IA de boas-vindas...";
            menuChatInput.focus();
        }
    }

    async function startMenuChatSession() {
        console.log("Attempting to start new menu chat session...");
        menuChatInput.disabled = true;
        menuSendButton.disabled = true;
        menuChatInput.placeholder = "Iniciando chat de boas-vindas...";
        menuChatContainer.classList.remove('hidden'); // Mostra o contêiner do chat do menu

        try {
            const response = await fetch('http://127.0.0.1:5000/start_menu_chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Erro do servidor ao iniciar chat do menu: ${response.status} - ${errorData.error}`);
            }

            const data = await response.json();
            menuChatSessionId = data.session_id;
            addMenuChatMessage("Google IA", data.initial_message); // Adiciona a primeira mensagem da IA

            console.log("Menu chat session started with ID:", menuChatSessionId);
            menuChatInput.focus();

        } catch (error) {
            console.error("Erro ao iniciar sessão de chat no menu:", error);
            showMessage(`Erro ao iniciar chat de boas-vindas: ${error.message}.`, 5000);
             menuChatContainer.classList.add('hidden'); // Esconde se falhar
        } finally {
            menuChatInput.disabled = false;
            menuSendButton.disabled = false;
            menuChatInput.placeholder = "Converse com a IA de boas-vindas...";
        }
    }
    // --- Fim das Funções para o chat no menu ---


    // Função para calcular o IMC
    function calculateBMI(weight, height) {
        if (height > 0) {
            return (weight / (height * height)).toFixed(2);
        }
        return null;
    }

    // Listener para validar o input de nome em tempo real
    userNameInput.addEventListener('input', () => {
        const nameRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ\s]*$/;
        const cleanedValue = userNameInput.value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ\s]/g, '');
        userNameInput.value = cleanedValue;
    });


    // Listener para o botão Iniciar Simulação
    startButton.addEventListener('click', () => {
        console.log("Botão Iniciar clicado.");

        // Coleta os dados do usuário
        const userName = userNameInput.value.trim();
        const userAge = parseInt(userAgeInput.value, 10);
        const userWeight = parseFloat(userWeightInput.value);
        const userHeight = parseFloat(userHeightInput.value);

        // --- Validação dos dados ---
        if (!userName) {
            showMessage("Por favor, insira seu nome.", 3000);
            return;
        }
        const nameRegexFinal = /^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/;
        if (!nameRegexFinal.test(userName)) {
             showMessage("O nome ainda contém caracteres inválidos. Por favor, use apenas letras e espaços.", 5000);
             return;
        }

        if (isNaN(userAge) || userAge <= 0) {
            showMessage("Por favor, insira uma idade válida (número maior que zero).", 3000);
            return;
        }
        if (isNaN(userWeight) || userWeight <= 0) {
            showMessage("Por favor, insira um peso válido em kg (número maior que zero).", 3000);
            return;
        }
        if (isNaN(userHeight) || userHeight <= 0) {
            showMessage("Por favor, insira uma altura válida em metros (número maior que zero).", 3000);
            return;
        }
        // --- Fim da Validação dos dados ---

        // Calcula o IMC
        const userBMI = calculateBMI(userWeight, userHeight);
        if (userBMI === null) {
             showMessage("Não foi possível calcular o IMC. Verifique se a altura é maior que zero.", 3000);
             return;
        }

        const selectedGender = document.querySelector('input[name="gender"]:checked').value;
        const selectedSkinColor = skinColorSelect.value;
        const selectedChatStyle = document.querySelector('input[name="chat-style"]:checked').value;

        console.log(`Opções selecionadas: Gênero: ${selectedGender}, Cor da Pele: ${selectedSkinColor}, Estilo de Chat: ${selectedChatStyle}`);
        console.log(`Dados do Usuário: Nome: "${userName}", Idade: ${userAge}, Peso: ${userWeight}, Altura: ${userHeight}, IMC: ${userBMI}`);

        // Esconde o chat do menu ao iniciar a simulação principal
        menuChatContainer.classList.add('hidden');

        // --- REDIRECIONA PARA entradaDoHospital.html PASSANDO OS DADOS NA URL ---
        const imageUrl = characterImages[selectedGender][selectedSkinColor];
        const encodedImageUrl = encodeURIComponent(imageUrl);
        const encodedUserName = encodeURIComponent(userName);
        const encodedUserAge = encodeURIComponent(userAge);
        const encodedUserWeight = encodeURIComponent(userWeight);
        const encodedUserHeight = encodeURIComponent(userHeight);
        const encodedUserBMI = encodeURIComponent(userBMI);

        console.log("Redirecionando para entradaDoHospital.html com URL da imagem e dados do usuário.");
        window.location.replace(`entradaDoHospital.html?gender=${selectedGender}&skin=${selectedSkinColor}&imageUrl=${encodedImageUrl}&chatStyle=${selectedChatStyle}&userName=${encodedUserName}&userAge=${encodedUserAge}&userWeight=${encodedUserWeight}&userHeight=${encodedUserHeight}&userBMI=${encodedUserBMI}`);
        // --- FIM DO REDIRECIONAMENTO ---
    });

    // --- Listeners para o chat no menu (ADICIONADO) ---
    menuSendButton.addEventListener('click', () => {
        const message = menuChatInput.value.trim();
        if (message) {
            sendMenuChatMessage(message);
        }
    });

    menuChatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const message = menuChatInput.value.trim();
            if (message) {
                menuSendButton.click();
            }
        }
    });
    // --- Fim dos Listeners para o chat no menu ---


    // Inicializa a pré-visualização da imagem e inicia a interação guiada pela IA
    const initialGender = document.querySelector('input[name="gender"]:checked').value;
    updateSkinColorOptions(initialGender); // Atualiza as opções de cor de pele na carga inicial

    // --- Modificado: Inicia o chat do menu em vez de apenas mostrar mensagens estáticas ---
    startMenuChatSession();
    // --- Fim da modificação ---

}); // Fim do DOMContentLoaded listener

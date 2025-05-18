🏥 Simulação de Hospital Psiquiátrico com IA
Este projeto apresenta uma simulação baseada na web de um processo de consulta inicial em um hospital psiquiátrico. Ele permite que os usuários personalizem um avatar, insiram seus dados pessoais e, em seguida, interajam com a equipe virtual impulsionada por IA – uma enfermeira de triagem e um especialista em psicologia – através de uma interface de chat, simulando as fases de admissão e consulta. A simulação inclui elementos visuais animados em 2D para o movimento do personagem e o ambiente hospitalar.

✨ Funcionalidades
Personalização de Avatar: Escolha o sexo e a cor da pele do seu avatar de paciente.
Entrada de Dados do Paciente: Insira seu nome, idade, peso e altura para uma experiência personalizada.
Seleção do Estilo de Chat: Opte por um estilo de conversação "Curto" ou "Longo" para influenciar a verbosidade da IA.
Enfermeira de Triagem com IA: Participe de uma entrevista inicial com uma enfermeira de IA (Google Gemini) que coleta informações relevantes para o encaminhamento a um especialista.
Consulta com Especialista com IA: Após a triagem, consulte um psicólogo de IA (Google Gemini) cuja especialidade e sexo são determinados durante a fase de triagem.
Avatares de IA Dinâmicos: O avatar da IA na interface de chat muda para refletir o personagem atual com quem você está interagindo (enfermeira, especialista masculino ou especialista feminino).
Simulação 2D do Hospital: Um simples canvas 2D exibe seu avatar se movendo pelo ambiente do hospital, incluindo uma porta animada e o personagem da enfermeira.
Resumo Abrangente do Chat: Ao concluir a consulta com o especialista, um resumo detalhado de toda a conversa é gerado e exibido.
Funcionalidade de Reiniciar: Reinicie facilmente a simulação a partir do menu após a conclusão.
CORS Habilitado: O backend Flask é configurado com CORS para integração perfeita com o frontend.
💻 Tecnologias Utilizadas
Backend:

Python 3.x
Flask: Framework web para lidar com solicitações de API.
Flask-CORS: Habilita o Compartilhamento de Recursos de Origem Cruzada (CORS).
Google Generative AI (Gemini API): Alimenta as capacidades de conversação da IA (modelos usados: gemini-1.5-flash para chats curtos e gemini-1.0-pro para chats longos e geração de resumo).
python-dotenv: (Pretende ser usado para carregar chaves de API de forma segura, embora atualmente a chave de API seja definida diretamente no backend para fins de demonstração. Veja as instruções de configuração para as melhores práticas.)
uuid: Para gerar IDs de sessão únicos.
re: Para operações de expressão regular, por exemplo, extrair recomendações de especialistas.
Frontend:

HTML5: Estrutura das páginas web.
CSS3: Estilização para uma interface com tema de hospital e responsividade.
JavaScript:
Manipulação do DOM para atualizações dinâmicas de conteúdo.
API Canvas para gráficos 2D e animação.
Fetch API para comunicação com o backend Flask.
Tratamento de parâmetros de URL para transferência de dados entre páginas.
🚀 Configuração e Instalação
Siga estas etapas para colocar o projeto em funcionamento na sua máquina local.

Pré-requisitos
Python 3.x: Certifique-se de que o Python esteja instalado.
pip: Gerenciador de pacotes do Python.
Uma Chave de API do Google Gemini: Obtenha uma no Google AI Studio.
Configuração do Backend
Clone o repositório:

Bash

git clone <url_do_repositorio>
cd <nome_do_repositorio>
(Substitua <url_do_repositorio> e <nome_do_repositorio> pelos detalhes reais do seu repositório, caso este projeto estivesse hospedado no GitHub ou similar.)

Navegue até o diretório do backend:

Bash

cd <diretorio_raiz_do_projeto> # Assumindo que backend_hospital.py está na raiz ou em uma pasta 'backend'
Crie um ambiente virtual (recomendado):

Bash

python -m venv venv
Ative o ambiente virtual:

No Windows:
Bash

.\venv\Scripts\activate
No macOS/Linux:
Bash

source venv/bin/activate
Instale as dependências:

Bash

pip install Flask Flask-CORS python-dotenv google-generativeai
Configure sua Chave de API do Google Gemini:
O arquivo backend_hospital.py fornecido define diretamente a chave de API dentro do código.

Python

api_key = "YOUR_GEMINI_API_KEY_HERE" # Substitua pela sua chave real
Para ambientes de produção, é altamente recomendável usar variáveis de ambiente. Crie um arquivo .env no mesmo diretório de backend_hospital.py e adicione sua chave de API:

GOOGLE_API_KEY="SUA_CHAVE_API_AQUI"
Em seguida, modifique backend_hospital.py para carregá-la usando load_dotenv() e os.getenv():

Python

from dotenv import load_dotenv
import os
load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    print("Erro: A chave API do Google não está definida nas variáveis de ambiente.")
    # Lidar com erro ou sair
Nota: O arquivo main.py parece ser um script de teste separado para carregamento de chave de API e inicialização de modelo e não está diretamente integrado com o aplicativo Flask.

Execute o backend Flask:

Bash

flask run
O backend normalmente será executado em http://127.0.0.1:5000/.

Configuração do Frontend
O frontend é puramente HTML, CSS e JavaScript. Nenhuma ferramenta de construção é necessária.

Abra o arquivo menu_structure.html no seu navegador web preferido.
Você pode abrir o arquivo diretamente do seu explorador de arquivos.
🕹️ Uso
Inicie o Backend: Certifique-se de que o backend Flask esteja em execução (flask run).
Abra o Menu: Abra menu_structure.html no seu navegador web.
Personalize Seu Avatar: Selecione seu sexo e cor da pele. A imagem de pré-visualização será atualizada.
Insira Seus Dados: Preencha seu nome, idade, peso e altura.
Escolha o Estilo de Chat: Selecione "Curto" ou "Longo" para o estilo de conversação.
Chat do Menu (Opcional): Você pode interagir com um guia de IA no chat do menu antes de iniciar a simulação.
Iniciar Simulação: Clique no botão "Iniciar Simulação". Isso o levará à página entradaDoHospital.html, onde seu avatar começará a se mover em direção à entrada do hospital.
Fase de Triagem: Assim que seu personagem alcançar a enfermeira, a interface de chat aparecerá, e você interagirá com a enfermeira de triagem de IA. Siga as perguntas dela, mantendo suas respostas concisas ou detalhadas com base no estilo de chat escolhido.
Consulta com Especialista: Após a enfermeira determinar o especialista apropriado, o chat fará a transição, e você começará a interagir com o psicólogo de IA. Continue a conversa até sentir que a consulta está completa ou indique que deseja "sair" ou "terminar".
Finalizar Chat: A mensagem final do especialista de IA incluirá a frase exata "Chat finalizado." para sinalizar o fim da interação. Alternativamente, você pode clicar no botão 'X' na interface de chat para encerrar manualmente o chat a qualquer momento.
Resumo: Após a conclusão do chat, um resumo da sua consulta será exibido na tela final.
Reiniciar: Clique no botão "Reiniciar Simulação" para voltar ao menu e iniciar uma nova simulação.
📂 Estrutura do Projeto
backend_hospital.py: O aplicativo Flask principal que lida com interações de IA, gerenciamento de sessão de chat e geração de resumo.
entradaDoHospital.html: O principal arquivo HTML para a simulação do hospital, contendo o canvas e a interface de chat.
entradaDoHospital.css: Folha de estilo para a página de simulação do hospital.
entradaDoHospital.js: JavaScript para controlar a animação do canvas 2D, movimento do personagem e gerenciar o chat na simulação com o backend.
menu_structure.html: O arquivo HTML inicial para personalização de personagens e entrada de dados do usuário.
menuStyle.css: Folha de estilo para a página do menu.
menu.style.js: JavaScript para lidar com a personalização do avatar, coleta de dados do usuário, o chat do menu e navegação para a página de simulação.
imagens/: Diretório contendo todos os ativos de imagem para personagens, planos de fundo e avatares.
🤝 Contribuindo
Contribuições são bem-vindas! Se você tiver sugestões de melhorias ou novas funcionalidades, sinta-se à vontade para abrir uma issue ou enviar um pull request.

📝 Licença
Este projeto é de código aberto. (Considere adicionar uma licença específica, por exemplo, MIT, Apache 2.0).

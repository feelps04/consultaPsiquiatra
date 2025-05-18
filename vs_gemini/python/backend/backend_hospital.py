# Importa as bibliotecas necessárias
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
import google.generativeai as genai
import uuid # Para gerar IDs de sessão básicos (para demonstração)
import re # Para extrair informações da conversa
import datetime # Para gerar timestamp para o nome do arquivo (não mais usado para salvar arquivo, mas pode ser útil para logs ou sumário)
import traceback # Para imprimir rastreamento de erro completo

# Não importamos mais as bibliotecas do Google Drive

# Carregar variáveis de ambiente do arquivo .env
# load_dotenv() # Comentado pois a chave API será definida diretamente abaixo

# Configurar a API KEY diretamente (ATENÇÃO: Não recomendado para produção, use .env)
# Remova ou comente a chave API antiga se estiver usando uma nova.
# api_key = "SUA_CHAVE_API_ANTIGA" # Comentei a chave antiga

# Defina sua nova chave API aqui
api_key = "AIzaSyCUgkBlMW10cxY2RDY8an8PUl3pal10sFw" # Sua nova chave API

if not api_key:
    print("Erro: A chave API do Google não está definida.")
    print("Por favor, defina a variável 'api_key' no código.")
    # Modelos para chat curto e longo (fase enfermeira e especialista)
    genai_model_short_nurse = None
    genai_model_long_nurse = None
    genai_model_short_specialist = None
    genai_model_long_specialist = None
    genai_model_summary = None # Modelo para o sumário
    genai_model_menu_chat = None # Modelo para chat no menu
else:
    try:
        # --- Instruções de Sistema Separadas por Fase (Enfermeira vs. Especialista) ---

        # Instrução para a fase de Enfermeira (Chat Curto)
        system_instruction_short_nurse = (
            "Você é uma enfermeira de triagem de um hospital psiquiátrico, "
            "representada pela Google IA. Sua função é conduzir uma entrevista inicial com o paciente "
            "para coletar informações e determinar o especialista em psicologia mais apropriado "
            "para o encaminhamento. Você recebeu os seguintes dados do paciente: "
            "Nome: {user_name}, Idade: {user_age}, Peso: {user_weight} kg, Altura: {user_height} m, IMC: {user_bmi}. "
            "Use o nome do paciente para se dirigir a ele de forma amigável, se apropriado. "
            "Considere a idade e o IMC se forem relevantes para as perguntas de triagem. "
            "Faça perguntas sobre os seguintes tópicos: "
            "histórico familiar de saúde mental, histórico de saúde geral (incluindo condições físicas relevantes), "
            "uso atual ou passado de substâncias (alcool, drogas ilícitas, medicamentos prescritos ou de venda livre), "
            "queixas atuais (o que o trouxe ao hospital hoje), sintomas (físicos como dores, fadiga, ou mentais como ansiedade, tristeza, dificuldade de concentração), "
            "pensamentos e sentimentos (humor, preocupações, medos, esperanças), "
            "comportamento recente (mudanças no sono, apetite, nível de atividade, interações sociais), "
            "função cognitiva (problemas de memória, atenção, tomada de decisão) "
            "e nível de funcionamento social (dificuldades no trabalho, escola, relacionamentos). "
            "Ao abordar o uso de substâncias, **pergunte sobre o impacto que isso tem na vida do paciente e explore se ele já pensou em buscar apoio ou alternativas mais saudáveis, em vez de dar ordens diretas para parar.**"
            "Mantenha suas respostas EXTREMAMENTE curtas e diretas durante a triagem. Limite-se a poucas palavras por resposta. **Seja o mais breve possível e evite detalhes desnecessários. Foco total na obtenção rápida das informações essenciais para o encaminhamento.**"
            "Faça apenas UMA pergunta por vez durante a triagem. "
            "Seja clara, empática, profissional, **afetuosa e gentil**. "
            "Ao se dirigir ao paciente no início, use 'Olá, querido!' se for homem e 'Olá, querida!' se for mulher. Use a concordância de gênero correta em todas as suas interações."
            "Quando sentir que tem informações suficientes para a triagem (busque ser rápido nisso), finalize esta fase com uma breve saudação e apresente a recomendação do especialista no seguinte formato EXATO: "
            "'Recomendação de Especialista: [Nome da Área de Especialista] ([Gênero do Especialista])'. "
            "Use 'Masculino' ou 'Feminino' para o gênero. **NÃO continue a conversa após esta linha.** Sua tarefa como enfermeira termina aqui."
            # Lembrete sutil para cobrir áreas do sumário durante a triagem
            "Durante a triagem, tente abordar (se relevante e natural) sintomas, histórico, sentimentos/comportamento e queixa principal, pois isso ajudará no sumário final."
        )

        # Instrução para a fase de Especialista (Chat Curto)
        system_instruction_short_specialist = (
            "Você é um(a) especialista em psicologia de um hospital psiquiátrico, representado(a) pela Google IA. "
            "Sua área de especialidade é {specialist_type}. "
            "Você recebeu o caso do paciente {user_name} ({user_age} anos, {user_weight} kg, {user_height} m, IMC: {user_bmi}) após a triagem inicial. "
            "A enfermeira Jane passou as informações relevantes do paciente. "
            "Sua função é conduzir a consulta aprofundando o caso com base no que foi discutido na triagem e nos dados fornecidos. "
            "Mantenha suas respostas EXTREMAMENTE curtas e diretas, limitando-se a poucas palavras por resposta. Seja o mais conciso possível. "
            "Mantenha um tom profissional, empático, **afetuoso e gentil** como psicólogo(a). "
            "Ao abordar o uso de substâncias, **continue a abordar o uso de substâncias de forma sutil, focando no impacto e apoio, não em ordens diretas para parar.**"
            "No final da consulta, após entender bem o paciente e se apropriado para o caso, você pode sugerir opções de remédios naturais ou práticas de bem-estar como complemento ao tratamento. Use frases claras ao sugerir opções naturais, como 'Para ajudar com [sintoma específico], recomendo considerar opções naturais como [exemplo de remédio natural ou prática]...' ou 'Com base no que discutimos, sugiro algumas práticas naturais para complementar seu bem-estar, como [exemplo]...'. "
            "A conversa deve continuar até que o paciente indique que quer 'sair' ou 'terminar'. **É ABSOLUTAMENTE CRÍTICO que, na SUA ÚLTIMA MENSAGEM (e SOMENTE na última mensagem), você inclua a frase exata 'Chat finalizado.' para indicar ao sistema que a interação terminou e o sumário deve ser gerado. NUNCA use 'Chat finalizado.' em qualquer outra situação.** Responda de forma amigável indicando que a interação foi concluída e finalize SUA ÚLTIMA MENSAGEM com a frase exata 'Chat finalizado.' O frontend controlará o fechamento da interface de chat com base na interação do usuário. Linguagem ofensiva resultará no encerramento imediato do chat e NÃO gerará sumário."
            # Lembrete sutil para cobrir áreas do sumário (agora focando em soluções e próximos passos)
            "Durante a consulta, tente abordar (se relevante e natural) sintomas, sentimentos/comportamento, histórico (se necessário aprofundar), e possíveis abordagens/soluções/próximos passos, pois isso ajudará no sumário final."
        )

        # Instrução para a fase de Enfermeira (Chat Longo)
        system_instruction_long_nurse = (
            "Você é uma enfermeira de triagem de um hospital psiquiátrico, "
            "representada pela Google IA. Sua função é conduzir uma entrevista inicial com o paciente "
            "para coletar informações e determinar o especialista em psicologia mais apropriado "
            "para o encaminhamento. Você recebeu os seguintes dados do paciente: "
            "Nome: {user_name}, Idade: {user_age}, Peso: {user_weight} kg, Altura: {user_height} m, IMC: {user_bmi}. "
             "Use o nome do paciente para se dirigir a ele de forma amigável, se apropriado. "
            "Considere a idade e o IMC se forem relevantes para as perguntas de triagem. "
            "Faça perguntas sobre os seguintes tópicos: "
            "histórico familiar de saúde mental, histórico de saúde geral (incluindo condições físicas relevantes), "
            "uso atual ou passado de substâncias (alcool, drogas ilícitas, medicamentos prescritos ou de venda livre), "
            "queixas atuais (o que o trouxe ao hospital hoje), sintomas (físicos como dores, fadiga, ou mentais como ansiedade, tristeza, dificuldade de concentração), "
            "pensamentos e sentimentos (humor, preocupações, medos, esperanças), "
            "comportamento recente (mudanças no sono, apetite, nível de atividade, interações sociais), "
            "função cognitiva (problemas de memória, atenção, tomada de decisão) "
            "e nível de funcionamento social (dificuldades no trabalho, escola, relacionamentos). "
            "Ao abordar o uso de substâncias, **pergunte sobre o impacto que isso tem na vida do paciente e explore se ele já pensou em buscar apoio ou alternativas mais saudáveis, em vez de dar ordens diretas para parar.**"
            "Mantenha suas respostas diretas durante a triagem, mas permita-se ser mais detalhado que na opção curta. "
            "Faça apenas UMA pergunta por vez durante a triagem. "
            "Seja clara, empática, profissional, **afetuosa e gentil**."
            "Ao se dirigir ao paciente no início, use 'Olá, querido!' se for homem e 'Olá, querida!' se for mulher. Use a concordância de gênero correta em todas as suas interações."
            "Quando sentir que tem informações suficientes para a triagem, finalize esta fase com uma breve saudação e apresente a recomendação do especialista no seguinte formato EXATO: "
            "'Recomendação de Especialista: [Nome da Área de Especialista] ([Gênero do Especialista])'. "
            "Use 'Masculino' ou 'Feminino' para o gênero. **NÃO continue a conversa após esta linha.** Sua tarefa como enfermeira termina aqui."
            # Lembrete sutil para cobrir áreas do sumário durante a triagem
            "Durante a triagem, tente abordar (se relevante e natural) sintomas, histórico, sentimentos/comportamento e queixa principal, pois isso ajudará no sumário final."
        )

        # Instrução para a fase de Especialista (Chat Longo)
        system_instruction_long_specialist = (
            "Você é um(a) especialista em psicologia de um hospital psiquiátrico, representado(a) pela Google IA. "
            "Sua área de especialidade é {specialist_type}. "
            "Você recebeu o caso do paciente {user_name} ({user_age} anos, {user_weight} kg, {user_height} m, IMC: {user_bmi}) após a triagem inicial. "
            "A enfermeira Jane passou as informações relevantes do paciente. "
            "Sua função é conduzir a consulta aprofundando o caso com base no que foi discutido na triagem e nos dados fornecidos. "
            "Mantenha um tone profissional, empático, **afetuoso e gentil** como psicólogo(a), permitindo-se respostas mais detalhadas que na opção curta. "
            "Ao abordar o uso de substâncias, **continue a abordar o uso de substâncias de forma sutil, focando no impacto e apoio, não em ordens diretas para parar.**"
            "No final da consulta, após entender bem o paciente e se apropriado para o caso, você pode sugerir opções de remédios naturais ou práticas de bem-estar como complemento ao tratamento. Use frases claras ao sugerir opções naturais, como 'Para ajudar com [sintoma específico], recomendo considerar opções naturais como [exemplo de remédio natural ou prática]...' ou 'Com base no que discutimos, sugiro algumas práticas naturais para complementar seu bem-estar, como [exemplo]...'. "
            "A conversa deve continuar até que o paciente indique que quer 'sair' ou 'terminar'. **É ABSOLUTAMENTE CRÍTICO que, na SUA ÚLTIMA MENSAGEM (e SOMENTE na última mensagem), você inclua a frase exata 'Chat finalizado.' para indicar ao sistema que a interação terminou e o sumário deve ser gerado. NUNCA use 'Chat finalizado.' em qualquer outra situação.** Responda de forma amigável indicando que a interação foi concluída e finalize SUA ÚLTIMA MENSAGEM com a frase exata 'Chat finalizado.' O frontend controlará o fechamento da interface de chat com base na interação do usuário. Linguagem ofensiva resultará no encerramento imediato do chat e NÃO gerará sumário."
            # Lembrete sutil para cobrir áreas do sumário (agora focando em soluções e próximos passos)
            "Durante a consulta, tente abordar (se relevante e natural) sintomas, sentimentos/comportamento, histórico (se necessário aprofundar), e possíveis abordagens/soluções/próximos passos, pois isso ajudará no sumário final."
        )

        # Instrução de sistema para o chat no menu
        system_instruction_menu_chat = (
            "Você é uma Google IA amigável e prestativa, atuando como um guia inicial na tela de personalização do menu. "
            "Sua função é dar as boas-vindas ao usuário, explicar brevemente o propósito da simulação do hospital psiquiátrico, "
            "incentivar o usuário a personalizar seu avatar e preencher seus dados (Nome, Idade, Peso, Altura, IMC), "
            "e responder a perguntas gerais sobre o processo ou a simulação. "
            "Mantenha um tone acolhedor, gentil e informativo. "
            "Evite iniciar a triagem médica aqui; essa parte ocorrerá após o usuário clicar em 'Iniciar Simulação'. "
            "Se o usuário perguntar sobre a triagem ou a consulta, explique que isso acontecerá na próxima etapa, após a personalização. "
            "Você não precisa coletar os dados do usuário diretamente no chat do menu; apenas incentivá-lo a preencher os campos no formulário. "
            "Após o usuário indicar que está pronto ou clicar em 'Iniciar Simulação', sua interação no chat do menu será encerrada. "
            "Não inclua a frase 'Chat finalizado.' neste chat do menu. A finalização será controlada pelo frontend."
        )

        # Instrução de sistema para o sumário, com formato aprimorado e sem Google Drive
        system_instruction_summary = (
            "Você é um assistente de IA focado em gerar um sumário conciso e informativo de uma conversa de triagem e consulta médica. "
            "Seu objetivo é extrair as informações mais importantes do histórico de chat fornecido e apresentá-las em um formato de relatório estruturado e fácil de ler. "
            "Siga EXATAMENTE a seguinte estrutura de seções, preenchendo cada item com base EXCLUSIVAMENTE no que foi discutido na conversa. "
            "Se uma seção não contiver informações RELEVANTES ou explícitas no histórico de chat, indique 'Não especificado na conversa.' para essa seção. Use exemplos para guiar o formato da sua resposta onde apropriado.\n"
            "\n--- Sumário da Consulta ---\n"
            "\n**Dados do Paciente:**\n"
            "- Nome: [Extraia o nome do paciente da conversa ou dos dados iniciais, se disponível. Ex: João Silva]\n"
            "- Idade: [Extraia a idade do paciente. Ex: 35 anos]\n"
            "- Peso: [Extraia o peso do paciente. Ex: 70 kg]\n"
            "- Altura: [Extraia a altura do paciente. Ex: 1.75 m]\n"
            "- IMC: [Extraia o IMC do paciente. Ex: 22.86]\n"
            "\n**Queixa Principal:**\n"
            "[Descreva a principal razão que levou o paciente a buscar atendimento. Seja conciso. Se não houver, indique 'Não especificado na conversa.' Ex: 'Paciente buscou atendimento devido a sentimentos de ansiedade e dificuldade de concentração relacionados ao trabalho.']\n"
            "\n**Sintomas Identificados:**\n"
            "[Liste os sintomas físicos e mentais relatados pelo paciente. Use bullet points se houver múltiplos. **Procure por qualquer menção a como o paciente se sente fisicamente ou emocionalmente.** Se não houver, indique 'Nenhum sintoma significativo relatado na conversa.']\n"
            "\n**Histórico Relevante:**\n"
            "[Inclua informações sobre histórico familiar de saúde mental, saúde geral, e uso de substâncias (alcool, drogas, medicamentos), se discutido. **Busque por qualquer detalhe sobre o passado médico ou familiar do paciente.** Se não houver, indique 'Nenhum histórico relevante detalhado na conversa.']\n"
            "\n**Sentimentos, Pensamentos e Comportamento:**\n"
            "[Descreva o humor do paciente, suas preocupações, medos, esperanças, e mudanças recentes em comportamento (sono, apetite, nível de atividade, interações sociais, função cognitiva), se mencionados. **Tente capturar a essência do estado emocional e mental do paciente.** Se não houver, indique 'Não foram detalhados aspectos específicos de sentimentos, pensamentos ou comportamento na conversa.']\n"
            "\n**Recomendação de Especialista:**\n"
            "[Indique a área de especialidade psicológica recomendada e o gênero do especialista, conforme a interação. Se não houver uma recomendação clara, indique 'Recomendação de especialista não concluída.']\n"
            "\n**Soluções Sugeridas e Abordagem:**\n"
            "[Liste quaisquer sugestões de remédios naturais, práticas de bem-estar ou abordagens de tratamento discutidas pelo especialista. Use bullet points se houver múltiplos. **Procure por qualquer recomendação ou próximo passo discutido.** Se não houver, indique 'Nenhuma solução específica ou abordagem de tratamento foi sugerida na conversa.']\n"
            "\n**Próximos Passos:**\n"
            "[Descreva os próximos passos recomendados ou a abordagem geral para a solução dos problemas discutidos, se houver. Se não houver, indique 'Não especificado na conversa.']\n"
            "Mantenha as respostas concisas e diretas, preenchendo cada seção com a informação mais relevante extraída da conversa. NÃO adicione informações que não estejam presentes no histórico de chat."
            # Adicionado: Reforço na instrução de extração para o modelo de sumário
            "É CRUCIAL que você se esforce para extrair informações para CADA SEÇÃO a partir do histórico de chat. Procure por palavras-chave e contexto para preencher os detalhes. SÓ use 'Não especificado na conversa.' se NÃO HOUVER absolutamente NENHUMA informação relevante no histórico para aquela seção."
            # Adicionado: Instrução ainda mais forte para evitar "Não especificado" se houver qualquer indício
            "Se houver QUALQUER indício ou menção a um tópico, mesmo que breve, TENTE RESUMIR essa informação em vez de usar 'Não especificado na conversa.'. Use essa frase APENAS se o tópico for COMPLETAMENTE AUSENTE do histórico."
        )


        genai.configure(api_key=api_key)
        # Inicializa os modelos com as instruções apropriadas
        # Os modelos são inicializados aqui com as instruções base, a formatação com dados do usuário ocorre em start_chat
        # Não inicializamos os modelos de especialista aqui, eles serão criados dinamicamente na rota /chat
        genai_model_short_nurse = genai.GenerativeModel('gemini-1.5-flash', system_instruction=system_instruction_short_nurse)
        genai_model_long_nurse = genai.GenerativeModel('gemini-1.5-flash', system_instruction=system_instruction_long_nurse)
        genai_model_summary = genai.GenerativeModel('gemini-1.5-flash', system_instruction=system_instruction_summary)
        genai_model_menu_chat = genai.GenerativeModel('gemini-1.5-flash', system_instruction=system_instruction_menu_chat)
        print("Modelos Gemini-1.5-flash (enfermeira curta, enfermeira longa, sumário, menu_chat) carregados com sucesso.")
    except Exception as e:
        print(f"Erro ao inicializar os modelos Gemini: {e}")
        genai_model_short_nurse = None
        genai_model_long_nurse = None
        genai_model_summary = None
        genai_model_menu_chat = None

app = Flask(__name__)
CORS(app) # Habilita CORS para permitir requisições do frontend

# Armazenamento em memória para o histórico de chat, estado da sessão, contador de ofensas, dados do usuário e FASE da sessão
# Em uma aplicação real, isso seria um banco de dados
session_histories = {} # Armazena o objeto ChatSession (para simulação principal)
session_modes = {} # 'short' ou 'long' (para simulação principal)
session_phases = {} # 'nurse' ou 'specialist' (para simulação principal)
session_specialist_info = {} # Armazena o tipo e gênero do especialista recomendado
session_summary_data = {} # Para armazenar o sumário gerado para uma sessão
session_offensive_counts = {} # Contador de ofensas por sessão (para simulação principal)
session_user_data = {} # Armazena os dados do usuário por sessão (compartilhado)

# Armazenamento em memória para o histórico do chat no menu
menu_chat_histories = {} # Armazena o objeto ChatSession para o chat do menu


@app.route('/')
def home():
    return "Backend do Hospital Psiquiátrico está rodando!"

# Rota para iniciar o chat no menu
@app.route('/start_menu_chat', methods=['POST'])
def start_menu_chat():
    session_id = str(uuid.uuid4())
    print(f"Iniciando nova sessão de chat no menu: {session_id}")

    if not genai_model_menu_chat:
        return jsonify({"error": "Modelo Gemini para chat no menu não inicializado."}), 500

    try:
        # Inicia a sessão de chat no menu com a instrução específica
        chat_session = genai_model_menu_chat.start_chat(history=[])
        menu_chat_histories[session_id] = chat_session

        # Primeira mensagem da IA para o chat do menu
        initial_ai_message = "Olá! Bem-vindo à simulação do Hospital Psiquiátrico. Estou aqui para ajudar você a começar. Por favor, personalize seu avatar e preencha seus dados em cima para iniciar sua jornada. Tem alguma dúvida sobre como funciona?"

        # Adiciona a primeira mensagem ao histórico da sessão do menu
        chat_session.history.append({'role': 'model', 'parts': [{'text': initial_ai_message}]})

        return jsonify({
            "session_id": session_id,
            "initial_message": initial_ai_message
        })
    except Exception as e:
        print(f"Erro ao iniciar chat no menu: {e}")
        traceback.print_exc() # Imprime o rastreamento completo do erro
        return jsonify({"error": "Erro ao iniciar a sessão de chat no menu."}), 500

# Rota para enviar mensagens para o chat no menu
@app.route('/menu_chat', methods=['POST'])
def menu_chat():
    data = request.json
    user_message = data.get('message')
    session_id = data.get('session_id')
    print(f"Mensagem recebida para chat no menu (sessão {session_id}): {user_message}")

    if not session_id or session_id not in menu_chat_histories:
        print(f"Sessão de chat no menu {session_id} não encontrada ou inválida.")
        return jsonify({"error": "Sessão de chat no menu inválida ou não encontrada."}), 400

    chat_session = menu_chat_histories[session_id]

    try:
        # Adiciona a mensagem do usuário ao histórico do chat do menu
        chat_session.history.append({'role': 'user', 'parts': [{'text': user_message}]})
        print("Mensagem do usuário adicionada ao histórico do chat do menu.")

        # Envia a mensagem para o modelo Gemini (usando a sessão do chat do menu)
        response = chat_session.send_message(user_message)
        ai_response_text = response.text
        print(f"Resposta do Gemini para chat no menu (sessão {session_id}): {ai_response_text}")

        # Adiciona a resposta da IA ao histórico do chat do menu
        chat_session.history.append({'role': 'model', 'parts': [{'text': ai_response_text}]})
        print("Resposta da IA adicionada ao histórico do chat no menu.")

        # O chat do menu não é finalizado por mensagem, apenas quando a simulação principal começa
        return jsonify({
            "message": ai_response_text,
            "finalized": False # O chat do menu não finaliza por aqui
        })

    except Exception as e:
        print(f"Erro ao gerar conteúdo com a IA para chat no menu (sessão {session_id}): {e}")
        traceback.print_exc() # Imprime o rastreamento completo do erro
        # Em caso de erro, podemos optar por finalizar este mini-chat ou apenas retornar um erro
        # Vamos retornar um erro e manter a sessão para depuração, mas o frontend pode decidir fechar.
        return jsonify({"error": "Desculpe, houve um erro ao processar sua solicitação no chat de boas-vindas.", "message": "Desculpe, houve um erro na comunicação.", "finalized": False}), 500


@app.route('/start_chat', methods=['POST'])
def start_chat():
    data = request.json
    chat_style = data.get('chatStyle', 'short')
    gender = data.get('gender', 'male') # 'male' ou 'female'
    session_id = str(uuid.uuid4()) # Novo ID para a sessão principal
    print(f"Iniciando nova sessão principal: {session_id} com estilo {chat_style} e gênero {gender}")

    # Coleta os dados do usuário recebidos, usando None como padrão se não existirem
    user_name = data.get('userName', None)
    user_age = data.get('userAge', None)
    user_weight = data.get('userWeight', None)
    user_height = data.get('userHeight', None)
    user_bmi = data.get('userBMI', None)

    # Armazena os dados do usuário na sessão principal
    session_user_data[session_id] = {
        'name': user_name,
        'age': user_age,
        'weight': user_weight,
        'height': user_height,
        'bmi': user_bmi
    }
    print(f"Dados do usuário armazenados para sessão principal {session_id}: {session_user_data[session_id]}")

    model_to_use_nurse = None
    system_instruction_base_nurse = None # Variável para armazenar a instrução base da enfermeira

    if chat_style == 'short':
        model_to_use_nurse = genai_model_short_nurse
        system_instruction_base_nurse = system_instruction_short_nurse
    elif chat_style == 'long':
        model_to_use_nurse = genai_model_long_nurse
        system_instruction_base_nurse = system_instruction_long_nurse
    else:
        # Limpa os dados do usuário se o chatStyle for inválido
        if session_id in session_user_data:
            del session_user_data[session_id]
        return jsonify({"error": "chatStyle inválido."}), 400

    if not model_to_use_nurse:
        # Limpa os dados do usuário se o modelo não inicializou
        if session_id in session_user_data:
            del session_user_data[session_id]
        return jsonify({"error": "Modelos Gemini para simulação principal (enfermeira) não inicializados."}), 500

    try:
        # Formata as instruções do sistema da enfermeira com os dados do usuário
        formatted_system_instruction_nurse = system_instruction_base_nurse.format(
            user_name=session_user_data[session_id].get('name', 'paciente'),
            user_age=session_user_data[session_id].get('age', 'desconhecida'),
            user_weight=session_user_data[session_id].get('weight', 'desconhecido'),
            user_height=session_user_data[session_id].get('height', 'desconhecida'),
            user_bmi=session_user_data[session_id].get('bmi', 'desconhecido')
        )
        print("Instrução do sistema para fase enfermeira formatada com dados do usuário.")
        # print(f"Instrução formatada: {formatted_system_instruction_nurse[:200]}...") # Opcional: logar parte da instrução

        # Inicia a sessão de chat principal na fase 'nurse' com a instrução formatada
        chat_session = genai.GenerativeModel('gemini-1.5-flash', system_instruction=formatted_system_instruction_nurse).start_chat(history=[])
        session_histories[session_id] = chat_session
        session_modes[session_id] = chat_style
        session_phases[session_id] = 'nurse' # Define a fase inicial como enfermeira
        session_offensive_counts[session_id] = 0 # Inicializa o contador de ofensas para a sessão principal
        session_specialist_info[session_id] = {'type': None, 'gender': None} # Inicializa info do especialista

        # Primeira mensagem da IA para a simulação principal (enfermeira)
        initial_ai_message = ""
        if gender == 'male':
            initial_ai_message = "Olá, querido! Bem-vindo ao hospital psiquiátrico. Sou a enfermeira de triagem. Para começar, poderia me dizer qual o principal motivo da sua vinda hoje?"
        else: # female
            initial_ai_message = "Olá, querida! Bem-vinda ao hospital psiquiátrico. Sou a enfermeira de triagem. Para começar, poderia me dizer qual o principal motivo da sua vinda hoje?"

        # Adiciona a primeira mensagem ao histórico da sessão principal
        chat_session.history.append({'role': 'model', 'parts': [{'text': initial_ai_message}]})

        # Opcional: Limpar o histórico do chat do menu ao iniciar a sessão principal
        # if session_id in menu_chat_histories:
        #    del menu_chat_histories[session_id]


        return jsonify({
            "session_id": session_id,
            "initial_message": initial_ai_message,
            "specialist_gender": None # Ainda não há especialista na simulação principal
        })
    except Exception as e:
        print(f"Erro ao iniciar chat principal: {e}")
        traceback.print_exc() # Imprime o rastreamento completo do erro
        # Limpa os dados do usuário se a sessão principal falhar ao iniciar
        if session_id in session_user_data:
            del session_user_data[session_id]
        return jsonify({"error": "Erro ao iniciar a sessão de chat principal."}), 500


# Lista básica de palavras ofensivas
OFFENSIVE_KEYWORDS = ["puta", "caralho", "negra", "idiota", "burro", "estúpido", "merda", "inferno"]

# Função para gerar o resumo da consulta (mantida a lógica de extração)
def generate_consultation_summary_text(session_id, chat_history):
    """Gera um sumário da consulta com base no histórico do chat principal e dados do usuário."""
    print("Iniciando geração do sumário...")
    conversation_text = ""
    for message in chat_history:
        # Verifica se a mensagem tem o atributo 'role' e 'parts'
        if hasattr(message, 'role') and hasattr(message, 'parts') and message.parts:
            role = "Paciente" if message.role == 'user' else "IA"
            # Acessa o texto da primeira parte, verificando se existe
            text_content = message.parts[0].text if message.parts[0] and hasattr(message.parts[0], 'text') else ""
            text_content = text_content.replace('Chat finalizado.', '').strip()
            if text_content:
                conversation_text += f"{role}: {text_content}\n"
        # Lida com mensagens que podem estar em um formato diferente (ex: do frontend)
        elif isinstance(message, dict) and 'role' in message and 'parts' in message and message['parts']:
             role = "Paciente" if message['role'] == 'user' else "IA"
             text_content = message['parts'][0].get('text', '') if message['parts'][0] and isinstance(message['parts'][0], dict) else ""
             text_content = text_content.replace('Chat finalizado.', '').strip()
             if text_content:
                 conversation_text += f"{role}: {text_content}\n"


    if not conversation_text.strip():
        return "Nenhuma interação significativa registrada para gerar o sumário."

    # Não precisamos mais extrair dados do usuário aqui, eles já estão na instrução do modelo de sumário

    try:
        if genai_model_summary:
            # O modelo de sumário já foi inicializado com a instrução correta.
            # Basta enviar o histórico da conversa como conteúdo.
            summary_response = genai_model_summary.generate_content(conversation_text)
            summary_text_full = summary_response.text
            print("Sumário gerado pela IA.")

            # Adiciona a data sugerida para a próxima consulta ao final do sumário gerado pela IA
            # Isso é feito aqui no backend antes de salvar ou enviar para o frontend
            today = datetime.date.today()
            next_week = today + datetime.timedelta(days=7)
            two_weeks_later = today + datetime.timedelta(days=14)
            suggested_date = f"{next_week.strftime('%d/%m/%Y')} ou {two_weeks_later.strftime('%d/%m/%Y')}"

            final_summary_content = f"{summary_text_full}\n\nSugestão para Próxima Consulta: {suggested_date}\n\n--- Fim do Sumário ---"

            return final_summary_content

        else:
            print("Modelo de sumário não disponível.")
            return "Erro: Modelo de sumário não inicializado."

    except Exception as e:
        print(f"Erro ao gerar sumário com a IA: {e}")
        traceback.print_exc() # Imprime o rastreamento completo do erro
        return f"Erro ao gerar o sumário da consulta: {e}"


@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    user_message = data.get('message')
    session_id = data.get('session_id') # ID da sessão principal
    print(f"Mensagem recebida para sessão principal {session_id}: {user_message}")

    if not session_id or session_id not in session_histories:
        print(f"Sessão principal {session_id} não encontrada ou inválida.")
        return jsonify({"error": "Sessão principal inválida ou não encontrada."}), 400

    chat_session = session_histories[session_id]
    chat_mode = session_modes.get(session_id, 'short')
    current_phase = session_phases.get(session_id, 'nurse')
    offensive_count = session_offensive_counts.get(session_id, 0)
    user_data = session_user_data.get(session_id, {}) # Dados do usuário da sessão principal

    if not chat_session:
        print("Objeto chat_session é None.")
        return jsonify({"error": "Erro interno: Objeto chat_session é None."}), 500

    # --- Verificação de linguagem ofensiva ---
    user_message_lower = user_message.lower()
    is_offensive = any(keyword in user_message_lower for keyword in OFFENSIVE_KEYWORDS)

    if is_offensive:
        offensive_count += 1
        session_offensive_counts[session_id] = offensive_count
        print(f"Linguagem ofensiva detectada. Contador para sessão principal {session_id}: {offensive_count}")

        if offensive_count >= 2:
            print(f"Linguagem ofensiva detectada pela {offensive_count}ª vez na sessão principal {session_id}. Encerrando chat.")
            ai_response_text = "Esta é a segunda vez que você usa linguagem ofensiva. O chat será encerrado agora. Chat finalizado."
            # Remove a sessão e dados associados
            if session_id in session_histories:
                del session_histories[session_id]
            if session_id in session_modes:
                del session_modes[session_id]
            if session_id in session_phases:
                del session_phases[session_id]
            if session_id in session_specialist_info:
                 del session_specialist_info[session_id]
            if session_id in session_offensive_counts:
                del session_offensive_counts[session_id]
            # Mantemos session_user_data[session_id] para o caso de querer salvar algo mesmo após ofensa,
            # mas ele será limpo na rota de salvar sumário ou em um timeout.

            # O sumário NÃO é gerado em caso de linguagem ofensiva
            summary_data = None
            specialist_gender = None # Não há especialista em caso de encerramento por ofensa


            return jsonify({"message": ai_response_text, "finalized": True, "summary": summary_data, "specialist_gender": specialist_gender})

        else:
            print(f"Linguagem ofensiva detectada pela 1ª vez na sessão principal {session_id}. Repreendendo.")
            ai_response_text = "Sinto muito, mas não posso responder a isso. Por favor, use uma linguagem respeitosa. Caso contrário, terei que encerrar o chat."
            # Adiciona a repreensão ao histórico para que o modelo veja (opcional, dependendo se queremos que a IA "lembre" da ofensa)
            # chat_session.history.append({'role': 'model', 'parts': [{'text': ai_response_text}]})
            return jsonify({"message": ai_response_text, "finalized": False, "summary": None, "specialist_gender": None})
    # --- Fim da Verificação de linguagem ofensiva ---

    try:
        # Adiciona a mensagem do usuário ao histórico ANTES de enviar para o modelo
        chat_session.history.append({'role': 'user', 'parts': [{'text': user_message}]})
        print("Mensagem do usuário adicionada ao histórico da sessão principal.")

        # --- Lógica para determinar qual modelo usar com base na fase ---
        model_to_use = None
        system_instruction_base = None

        if current_phase == 'nurse':
            if chat_mode == 'short':
                model_to_use = genai_model_short_nurse
                system_instruction_base = system_instruction_short_nurse
            else: # long
                model_to_use = genai_model_long_nurse
                system_instruction_base = system_instruction_long_nurse
        elif current_phase == 'specialist':
             # Para a fase especialista, criamos um novo modelo com a instrução formatada
             specialist_info = session_specialist_info.get(session_id, {'type': 'Psicologia', 'gender': 'Não especificado'})
             specialist_type = specialist_info.get('type', 'Psicologia')
             specialist_gender_str = specialist_info.get('gender', 'Não especificado') # 'Masculino' ou 'Feminino'

             if chat_mode == 'short':
                 system_instruction_base = system_instruction_short_specialist
             else: # long
                 system_instruction_base = system_instruction_long_specialist

             # Formata a instrução do especialista com dados do usuário e tipo/gênero do especialista
             formatted_system_instruction_specialist = system_instruction_base.format(
                 user_name=user_data.get('name', 'paciente'),
                 user_age=user_data.get('age', 'desconhecida'),
                 user_weight=user_data.get('weight', 'desconhecido'),
                 user_height=user_data.get('height', 'desconhecida'),
                 user_bmi=user_data.get('bmi', 'desconhecido'),
                 specialist_type=specialist_type # Usa o tipo de especialista determinado na fase nurse
             )
             print(f"Instrução do sistema para fase especialista ({specialist_type}, {specialist_gender_str}) formatada.")
             # print(f"Instrução formatada: {formatted_system_instruction_specialist[:200]}...") # Opcional: logar parte da instrução

             # Cria um NOVO objeto ChatSession para o especialista, mantendo o histórico
             # Isso efetivamente "muda" a persona do modelo para a próxima interação
             model_to_use = genai.GenerativeModel('gemini-1.5-flash', system_instruction=formatted_system_instruction_specialist)
             # Mantemos o histórico existente
             chat_session = model_to_use.start_chat(history=chat_session.history)
             session_histories[session_id] = chat_session # Atualiza a sessão no armazenamento

        if not model_to_use:
             raise Exception("Modelo Gemini não disponível para a fase atual.")

        # --- Fim da Lógica para determinar qual modelo usar ---


        response = chat_session.send_message(user_message)
        ai_response_text = response.text
        print(f"Resposta do Gemini para sessão principal {session_id} ({current_phase}): {ai_response_text}")

        is_finalized = False
        summary_data = None
        specialist_gender_to_frontend = None # Gênero do especialista a ser enviado para o frontend

        # --- Lógica para detecção de transição de fase (Enfermeira -> Especialista) ---
        if current_phase == 'nurse':
            specialist_match = re.search(r'Recomendação de Especialista: (.+?) \((Masculino|Feminino)\)', ai_response_text)
            if specialist_match:
                specialist_type = specialist_match.group(1).strip()
                specialist_gender_str = specialist_match.group(2).strip()
                print(f"Triagem finalizada. Recomendação: {specialist_type} ({specialist_gender_str}). Mudando fase para 'specialist'.")

                # Armazena as informações do especialista para a próxima interação
                session_specialist_info[session_id] = {'type': specialist_type, 'gender': specialist_gender_str}
                session_phases[session_id] = 'specialist' # Muda a fase da sessão para 'specialist'

                # Envia o gênero do especialista para o frontend para que ele possa atualizar o avatar
                specialist_gender_to_frontend = specialist_gender_str
        # --- Fim da Lógica de transição de fase ---


        # Verifica se a IA finalizou o chat (e não foi por ofensa)
        if 'Chat finalizado.' in ai_response_text and offensive_count < 2:
            is_finalized = True
            print("Detecção de 'Chat finalizado.' na sessão principal. Gerando sumário detalhado...")
            # Passa o histórico COMPLETO (incluindo a última mensagem da IA) para a função de sumário
            # A função generate_consultation_summary_text agora retorna o texto formatado completo
            # Criamos uma cópia do histórico para incluir a última mensagem da IA antes de gerar o sumário
            history_for_summary = list(chat_session.history) # Copia o histórico atual
            history_for_summary.append({'role': 'model', 'parts': [{'text': ai_response_text}]}) # Adiciona a última mensagem da IA
            summary_content_for_frontend = generate_consultation_summary_text(session_id, history_for_summary)
            session_summary_data[session_id] = summary_content_for_frontend # Armazena o texto completo do sumário
            print("Sumário detalhado gerado e armazenado para envio ao frontend.")

            # Remove a sessão e dados associados após a geração do sumário
            if session_id in session_histories:
                del session_histories[session_id]
            if session_id in session_modes:
                del session_modes[session_id]
            if session_id in session_phases:
                del session_phases[session_id]
            if session_id in session_specialist_info:
                 del session_specialist_info[session_id]
            if session_id in session_offensive_counts:
                del session_offensive_counts[session_id]
            # Os dados do usuário (session_user_data) são mantidos para a exibição do sumário no frontend,
            # mas não serão usados para salvar arquivo no backend.

            # Envia o texto completo do sumário para o frontend
            summary_data = summary_content_for_frontend


        # Adiciona a resposta da IA ao histórico APÓS verificar a finalização e a transição de fase
        # Isso garante que a frase "Chat finalizado." esteja no histórico se for o caso
        # e que o histórico seja o correto para a próxima fase.
        chat_session.history.append({'role': 'model', 'parts': [{'text': ai_response_text}]})
        print("Resposta da IA adicionada ao histórico da sessão principal.")


        return jsonify({
            "message": ai_response_text,
            "finalized": is_finalized,
            "summary": summary_data, # Enviando o texto completo do sumário se finalizado
            "specialist_gender": specialist_gender_to_frontend # Envia o gênero do especialista se a transição ocorreu
        })

    except Exception as e:
        print(f"Erro ao gerar conteúdo com a IA para sessão principal {session_id} ({current_phase}): {e}")
        traceback.print_exc() # Imprime o rastreamento completo do erro
        # Em caso de erro, remove a sessão e dados associados
        if session_id in session_histories:
             del session_histories[session_id]
        if session_id in session_modes:
             del session_modes[session_id]
        if session_id in session_phases:
             del session_phases[session_id]
        if session_id in session_specialist_info:
                 del session_specialist_info[session_id]
        if session_id in session_offensive_counts:
             del session_offensive_counts[session_id]
        if session_id in session_user_data:
             del session_user_data[session_id]

        # Não gera sumário em caso de erro no chat principal
        return jsonify({"error": "Desculpe, houve um erro ao processar sua solicitação de chat principal.", "message": "Desculpe, houve um erro na comunicação. O chat será encerrado.", "finalized": True, "summary": None, "specialist_gender": None}), 500

# Rota para gerar e salvar o sumário em arquivo (REMOVIDA)
# @app.route('/generate_summary_file', methods=['POST'])
# def generate_summary_file():
#     # Esta rota foi removida conforme solicitado
#     pass # Nenhuma ação é realizada


# Rota de exemplo para verificar se o backend está funcionando
@app.route('/')
def index():
    return "Backend do Hospital Psiquiátrico está rodando!"

# Inicia o servidor Flask
if __name__ == '__main__':
    # Use threaded=True para permitir múltiplas requisições simultâneas
    # Em produção, use um servidor WSGI como Gunicorn ou uWSGI
    app.run(debug=True, port=5000, threaded=True)

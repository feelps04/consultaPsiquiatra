from dotenv import load_dotenv
import os
import google.generativeai as genai

# Carregar variáveis de ambiente do arquivo .env
# Isso deve ser feito no ambiente onde o script Python roda (servidor)
load_dotenv()

# Verificar se a API key está sendo carregada corretamente
api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    # Em um servidor web real, você pode querer logar um erro ou retornar um erro HTTP
    # Em um script simples, levantar um erro é aceitável.
    raise ValueError("A variável GOOGLE_API_KEY não foi carregada. Verifique seu arquivo .env no servidor.")

# Configurar a API KEY a partir da variável de ambiente
genai.configure(api_key=api_key)

# Criar o modelo gemini-2.0-flash
# O modelo pode ser inicializado uma vez e reutilizado
try:
    model = genai.GenerativeModel('gemini-2.0-flash')
    print("Modelo Gemini-2.0-flash carregado com sucesso.") # Log para verificar se o modelo carregou
except Exception as e:
    print(f"Erro ao carregar o modelo Gemini: {e}")
    # Em um servidor real, você pode querer lidar com este erro de forma mais robusta


# Função para interagir com o modelo Gemini
# Esta função receberia um prompt do frontend (via requisição HTTP)
# e retornaria a resposta da IA.
def get_ai_response(prompt):
    """
    Envia um prompt para o modelo Gemini e retorna a resposta em texto.

    Args:
        prompt (str): O texto do prompt a ser enviado para a IA.

    Returns:
        str: A resposta gerada pelo modelo, ou uma mensagem de erro.
    """
    if not model:
        return "Erro: O modelo de IA não foi carregado corretamente no servidor."

    try:
        # Enviar o prompt para o modelo
        response = model.generate_content(prompt)

        # Retornar o texto da resposta
        # Em um servidor web, você retornaria isso como parte de uma resposta HTTP (ex: JSON)
        return response.text

    except Exception as e:
        # Capturar e logar quaisquer erros durante a geração da resposta
        print(f"Erro ao gerar conteúdo com a IA: {e}")
        # Retornar uma mensagem de erro amigável para o frontend
        return "Desculpe, houve um erro ao processar sua solicitação."

# --- Exemplo de como esta função seria usada (em um contexto de servidor) ---
# Em um servidor web (usando Flask, FastAPI, etc.), você teria um endpoint HTTP
# que chamaria esta função quando recebesse uma requisição do frontend.

# Exemplo de uso direto da função (para teste no backend)
if __name__ == "__main__":
    test_prompt = "Qual é o objetivo principal de uma simulação de hospital psiquiátrico?"
    print(f"\nEnviando prompt de teste: '{test_prompt}'")
    ai_response = get_ai_response(test_prompt)
    print("\nResposta da IA:")
    print(ai_response)

    # Outro exemplo de uso
    test_prompt_2 = "Gere uma breve mensagem de boas-vindas para um usuário novo na simulação."
    print(f"\nEnviando prompt de teste: '{test_prompt_2}'")
    ai_response_2 = get_ai_response(test_prompt_2)
    print("\nResposta da IA:")
    print(ai_response_2)

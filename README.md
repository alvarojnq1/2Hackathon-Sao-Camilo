<!--TÍTULO-->
# Sistema GenoWeb


<!--DESCRIÇÃO-->
> Sistema desenvolvido no 2º Hackathon entre o Instituto Mauá de Tecnologia e o Centro Universitário São Camilo.<br/>
> O sistema consiste em um genograma digital voltado ao cruzamento de dados genéticos familiares, com foco em agilizar o diagnóstico de padrões hereditários e auxiliar na prevenção de doenças genéticas.<br/>
> 🏆 Projeto vencedor do 1º lugar no Hackathon.

<!--STATUS-->
## Status
> ✔ Concluído.


<!--FUNCIONALIDADES-->
## Funcionalidades 
````

````


<!--TECNOLOGIAS-->
## Tecnologias
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg" width="40"/> | <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/tailwindcss/tailwindcss-original.svg" width="40"/> | <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/vitejs/vitejs-original.svg" width="40"/> | <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/mysql/mysql-original.svg" width="40"/> | <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg" width="40"/> | <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/figma/figma-original.svg" width="40"/> |
| ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| React                                                                                                      | Tailwind CSS                                                                                                            | Vite                                                                                                         | MySQL                                                                                                        | Python                                                                                                       | Figma                                                                                                      |


<!--PROTÓTIPO-->
## Protótipo


<!--PARTICIPANTES-->
## Participantes
| Nome                            |
|---------------------------------|
| Alvaro Nogueira Junqueira Souza	|
| Antônio Vítor Bozzo de Napoli   |
| Felipe Brito Moulin Rodrigues   |
| Luan Camara Lopes	              |
| Victor Hugo Pinho               | 


<!--DEPENDÊNCIAS-->
## Dependências
````
@eslint/js                  | versão ^9.36.0       | Configurações base do ESLint em JavaScript.
@gsap/react                 | versão ^2.1.2        | Integração do GSAP com React.
@tailwindcss/vite           | versão ^4.1.17       | Plugin Vite para integração com Tailwind CSS.
@vitejs/plugin-react        | versão ^5.0.4        | Plugin oficial do Vite para projetos React.
autoprefixer                | versão ^10.4.21      | Adiciona prefixos CSS automaticamente.
bcryptjs                    | versão ^2.4.3        | Hashing de senhas em JavaScript puro.
concurrently                | versão ^9.1.2        | Execução de múltiplos scripts npm em paralelo.
cors                        | versão ^2.8.5        | Habilita CORS para requisições entre origens.
dotenv                      | versão ^17.2.3       | Gerenciamento de variáveis de ambiente.
eslint                      | versão ^9.36.0       | Ferramenta de linting para JavaScript e TypeScript.
eslint-plugin-react-hooks   | versão ^5.2.0        | Regras ESLint para React Hooks.
eslint-plugin-react-refresh | versão ^0.4.22       | Suporte a Fast Refresh no React com ESLint.
express                     | versão ^4.21.2       | Framework para criação de servidores web e APIs.
globals                     | versão ^16.4.0       | Definições de variáveis globais para ESLint.
gsap                        | versão ^3.13.0       | Biblioteca para animações avançadas.
jsonwebtoken                | versão ^9.0.2        | Geração e validação de tokens JWT.
lucide-react                | versão ^0.553.0      | Biblioteca de ícones SVG para React.
mysql2                      | versão ^3.14.0       | Driver MySQL para Node.js com suporte a Promises.
nodemailer                  | versão ^7.0.10       | Biblioteca para envio de e-mails.
postcss                     | versão ^8.5.6        | Processador CSS usado com Tailwind.
react                       | versão ^19.1.1       | Biblioteca JavaScript para construção de interfaces de usuário.
react-dom                   | versão ^19.1.1       | Renderização do React no DOM.
react-router-dom            | versão ^7.9.5        | Roteamento para aplicações React.
tailwindcss                 | versão ^4.1.17       | Framework CSS utilitário para estilização rápida.
vite                        | versão ^7.1.7        | Bundler e servidor de desenvolvimento frontend.
````


<!--COMO UTILIZAR-->
## Como Utilizar
```
Requisitos:
    . Node.js 16+ para executar o backend e frontend (Vite)
    . npm como gerenciador de pacotes
    . MySQL 8.0+ para banco de dados relacional
    . Python 3.10+ para executar o serviço de análise de exames
    . pip para gerenciamento de dependências Python
    . IDE (VS Code recomendado)

Execução:
    1. Clone o repositório                          | git clone https://github.com/alvarojnq1/2Hackathon-Sao-Camilo
    
    2. Navegue até o diretório do projeto           | cd 2Hackathon-Sao-Camilo
    
    3. Instale as dependências                      | npm install
    
    4. Configure as variáveis de ambiente           | PORT=3000
                                                    | DB_HOST=localhost
                                                    | DB_USER=usuario
                                                    | DB_PASSWORD=senha
                                                    | DB_NAME=nome_do_banco
                                                    | JWT_SECRET=sua_chave_secreta
                                                    | EMAIL_USER=seu_email
                                                    | EMAIL_PASS=sua_senha
    
    5. Inicialize o servidor                        | npm run dev

    6. API de Análise de Exames (Python)            | cd backend/python
                                                    | pip install fastapi uvicorn pdfminer.six pydantic
                                                    | uvicorn main:app --reload --port 8000
```


<!--CONTRIBUIÇÃO-->
## Contribuição
````
1. Fork               | Crie uma cópia do repositório no seu perfil

2. Clone              | git clone https://github.com/alvarojnq1/2Hackathon-Sao-Camilo

3. Crie uma Branch    | git checkout -b minha-branch

4. Faça as Alterações | Edite os arquivos e teste.

5. Commit e Push      | git add .
                      |	git commit -m "Descrição das alterações" 
                      |	git push origin minha-branch

6. Pull Request       | Solicite a inclusão de suas mudanças no repositório original.
````


<!--ESTRUTURA DE PASTAS-->
## Estrutura de Pastas
````
├── backend/
│   ├── auth.js
│   ├── db.js
│   ├── profile.js
│   ├── server.js
│   ├── test-banco.js
│   ├── test-env.js
│   └── python/
│       └── main.py
└── src/
    ├── App.css
    ├── App.jsx
    ├── global.css
    ├── main.jsx
    ├── ProfilePage.css
    ├── components/
    │   ├── FamilyCreation.jsx
    │   ├── FamilyMembers.jsx
    │   ├── Header.jsx
    │   ├── Memberform.jsx
    │   ├── MembersList.jsx
    │   └── navbar.jsx
    ├── pages/
    │   ├── cadastro.jsx
    │   ├── home.jsx
    │   ├── login.jsx
    │   ├── medico.jsx
    │   ├── paciente.jsx
    │   └── perfil.tsx
    └── services/
        └── api.js
├── .gitignore
├── README.md
├── eslint.config.js
├── index.html
├── package-lock.json
├── package.json
├── vite.config.js
````


<!--ESTATÍSTICAS-->
## Estatísticas
![](https://visitor-badge.laobi.icu/badge?page_id=alvarojnq1.2Hackathon-Sao-Camilo)
![Tamanho do Repositório](https://img.shields.io/github/repo-size/alvarojnq1/2Hackathon-Sao-Camilo)
![Linguagens](https://img.shields.io/github/languages/top/alvarojnq1/2Hackathon-Sao-Camilo)


<!--LICENÇA-->
## Licença
[Veja a licença](https://github.com/alvarojnq1/2Hackathon-Sao-Camilo/tree/main?tab=License-1-ov-file)
































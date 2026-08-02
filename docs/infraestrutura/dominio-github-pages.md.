# Configuração do Domínio Próprio no GitHub Pages

**Projeto:** ContadJus

**Domínio:** contadjus.com.br

---

# Objetivo

Publicar a aplicação hospedada gratuitamente no GitHub Pages utilizando um domínio próprio registrado no Registro.br.

Arquitetura final:

Usuário

↓

https://contadjus.com.br

↓

Registro.br (DNS)

↓

GitHub Pages

↓

Repositório GitHub

↓

Aplicação ContadJus

---

# Componentes utilizados

- Registro.br
- GitHub Pages
- GitHub Repository
- Arquivo CNAME
- HTTPS automático do GitHub

---

# Etapa 1 — Registro do domínio

O domínio foi registrado no Registro.br.

Domínio escolhido:

```
contadjus.com.br
```

Após o registro, o domínio ainda não aponta para nenhum servidor.

---

# Etapa 2 — Publicação no GitHub Pages

O projeto foi hospedado em um repositório GitHub.

Foi habilitado:

Settings

↓

Pages

↓

Deploy from Branch

↓

main

↓

/

Após alguns minutos o GitHub passou a publicar automaticamente o site.

Exemplo:

```
https://usuario.github.io/repositorio
```

---

# Etapa 3 — Configuração do domínio personalizado

No GitHub:

Settings

↓

Pages

↓

Custom Domain

Foi informado:

```
contadjus.com.br
```

Neste momento o GitHub exibe:

```
DNS check unsuccessful
```

Isso é esperado.

O GitHub ainda não consegue localizar o domínio.

---

# Etapa 4 — Configuração do DNS no Registro.br

No painel do Registro.br foram configurados os apontamentos DNS para o GitHub Pages.

Após salvar, o Registro.br iniciou a propagação dos novos registros.

Neste momento apareceu a mensagem:

```
Você está utilizando os servidores DNS do Registro.br.

No momento, os servidores DNS do domínio se encontram em transição.

Servidores DNS externos poderão ser delegados em aproximadamente X minutos.
```

Essa mensagem indica que a alteração foi aceita e está sendo propagada.

Não é um erro.

---

# Etapa 5 — Propagação DNS

A propagação normalmente ocorre em poucos minutos quando apenas os registros são alterados.

Na prática:

- 5 minutos
- 10 minutos
- 30 minutos

Em alguns casos pode levar até:

24 horas

dependendo do cache DNS da operadora ou do provedor de internet.

Durante esse período é normal que:

- algumas pessoas consigam acessar;
- outras ainda não;
- o GitHub ainda informe erro de DNS.

---

# Etapa 6 — Arquivo CNAME

Após a validação do domínio, o GitHub criou automaticamente o arquivo:

```
CNAME
```

na raiz do projeto.

Conteúdo:

```
contadjus.com.br
```

Este arquivo informa ao GitHub que aquele repositório responde por esse domínio.

Ele deve permanecer versionado no repositório.

Não deve ser removido.

---

# Etapa 7 — HTTPS

Após o DNS ser validado, o GitHub solicita automaticamente um certificado TLS.

Nesse momento aparece a opção:

```
Enforce HTTPS
```

Quando disponível, ela deve permanecer habilitada.

A emissão do certificado normalmente leva:

5 a 30 minutos

podendo chegar a algumas horas.

---

# Etapa 8 — Testes realizados

Após a propagação:

✓ acesso ao domínio

https://contadjus.com.br

✓ carregamento da aplicação

✓ carregamento do CSS

✓ carregamento do JavaScript

✓ funcionamento do Supabase

✓ autenticação

✓ persistência de sessão

✓ logout

---

# Problemas encontrados

## DNS check unsuccessful

Motivo:

O GitHub ainda não localizou os registros DNS.

Solução:

Aguardar a propagação.

---

## Site continua abrindo pelo github.io

Motivo:

Cache DNS.

Solução:

Aguardar.

Ou utilizar:

Ctrl + Shift + R

para limpar o cache do navegador.

---

## HTTPS indisponível

Motivo:

Certificado TLS ainda não emitido.

Solução:

Aguardar a emissão automática.

---

# Fluxo completo

Registro.br

↓

Configuração DNS

↓

Propagação DNS

↓

GitHub valida domínio

↓

GitHub cria CNAME

↓

GitHub emite HTTPS

↓

Site disponível

↓

Supabase realiza autenticação

↓

LiquidaCalc é carregado

---

# Tempo observado

Registro do domínio:

Imediato.

Configuração do GitHub:

2 minutos.

Configuração DNS:

5 minutos.

Propagação inicial:

5 a 30 minutos.

Certificado HTTPS:

5 a 30 minutos.

Tempo total esperado:

Entre 10 minutos e 1 hora.

Em situações excepcionais:

Até 24 horas.

---

# Resultado Final

A infraestrutura passou a ser composta por:

Usuário

↓

contadjus.com.br

↓

Registro.br

↓

GitHub Pages

↓

Repositório GitHub

↓

Supabase Auth

↓

LiquidaCalc

Esta arquitetura mantém o projeto totalmente gratuito para hospedagem, preserva a execução integral dos cálculos no navegador do usuário e estabelece a base para a futura expansão da plataforma ContadJus.

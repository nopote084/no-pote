# No Pote — site e cardápio online

Site responsivo feito com HTML, CSS e JavaScript puro, pronto para publicar no GitHub Pages.

## Arquivos
- `index.html` — estrutura do site, cardápio, sobre, carrinho e confirmação.
- `style.css` — visual responsivo nas cores vermelho, amarelo e creme.
- `script.js` — produtos, personalização, carrinho e mensagem de pedido para WhatsApp.
- `assets/` — logo e arte de história fornecidas.

## Como publicar no GitHub Pages
1. Crie um repositório no GitHub (por exemplo `no-pote`).
2. Envie todos os arquivos e a pasta `assets` mantendo essa estrutura.
3. No repositório, abra **Settings → Pages**.
4. Em **Build and deployment**, escolha **Deploy from a branch**.
5. Selecione a branch `main` e a pasta `/ (root)`, depois salve.
6. Aguarde o GitHub publicar o endereço do site.

## Como funciona o pedido
- O cliente escolhe tamanho, sabor, quantidade e acompanhamentos.
- Batata palha e molho especial podem ser marcados como grátis.
- Porção extra de batata palha e molho especial custa R$ 2,00 cada.
- O carrinho calcula os produtos e apresenta a chave Pix.
- Depois de pagar, o cliente toca em **Já paguei — enviar pedido no WhatsApp**. O WhatsApp abre com os itens, personalizações, endereço e total preenchidos.
- O site não consegue confirmar o pagamento Pix automaticamente. O cliente deve enviar o comprovante pelo WhatsApp.
- A taxa da Uber Entrega fica à parte e deve ser combinada com o cliente.

## Preços configurados
- Mini Pote 140ml: R$ 5,00 (Misto, Tradicional e Frango).
- No Pote 350ml: Tradicional R$ 15,00; Frango Cremoso R$ 15,00; Misto R$ 15,00; Calabresa R$ 16,00.
- Monte seu No Pote 750ml: R$ 20,00, escolhendo até 3 sabores.

## Alterações rápidas
- WhatsApp e Pix: no início de `script.js`, nas constantes `WHATSAPP` e `PIX_KEY`.
- Preços e sabores: no array `PRODUCTS` e em `FLAVORS_350`, no `script.js`.

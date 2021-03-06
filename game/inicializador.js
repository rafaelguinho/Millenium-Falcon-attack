if ('serviceWorker' in navigator) {

    navigator.serviceWorker.register('./sw.js', { scope: '' })

        .then(function (reg) {
            console.log('Registration succeeded. Scope is ' + reg.scope);
        }).catch(function (error) {
            console.log('Registration failed with ' + error);
        });
}

window.addEventListener('beforeinstallprompt', function (e) {
    outputElement.textContent = 'beforeinstallprompt Event fired';
});

var canvas = document.getElementById('canvas_animacao');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

var context = canvas.getContext('2d');
context.font = "16px Lcd-Solid";

var imagens, animacao, teclado, colisor, milleniumFalcon, criadorInimigos, painel, touch;
var totalImagens = 0, carregadas = 0;
var musicaAcao;

carregarImagens();
carregarMusicas();

var menuButtons = [];

var isGameOver = false;

function carregarMusicas() {
    'use strict';
    musicaAcao = new Audio();
    // musicaAcao.src = 'snd/musica-acao.mp3';
    musicaAcao.load();
    musicaAcao.volume = 0.8;
    musicaAcao.loop = true;
}

function carregarImagens() {
    imagens = {
        espaco: 'space.png',
        milleniumFalcon: 'sprite-nave.png',
        tieFighter: 'tie.png',
        imgAsteroid: 'asteroid.png',
        imgExplosao: 'explosao.png',
        imgVida: 'nave-vida.png',
        imgButtonStart: 'start.svg',
        imgButtonCredits: 'credits.svg',
        logo: 'logo.svg',
        I: 'I.jpg'
    };

    // Carregar todas
    for (var i in imagens) {
        var img = new Image();
        img.src = 'img/' + imagens[i];
        img.onload = carregando;
        totalImagens++;
        // Substituir o nome pela imagem
        imagens[i] = img;
    }
}

function carregando() {

    context.save();

    context.fillStyle = "#000";
    context.fillRect(0, 0, canvas.width, canvas.height);

    carregadas++;
    if (carregadas == totalImagens) {

        var x = (canvas.width / 2 - 65), y = (canvas.height / 2 - 100);
        var btnStart = new Button(canvas, imagens.imgButtonStart, x, y, configureAndStartGame);
        btnStart.draw();
        
        y += 140;
        var btnCredits = new Button(canvas, imagens.imgButtonCredits, x, y, showCredits);
        btnCredits.draw();
        
        menuButtons.push(btnStart);
        menuButtons.push(btnCredits);

        x = (canvas.width / 2 - 80);
        y = 50;
        context.drawImage(imagens.logo, x, y, imagens.logo.width, imagens.logo.height);
    }

    context.restore();
}


function showCredits() {
    window.location.href = "credits.html";
}



function configureAndStartGame() {
    removeEventsButton();
    iniciarObjetos();
    iniciarJogo();
}

function removeEventsButton(){
    for(var i = 0, count = menuButtons.length; i< count; i++){
        menuButtons[i].removeEvents();
    }
}


function iniciarObjetos() {

    // Objetos principais
    animacao = new Animacao(context);
    teclado = new Teclado(document);
    touch = new Touch(document, context, unPause, pause);
    colisor = new Colisor();

    espaco = new Fundo(context, imagens.espaco);

    milleniumFalcon = new MilleniumFalcon(context, teclado, imagens.milleniumFalcon, imagens.imgExplosao, touch);

    painel = new Painel(context, milleniumFalcon, imagens.imgVida);
    painel.pontuacaoMaxima = obterPontucaoMaxima();

    // Ligações entre objetos
    animacao.novoSprite(espaco);
    //animacao.novoSprite(estrelas);
    animacao.novoSprite(milleniumFalcon);

    colisor.novoSprite(milleniumFalcon);
    animacao.novoProcessamento(colisor);

    animacao.novoSprite(painel);

    configuracoesIniciais();
}

function iniciarJogo() {

    isGameOver = false;

    criacaoInimigos.ultimoCriado = new Date().getTime();
    painel.pontuacao = 0;

    //musicaAcao.play();
    animacao.ligar();

    ativarTiro(true);
    // Pausa
    teclado.disparou(ENTER, doPauseOrUnPause);

}

function obterPontucaoMaxima() {
    if (!localStorage.getItem('pontucaoMaxima')) return 0;

    return localStorage.getItem('pontucaoMaxima');
}

function setarPontuacaoMaxima(pontucao) {
    localStorage.setItem('pontucaoMaxima', pontucao);
}
function verificarSePontucaoMaxima(pontucao) {
    if (!localStorage.getItem('pontucaoMaxima')) return true;
    if (Number(localStorage.getItem('pontucaoMaxima')) < pontucao) return true;

    return false;
}

function configuracoesIniciais() {

    colisor.aoColidir = function (o1, o2) {
        if ((o1 instanceof Tiro && o2 instanceof TieFighter) || (o1 instanceof TieFighter && o2 instanceof Tiro)) {
            painel.pontuacao += 20;

            if (verificarSePontucaoMaxima(painel.pontuacao)) setarPontuacaoMaxima(painel.pontuacao);

            painel.pontuacaoMaxima = obterPontucaoMaxima();

        }
    }

    // Fundos
    espaco.velocidade = 30;

    milleniumFalcon.posicionar();
    milleniumFalcon.velocidade = 315;
    milleniumFalcon.velocidade = 305;


    criacaoInimigos();

    milleniumFalcon.acabaramVidas = function () {
        animacao.desligar();
        gameOver();
    }
}

function gameOver() {

    isGameOver = true;

    ativarTiro(false);

    teclado.disparou(ENTER, null);

    musicaAcao.pause();
    musicaAcao.curretTime = 0.0;

    context.save();
    context.fillStyle = 'red';
    context.font = '30px Lcd-Solid';

    context.fillText("GAME OVER", (canvas.width / 2 - 80), (canvas.height / 2 - 30));


    context.fillStyle = 'white';
    context.font = '17px Lcd-Solid';

    context.fillText("Tap to restart", (canvas.width / 2 - 70), (canvas.height / 2 - 10));

    context.restore();

    milleniumFalcon.vidasExtras = 3;
    milleniumFalcon.posicionar();
    animacao.novoSprite(milleniumFalcon);
    colisor.novoSprite(milleniumFalcon);

    removerInimigos();
}

function removerInimigos() {
    for (var i = 0, j = this.sprites.length; i < j; i++) {
        if (animacao.sprites[i] instanceof TieFighter)
            animacao.excluirSprite(animacao.sprites[i]);
    }
}

function doPauseOrUnPause() {
    if (animacao.ligado) {
        pause();
        return;
    }

    unPause();
}

function unPause() {

    if (isGameOver) {
        iniciarJogo();
        return;
    }

    criacaoInimigos.ultimoCriado = new Date().getTime();
    animacao.ligar();
    ativarTiro(true);
    //musicaAcao.play();
}

function pause() {

    if (isGameOver) return;

    animacao.desligar();
    ativarTiro(false);

    context.save();
    context.fillStyle = 'yellow';
    context.font = '30px Lcd-Solid';

    context.fillText("PAUSE", (canvas.width / 2 - 45), (canvas.height / 2 - 30));
    context.restore();

    //musicaAcao.pause();
}

function ativarTiro(ativar) {
    if (ativar) {
        teclado.disparou(ESPACO, function () {
            milleniumFalcon.atirar();
        });
    }
    else {
        teclado.disparou(ESPACO, null);
    }
}

function criacaoInimigos() {
    var criadorTieFighters = {

        ultimoCriado: new Date().getTime(),

        processar: function () {
            var agora = new Date().getTime();
            var decorrido = agora - this.ultimoCriado;

            if (decorrido > 900) {
                newEnemy();
                this.ultimoCriado = agora;
            }
        }
    };
    animacao.novoProcessamento(criadorTieFighters);
}

function newEnemy() {
    var enemy = instanceEnemy();

    enemy.velocidade = Math.floor(90 + Math.random() * (400 - 150 + 1));

    enemy.x = Math.floor(Math.random() * (canvas.width - enemy.imagem.width + 1));

    enemy.y = -enemy.imagem.height;
    animacao.novoSprite(enemy);

    colisor.novoSprite(enemy);

    animacao.novoProcessamento(colisor);
}

function instanceEnemy() {
    var random = Math.floor(Math.random() * 2) + 1;

    if (random == 1) return new TieFighter(context, imagens.tieFighter, imagens.imgExplosao);

    return new Asteroid(context, imagens.imgAsteroid, imagens.imgExplosao);
}




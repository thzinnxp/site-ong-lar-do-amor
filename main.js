import { lerFavoritos, salvarFavoritos } from './favoritos.js';

const areaPrincipal = document.getElementById('conteudo-principal');
const paginas = {
    inicio: { titulo: 'ONG Lar do Amor' },
    projetos: { arquivo: 'projetos.html', titulo: 'Projetos - ONG Lar do Amor' },
    cadastro: { arquivo: 'cadastro.html', titulo: 'Cadastro de voluntário - ONG Lar do Amor' }
};
const conteudoInicial = areaPrincipal.innerHTML;
let carregamentoAtual = 0;
let favoritos = lerFavoritos();

const dadosProjetos = [
    {
        titulo: 'Projeto Educação',
        descricao: 'Projeto voltado para apoiar estudantes.',
        ancora: 'oficinas'
    },
    {
        titulo: 'Projeto Social',
        descricao: 'Projeto voltado para ajudar famílias.',
        ancora: 'campanha-alimentos'
    }
];

function preencherProjetos() {
    const lista = areaPrincipal.querySelector('#lista-projetos');
    const modelo = areaPrincipal.querySelector('#modelo-projeto');
    if (!lista || !modelo) return;

    const fragmento = document.createDocumentFragment();
    for (const projeto of dadosProjetos) {
        const copia = document.importNode(modelo.content, true);
        copia.querySelector('.projeto-titulo').textContent = projeto.titulo;
        copia.querySelector('.projeto-descricao').textContent = projeto.descricao;
        copia.querySelector('.projeto-link').href = `#projetos/${projeto.ancora}`;

        const botaoFavorito = copia.querySelector('.botao-favorito');
        if (botaoFavorito) {
            botaoFavorito.dataset.projeto = projeto.ancora;
            botaoFavorito.setAttribute('aria-pressed', String(favoritos.includes(projeto.ancora)));
        }
        fragmento.append(copia);
    }
    lista.replaceChildren(fragmento);
}

function lerRota() {
    const [nome, ancora] = location.hash.slice(1).split('/');
    return {
        pagina: Object.hasOwn(paginas, nome) ? nome : 'inicio',
        ancora: ancora || ''
    };
}

function atualizarLinkAtivo(pagina) {
    document.querySelectorAll('.menu a[aria-current="page"]').forEach((link) => {
        link.removeAttribute('aria-current');
    });
    document.querySelector(`.menu a[data-pagina="${pagina}"]`)?.setAttribute('aria-current', 'page');
}

async function renderizar() {
    const numeroDoCarregamento = ++carregamentoAtual;
    const { pagina, ancora } = lerRota();
    atualizarLinkAtivo(pagina);
    document.title = paginas[pagina].titulo;

    if (pagina === 'inicio') {
        areaPrincipal.innerHTML = conteudoInicial;
        window.scrollTo(0, 0);
        return;
    }

    try {
        const resposta = await fetch(paginas[pagina].arquivo);
        if (!resposta.ok) throw new Error(`Erro HTTP ${resposta.status}`);
        const texto = await resposta.text();
        if (numeroDoCarregamento !== carregamentoAtual) return;

        const documento = new DOMParser().parseFromString(texto, 'text/html');
        const conteudo = documento.querySelector('main');
        if (!conteudo) throw new Error('O arquivo carregado não tem a tag <main>.');

        areaPrincipal.replaceChildren(...Array.from(conteudo.childNodes, (no) => document.importNode(no, true)));
        if (pagina === 'projetos') preencherProjetos();

        if (ancora) {
            const elemento = document.getElementById(ancora);
            elemento ? elemento.scrollIntoView() : window.scrollTo(0, 0);
        } else {
            window.scrollTo(0, 0);
        }
    } catch (erro) {
        if (numeroDoCarregamento !== carregamentoAtual) return;
        console.error(erro);
        areaPrincipal.textContent = 'Não foi possível carregar esta página.';
    }
}

document.addEventListener('click', (evento) => {
    const botaoFavorito = evento.target.closest('.botao-favorito');
    if (botaoFavorito) {
        const projeto = botaoFavorito.dataset.projeto;
        if (!projeto) return;
        const novosFavoritos = favoritos.includes(projeto)
            ? favoritos.filter((item) => item !== projeto)
            : [...favoritos, projeto];
        if (salvarFavoritos(novosFavoritos)) {
            favoritos = novosFavoritos;
            botaoFavorito.setAttribute('aria-pressed', String(favoritos.includes(projeto)));
        }
        return;
    }

    const botaoModal = evento.target.closest('#abrir-modal');
    if (botaoModal) {
        document.getElementById('modal-informacoes')?.showModal();
        return;
    }

    const link = evento.target.closest('a[href]');
    if (!link || evento.defaultPrevented || evento.button !== 0 ||
        evento.ctrlKey || evento.shiftKey || evento.altKey || evento.metaKey ||
        link.target || link.hasAttribute('download')) return;

    const destino = new URL(link.href);
    if (destino.origin !== location.origin || destino.pathname !== location.pathname) return;
    const [pagina] = destino.hash.slice(1).split('/');
    if (!Object.hasOwn(paginas, pagina)) return;

    evento.preventDefault();
    if (destino.hash === location.hash) return;
    location.hash = destino.hash;
});

window.addEventListener('hashchange', renderizar);
renderizar();

function verificarCampo(campo) {
    const formulario = campo.closest('.formulario-cadastro');
    const aviso = formulario.querySelector(`#erro-${campo.id}`);
    if (!aviso) return;

    let erro = '';
    if (campo.validity.valueMissing) {
        erro = 'Preencha este campo.';
    } else if (campo.validity.tooShort) {
        erro = 'Digite pelo menos 3 caracteres.';
    } else if (campo.validity.typeMismatch) {
        erro = 'Digite um e-mail válido.';
    } else if (campo.validity.patternMismatch) {
        const exemplos = {
            telefone: 'Use o formato (32) 99999-9999.',
            cep: 'Use o formato 00000-000.',
            cpf: 'Use o formato 000.000.000-00.'
        };
        erro = exemplos[campo.id] || 'Confira o formato deste campo.';
    } else if (!campo.validity.valid) {
        erro = 'Confira este campo.';
    }

    aviso.textContent = erro;
    campo.style.borderColor = erro ? 'red' : campo.value ? 'green' : '';
    return erro === '';
}

document.addEventListener('input', (evento) => {
    const campo = evento.target;
    if (!campo.matches('.formulario-cadastro input')) return;
    verificarCampo(campo);
    campo.closest('form').querySelector('#mensagem-cadastro').textContent = '';
});

document.addEventListener('invalid', (evento) => {
    const campo = evento.target;
    if (campo.matches('.formulario-cadastro input')) verificarCampo(campo);
}, true);

document.addEventListener('submit', (evento) => {
    const formulario = evento.target;
    if (!formulario.matches('.formulario-cadastro')) return;
    evento.preventDefault();

    const campos = formulario.querySelectorAll('input');
    const tudoCerto = Array.from(campos).every(verificarCampo);
    if (!tudoCerto) return;

    formulario.querySelector('#mensagem-cadastro').textContent =
        'Cadastro preenchido com sucesso! Esta é apenas uma demonstração; os dados não foram enviados.';
    formulario.reset();
    campos.forEach((campo) => {
        campo.style.borderColor = '';
        formulario.querySelector(`#erro-${campo.id}`).textContent = '';
    });
});

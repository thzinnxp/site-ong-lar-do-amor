const CHAVE_FAVORITOS = 'ong-lar-do-amor-favoritos';

export function lerFavoritos() {
    try {
        const texto = localStorage.getItem(CHAVE_FAVORITOS);
        const dados = texto ? JSON.parse(texto) : [];
        return Array.isArray(dados) ? dados : [];
    } catch (erro) {
        console.error('Não foi possível ler os favoritos:', erro);
        return [];
    }
}

export function salvarFavoritos(favoritos) {
    try {
        localStorage.setItem(CHAVE_FAVORITOS, JSON.stringify(favoritos));
        return true;
    } catch (erro) {
        console.error('Não foi possível salvar os favoritos:', erro);
        return false;
    }
}

new Sortable(document.getElementById('sortable-list'), {
    animation: 150,
    handle: '.dropdown-item', // garante que só esses são arrastáveis
    filter: '[disabled]',     // ignora qualquer item com atributo disabled
    onMove: function (evt) {
      // impede mover se o item for 'disabled'
      return !evt.related.hasAttribute('disabled');
    }
});
$(document).ready(function () {
  $('#descricao_evento_cadastro').summernote({
    placeholder: 'Digite a descrição do evento...',
    tabsize: 2,
    height: 200
  });

  exibir_eventos();
  carregar_usuarios();
});

function salvar_evento() {
  atualizar_evento();
}

function exibir_eventos() {
  $.ajax({
    url: 'http://localhost/sicap_360-main/app/controllers/eventoController.php',
    data: { 
      s: 1 
    },
    type: 'POST',
    dataType: 'json',
    success: resposta => {
      const $ul = $('.verti-timeline');
      const $template = $('#template-evento');
      $ul.empty();

      if (!Array.isArray(resposta) || resposta.length === 0) {
        $ul.append('<li><p class="text-muted">Nenhum evento disponível no momento.</p></li>');
        return;
      }

      resposta.forEach(evento => {
        const $clone = $template.clone().removeAttr('id').css('display', 'flex');
        const $card = $clone.find('.cont_pressed_info_card');
      
        const idEvento = evento.id_evento;
        $clone.attr('data-id', idEvento);
      
        const anexos = evento.arquivo_evento
          ? [{
              nome: evento.arquivo_evento,
              url: evento.arquivo_evento,
              thumb: evento.thumb_evento
            }]
          : [];
       
        $card.attr({
        'id-evento': idEvento,
        'data-evento': evento.data_evento,
        'titulo-evento': evento.nome_evento,
        'descricao-evento': evento.descricao_evento,
        'data-anexos': JSON.stringify(anexos),
        'data-thumb': evento.thumb_evento || ''
      });

        const dataFormatada = formatarDataBR(evento.data_evento);

        $clone.find('h5 b').text(evento.nome_evento);
        $clone.find('p.text-muted').text(`Evento a ser realizado - ${dataFormatada}`);

        $ul.append($clone);
      });
    },
    error: () => {
      $('.verti-timeline').html('<li><p class="text-danger">Erro ao carregar eventos.</p></li>');
    }
  });
}

function exibir_modal_evento($card) {
  const id = $card.attr('id-evento');
  $('#modal-title').data('id', id);

  const titulo    = $card.attr('titulo-evento');
  const data      = $card.attr('data-evento');
  const descricao = $card.attr('descricao-evento');
  const thumb     = $card.attr('data-thumb');
  let anexos      = [];

  $('#id_evento_atual').data('id', id);
  $('#nome_evento_timeline').val(titulo);
  $('#data_evento_timeline').val(data);

  try {
    const rawAnexos = $card.attr('data-anexos');
    anexos = rawAnexos ? JSON.parse(rawAnexos) : [];
  } catch {
    anexos = [];
  }

  const $editor = $('#descricao_evento_timeline');
  if (!$editor.next('.note-editor').length) {
    $editor.summernote({
      placeholder: 'Digite a descrição do evento...',
      tabsize: 2,
      height: 200
    });
  }
  $editor.summernote('code', descricao);

  const idEvento = $card.attr('id-evento');
  $.ajax({
    url: 'http://localhost/sicap_360-main/app/controllers/eventoController.php',
    type: 'POST',
    data: { s: 9, id_evento: idEvento },
    dataType: 'json',
    success: function(res) {
      let htmlFotos = '';
      if (res.fotos && res.fotos.length) {
        res.fotos.forEach(foto => {
          htmlFotos += `<img class="rounded-circle avatar-xs mini_ft_timeline" src="${foto}" alt="Foto Usuário">`;
        });
      }
      $('.fotos-usuarios-timeline').html(htmlFotos);
    },
    error: function(e) {
      $('.fotos-usuarios-timeline').empty();
    }
  });

  const $tbody = $('#tbody-anexos').empty();
  const $template = $('#template-anexo');

  anexos.forEach((anexo, i) => {
    const fileName = anexo.url.split('/').pop();
    const { nome, url, thumb } = anexo;
    const ext = nome.split('.').pop().toLowerCase();
    const preview = ext === 'pdf'
      ? `<iframe src="${url}" width="60" height="60" style="border:none;"></iframe>`
      : `<img src="${thumb || url}" style="width:60px;height:60px;">`;

    const $row = $($template.html())
      .find('.num-anexo').text(i + 1).end()
      .find('.nome-anexo').html(preview).end()
      .find('.titulo-anexo').text(fileName).end()
      .find('.btn-visualizar').attr('href', url).end()
      .find('.btn-download').attr('href', url).attr('download', nome).end();

    $tbody.append($row);
  });

  if (anexos.length === 0) {
    $('#container-anexos').hide();
    $('#container-upload').removeClass('d-none').show();
  } else {
    $('#container-anexos').show();
    $('#container-upload').addClass('d-none').hide();
  }

  $('.card_detalhes_eventos_timeline').removeClass('d-none').show();
}

function cadastrar_evento() {
  const nome = $('#nome_evento_cadastro').val().trim();
  const data = $('#data_evento_cadastro').val().trim();
  const descricao = $('#descricao_evento_cadastro').summernote('code').trim();
  const arquivo = $('#arquivo_evento_cadastro')[0]?.files[0];
  const $alerta = $('#alertaEvento');

  const usuariosSelecionados = [];
  $('.usuario-checkbox:checked').each(function () {
    usuariosSelecionados.push($(this).val());
  });


  if (!nome || !data || !descricao || !arquivo || usuariosSelecionados.length === 0) {
    $alerta.removeClass('d-none alert-success')
      .addClass('alert-danger')
      .text('Preencha todos os campos e selecione pelo menos um usuário.');
    return;
  }

  const formData = new FormData();
  formData.append('s', '2');
  formData.append('nome_evento', nome);
  formData.append('data_evento', data);
  formData.append('descricao_evento', descricao);
  formData.append('arquivo_evento', arquivo);

  usuariosSelecionados.forEach((id, index) => {
    formData.append(`usuarios[${index}][id]`, id);
  });

  $.ajax({
    url: 'http://localhost/sicap_360-main/app/controllers/eventoController.php',
    data: formData,
    contentType: false,
    cache: false,
    processData: false,
    dataType: 'json',
    type: 'POST',
    success: function (resposta) {
      if (resposta.erro) {
        $alerta.removeClass('d-none alert-success')
          .addClass('alert-danger')
          .text(resposta.erro);
      } else if (resposta.sucesso) {
        $alerta.removeClass('d-none alert-danger')
          .addClass('alert-success')
          .text('Evento salvo com sucesso!');

        $('#nome_evento_cadastro, #data_evento_cadastro, #descricao_evento_cadastro').val('');
        $('#arquivo_evento_cadastro').val('');
        $('.usuario-checkbox').prop('checked', false);

        exibir_eventos();
        $('.container_timeline_main').show(); 
        $(".modal_cad_evento").modal("hide");
      }
    },
    error: function (e) {
      console.log('Erro ao cadastrar evento:', e);
    }
  });
}

function carregar_usuarios() {
  $.ajax({
    url: 'http://localhost/sicap_360-main/app/controllers/eventoController.php',
    data: { s: 7 },
    type: 'POST',
    dataType: 'json',
    success: resposta => {

      const $tbody = $('#lista_usuarios');
      $tbody.empty();

      if (!Array.isArray(resposta) || resposta.length === 0) {
        $tbody.append('<tr><td colspan="4" class="text-muted">Nenhum usuário disponível no momento.</td></tr>');
        return;
      }

      resposta.forEach(usuario => {
        const linha = `
          <tr>
            <td class="text-center"><input type="checkbox" class="usuario-checkbox" value="${usuario.id_usuario}"></td>
            <td class="text-center">${usuario.nome_usuario}</td>
            <td class="text-center"><img src="${usuario.foto_usuario}" width="50" height="50" style="object-fit: cover;"></td>            
            <td class="text-center"><button class="btn btn-xl btn-success w-25">Ativo</button></td>
          </tr>
        `;
        $tbody.append(linha);
      });
    },
    error: (xhr, err) => {
      $('#lista_usuarios').html('<tr><td colspan="4" class="text-danger">Erro ao carregar usuários.</td></tr>');
    }
  });
}

function abrir_modal_cad_evento() {
  $('#id_evento_atual').removeData('id');
  $('#nome_evento_cadastro, #data_evento_cadastro').val('');
  $('#arquivo_evento_cadastro').val('');
  $('#alertaEvento').addClass('d-none').removeClass('alert-success alert-danger').text('');
  $('.usuario-checkbox').prop('checked', false);

  if (!$('#descricao_evento_cadastro').next('.note-editor').length) {
    $('#descricao_evento_cadastro').summernote({
      placeholder: 'Digite a descrição do evento...',
      tabsize: 2,
      height: 200
    });
  } else {
    $('#descricao_evento_cadastro').summernote('code', '');
  }

  $(".modal_cad_evento").modal("show");
}

function alterar_visualizacao(idx) {
  if (idx === 1) {
    $(".container_timeline_calendar_main").hide();
    $(".container_timeline_main").show();
  } else if (idx === 2) {
    $(".container_timeline_calendar_main").show();
    $(".container_timeline_main").hide();
    $(".calendar").html("");
    renderizar_calendario();
  }
}

function renderizar_calendario() {
  
  const $el = $('#calendar');

  $.post({
    url: 'http://localhost/sicap_360-main/app/controllers/eventoController.php',
    data: { s: 1 },
    type: 'POST',
    dataType: 'json',
    success: function (res) {
      const eventos = Array.isArray(res) ? res : [];
      const dados = eventos.map(e => ({
        title: e.nome_evento,
        start: e.data_evento,
        end: e.data_evento,
        allDay: true,
        extendedProps: {
          id_evento: e.id_evento,
          descricao_evento: e.descricao_evento,
          arquivo_evento: e.arquivo_evento
        }
      }));

      const instancia = $el.data('fullCalendarInstance');
      if (instancia) instancia.destroy();

      const calendar = new FullCalendar.Calendar($el[0], {
        locale: 'pt-br',
        initialView: 'dayGridMonth',
        headerToolbar: getResponsiveToolbar(),
        selectable: true,
        events: dados,

        eventClick: e => {
          if ($('.container_timeline_main').is(':visible')) {
            const id = e.event.extendedProps.id_evento;
            const $card = $(`.cont_pressed_info_card[id-evento="${id}"]`);
            if ($card.length) {
              exibir_modal_evento($card);
              return;
            }
          }
          preencherModalVisualizacao(e.event);
        },
    select: e => {
    const fakeCard = $('<div>')
    .attr('id-evento', 'novo')
    .attr('titulo-evento', 'Novo Evento')
    .attr('data-evento', e.startStr)
    .attr('descricao-evento', '')
    .attr('data-anexos', '[]')
    .attr('data-thumb', '');

  exibir_modal_evento(fakeCard);
},
        eventDidMount: e => {
          const desc = e.event.extendedProps.descricao_evento;
          if (desc) {
            new bootstrap.Popover(e.el, {
              title: e.event.title,
              content: desc,
              trigger: 'hover',
              placement: 'top',
              container: 'body'
            });
          }
        },

        windowResize: () => calendar.setOption('headerToolbar', getResponsiveToolbar())
      });

      calendar.render();
      $el.data('fullCalendarInstance', calendar);
    },
    error: (xhr, err) => console.error('Erro ao carregar eventos:', xhr, err)
  });
}

function preencherModalVisualizacao(event) {
  const props       = event.extendedProps;
  const titulo      = event.title;
  const data        = event.start ? new Date(event.start).toISOString().slice(0, 10) : '';
  const dataFormat  = new Date(event.start).toLocaleDateString('pt-BR');
  const descricao   = props.descricao_evento;
  const arquivoUrl  = props.arquivo_evento || '';
  const arquivoNome = arquivoUrl
    ? decodeURIComponent(arquivoUrl.split('/').pop()).trim()
    : '';

  $('#modal-title').text(`${titulo} – ${dataFormat}`);
  $('#modal-title').data('id', props.id_evento);
  $('#nome_evento_visualizacao').val(titulo);
  $('#data_evento_visualizacao').val(data);
  const $editor = $('#descricao_evento_visualizacao');
  if (!$editor.next('.note-editor').length) {
    $editor.summernote({
      placeholder: 'Digite a descrição do evento...',
      tabsize: 2,
      height: 200
    });
  }
  $editor.summernote('code', descricao);

  const $tbody    = $('#anexos_tbody').empty();
  const $template = $('#template-anexos');

  if (!arquivoUrl) {
    $('#container-anexos-visualizacao').hide();
    $('#container-upload-visualizacao').removeClass('d-none').show();
    $tbody.append('<tr><td colspan="4" class="text-center">Nenhum anexo disponível</td></tr>');
  } else {
    $('#container-anexos-visualizacao').show();
    $('#container-upload-visualizacao').addClass('d-none').hide();
    const ext     = arquivoNome.split('.').pop().toLowerCase();
    const preview = ext === 'pdf'
      ? `<iframe src="${arquivoUrl}" width="60" height="60" style="border:none;"></iframe>`
      : `<img src="${arquivoUrl}" style="width:60px;height:60px;border-radius:4px;">`;

    const $row = $($template.prop('content').cloneNode(true))
      .find('.num-anexos').text(1).end()
      .find('.nome-anexos').html(preview).end()
      .find('.titulo-anexos').text(arquivoNome).end()
      .find('.btn-visualizar').attr('href', arquivoUrl).end()
      .find('.btn-download')
      .attr('href', arquivoUrl)
      .attr('download', arquivoNome).end()
      .find('.btn-excluir').attr('onclick', `excluir_arquivo_visualizacao('${arquivoNome}'); return false;`).end();

    $tbody.append($row);
  }

  $.ajax({
    url: 'http://localhost/sicap_360-main/app/controllers/eventoController.php',
    type: 'POST',
    data: { 
      s: 9, 
      id_evento: props.id_evento 
    },
    dataType: 'json',
    success: function(res) {
      let htmlFotos = '';
      if (res.fotos && res.fotos.length) {
        res.fotos.forEach(foto => {
          htmlFotos += `<img class="rounded-circle avatar-xs mini_ft_timeline" src="${foto}" alt="Foto Usuário">`;
        });
      }
      if ($('.modal_card_visualizacao .info_titulo_cad_evento .fotos-usuarios').length) {
        $('.modal_card_visualizacao .info_titulo_cad_evento .fotos-usuarios').html(htmlFotos);
      } else {
        $('.modal_card_visualizacao .info_titulo_cad_evento').append(`<div class="fotos-usuarios d-flex justify-content-center gap-1 mt-2">${htmlFotos}</div>`);
      }
    },
    error: function(e) {
      $('.modal_card_visualizacao .info_titulo_cad_evento .fotos-usuarios').empty();
    }
  });
  $('.modal_card_visualizacao').modal('show');
}

function getResponsiveToolbar() {
  const larguraJanela = $(window).width();
  return larguraJanela < 768
    ? { left: 'prev,next', center: 'title', right: '' }
    : { left: 'prev,next', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' };
}

function preencherModalCadastro(data) {
  const dataFormatada = (() => {
    const d = new Date(data);
    d.setDate(d.getDate() + 1);
    return d.toLocaleDateString('pt-BR');
  })();

  $(".modal_cad_evento input[type='text']").each(function () {
    if ($(this).closest('.col-lg-12').find('label').text().toLowerCase().includes('data')) {
      $(this).val(dataFormatada);
    }
  });

  $(".modal_cad_evento").modal("show");
}

function fechar_cont_info_eventos() {
  $(".card_detalhes_eventos_timeline").css("display", "none");
}

function formatarDataBR(data) {
  return data.split('-').reverse().join('/');
}

$('.verti-timeline').on('click', '.cont_pressed_info_card', function () {
  exibir_modal_evento($(this));
});

function atualizar_evento() {
  const idEvento = $('#modal-title').data('id');
  const nome = $('#nome_evento_visualizacao').val()?.trim();
  const data = $('#data_evento_visualizacao').val()?.trim();
  let descricao = '';


  if ($('#descricao_evento_visualizacao').next('.note-editor').length) {
    descricao = $('#descricao_evento_visualizacao').summernote('code').trim();
  }

  const novoArquivo = $('#arquivo_evento_visualizacao')[0]?.files[0];
  const $alerta = $('#alertaEvento');

  if (!idEvento || !nome || !data || (!descricao && !novoArquivo)) {
    console.warn('[atualizar_evento] Falha na validação dos campos.', { idEvento, nome, data, descricao, novoArquivo });
    $alerta.removeClass('d-none alert-success')
      .addClass('alert-danger')
      .text('Preencha todos os campos obrigatórios ou anexe um arquivo.');
    return;
  }

  const formData = new FormData();
  formData.append('s', '6');
  formData.append('id_evento', idEvento);
  formData.append('nome_evento', nome);
  formData.append('data_evento', data);
  formData.append('descricao_evento', descricao);

  if (novoArquivo) {
    formData.append('arquivo_evento', novoArquivo);
  }

  console.log('[atualizar_evento] Enviando AJAX:', {
    s: '6',
    id_evento: idEvento,
    nome_evento: nome,
    data_evento: data,
    descricao_evento: descricao,
    arquivo_evento: novoArquivo
  });

  $.ajax({
    url: 'http://localhost/sicap_360-main/app/controllers/eventoController.php',
    data: formData,
    contentType: false,
    cache: false,
    processData: false,
    dataType: 'json',
    type: 'POST',
    success: function (resposta) {
      console.log('[atualizar_evento] resposta:', resposta);
      if (resposta.erro) {
        $alerta.removeClass('d-none alert-success')
          .addClass('alert-danger')
          .text(resposta.erro);
      } else if (resposta.sucesso) {
        $alerta.removeClass('d-none alert-danger')
          .addClass('alert-success')
          .text('Evento atualizado com sucesso!');
        renderizar_calendario();
        exibir_eventos(); 
        if (document.activeElement) document.activeElement.blur();
        $('.modal_card_visualizacao').modal('hide');
      }
    },
    error: function (e) {
      console.error('[atualizar_evento] Erro ao atualizar evento:', e);
    }
  });
}

 function atualizar_evento_timeline() {
  console.log('atualizar_evento_timeline clicado');

  const idEvento = $('#modal-title').data('id');
  const nome = $('#nome_evento_timeline').val()?.trim();
  const data = $('#data_evento_timeline').val()?.trim();
  let descricao = '';

  if ($('#descricao_evento_timeline').next('.note-editor').length) {
    descricao = $('#descricao_evento_timeline').summernote('code').trim();
  }

  const novoArquivo = $('#arquivo_evento_timeline')[0]?.files[0];
  const $alerta = $('#alertaEvento');

  if (!idEvento || !nome || !data || (!descricao && !novoArquivo)) {
    console.warn('Falha na validação dos campos.');
    $alerta.removeClass('d-none alert-success')
      .addClass('alert-danger')
      .text('Preencha todos os campos obrigatórios ou anexe um arquivo.');
    return;
  }

  const formData = new FormData();
  formData.append('s', '6');
  formData.append('id_evento', idEvento);
  formData.append('nome_evento', nome);
  formData.append('data_evento', data);
  formData.append('descricao_evento', descricao);

  if (novoArquivo) {
    formData.append('arquivo_evento', novoArquivo);
    formData.append('titulo_evento', novoArquivo.name);
  }

  $.ajax({
    url: 'http://localhost/sicap_360-main/app/controllers/eventoController.php',
    data: formData,
    contentType: false,
    cache: false,
    processData: false,
    dataType: 'json',
    type: 'POST',

    success: function (resposta) {

      if (resposta.erro) {
        console.warn('Erro do servidor:', resposta.erro);
        $alerta.removeClass('d-none alert-success')
          .addClass('alert-danger')
          .text(resposta.erro);
      } else if (resposta.sucesso) {

        if (novoArquivo) {
          console.log('Novo arquivo enviado:', novoArquivo.name);
        }

        $('#novo_arquivo_evento').val('');
        $('#titulo_evento').val('');
        $('.evento-thumb').empty();
        $('#tbody-anexos').empty();
        $('#container-upload').addClass('d-none').hide();
        $('#container-anexos').show();
        $('.card_detalhes_eventos_timeline').hide();
        exibir_eventos();
      }
    },

    error: function (e) {
      $alerta.removeClass('d-none alert-success')
        .addClass('alert-danger')
        .text('Erro na requisição de atualização.');
    },

  });
}

function atualizarTituloArquivo() {
  const fileInput = document.getElementById('novo_arquivo_evento');
  const tituloInput = document.getElementById('titulo_evento');

  if (fileInput.files.length > 0) {
    tituloInput.value = fileInput.files[0].name;
  } else {
    tituloInput.value = '';
  }
}

function excluir_arquivo() {
  const idEvento = $('#modal-title').data('id');
  const $alerta = $('#alertaEvento');

  if (!idEvento) {
    $alerta.removeClass('d-none alert-success')
      .addClass('alert-danger')
      .text('Evento inválido para exclusão.');
    return;
  }

  const formData = new FormData();
  formData.append('s', '8');
  formData.append('id_evento', idEvento);

  $.ajax({
    url: 'http://localhost/sicap_360-main/app/controllers/eventoController.php',
    data: formData,
    contentType: false,
    cache: false,
    processData: false,
    dataType: 'json',
    type: 'POST',
    success: function (resposta) {
      if (resposta.sucesso) {
        $alerta.removeClass('d-none alert-danger')
          .addClass('alert-success')
          .text('Anexo excluído com sucesso.');

        $('#titulo_evento').val('');
        $('#novo_arquivo_evento').val('');
        $('#tbody-anexos').empty();
        $('.evento-thumb').empty();

        $('#container-anexos').hide();
        $('#container-upload').removeClass('d-none').show();
      } else {
        $alerta.removeClass('d-none alert-success')
          .addClass('alert-danger')
          .text(resposta.erro || 'Erro ao excluir arquivo.');
      }
    },
    error: function (e) {
      $alerta.removeClass('d-none alert-success')
        .addClass('alert-danger')
        .text('Erro na requisição de exclusão.');
    }
  });
}

function excluir_arquivo_visualizacao(nomeArquivo) {
  const idEvento = $('#modal-title').data('id');
  const $alerta = $('#alertaEvento');
  if (!idEvento || !nomeArquivo) return $alerta.removeClass('d-none alert-success').addClass('alert-danger').text('Evento ou arquivo inválido para exclusão.');
  const formData = new FormData();
  formData.append('s', '8');
  formData.append('id_evento', idEvento);
  formData.append('arquivo_nome', nomeArquivo);
  $.ajax({
    url: 'http://localhost/sicap_360-main/app/controllers/eventoController.php',
    data: formData,
    contentType: false,
    cache: false,
    processData: false,
    dataType: 'json',
    type: 'POST',
    success: r => {
      $alerta.removeClass('d-none alert-success alert-danger');
      if (r.sucesso) {
        $alerta.addClass('alert-success').text('Anexo excluído com sucesso.');
        $('#anexos_tbody').empty();
        $('#container-anexos-visualizacao').hide();
        $('#container-upload-visualizacao').removeClass('d-none').show();
        $('#arquivo_evento_visualizacao').val('');
        document.activeElement?.blur();
      } else {
        $alerta.addClass('alert-danger').text(r.erro || 'Erro ao excluir arquivo.');
      }
    },
    error: () => $alerta.removeClass('d-none alert-success').addClass('alert-danger').text('Erro na requisição de exclusão.')
  });
}
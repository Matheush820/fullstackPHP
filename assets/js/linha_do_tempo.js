$(function () {
  inicializarLinhaDoTempo();
});

function inicializarLinhaDoTempo() {
  exibir_eventos();
}

function exibir_eventos() {
  $.ajax({
    url: 'http://localhost/sicap_360-main/app/controllers/eventoController.php',
    data: {
      s:
        1
    },
    method: 'POST',
    dataType: 'json',
    beforeSend: xhr => xhr.setRequestHeader('Accept', 'application/json'),
    success: resposta => renderizar_eventos(resposta),
    error: (textStatus, errorThrown) => console.error('Erro ao buscar eventos:', textStatus, errorThrown)
  });
}

function renderizar_eventos(eventos) {
  const $ul = $('.verti-timeline');
  const $template = $('#template-evento');
  $ul.empty();

  if (typeof eventos === 'string') {
    try {
      eventos = JSON.parse(eventos);
    } catch (e) {
      $ul.append('<li><p class="text-danger">Erro ao carregar eventos.</p></li>');
      return;
    }
  }

  if (!Array.isArray(eventos) || eventos.length === 0) {
    $ul.append('<li><p class="text-muted">Nenhum evento disponível no momento.</p></li>');
    return;
  }

  eventos.forEach((evento) => {
    if (!evento.nome_evento || !evento.data_evento) return;

    const $clone = $template.clone().removeAttr('id').css('display', 'flex');
    const $card = $clone.find('.cont_pressed_info_card');

    $card.attr({
      'data-evento': evento.data_evento,
      'titulo-evento': evento.nome_evento,
      'descricao-evento': evento.descricao_evento,
      'data-anexos': JSON.stringify(evento.arquivo_evento
        ? [{ nome: evento.arquivo_evento, url: evento.arquivo_evento }]
        : []),
      'data-thumb': evento.thumb_evento || ''
    });


    const dataFormatada = formatarDataBR(evento.data_evento);
    $clone.find('h5 b').text(evento.nome_evento);
    $clone.find('p.text-muted').text(`Evento a ser realizado - ${dataFormatada}`);

    $ul.append($clone);
  });
}

function exibir_modal_evento($card) {
  const titulo = $card.attr('titulo-evento');
  const data = $card.attr('data-evento');
  const descricao = $card.attr('descricao-evento');
  const thumb = $card.attr('data-thumb');
  let anexos;

  try {
    anexos = JSON.parse($card.attr('data-anexos'));
  } catch {
    anexos = [];
  }

  $('.info_titulo_cad_evento').text(`${titulo} - ${formatarDataBR(data)}`);
  $('.text_area_descricao').val(descricao);

  if (thumb) {
    $('.evento-thumb').html(`<img src="${thumb}" class="img-thumbnail" style="max-width: 200px;">`);
  } else {
    $('.evento-thumb').empty();
  }

  // Preencher lista de anexos
  const $tbody = $('#tbody-anexos');
  const $template = $('#template-anexo');
  $tbody.empty();

  anexos.forEach((anexo, i) => {
    const $clone = $($template.html());
    $clone.find('.num-anexo').text(i + 1);
    $clone.find('.nome-anexo').text(anexo.nome);
    $clone.find('.btn-visualizar').attr('href', anexo.url);
    $clone.find('.btn-download').attr('href', anexo.url).attr('download', anexo.nome);
    $tbody.append($clone);
  });

  $('.card_detalhes_eventos_timeline').removeClass('d-none').show();
}


function cadastrar_evento() {
  const nome = $('#nome_evento').val().trim();
  const data = $('#data_evento').val().trim();
  const descricao = $('#descricao_evento_cadastro').val().trim();
  const arquivo = $('#arquivo_evento')[0]?.files[0];
  const $alerta = $('#alertaEvento');

  if (!nome || !data || !descricao || !arquivo) {
    $alerta.removeClass('d-none alert-success')
      .addClass('alert-danger')
      .text('Preencha todos os campos obrigatórios.');
    return;
  }
  
  const formData = new FormData();
  formData.append('s', '2');
  formData.append('nome_evento', nome);
  formData.append('data_evento', data);
  formData.append('descricao_evento', descricao);
  formData.append('arquivo_evento', arquivo);
  
  $.ajax({
    url: 'http://localhost/sicap_360-main/app/controllers/eventoController.php',
    data: formData,
    contentType: false,
    cache: false,
    processData: false,
    dataType: 'json',
    type: 'POST',
    success: function(resposta) {
      const $alerta = $('#alertaEvento');

      if (resposta.erro) {
        $alerta.removeClass('d-none alert-success')
          .addClass('alert-danger')
          .text(resposta.erro);
      } else if (resposta.sucesso) {
        $alerta.removeClass('d-none alert-danger')
          .addClass('alert-success')
          .text('Evento salvo com sucesso!');
        
        $('#nome_evento, #data_evento, #descricao_evento_cadastro').val('');
        $('#arquivo_evento').val('');
        
        exibir_eventos();
      }
    },
    error: function (e) {
      console.log(e);
    }
  });
}


function abrir_modal_cad_evento() {
  $('#nome_evento, #data_evento, #descricao_evento_cadastro').val('');
  $('#arquivo_evento').val('');
  $('#alertaEvento').addClass('d-none').removeClass('alert-success alert-danger').text('');
  $(".modal_cad_evento").modal("show");
}

function preencherModalVisualizacao(event) {
  const props = event.extendedProps;
  const descricao = props.descricao_evento;
  const arquivo = props.arquivo_evento;
  const arquivoNome = decodeURIComponent(arquivo).trim();

  $('#descricao').val(descricao);
  const $tbody = $('#anexos_tbody');
  const $template = $('#template-anexos');
  $tbody.empty();

  if (!arquivoNome) {
    $tbody.append('<tr><td colspan="3" class="text-center">Nenhum anexo disponível</td></tr>');
  } else {
    const clone = $template.prop('content').cloneNode(true);
    const $clone = $(clone);
    const basePath = '/sicap_360-main/uploads/';
    $clone.find('.num-anexos').text('1');
    $clone.find('.nome-anexos').text(arquivoNome);
    $clone.find('.btn-visualizar').attr('href', basePath + arquivoNome);
    $clone.find('.btn-download').attr('href', basePath + arquivoNome).attr('download', arquivoNome);
    $tbody.append($clone);
  }

  const dataFormatada = new Date(event.start).toLocaleDateString('pt-BR');
  $('#modal-title').text(`${event.title} - ${dataFormatada}`);
  $('.modal_card_visualizacao').modal('show');
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
    data: {
      s: 1
    },
    dataType: 'json',
    success: function (res) {
      const eventos = Array.isArray(res) ? res : [];
      const dados = eventos.map(e => ({
        title: e.nome_evento,
        start: e.data_evento,
        end: e.data_evento,
        allDay: true,
        extendedProps: {
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
        eventClick: e => preencherModalVisualizacao(e.event),
        select: e => preencherModalCadastro(e.start),
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

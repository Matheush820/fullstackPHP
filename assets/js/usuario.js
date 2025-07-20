  function criar_usuario_sicap() {
  let nome_usuario  = $('.nome_usuario').val().trim();
  let email_usuario = $('.email_usuario').val().trim();
  let senha_usuario = $('.senha_usuario').val().trim();

  if (!nome_usuario || !email_usuario || !senha_usuario) {
    alert("Preencha todos os campos!");
    return false;
  }

  if (!email_usuario.includes('@')) {
    alert("E-mail inválido.");
    return false;
  }

  $.ajax({
    type: "POST",
    url: 'https://sicapsolucoes.com/sicap360/app/controllers/eventoController.php',
    data: {
      s: 3,
      nome_usuario: nome_usuario,
      email_usuario: email_usuario,
      senha_usuario: senha_usuario
    },
    dataType: "json",
    success: function (json) {
      if (json.sucesso) {
        $('.nome_usuario, .email_usuario, .senha_usuario').val('');
        setTimeout(function () {
          window.location.href = 'login.html';
        });
      } else {
        alert("Erro ao criar usuário: " + json.erro);
      }
    }
  });
}

   function login_usuario() {
      let email = $('#email_usuario').val().trim();
      let senha = $('#senha_usuario').val().trim();
      let $alerta = $('#alertaLogin');

      if (!email || !senha) {
        $alerta.removeClass('d-none alert-success')
               .addClass('alert-danger')
               .text('Preencha todos os campos!');
        return;
      }

      const formData = new FormData();
      formData.append('s', '4'); 
      formData.append('email_usuario', email);
      formData.append('senha_usuario', senha);

      $.ajax({
    url: 'https://sicapsolucoes.com/sicap360/app/controllers/eventoController.php',
        type: 'POST',
        data: formData,
        contentType: false,
        processData: false,
        dataType: 'json',
        success: function(resposta) {
  if (resposta.sucesso) {
    const token = resposta.token;
    const idUsuario = parseInt(resposta.id_usuario);

    console.log('Token recebido:', token);
    console.log('ID do usuário:', idUsuario);

    localStorage.setItem('token_login', token);
    localStorage.setItem('id_usuario', idUsuario);

    $alerta.removeClass('d-none alert-danger')
           .addClass('alert-success')
           .text('Login realizado com sucesso! Redirecionando...');

    setTimeout(() => {
      window.location.href = 'index.html';
    });
  } else {
    $alerta.removeClass('d-none alert-success')
           .addClass('alert-danger')
           .text(resposta.erro || 'Erro ao fazer login.');
  }
},
      });
}

function logout_usuario_sicap() {
  let token = localStorage.getItem('token_login');
  let id_usuario = localStorage.getItem('id_usuario');

  console.log('ID do usuário:', id_usuario);
  console.log('Token:', token);

  if (!id_usuario || !token) {
    return;
  }

  let formData = new FormData();
  formData.append('s', '5');
  formData.append('id_usuario', id_usuario);
  formData.append('token_login', token);

  $.ajax({
    type: "POST",
    url: 'https://sicapsolucoes.com/sicap360/app/controllers/eventoController.php',
    data: formData,
    contentType: false,
    processData: false,
    dataType: "json",
    success: function (json) {
      if (json.sucesso) {
        localStorage.removeItem('token_login');
        localStorage.removeItem('id_usuario');

        window.location.href = 'login.html';
      } else {
        alert("Erro ao fazer logout: " + (json.erro || 'Erro desconhecido.'));
      }
    },
    error: function (xhr, error) {
      console.error("Erro no logout AJAX:", error, xhr.responseText);
    }
  });
}


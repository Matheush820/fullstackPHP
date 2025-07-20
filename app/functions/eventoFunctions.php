<?php

function salvarEvento($nome, $data, $descricao, $titulo, $arquivoNome, $thumbNome, $usuarios = []) {
    try {
        $conect = $GLOBALS['dbh'];
        if ($conect === null) {
            http_response_code(500);
            echo json_encode(['erro' => 'Erro de conexão com o banco de dados.']);
            return;
        }

        $conect->beginTransaction();

        $consulta = $conect->prepare("
            INSERT INTO eventos (
                nome_evento, 
                data_evento,   
                descricao_evento, 
                arquivo_evento,
                thumb_evento,
                titulo_evento
            ) VALUES (
                UPPER(:nome), 
                :dataevento, 
                :descricao,
                :arquivo,
                :thumb,
                :titulo
            );
        ");

        $consulta->bindParam(':nome',       $nome,        PDO::PARAM_STR);
        $consulta->bindParam(':dataevento', $data,        PDO::PARAM_STR);
        $consulta->bindParam(':descricao',  $descricao,   PDO::PARAM_STR);
        $consulta->bindParam(':arquivo',    $arquivoNome, PDO::PARAM_STR);
        $consulta->bindParam(':thumb',      $thumbNome,   PDO::PARAM_STR);
        $consulta->bindParam(':titulo',     $titulo,      PDO::PARAM_STR);

        $consulta->execute();

        $idEvento = $conect->lastInsertId();

        foreach ($usuarios as $usuario) {
            $idUsuario = intval($usuario['id']);
            $stmt = $conect->prepare("
                INSERT INTO usuario_evento (
                    id_evento,
                    id_usuario,
                    usuario_evento_ativo
                ) VALUES (
                    :id_evento,
                    :id_usuario,
                    true
                );
            ");
            $stmt->bindParam(':id_evento', $idEvento, PDO::PARAM_INT);
            $stmt->bindParam(':id_usuario', $idUsuario, PDO::PARAM_INT);
            $stmt->execute();
        }

        $conect->commit();

        echo json_encode([
            'sucesso' => true,
            'evento' => [
                'id_evento'       => $idEvento,
                'nome_evento'     => $nome,
                'data_evento'     => $data,
                'descricao_evento'=> $descricao,
                'titulo_evento'   => $titulo,
                'arquivo_evento'  => $arquivoNome,
                'thumb_evento'    => $thumbNome
            ],
            'usuarios' => $usuarios
        ]);

    } catch (Exception $e) {
        $conect->rollBack();
        echo json_encode(['erro' => 'Erro ao salvar evento: ' . $e->getMessage()]);
    }
}

function buscarEventos() {
    try {
        $conect = $GLOBALS['dbh'];
        if ($conect === null) {
            echo json_encode(['erro' => 'Erro de conexão com o banco de dados.']);
            return;
        }

        $consulta = $conect->prepare("
            SELECT 
                id_evento,
                nome_evento,
                data_evento, 
                descricao_evento,
                titulo_evento,
                arquivo_evento,
                thumb_evento
            FROM eventos
            ORDER BY data_evento DESC
        ");
        $consulta->execute();
        $eventos = $consulta->fetchAll(PDO::FETCH_ASSOC);

        $consultaUsuarios = $conect->prepare("
            SELECT 
                ue.id_evento,
                u.id_usuario,
                u.nome_usuario,
                u.foto_usuario
            FROM usuario_evento ue
            JOIN usuario u ON ue.id_usuario = u.id_usuario
            WHERE ue.usuario_evento_ativo = true
        ");
        $consultaUsuarios->execute();
        $usuarios = $consultaUsuarios->fetchAll(PDO::FETCH_ASSOC);

        $usuariosPorEvento = [];
        foreach ($usuarios as $usuario) {
            $idEvento = $usuario['id_evento'];
            if (!isset($usuariosPorEvento[$idEvento])) {
                $usuariosPorEvento[$idEvento] = [];
            }
            $usuariosPorEvento[$idEvento][] = [
                'id_usuario'   => $usuario['id_usuario'],
                'nome_usuario' => $usuario['nome_usuario'],
                'foto_usuario' => $usuario['foto_usuario']
            ];
        }

        foreach ($eventos as &$evento) {
            $idEvento = $evento['id_evento'];
            $evento['usuarios'] = $usuariosPorEvento[$idEvento] ?? [];
        }

        return json_encode($eventos);

    } catch (Exception $e) {
        return json_encode(['erro' => 'Erro ao buscar eventos: ' . $e->getMessage()]);
    }
}

function criarUsuario($nome, $email, $senha) {
    try {
        $conect = $GLOBALS['dbh'];

        $senhaHash = md5($senha);  

        $conect->beginTransaction();
        $consulta = $conect->prepare("
            INSERT INTO usuario (
                nome_usuario, 
                email_usuario,   
                senha_usuario
            ) VALUES (
                :nome, 
                :email, 
                :senha
            );
        ");

        $consulta->bindParam(':nome',  $nome,      PDO::PARAM_STR);
        $consulta->bindParam(':email', $email,     PDO::PARAM_STR);
        $consulta->bindParam(':senha', $senhaHash, PDO::PARAM_STR);

        $consulta->execute();
        $conect->commit();

        return ['sucesso' => true];

    } catch (Exception $e) {
        if ($conect->inTransaction()) {
            $conect->rollBack();
        }
        return ['sucesso' => false, 'erro' => 'Erro ao salvar usuário: ' . $e->getMessage()];
    }
}

function loginUsuario($email, $senha) {
    try {
        $conect = $GLOBALS['dbh'];

        $email = trim($email);
        $senha = md5(trim($senha));

        $stmt = $conect->prepare("SELECT id_usuario, senha_usuario FROM usuario WHERE email_usuario = :email");
        $stmt->bindParam(':email', $email);
        $stmt->execute();
        $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($usuario && $senha === $usuario['senha_usuario']) {
            $token = bin2hex(random_bytes(32));

            $stmtUpdate = $conect->prepare("UPDATE usuario SET token_login_data_hora = NOW() WHERE id_usuario = :id");
            $stmtUpdate->bindParam(':id', $usuario['id_usuario']);
            $stmtUpdate->execute();

            return [
                'sucesso' => true,
                'token' => $token,
                'id_usuario' => $usuario['id_usuario']
            ];
        } else {
            return ['sucesso' => false, 'erro' => 'Senha incorreta'];
        }
    } catch (Exception) {
        return ['sucesso' => false, 'erro' => 'Erro ao verificar login'];
    }
}

function logoutUsuario($id_usuario) {
    try {
        $conect = $GLOBALS['dbh'];

        $stmt = $conect->prepare("UPDATE usuario SET token_login_data_hora = NULL WHERE id_usuario = :id");
        $stmt->bindParam(':id', $id_usuario);
        $stmt->execute();

        return ['sucesso' => true];
    } catch (Exception) {
        return ['sucesso' => false, 'erro' => 'Erro ao sair'];
    }
}

function buscarUsuarios() {
    try {
        $conect = $GLOBALS['dbh'];

        $stmt = $conect->prepare("SELECT id_usuario, nome_usuario, foto_usuario FROM usuario");
        $stmt->execute();
        $usuarios = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return $usuarios;

    } catch (Exception $e) {
        return ['erro' => 'Erro ao buscar usuários: ' . $e->getMessage()];
    }
}
function atualizarEvento($idEvento, $dados) {
    try {
        $conect = $GLOBALS['dbh'];
        $conect->beginTransaction();

        $consulta = $conect->prepare("
            UPDATE eventos 
            SET 
                nome_evento = :nome,
                data_evento = :data,
                descricao_evento = :descricao,
                arquivo_evento = :arquivo,
                thumb_evento = :thumb,
                titulo_evento = :titulo
            WHERE id_evento = :id
        ");

        $consulta->bindParam(':nome', $dados['nome_evento'],                PDO::PARAM_STR);
        $consulta->bindParam(':data', $dados['data_evento'],                PDO::PARAM_STR);
        $consulta->bindParam(':descricao', $dados['descricao_evento'],      PDO::PARAM_STR);
        $consulta->bindParam(':arquivo', $dados['arquivo_evento'],          PDO::PARAM_STR);
        $consulta->bindParam(':thumb', $dados['thumb_evento'],              PDO::PARAM_STR);
        $consulta->bindParam(':titulo', $dados['titulo_evento'],            PDO::PARAM_STR);
        $consulta->bindParam(':id', $idEvento,                              PDO::PARAM_INT);

        $consulta->execute();
        $conect->commit();

        echo json_encode([
            'sucesso' => true,
            'mensagem' => 'Evento atualizado com sucesso.',
            'evento' => $dados
        ]);

    } catch (Exception $e) {
        if ($conect->inTransaction()) {
            $conect->rollBack();
        }

        echo json_encode(['erro' => 'Erro ao atualizar evento: ' . $e->getMessage()]);
    }
}

function excluirArquivoEvento($idEvento) {
    try {
        $conect = $GLOBALS['dbh'];

        $consulta = $conect->prepare("
            SELECT thumb_evento, arquivo_evento 
            FROM eventos 
            WHERE id_evento = :id
        ");
        $consulta->bindParam(':id', $idEvento, PDO::PARAM_INT);
        $consulta->execute();
        $dados = $consulta->fetch(PDO::FETCH_ASSOC);

        if (!$dados) {
            echo json_encode(['erro' => 'Evento não encontrado.']);
            return;
        }

        $basePath = dirname(__DIR__, 2) . '/';
        $thumbPath = !empty($dados['thumb_evento']) ? $basePath . $dados['thumb_evento'] : null;
        $arquivoPath = !empty($dados['arquivo_evento']) ? $basePath . $dados['arquivo_evento'] : null;

        if ($thumbPath && file_exists($thumbPath)) {
            unlink($thumbPath);
        }

        if ($arquivoPath && file_exists($arquivoPath)) {
            unlink($arquivoPath);
        }

        $update = $conect->prepare("
            UPDATE eventos 
            SET thumb_evento = NULL, arquivo_evento = NULL, titulo_evento = NULL 
            WHERE id_evento = :id
        ");
        $update->bindParam(':id', $idEvento, PDO::PARAM_INT);
        $update->execute();

        echo json_encode(['sucesso' => true, 'mensagem' => 'Anexo excluído com sucesso.']);

    } catch (Exception $e) {
        echo json_encode(['erro' => 'Erro ao excluir arquivos: ' . $e->getMessage()]);
    }
}

function buscarFotosUsuariosPorEvento($idEvento) {
    try {
        $conect = $GLOBALS['dbh'];
        if ($conect === null) {
            echo json_encode(['erro' => 'Erro de conexão com o banco de dados.']);
            return;
        }

        $consulta = $conect->prepare('
            SELECT u.foto_usuario
            FROM usuario_evento ue
            JOIN usuario u ON ue.id_usuario = u.id_usuario
            WHERE ue.id_evento = :id_evento AND ue.usuario_evento_ativo = true
        ');
        $consulta->bindParam(':id_evento', $idEvento, PDO::PARAM_INT);
        $consulta->execute();
        $fotos = $consulta->fetchAll(PDO::FETCH_COLUMN);

        echo json_encode(['fotos' => $fotos]);
    } catch (Exception $e) {
        echo json_encode(['erro' => 'Erro ao buscar fotos: ' . $e->getMessage()]);
    }
}
?>
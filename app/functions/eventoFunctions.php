<?php

function salvarEvento($nome, $data, $descricao, $arquivoNome, $thumbNome) {
    $data = preg_replace('/^(\d{2})\/(\d{2})\/(\d{4})$/', '$3-$2-$1', $data);
    $dateObj = DateTime::createFromFormat('Y-m-d', $data);
    $errors = DateTime::getLastErrors();

    if (!$dateObj || $errors['warning_count'] > 0 || $errors['error_count'] > 0) {
        http_response_code(400);
        echo json_encode(['erro' => 'Data inválida.']);
        return;
    }

    $data = $dateObj->format('Y-m-d');

    if (empty($arquivoNome)) {
        http_response_code(400);
        echo json_encode(['erro' => 'Arquivo não pode estar vazio.']);
        return;
    }

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
                thumb_evento
            ) VALUES (
                UPPER(:nome), 
                :dataevento, 
                UPPER(:descricao), 
                :arquivo,
                :thumb
            );
        ");

        $consulta->bindParam(':nome',           $nome,         PDO::PARAM_STR);
        $consulta->bindParam(':dataevento',     $data,         PDO::PARAM_STR);
        $consulta->bindParam(':descricao',      $descricao,    PDO::PARAM_STR);
        $consulta->bindParam(':arquivo',        $arquivoNome,  PDO::PARAM_STR);
        $consulta->bindParam(':thumb',          $thumbNome,    PDO::PARAM_STR);

        $consulta->execute();
        $conect->commit();

        echo json_encode([
            'sucesso' => true,
            'evento' => [
                'nome_evento' =>        $nome,
                'data_evento' =>        $data,
                'descricao_evento' =>   $descricao,
                'arquivo_evento' =>     $arquivoNome,
                'thumb_evento' =>       $thumbNome
            ]
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
                nome_evento,
                data_evento, 
                descricao_evento,
                arquivo_evento,
                thumb_evento
            FROM 
                eventos 
            ORDER BY 
                data_evento DESC
        ");
        $consulta->execute();
        $result = $consulta->fetchAll(PDO::FETCH_ASSOC);
        return json_encode($result);
    } catch (Exception $e) {
        $conect->rollBack();
        return json_encode(['erro' => 'Erro ao buscar eventos: ' . $e->getMessage()]);
    }
}

?>
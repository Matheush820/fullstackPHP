<?php
error_reporting(0);
header("Access-Control-Allow-Origin: *");

require "../database/config.php";
require "../functions/eventoFunctions.php";

$opcao = $_POST["s"];

switch ($opcao) {
    case "1": 
        f1(); break;
    case "2": 
        f2(); break;
    default:
        echo json_encode(["erro" => "Serviço não disponível!"]);
        exit;
}

exit;

function f1() {
    echo buscarEventos();
}

function f2() {
    $nome       = trim($_POST['nome_evento']);
    $descricao  = trim($_POST['descricao_evento']);
    $data       = trim($_POST['data_evento']);
    $arquivoNomeFinal = null;
    $thumbNomeFinal   = null;

    if (!empty($_FILES['arquivo_evento']['tmp_name'])) {
        $pastaAbs = dirname(__DIR__, 2) . '/uploads/';
        $pastaRel = 'uploads/';
        if (!is_dir($pastaAbs)) {
            mkdir($pastaAbs, 0755, true);
        }

        $nomeArquivo   = uniqid() . '_' . basename($_FILES['arquivo_evento']['name']);
        $arquivoAbs    = $pastaAbs . $nomeArquivo;
        $arquivoRel    = $pastaRel . $nomeArquivo;
        move_uploaded_file($_FILES['arquivo_evento']['tmp_name'], $arquivoAbs);
        $arquivoNomeFinal = $arquivoRel;

        // Gerar thumb
        $thumbAbsPasta = $pastaAbs . 'thumbs/';
        $thumbRelPasta = $pastaRel . 'thumbs/';
        if (!is_dir($thumbAbsPasta)) {
            mkdir($thumbAbsPasta, 0755, true);
        }
        $ext = strtolower(pathinfo($arquivoAbs, PATHINFO_EXTENSION));
        $nomeThumb = uniqid() . '_thumb.' . $ext;
        $thumbAbs  = $thumbAbsPasta . $nomeThumb;
        $thumbRel  = $thumbRelPasta . $nomeThumb;
        $thumbNomeFinal = null;

        if (in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'webp'])) {
            list($w, $h) = getimagesize($arquivoAbs);
            $thumbW = 200;
            $thumbH = 200;
            $thumb  = imagecreatetruecolor($thumbW, $thumbH);
            if ($ext === 'jpg' || $ext === 'jpeg') {
                $src = @imagecreatefromjpeg($arquivoAbs);
            } elseif ($ext === 'png') {
                $src = @imagecreatefrompng($arquivoAbs);
            } elseif ($ext === 'gif') {
                $src = @imagecreatefromgif($arquivoAbs);
            } elseif ($ext === 'webp') {
                $src = function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($arquivoAbs) : false;
            } else {
                $src = false;
            }
            if ($src) {
                imagecopyresampled($thumb, $src, 0, 0, 0, 0, $thumbW, $thumbH, $w, $h);
                if ($ext === 'jpg' || $ext === 'jpeg') {
                    imagejpeg($thumb, $thumbAbs, 90);
                } elseif ($ext === 'png') {
                    imagepng($thumb, $thumbAbs, 9);
                } elseif ($ext === 'gif') {
                    imagegif($thumb, $thumbAbs);
                } elseif ($ext === 'webp' && function_exists('imagewebp')) {
                    imagewebp($thumb, $thumbAbs, 90);
                }
                imagedestroy($thumb);
                imagedestroy($src);
                $thumbNomeFinal = $thumbRel;
            }
        }
    }

    echo salvarEvento($nome, $data, $descricao, $arquivoNomeFinal, $thumbNomeFinal);
}
?>
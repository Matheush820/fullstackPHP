<?php
error_reporting(0);
header("Access-Control-Allow-Origin: *");

require "../database/config.php";
require "../functions/eventoFunctions.php";

$opcao = $_POST["s"];

switch ($opcao) {
    case "1": f1();  
        break;
    case "2": f2();  
        break;
    case "3": f3();  
        break;
    case "4": f4();  
        break;
    case "5": f5();  
        break;
    case "6": f6();  
        break;
    case "7": f7();
        break;
    case "8": f8();
        break;
    case "9": f9();
        break;
    default:
        echo json_encode(["erro" => "Serviço não disponível!"]);
}

exit;

function f1() {
    echo buscarEventos();
}

function f2() {
    $nome       = trim($_POST['nome_evento']);
    $descricao  = trim($_POST['descricao_evento']);
    $data       = trim($_POST['data_evento']);

    $titulo           = null;
    $arquivoNomeFinal = null;
    $thumbNomeFinal   = null;

    if (!empty($_FILES['arquivo_evento']['tmp_name'])) {
        $pastaAbs = dirname(__DIR__, 2) . '/uploads/';
        $pastaRel = 'uploads/';

        if (!is_dir($pastaAbs)) {
            mkdir($pastaAbs, 0755, true);
        }

        $origName     = basename($_FILES['arquivo_evento']['name']);
        $uniqueName   = uniqid() . '_' . $origName;
        $absPath      = $pastaAbs . $uniqueName;
        $relPath      = $pastaRel . $uniqueName;
        move_uploaded_file($_FILES['arquivo_evento']['tmp_name'], $absPath);

        $arquivoNomeFinal = $relPath;
        $titulo            = basename($relPath);

        $thumbAbsDir = $pastaAbs . 'thumbs/';
        $thumbRelDir = $pastaRel . 'thumbs/';
        if (!is_dir($thumbAbsDir)) {
            mkdir($thumbAbsDir, 0755, true);
        }

        $ext = strtolower(pathinfo($absPath, PATHINFO_EXTENSION));

        if (in_array($ext, ['jpg','jpeg','png','gif','webp'])) {
            $thumbName    = uniqid() . '_thumb.' . $ext;
            $thumbAbsPath = $thumbAbsDir . $thumbName;
            $thumbRelPath = $thumbRelDir . $thumbName;

            list($w, $h) = getimagesize($absPath);
            $thumbW = 200; 
            $thumbH = 200;
            $thumb  = imagecreatetruecolor($thumbW, $thumbH);

            switch ($ext) {
                case 'jpg': case 'jpeg':
                    $src = @imagecreatefromjpeg($absPath); break;
                case 'png':
                    $src = @imagecreatefrompng($absPath); break;
                case 'gif':
                    $src = @imagecreatefromgif($absPath); break;
                case 'webp':
                    $src = function_exists('imagecreatefromwebp')
                         ? @imagecreatefromwebp($absPath)
                         : false;
                    break;
                default:
                    $src = false;
            }

            if ($src) {
                imagecopyresampled($thumb, $src, 0,0,0,0, $thumbW,$thumbH,$w,$h);
                switch ($ext) {
                    case 'jpg': case 'jpeg':
                        imagejpeg($thumb, $thumbAbsPath, 90); break;
                    case 'png':
                        imagepng($thumb, $thumbAbsPath, 9); break;
                    case 'gif':
                        imagegif($thumb, $thumbAbsPath); break;
                    case 'webp':
                        if (function_exists('imagewebp')) {
                            imagewebp($thumb, $thumbAbsPath, 90);
                        }
                        break;
                }
                imagedestroy($thumb);
                imagedestroy($src);
                $thumbNomeFinal = $thumbRelPath;
            }

        } elseif ($ext === 'pdf') {
            $thumbNomeFinal = $relPath;
        }
    }

    $usuarios = [];
    if (isset($_POST['usuarios']) && is_array($_POST['usuarios'])) {
        foreach ($_POST['usuarios'] as $usuarioData) {
            $idUsuario = intval($usuarioData['id'] ?? 0);
            if ($idUsuario > 0) {
                $usuarios[] = ['id' => $idUsuario];
            }
        }
    }

    echo salvarEvento($nome, $data, $descricao, $titulo, $arquivoNomeFinal, $thumbNomeFinal, $usuarios);
}

function f3() {
    $nome  = trim($_POST['nome_usuario']);
    $email = trim($_POST['email_usuario']);
    $senha = trim($_POST['senha_usuario']);

    $senhaMd5 = md5($senha);

    $resultado = criarUsuario($nome, $email, $senhaMd5);

    echo json_encode($resultado);
}

function f4() {
    $email = $_POST['email_usuario'];
    $senha = $_POST['senha_usuario'];

    $resultado = loginUsuario($email, $senha);
    echo json_encode($resultado);
}

function f5() {
    $id_usuario = intval($_POST['id_usuario']);

    if (!$id_usuario) {
        echo json_encode(['sucesso' => false, 'erro' => 'ID do usuário inválido']);
        return;
    }

    $resultado = logoutUsuario($id_usuario);
    echo json_encode($resultado);
}

function f6() {
    $idEvento = intval($_POST['id_evento']);
    $nome     = trim($_POST['nome_evento']);
    $descricao= trim($_POST['descricao_evento']);
    $data     = trim($_POST['data_evento']);

    $titulo           = null;
    $arquivoNomeFinal = null;
    $thumbNomeFinal   = null;

    if (!empty($_FILES['arquivo_evento']['tmp_name'])) {
        $pastaAbs = dirname(__DIR__, 2) . '/uploads/';
        $pastaRel = 'uploads/';

        if (!is_dir($pastaAbs)) {
            mkdir($pastaAbs, 0755, true);
        }

        $origName     = basename($_FILES['arquivo_evento']['name']);
        $uniqueName   = uniqid() . '_' . $origName;
        $absPath      = $pastaAbs . $uniqueName;
        $relPath      = $pastaRel . $uniqueName;
        move_uploaded_file($_FILES['arquivo_evento']['tmp_name'], $absPath);

        $arquivoNomeFinal = $relPath;
        $titulo            = basename($relPath);

        $thumbAbsDir = $pastaAbs . 'thumbs/';
        $thumbRelDir = $pastaRel . 'thumbs/';
        if (!is_dir($thumbAbsDir)) {
            mkdir($thumbAbsDir, 0755, true);
        }

        $ext = strtolower(pathinfo($absPath, PATHINFO_EXTENSION));

        if (in_array($ext, ['jpg','jpeg','png','gif','webp'])) {
            $thumbName    = uniqid() . '_thumb.' . $ext;
            $thumbAbsPath = $thumbAbsDir . $thumbName;
            $thumbRelPath = $thumbRelDir . $thumbName;

            list($w, $h) = getimagesize($absPath);
            $thumbW = 200; 
            $thumbH = 200;
            $thumb  = imagecreatetruecolor($thumbW, $thumbH);

            switch ($ext) {
                case 'jpg': case 'jpeg':
                    $src = @imagecreatefromjpeg($absPath); break;
                case 'png':
                    $src = @imagecreatefrompng($absPath); break;
                case 'gif':
                    $src = @imagecreatefromgif($absPath); break;
                case 'webp':
                    $src = function_exists('imagecreatefromwebp')
                         ? @imagecreatefromwebp($absPath)
                         : false;
                    break;
                default:
                    $src = false;
            }

            if ($src) {
                imagecopyresampled($thumb, $src, 0,0,0,0, $thumbW,$thumbH,$w,$h);
                switch ($ext) {
                    case 'jpg': case 'jpeg':
                        imagejpeg($thumb, $thumbAbsPath, 90); break;
                    case 'png':
                        imagepng($thumb, $thumbAbsPath, 9); break;
                    case 'gif':
                        imagegif($thumb, $thumbAbsPath); break;
                    case 'webp':
                        if (function_exists('imagewebp')) {
                            imagewebp($thumb, $thumbAbsPath, 90);
                        }
                        break;
                }
                imagedestroy($thumb);
                imagedestroy($src);
                $thumbNomeFinal = $thumbRelPath;
            }

        } elseif ($ext === 'pdf') {
            $thumbNomeFinal = $relPath;
        }
    }

    $dados = [
        'nome_evento'      => $nome,
        'data_evento'      => $data,
        'descricao_evento' => $descricao,
        'arquivo_evento'   => $arquivoNomeFinal,
        'thumb_evento'     => $thumbNomeFinal,
        'titulo_evento'    => $titulo
    ];

    atualizarEvento($idEvento, $dados);
}


function f7() {

    echo json_encode(buscarUsuarios());
}

function f8() {
    $idEvento = intval($_POST['id_evento'] ?? 0);

    echo excluirArquivoEvento($idEvento);
}

function f9() {
    $idEvento = intval($_POST['id_evento'] ?? 0);
    buscarFotosUsuariosPorEvento($idEvento);
}

?>
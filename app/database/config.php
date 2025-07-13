<?php

    // $host = '31.97.9.223';
    // $port = '5432';
    // $dbname = 'sicap_360';
    // $user = 'postgres';
    // $password = 'vSoj3WaPHUaa6MrADKtzayy46ub5YS69S2K3JXrQtqkeV8VtYv';

    //$dbh = new PDO( "pgsql:host=" . $host . ";port=" . $port . ";dbname=" . $dbname,$user, $password);

    
    $host = 'localhost';
    $port = '5433';
    $dbname = 'sicap_360';
    $user = 'postgres';
    $password = 'Legiondbd123#';

    $dbh = new PDO( "pgsql:host=" . $host . ";port=" . $port . ";dbname=" . $dbname,$user, $password);

?>
<?php
return [
    'settings' => [
        'displayErrorDetails'    => TRUE, // set to false in production
        'addContentLengthHeader' => FALSE, // Allow the web server to send the content-length header

        // Twig settings
        'view'                   => [
            'template_path' => __DIR__ . '/../templates',
            'twig'          => [
                'debug'       => TRUE,
                'auto_reload' => TRUE,
            ],
        ],

        // Monolog settings
        'logger'                 => [
            'name'  => 'slim-app',
            'path'  => __DIR__ . '/../logs/app.log',
            'level' => \Monolog\Logger::DEBUG,
        ],

        // Authentication config
        'auth'                   => [
            'session'      => 'session',
            'remember'     => 'remember_me',
            'remember_for' => '1 month',
            'domain'       => '.lon-chat.ally-net.xyz',
        ],

        // Database config
        'db'                     => [
            'driver'    => 'mysql',
            'host'      => 'localhost',
            'database'  => 'node_lon_chat',
            'username'  => 'node_lon_chat',
            'password'  => 'K3PUJqbmodF7cKG6KD9Sn8GJ0QYHLTEIAQO0gIYyTa1ELz54ssmWyIMvNDSNURyS54RolCo5v3fFBz0BwqiM2T5IDYtpOKyO0D99',
            'charset'   => 'utf8',
            'collation' => 'utf8_unicode_ci',
            'prefix'    => '',
        ],

        // Hash helper settings
        'hash'                   => [
            'algorithm'  => PASSWORD_BCRYPT,
            'cost'       => 8,
            'secret_key' => 'h@#pLg1I64vkH%^L4kSB&OTiPiEbj8&Rikm781NSdxdJv68yN%66wmy*Z2QbvauKs1j#@41I%7$wGk7d$QzS7x0Q@Y6$ev5dxuKr',
        ],

    ],
];

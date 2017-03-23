<?php
// DIC configuration
use Slim\Container;

$container = $app->getContainer();

// Twig
$container[ 'view' ] = function (Container $c) {
    $settings = $c->get('settings');
    $view     = new Slim\Views\Twig($settings[ 'view' ][ 'template_path' ], $settings[ 'view' ][ 'twig' ]);
    // Add extensions
    $view->addExtension(new Slim\Views\TwigExtension($c->get('router'), $c->get('request')->getUri()));
    $view->addExtension(new Twig_Extension_Debug());

    return $view;
};

// Authenticated user
$container[ 'auth' ] = function () {
    return FALSE;
};

// monolog
$container[ 'logger' ] = function (Container $c) {
    $settings = $c->get('settings')[ 'logger' ];
    $logger   = new Monolog\Logger($settings[ 'name' ]);
    $logger->pushProcessor(new Monolog\Processor\UidProcessor());
    $logger->pushHandler(new Monolog\Handler\StreamHandler($settings[ 'path' ], $settings[ 'level' ]));

    return $logger;
};

// memcached
$container[ 'cache' ] = function (Container $c) {
    $settings = $c->get('settings')[ 'cache' ];
    $servers  = $settings[ 'servers' ];

    $cache = new Memcache();

    foreach ($servers as $server)
        $cache->addserver($server[ 'host' ], $server[ 'port' ], $server[ 'persistent' ], $server[ 'weight' ]);

    return $cache;
};

/* START ELOQUENT BOOT */
$capsule = new \Illuminate\Database\Capsule\Manager;
$capsule->addConnection($container->get('settings')[ 'db' ]);

$capsule->setAsGlobal();
$capsule->bootEloquent();
/* END ELOQUENT BOOT */


// Service factory for the ORM
$container[ 'db' ] = function () use ($capsule) {
    return $capsule;
};

// Cookie stuff (may be delicious)
$container[ 'cookie' ] = function ($c) {
    $request = $c->get('request');

    return new \Slim\Http\Cookies($request->getCookieParams());
};

##### HELPERS #####
$container[ 'hash' ] = function (Container $c) {
    $settings = $c->get('settings')[ 'hash' ];

    return new \App\Helpers\HashHelper($settings);
};

$container[ 'user' ] = function (Container $c) {
    $user = new \App\DB\User;

    return $user->addContainer($c, TRUE);
};

// Output helper
$container[ 'o' ] = function () {
    return new \App\Helpers\OutputHelper;
};

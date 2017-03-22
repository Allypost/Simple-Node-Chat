<?php
// Application middleware

$app->add(new \App\Middleware\AuthMiddleware($app->getContainer()));
// e.g: $app->add(new \Slim\Csrf\Guard);

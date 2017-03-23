<?php
use App\Action\HomeAction as Home;

// Routes
$app->get('/', Home::class . ':home')->setName('home');
$app->post('/login', Home::class . ':auth')->setName('api:login');
$app->get('/logout', Home::class . ':logout')->setName('api:logout');

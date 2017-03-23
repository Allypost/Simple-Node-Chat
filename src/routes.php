<?php
use App\Action\HomeAction as Home;

// Routes
$app->get('/', Home::class . ':home')->setName('home');
$app->post('/login', Home::class . ':auth')->setName('api:login');
